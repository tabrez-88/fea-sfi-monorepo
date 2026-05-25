/**
 * Rule Snapshot v2 validator.
 *
 * Pure TypeScript validator for `RuleSnapshotRulesV2` JSON blobs — no
 * NestJS, no Prisma, no zod dependency. Run plan §Run 2 originally called
 * for a zod validator, but sfi-api doesn't ship zod and the engine layer
 * is deliberately framework-free; a hand-rolled validator keeps the
 * substrate self-contained and easy to unit-test.
 *
 * Enforces (per Run 2 spec):
 *   - Mode-based applicability (revenue_share has no tiers; recoup has 1;
 *     waterfall has 2)
 *   - Tier `splits[].percentage` values sum to 100 per tier (±0.01 tolerance)
 *   - At most one pool target per snapshot (v1 constraint)
 *   - `hardCapMultiplier ≥ recoupMultiplier` when both are set on a tier
 *   - `deductions[]` participantId / feePercentage / feeAmount shape (Run 2 safety audit)
 *   - revenue_share mode requires at least one of `splits[]` or
 *     `poolRevenueSources[]` (Run 2 safety audit — prevents no-op snapshots)
 *
 * Returns a discriminated result so callers don't have to throw:
 *   `{ ok: true, rules }` on success
 *   `{ ok: false, errors }` on failure (errors is a flat string[])
 */

import {
  AllocationSplit,
  AllocationTarget,
  RuleSnapshotRulesV2,
  SettlementMode,
  WaterfallTierRule,
} from './types';

export type ValidationResult =
  | { ok: true; rules: RuleSnapshotRulesV2 }
  | { ok: false; errors: string[] };

const VALID_MODES: ReadonlySet<SettlementMode> = new Set([
  'revenue_share',
  'recoup',
  'waterfall',
]);

const PERCENT_TOLERANCE = 0.01;

export function validateRuleSnapshotV2(input: unknown): ValidationResult {
  if (input === null || typeof input !== 'object') {
    return { ok: false, errors: ['rules must be a non-null object'] };
  }
  const rules = input as Record<string, unknown>;

  if (rules.schemaVersion !== 2) {
    return {
      ok: false,
      errors: [`schemaVersion must be 2, got ${JSON.stringify(rules.schemaVersion)}`],
    };
  }

  const errors: string[] = [];
  const mode = validateMode(rules, errors);
  const tiers = validateTiersForMode(rules, mode, errors);
  validateTierContents(tiers, errors);
  validateTopLevelSplits(rules, errors);
  validateRevenueShareSinks(rules, mode, errors);
  validateDeductions(rules, errors);
  validatePoolUniqueness(rules, errors);
  validatePoolRevenueSources(rules, errors);

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, rules: rules as unknown as RuleSnapshotRulesV2 };
}

// ──────────────────────────────────────────────────────────────────────
// Section validators (kept small + flat so the top-level orchestrator
// can stay scannable)
// ──────────────────────────────────────────────────────────────────────

function validateMode(rules: Record<string, unknown>, errors: string[]): SettlementMode | undefined {
  const mode = rules.mode as SettlementMode | undefined;
  if (!mode || !VALID_MODES.has(mode)) {
    errors.push(
      `mode must be one of ${[...VALID_MODES].join(', ')} (got ${JSON.stringify(rules.mode)})`,
    );
    return undefined;
  }
  return mode;
}

function validateTiersForMode(
  rules: Record<string, unknown>,
  mode: SettlementMode | undefined,
  errors: string[],
): WaterfallTierRule[] {
  const tiersRaw = rules.tiers;
  if (tiersRaw !== undefined && !Array.isArray(tiersRaw)) {
    errors.push('tiers must be an array when provided');
    return [];
  }
  const tiers = (tiersRaw as WaterfallTierRule[] | undefined) ?? [];

  if (mode === 'revenue_share' && tiers.length > 0) {
    errors.push('revenue_share mode must not declare any tiers');
  } else if (mode === 'recoup' && tiers.length !== 1) {
    errors.push(`recoup mode must declare exactly 1 tier (got ${tiers.length})`);
  } else if (mode === 'waterfall' && tiers.length !== 2) {
    errors.push(`waterfall mode must declare exactly 2 tiers (got ${tiers.length})`);
  }

  return tiers;
}

function validateTierContents(tiers: WaterfallTierRule[], errors: string[]): void {
  const seenTierNumbers = new Set<number>();
  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    if (!tier || typeof tier !== 'object') {
      errors.push(`tiers[${i}] must be an object`);
      continue;
    }
    validateTierNumber(tier, i, seenTierNumbers, errors);
    validateTierSplits(tier, i, errors);
    validateTierMultipliers(tier, i, errors);
    validateTierDeadline(tier, i, errors);
  }
}

function validateTierNumber(
  tier: WaterfallTierRule,
  i: number,
  seen: Set<number>,
  errors: string[],
): void {
  if (tier.tier !== 1 && tier.tier !== 2) {
    errors.push(`tiers[${i}].tier must be 1 or 2 (got ${String(tier.tier)})`);
    return;
  }
  if (seen.has(tier.tier)) {
    errors.push(`duplicate tier number: ${tier.tier}`);
    return;
  }
  seen.add(tier.tier);
}

function validateTierSplits(tier: WaterfallTierRule, i: number, errors: string[]): void {
  if (!Array.isArray(tier.splits) || tier.splits.length === 0) {
    errors.push(`tiers[${i}].splits must be a non-empty array`);
    return;
  }
  const sum = sumPercentages(tier.splits);
  if (Math.abs(sum - 100) > PERCENT_TOLERANCE) {
    errors.push(`tiers[${i}].splits percentages must sum to 100 (got ${sum.toFixed(2)})`);
  }
  for (let j = 0; j < tier.splits.length; j++) {
    validateSplit(tier.splits[j], `tiers[${i}].splits[${j}]`, errors);
  }
}

function validateTierMultipliers(tier: WaterfallTierRule, i: number, errors: string[]): void {
  if (
    typeof tier.hardCapMultiplier === 'number' &&
    typeof tier.recoupMultiplier === 'number' &&
    tier.hardCapMultiplier < tier.recoupMultiplier
  ) {
    errors.push(
      `tiers[${i}]: hardCapMultiplier (${tier.hardCapMultiplier}) must be ≥ recoupMultiplier (${tier.recoupMultiplier})`,
    );
  }
}

function validateTierDeadline(tier: WaterfallTierRule, i: number, errors: string[]): void {
  if (tier.deadline !== undefined && Number.isNaN(Date.parse(String(tier.deadline)))) {
    errors.push(`tiers[${i}].deadline must be a valid ISO date when provided`);
  }
}

function validateSplit(split: AllocationSplit, path: string, errors: string[]): void {
  if (typeof split.percentage !== 'number' || split.percentage < 0 || split.percentage > 100) {
    errors.push(`${path}.percentage must be 0–100 (got ${String(split.percentage)})`);
  }
  const targetError = validateAllocationTarget(split.target);
  if (targetError) errors.push(`${path}.target — ${targetError}`);
}

function validateTopLevelSplits(rules: Record<string, unknown>, errors: string[]): void {
  if (rules.splits === undefined) return;
  if (!Array.isArray(rules.splits)) {
    errors.push('splits must be an array when provided');
    return;
  }
  const sum = sumPercentages(rules.splits as AllocationSplit[]);
  if (Math.abs(sum - 100) > PERCENT_TOLERANCE) {
    errors.push(`top-level splits percentages must sum to 100 (got ${sum.toFixed(2)})`);
  }
}

function validateRevenueShareSinks(
  rules: Record<string, unknown>,
  mode: SettlementMode | undefined,
  errors: string[],
): void {
  if (mode !== 'revenue_share') return;
  const hasSplits = Array.isArray(rules.splits) && (rules.splits as unknown[]).length > 0;
  const hasPool =
    Array.isArray(rules.poolRevenueSources) &&
    (rules.poolRevenueSources as unknown[]).length > 0;
  if (hasSplits || hasPool) return;
  errors.push(
    'revenue_share mode requires at least one of `splits[]` or `poolRevenueSources[]`',
  );
}

function validateDeductions(rules: Record<string, unknown>, errors: string[]): void {
  if (rules.deductions === undefined) return;
  if (!Array.isArray(rules.deductions)) {
    errors.push('deductions must be an array when provided');
    return;
  }
  const deductions = rules.deductions as Array<{
    participantId?: unknown;
    feePercentage?: unknown;
    feeAmount?: unknown;
  }>;
  for (let i = 0; i < deductions.length; i++) {
    validateDeductionRow(deductions[i], i, errors);
  }
}

function validateDeductionRow(
  d: { participantId?: unknown; feePercentage?: unknown; feeAmount?: unknown },
  i: number,
  errors: string[],
): void {
  if (typeof d.participantId !== 'string' || d.participantId.length === 0) {
    errors.push(`deductions[${i}].participantId must be a non-empty string`);
  }
  if (typeof d.feePercentage !== 'number' || d.feePercentage < 0 || d.feePercentage > 100) {
    errors.push(`deductions[${i}].feePercentage must be 0–100`);
  }
  if (d.feeAmount !== undefined && (typeof d.feeAmount !== 'number' || d.feeAmount < 0)) {
    errors.push(`deductions[${i}].feeAmount must be a non-negative number when provided`);
  }
}

function validatePoolUniqueness(rules: Record<string, unknown>, errors: string[]): void {
  const poolTargets = collectPoolTargets(rules);
  const distinct = new Set(poolTargets);
  if (distinct.size <= 1) return;
  errors.push(
    `at most one pool target is allowed per snapshot (found ${distinct.size}: ${[...distinct].join(', ')})`,
  );
}

function validatePoolRevenueSources(rules: Record<string, unknown>, errors: string[]): void {
  if (rules.poolRevenueSources === undefined) return;
  if (!Array.isArray(rules.poolRevenueSources)) {
    errors.push('poolRevenueSources must be an array when provided');
    return;
  }
  const sources = rules.poolRevenueSources as Array<{
    poolId?: unknown;
    percentage?: unknown;
    basis?: unknown;
  }>;
  for (let i = 0; i < sources.length; i++) {
    validatePoolRevenueSourceRow(sources[i], i, errors);
  }
}

function validatePoolRevenueSourceRow(
  src: { poolId?: unknown; percentage?: unknown; basis?: unknown },
  i: number,
  errors: string[],
): void {
  if (typeof src.poolId !== 'string' || src.poolId.length === 0) {
    errors.push(`poolRevenueSources[${i}].poolId must be a non-empty string`);
  }
  if (typeof src.percentage !== 'number' || src.percentage < 0 || src.percentage > 100) {
    errors.push(`poolRevenueSources[${i}].percentage must be 0–100`);
  }
  if (src.basis !== 'GROSS' && src.basis !== 'NET') {
    errors.push(`poolRevenueSources[${i}].basis must be 'GROSS' or 'NET'`);
  }
}

function validateAllocationTarget(target: unknown): string | null {
  if (target === null || typeof target !== 'object') return 'must be an object';
  const t = target as Record<string, unknown>;
  if (t.type === 'individual') {
    if (typeof t.participantId !== 'string' || t.participantId.length === 0) {
      return 'individual target requires `participantId` string';
    }
    return null;
  }
  if (t.type === 'pool') {
    if (typeof t.poolId !== 'string' || t.poolId.length === 0) {
      return 'pool target requires `poolId` string';
    }
    return null;
  }
  return `unknown target type ${JSON.stringify(t.type)}`;
}

function sumPercentages(splits: AllocationSplit[]): number {
  return splits.reduce(
    (acc, s) => acc + (typeof s.percentage === 'number' ? s.percentage : 0),
    0,
  );
}

/**
 * Walk a v2 rules object and return every `poolId` referenced anywhere
 * (poolRevenueSources, tier splits, top-level splits). Used to enforce the
 * "at most one pool target per snapshot" rule.
 */
function collectPoolTargets(rules: Record<string, unknown>): string[] {
  const out: string[] = [];

  const sources = rules.poolRevenueSources as Array<{ poolId?: unknown }> | undefined;
  if (Array.isArray(sources)) {
    for (const s of sources) {
      if (typeof s.poolId === 'string') out.push(s.poolId);
    }
  }

  const walkSplits = (splits: unknown) => {
    if (!Array.isArray(splits)) return;
    for (const s of splits as Array<{ target?: AllocationTarget }>) {
      if (s.target?.type === 'pool' && typeof s.target.poolId === 'string') {
        out.push(s.target.poolId);
      }
    }
  };

  walkSplits(rules.splits);
  const tiers = rules.tiers;
  if (Array.isArray(tiers)) for (const t of tiers) walkSplits((t as WaterfallTierRule).splits);

  return out;
}

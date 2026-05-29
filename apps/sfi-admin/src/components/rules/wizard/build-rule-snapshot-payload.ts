import type {
  CreateRuleSnapshotInput,
  RuleSnapshotParticipantInput,
} from '@/services/rules.service';
import type { Participant } from '@/types/participant.types';
import { ParticipantBehavior } from '@/types/participant.types';
import type {
  AllocationSplit,
  AllocationTarget,
  DeductionRule,
  PoolRevenueSourceRule,
  RuleSnapshotRulesV2,
  WaterfallTierRule,
} from '@/types/rule-snapshot.types';

import {
  POOL_TARGET_ID,
  type DeductionRow,
  type DistributionRowMap,
  type ExitConditionsData,
  type WizardStep1Data,
  type WizardStep2Data,
} from './wizard-state.types';

/**
 * Canonical pool identifier used in v2 `AllocationTarget.pool.poolId` and
 * `PoolRevenueSourceRule.poolId`. The validator enforces "at most one
 * pool target per snapshot", so a single fixed id is fine for now —
 * multi-pool support is explicitly out of scope per Liang's Round 3
 * decisions.
 */
const POOL_ID = 'investor-pool';

/**
 * Discriminated payload result. Returned instead of throwing so the
 * Step 3 UI can surface validation errors inline against the Previous /
 * Create Snapshot buttons rather than relying on a thrown stack.
 */
export type BuildPayloadResult =
  | { ok: true; payload: CreateRuleSnapshotInput }
  | { ok: false; errors: string[] };

/**
 * Translate the wizard's in-memory `WizardStep1Data + WizardStep2Data` into
 * the BE-shaped `CreateRuleSnapshotInput` (v2). Mirrors the engine's
 * `validateRuleSnapshotV2` so the assembled payload is the same shape the
 * BE validator will accept — server-side `400 Bad Request` rejections
 * here should be rare and indicate a wizard bug, not a data bug.
 *
 * The assembler is deliberately pure (no React, no hooks, no fetch) so
 * it can be unit-tested directly and reused if a future "edit draft"
 * flow needs to reconstruct a payload from saved state.
 */
export function buildRuleSnapshotPayload(
  step1: WizardStep1Data,
  step2: WizardStep2Data,
  participants: ReadonlyArray<Participant>,
): BuildPayloadResult {
  const errors: string[] = [];

  // ───── Deductions ─────────────────────────────────────────────────────
  const deductions = buildDeductions(step2.deductions, step2.deductionsEnabled, errors);

  // ───── Pool revenue source ────────────────────────────────────────────
  const poolRevenueSources = buildPoolRevenueSources(step2, errors);

  // ───── Mode-conditional rule body ─────────────────────────────────────
  let tiers: WaterfallTierRule[] | undefined;
  let splits: AllocationSplit[] | undefined;

  if (step2.mode === 'revenue_share') {
    splits = buildSplits(step2.splitRows, participants, errors, 'splits');
  } else if (step2.mode === 'recoup') {
    const tierSplits = buildSplits(step2.recoupRows, participants, errors, 'recoup splits');
    if (tierSplits.length > 0) {
      tiers = [withExitConditions({ tier: 1, splits: tierSplits }, step2.exitConditions)];
    }
  } else {
    // waterfall
    //
    // Tier filtering must match `DistributionBodySection` in
    // `Step2ParticipantsRules.tsx` exactly — otherwise the wire payload
    // could include splits the admin never saw or omit ones they
    // configured.
    //   Tier 1 (Recoupment Phase): Pool + RECOUPMENT solo.
    //   Tier 2 (Post Recoup Split): Pool + non-RECOUPMENT solo
    //     (NET_PROFIT_SHARE / FLAT_FEE / etc.). Solo RECOUPMENT is
    //     excluded — their structural role is "get capital back in
    //     Tier 1, then done".
    const tier1AllowedTargets = step2.selectedTargets.filter((id) => {
      if (id === POOL_TARGET_ID) return true;
      const p = participants.find((x) => x.id === id);
      return p?.behaviorType === ParticipantBehavior.RECOUPMENT;
    });
    const tier2AllowedTargets = step2.selectedTargets.filter((id) => {
      if (id === POOL_TARGET_ID) return true;
      const p = participants.find((x) => x.id === id);
      return p !== undefined && p.behaviorType !== ParticipantBehavior.RECOUPMENT;
    });
    const tier1Splits = buildSplits(
      step2.tier1Rows,
      participants,
      errors,
      'Tier 1 splits',
      tier1AllowedTargets,
    );
    const tier2Splits = buildSplits(
      step2.tier2Rows,
      participants,
      errors,
      'Tier 2 splits',
      tier2AllowedTargets,
    );
    const tierRules: WaterfallTierRule[] = [];
    // Exit conditions bind to the recoup phase only — Tier 1 in waterfall
    // mode. Tier 2 (Post Recoup Split) stays unbounded so the post-recoup
    // split keeps running after the recoup phase exits. This mirrors the
    // copy in `Step2ParticipantsRules.tsx` ExitConditionsSection.
    if (tier1Splits.length > 0) {
      tierRules.push(
        withExitConditions({ tier: 1, splits: tier1Splits }, step2.exitConditions),
      );
    }
    if (tier2Splits.length > 0) {
      tierRules.push({ tier: 2, splits: tier2Splits });
    }
    if (tierRules.length > 0) tiers = tierRules;
  }

  if (errors.length > 0) return { ok: false, errors };

  const rules: RuleSnapshotRulesV2 = {
    schemaVersion: 2,
    mode: step2.mode,
    ...(deductions.length > 0 ? { deductions } : {}),
    ...(poolRevenueSources.length > 0 ? { poolRevenueSources } : {}),
    ...(tiers ? { tiers } : {}),
    ...(splits ? { splits } : {}),
  };

  // ───── Participants list (every checked allocation target + every
  // included deduction row that maps to an existing participant) ───────
  const participantInputs = buildParticipantInputs(step2, participants);

  const trimmedNotes = step1.notes.trim();

  const payload: CreateRuleSnapshotInput = {
    rules,
    participants: participantInputs,
    ...(step1.effectiveFrom ? { effectiveFrom: step1.effectiveFrom } : {}),
    ...(trimmedNotes ? { notes: trimmedNotes } : {}),
  };

  return { ok: true, payload };
}

// ──────────────────────────────────────────────────────────────────────
// Section assemblers
// ──────────────────────────────────────────────────────────────────────

function buildDeductions(
  rows: ReadonlyArray<DeductionRow>,
  enabled: boolean,
  errors: string[],
): DeductionRule[] {
  if (!enabled) return [];
  const out: DeductionRule[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row.included) continue;
    if (!row.participantId) {
      // Net-new deduction participants would need to be created server-
      // side first. Out of scope for this Chunk — the wizard's existing
      // auto-populate only emits rows linked to existing participants.
      errors.push(
        `Deduction row ${i + 1} ("${row.name}") is not linked to an existing participant. Remove the row or pick an existing Fee Deduction participant.`,
      );
      continue;
    }
    const amount = Number(row.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      errors.push(`Deduction row ${i + 1}: amount must be a non-negative number.`);
      continue;
    }
    if (row.feeType === 'flat') {
      out.push({ participantId: row.participantId, feePercentage: 0, feeAmount: amount });
    } else {
      // percent_gross / percent_net: v2's DeductionRule only carries a
      // single `feePercentage`. The basis (gross vs net) is conveyed at
      // the engine level by where the deduction sits in the pipeline
      // (deductions[] always runs against gross before pool funding /
      // tier distribution). Keeping the wizard split between
      // percent_gross / percent_net for FE labelling is intentional, but
      // both serialize the same way here.
      if (amount > 100) {
        errors.push(`Deduction row ${i + 1}: percentage must be 0-100 (got ${amount}).`);
        continue;
      }
      out.push({ participantId: row.participantId, feePercentage: amount });
    }
  }
  return out;
}

function buildPoolRevenueSources(
  step2: WizardStep2Data,
  errors: string[],
): PoolRevenueSourceRule[] {
  const poolSelected = step2.selectedTargets.includes(POOL_TARGET_ID);
  if (!poolSelected) return [];
  const pct = Number(step2.poolRevenue.percentage);
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
    errors.push('Pool revenue percentage must be 0-100.');
    return [];
  }
  return [{ poolId: POOL_ID, percentage: pct, basis: step2.poolRevenue.basis }];
}

function buildSplits(
  rows: DistributionRowMap,
  participants: ReadonlyArray<Participant>,
  errors: string[],
  contextLabel: string,
  restrictToTargetIds?: ReadonlyArray<string>,
): AllocationSplit[] {
  const targetIds = restrictToTargetIds ?? Object.keys(rows);
  const splits: AllocationSplit[] = [];
  let sum = 0;
  for (const id of targetIds) {
    const raw = rows[id];
    if (raw === undefined || raw === '') continue;
    const pct = Number(raw);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      errors.push(`${contextLabel}: percentage for "${labelForTarget(id, participants)}" must be 0-100.`);
      continue;
    }
    splits.push({ target: toAllocationTarget(id), percentage: pct });
    sum += pct;
  }
  if (splits.length > 0 && Math.abs(sum - 100) > 0.01) {
    errors.push(`${contextLabel} must sum to 100% (currently ${sum.toFixed(2)}%).`);
  }
  return splits;
}

function withExitConditions(
  tier: WaterfallTierRule,
  exit: ExitConditionsData,
): WaterfallTierRule {
  const out: WaterfallTierRule = { ...tier };
  if (exit.hardCapEnabled) {
    const hc = Number(exit.hardCapMultiplier);
    if (Number.isFinite(hc) && hc > 0) out.hardCapMultiplier = hc;
  }
  if (exit.deadlineEnabled && exit.deadline) {
    out.deadline = exit.deadline;
  }
  return out;
}

function buildParticipantInputs(
  step2: WizardStep2Data,
  participants: ReadonlyArray<Participant>,
): RuleSnapshotParticipantInput[] {
  // Every participant referenced anywhere in the snapshot needs to be in
  // the `participants[]` array per the BE contract (so the engine can
  // resolve names + investment baselines at run time). We union:
  //   - included deduction rows with linked participantIds
  //   - selectedTargets that map to an existing participant (i.e. not
  //     the pool sentinel)
  //   - all pool members (the pool target aggregates them; the engine
  //     needs the underlying investors to compute per-investor caps)
  const ids = new Set<string>();

  for (const row of step2.deductions) {
    if (row.included && row.participantId) ids.add(row.participantId);
  }

  for (const id of step2.selectedTargets) {
    if (id !== POOL_TARGET_ID) ids.add(id);
  }

  if (step2.selectedTargets.includes(POOL_TARGET_ID)) {
    for (const p of participants) {
      if (p.poolMember === true) ids.add(p.id);
    }
  }

  return Array.from(ids).map((id) => ({ participantId: id }));
}

function toAllocationTarget(targetId: string): AllocationTarget {
  if (targetId === POOL_TARGET_ID) {
    return { type: 'pool', poolId: POOL_ID, displayName: 'Investor Pool' };
  }
  return { type: 'individual', participantId: targetId };
}

function labelForTarget(
  targetId: string,
  participants: ReadonlyArray<Participant>,
): string {
  if (targetId === POOL_TARGET_ID) return 'Investor Pool';
  const match = participants.find((p) => p.id === targetId);
  return match ? match.name : targetId;
}

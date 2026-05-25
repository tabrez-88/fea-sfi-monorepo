/**
 * FE consumer types for Rule Snapshots.
 *
 * Mirrors the BE engine types in
 * `apps/sfi-api/src/modules/settlement/engine/types.ts`. Kept by hand
 * (rather than auto-generated) because the BE types live deep inside the
 * NestJS engine module and aren't currently exposed via a shared package.
 *
 * Run 2 substrate-only: the v2 shape is wire-ready for Run 3's form work
 * (3-mode toggle, Exit Conditions card, tier tables). No UI consumes
 * these types yet.
 *
 * If you change anything here, update the BE counterpart and vice versa.
 */

// ============================================
// V1 — legacy flat shape (still supported)
// ============================================

export interface DistributionFeeRule {
  participantId: string;
  feePercentage: number;
  /** FB-003 FLATFEE — flat dollar fee (capped at remaining gross). */
  feeAmount?: number;
}

export interface RecoupmentRule {
  participantId: string;
  recoupAmount: number;
  recoupCap: number;
  priority: number;
  previouslyRecouped?: number;
  /** FB-003 RECOUPMULT — recoup target = recoupAmount × multiplier. */
  recoupMultiplier?: number;
}

export interface NetProfitRule {
  participantId: string;
  percentage: number;
}

export interface SettlementRulesV1 {
  distributionFees: DistributionFeeRule[];
  recoupment: RecoupmentRule[];
  netProfitSplit: NetProfitRule[];
}

// ============================================
// V2 — FB-003 Rev 3 single-pipeline schema
// ============================================

export type SettlementMode = 'revenue_share' | 'recoup' | 'waterfall';

export type AllocationTarget =
  | { type: 'individual'; participantId: string }
  | { type: 'pool'; poolId: string; displayName?: string };

export interface AllocationSplit {
  target: AllocationTarget;
  percentage: number;
}

export interface PoolRevenueSourceRule {
  poolId: string;
  percentage: number;
  basis: 'GROSS' | 'NET';
}

export interface WaterfallTierRule {
  tier: 1 | 2;
  splits: AllocationSplit[];
  recoupMultiplier?: number;
  hardCapMultiplier?: number;
  /** ISO date string */
  deadline?: string;
}

/** Deduction layer (reuses the v1 DistributionFeeRule shape). */
export type DeductionRule = DistributionFeeRule;

export interface RuleSnapshotRulesV2 {
  schemaVersion: 2;
  mode: SettlementMode;
  deductions?: DeductionRule[];
  poolRevenueSources?: PoolRevenueSourceRule[];
  tiers?: WaterfallTierRule[];
  splits?: AllocationSplit[];
}

/**
 * Discriminated stored shape. The engine reads either; the FE form work
 * in Run 3 will write v2 going forward (gated behind
 * `SETTLEMENT_RULES_V2_ENABLED` on the BE).
 */
export type StoredRuleSnapshot =
  | (SettlementRulesV1 & { schemaVersion?: 1 })
  | RuleSnapshotRulesV2;

/**
 * Mirrors `getRulesSchemaVersion()` in the BE engine — returns `1` for
 * legacy flat shapes (no `schemaVersion` or `schemaVersion === 1`) and
 * `2` for the new shape. Throws when a stored snapshot carries a version
 * this build doesn't understand.
 */
export function getRulesSchemaVersion(rules: unknown): 1 | 2 {
  if (rules === null || typeof rules !== 'object') return 1;
  const sv = (rules as { schemaVersion?: unknown }).schemaVersion;
  if (sv === undefined || sv === 1) return 1;
  if (sv === 2) return 2;
  throw new Error(`Unsupported RuleSnapshot.schemaVersion: ${String(sv)}`);
}

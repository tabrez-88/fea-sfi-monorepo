/**
 * Settlement Engine Types
 *
 * Pure type definitions for the settlement computation engine.
 * These types define the JSON-based input/output contract.
 * NO NestJS, NO Prisma, NO framework dependencies.
 */

// ============================================
// Enums (engine-internal, framework-free)
// ============================================

export enum Phase {
  // v1 phases — unchanged for proof-record back-compat
  GROSS_RECEIPTS = 'GROSS_RECEIPTS',
  DISTRIBUTION_FEES = 'DISTRIBUTION_FEES',
  RECOUPMENT = 'RECOUPMENT',
  NET_PROFITS = 'NET_PROFITS',

  // FB-003 Run 3 — v2 phases (pool revenue source + waterfall tiers).
  // Engine only emits these when the stored snapshot has `schemaVersion: 2`,
  // so v1 settlement runs continue to emit only the 4 legacy phases.
  POOL_REVENUE_SOURCE = 'POOL_REVENUE_SOURCE',
  WATERFALL_TIER_1 = 'WATERFALL_TIER_1',
  WATERFALL_TIER_2 = 'WATERFALL_TIER_2',
}

export enum ParticipantBehavior {
  FEE_DEDUCTION = 'FEE_DEDUCTION',
  RECOUPMENT = 'RECOUPMENT',
  NET_PROFIT_SHARE = 'NET_PROFIT_SHARE',
  FLAT_FEE = 'FLAT_FEE',
  PASS_THROUGH = 'PASS_THROUGH',
}

// ============================================
// Input Types
// ============================================

/**
 * A single revenue batch to settle.
 */
export interface RevenueBatchInput {
  id: string;
  amount: number; // in minor units or as precise number
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
}

/**
 * Distribution fee configuration.
 * Applied to gross receipts before recoupment.
 *
 * Exactly one of `feePercentage` or `feeAmount` is consumed per rule:
 *   - `feePercentage` (legacy default): `mulPercent(gross, feePercentage)`
 *   - `feeAmount` (FB-003 FLATFEE, Run 2): flat dollar amount, capped at
 *     the remaining gross so the phase can never overspend
 *
 * If both are present, `feeAmount` wins. If neither is set, the participant
 * collects $0 in this phase. Back-compat: v1 snapshots never set `feeAmount`,
 * so existing behavior is preserved exactly.
 */
export interface DistributionFeeRule {
  participantId: string;
  feePercentage: number; // e.g. 15 for 15%
  feeAmount?: number; // FB-003 FLATFEE — flat dollar fee (capped at remaining gross)
}

/**
 * Recoupment configuration for a single participant.
 * Investor recoups their investment before net profit split.
 *
 * `recoupMultiplier` (FB-003 RECOUPMULT, Run 2) scales the effective cap to
 * `recoupAmount × recoupMultiplier`. e.g. multiplier=1.2 means the investor
 * recoups up to 120% of their original investment. Bounded above by
 * `recoupCap` (which still acts as a hard ceiling). When `recoupMultiplier`
 * is `undefined`, behavior is unchanged from v1.
 */
export interface RecoupmentRule {
  participantId: string;
  recoupAmount: number; // total amount to recoup
  recoupCap: number; // maximum they can recoup (often same as recoupAmount)
  priority: number; // lower number = higher priority (recouped first)
  previouslyRecouped?: number; // amount already recouped in prior settlement runs (carry-forward)
  recoupMultiplier?: number; // FB-003 RECOUPMULT — e.g. 1.2 for 120% recoup
}

/**
 * Net profit split rule for a single participant.
 */
export interface NetProfitRule {
  participantId: string;
  percentage: number; // e.g. 70 for 70%
}

/**
 * Complete rule configuration for settlement.
 */
export interface SettlementRules {
  distributionFees: DistributionFeeRule[];
  recoupment: RecoupmentRule[];
  netProfitSplit: NetProfitRule[];
}

/**
 * Participant metadata included in input.
 *
 * FB-003 Run 3 — pool-member context is sourced from
 * `RuleSnapshotParticipant.participantData` (frozen at snapshot creation)
 * rather than the live `Participant.metadata`. This keeps finalized runs
 * deterministic even if someone toggles the live flag later.
 *
 * All v2 pool fields are optional so v1 snapshots stay identical.
 */
export interface ParticipantInput {
  id: string;
  name: string;
  roleName: string;
  behaviorType: ParticipantBehavior;

  // FB-003 Run 3 — pool weighting inputs (v2 only). Read from the frozen
  // snapshot, not live participant data.
  poolMember?: boolean;
  poolId?: string;
  units?: number;
  investmentAmount?: number;
  pricePerUnit?: number;

  /**
   * ISO date the participant was added to the deal. Threaded through so
   * the pool's cent-rounding remainder lands on the last-to-join member
   * (Liang spec: "last investor or a defined remainder account"). When
   * absent the resolver falls back to the last-by-id share.
   */
  createdAt?: string;
}

/**
 * Per-participant cumulative-payout record carried into a settlement run.
 *
 * FB-003 Run 3 (BE-FB003-HARDCAP) — the settlement service loads these
 * from `participant_balances` keyed by `(dealId, participantId, ruleSnapshotId)`
 * before invoking the engine, so the v2 waterfall-tier phase can enforce
 * per-investor hard caps across multiple settlement runs (clip-not-skip on
 * cap). For v1 snapshots this field is absent and ignored.
 */
export interface ParticipantBalanceInput {
  participantId: string;
  cumulativePayout: number;
}

/**
 * Complete input to the settlement engine.
 * This is a pure JSON structure - no database references.
 */
export interface SettlementInput {
  /** Unique identifier for this calculation (for proof record) */
  settlementRunId: string;
  /** Rule snapshot version (for audit trail) */
  ruleSnapshotVersion: number;
  /** Currency for all amounts */
  currency: string;
  /** Revenue batches to settle */
  revenueBatches: RevenueBatchInput[];
  /** All participants in this deal */
  participants: ParticipantInput[];
  /** Settlement rules */
  rules: SettlementRules;

  /**
   * FB-003 Run 3 — ISO date threaded from `SettlementRun.createdAt`. Used
   * by the v2 exit-condition evaluator for deadline checks; for preview
   * determinism the engine must NOT call `new Date()` internally.
   * Optional for v1 snapshots that don't carry deadlines.
   */
  runDate?: string;

  /**
   * FB-003 Run 3 — cumulative payouts carried forward from prior runs on
   * the same `(deal, participant, ruleSnapshot)` triple. Only consulted by
   * the v2 waterfall-tier phase for hard-cap enforcement. v1 snapshots
   * don't use it.
   */
  priorBalances?: ParticipantBalanceInput[];

  /**
   * FB-003 Run 3 — when present, the engine takes the v2 orchestration
   * path (mode-aware: revenue_share / recoup / waterfall). When absent,
   * the engine runs the legacy 4-phase v1 path bit-identically.
   *
   * The flat `rules` field above stays populated either way (extracted
   * by `extractV2SettlementRules` for v2 inputs) — this gives the v2
   * orchestration backward-compatible access to the legacy phases when
   * useful (e.g. distributing the creator-retained slice via the legacy
   * net-profits phase).
   */
  rulesV2?: RuleSnapshotRulesV2;
}

// ============================================
// Output Types
// ============================================

/**
 * A single allocation to a participant.
 */
export interface AllocationEntry {
  participantId: string;
  participantName: string;
  phase: Phase;
  amount: number;
  metadata: Record<string, unknown>;
}

/**
 * Result of processing a single phase.
 */
export interface PhaseResult {
  phase: Phase;
  inputAmount: number;
  totalAllocated: number;
  remainingAmount: number;
  allocations: AllocationEntry[];
  details: Record<string, unknown>;
}

/**
 * Recoupment balance tracking for carry-forward.
 */
export interface RecoupmentBalance {
  participantId: string;
  totalToRecoup: number;
  previouslyRecouped: number;
  recoupedThisRun: number;
  remainingToRecoup: number;
  fullyRecouped: boolean;
}

/**
 * FB-003 Run 3 — per-investor exit-condition chip for the FE Detail page
 * (Round 3 Comment 14 r8). One row per active condition; multiple
 * conditions can stack (Hard Cap + Deadline both set → both render).
 * `firedAt` is populated when the condition triggered in THIS run.
 */
export type ExitConditionType = 'hard_cap' | 'deadline' | 'recoup_cap' | 'none';

export interface ExitConditionChip {
  type: ExitConditionType;
  /** e.g. 1.40 for hard_cap, ISO date for deadline, 1.20 for recoup_cap */
  value?: number | string;
  /** ISO timestamp — set when the condition fires during this run */
  firedAt?: string;
}

/**
 * FB-003 Run 3 — updated cumulative balance output for a pool member,
 * written back to `participant_balances` after each finalized run.
 */
export interface ParticipantBalanceOutput {
  participantId: string;
  cumulativePayout: number;
  paidThisRun: number;
  /** Per-investor exit conditions active for this participant */
  exitConditions: ExitConditionChip[];
}

/**
 * Proof record for audit trail.
 */
export interface ProofRecord {
  proofHash: string;
  algorithm: string;
  timestamp: string;
  inputSummary: {
    ruleSnapshotVersion: number;
    revenueBatchCount: number;
    totalRevenue: number;
    participantCount: number;
    currency: string;
  };
}

/**
 * Complete output from the settlement engine.
 */
export interface SettlementOutput {
  /** Echo of input settlement run ID */
  settlementRunId: string;
  /** Total gross revenue from all batches */
  totalRevenue: number;
  /** Total allocated to all participants across all phases */
  totalAllocated: number;
  /** Currency */
  currency: string;
  /** Breakdown by phase */
  phaseResults: PhaseResult[];
  /** All individual allocations (flat list) */
  allocations: AllocationEntry[];
  /** Recoupment balance tracking (v1 + v2 recoup mode) */
  recoupmentBalances: RecoupmentBalance[];
  /**
   * FB-003 Run 3 — per-investor cumulative balances after this run.
   * Persisted by the settlement service to `participant_balances` for
   * cross-run hard-cap enforcement. Empty for v1 snapshots.
   */
  participantBalances?: ParticipantBalanceOutput[];
  /** Proof record for determinism verification */
  proof: ProofRecord;
}

// ============================================
// Rule Snapshot v2 types (FB-003 Rev 3)
// ============================================
//
// New schema for stored RuleSnapshot.rules JSON. Discriminated from v1 by
// `schemaVersion: 2`. v1 snapshots (`schemaVersion: undefined | 1`) remain
// fully supported via the legacy path in `settlement.service.ts`.
//
// References:
//   - BACKEND_GAP_ANALYSIS_FB003.md §3 (TARGETS / per-target allocation)
//   - Round 3 Comment 11 (3-mode discriminator)
//   - Round 4 Comment 17 (per-target editable allocation)
//
// Run 2 lays the substrate (types + validator + read path). The
// orchestration that actually drives the new phases (Tier 2, pool resolver,
// hard cap tracking) lands in Run 3.

/**
 * Distribution mode for a v2 rule snapshot. Mode-driven branching is the
 * top-level switch the engine and validator consult:
 *   - `revenue_share`: no recoupment, no tiers — straight % split of gross/net
 *   - `recoup`: single recoupment phase + optional exit conditions, no tiers
 *   - `waterfall`: full Tier 1 + Tier 2 + exit conditions
 */
export type SettlementMode = 'revenue_share' | 'recoup' | 'waterfall';

/**
 * Allocation target — the recipient of a split percentage. Either a single
 * participant or a pool of participants (whose share resolves via the pool
 * resolver in Run 3). Pool targets support an optional `displayName` so the
 * UI can label them e.g. "Investor Pool" instead of the underlying UUID.
 */
export type AllocationTarget =
  | {
      type: 'individual';
      participantId: string;
    }
  | {
      type: 'pool';
      poolId: string;
      displayName?: string;
    };

/**
 * One row inside a `WaterfallTierRule.splits`. The percentage is the share
 * of THIS tier's bucket (not gross/net). All `percentage` values for a
 * given tier must sum to 100.
 */
export interface AllocationSplit {
  target: AllocationTarget;
  percentage: number; // 0–100; splits within a tier sum to 100
}

/**
 * Pool-revenue-source rule — defines how much of the upstream amount
 * funds a pool's bucket and what base the percentage applies to.
 */
export interface PoolRevenueSourceRule {
  poolId: string;
  percentage: number; // 0–100
  basis: 'GROSS' | 'NET'; // percentage of gross receipts or net (after deductions)
}

/**
 * A single waterfall tier. `recoupMultiplier`/`hardCapMultiplier`/`deadline`
 * are tier-scoped exit conditions consulted when the engine decides whether
 * to keep paying into this tier (Run 3 wires the evaluator).
 *
 * `tier` is 1 or 2 in v1 — Tier 3 is explicitly deferred per Liang.
 */
export interface WaterfallTierRule {
  tier: 1 | 2;
  splits: AllocationSplit[];
  recoupMultiplier?: number; // exit when cumulative payout ≥ recoupAmount × multiplier
  hardCapMultiplier?: number; // hard ceiling — never pays past this multiple
  deadline?: string; // ISO date — exit when runDate > deadline
}

/**
 * Optional deduction layer that runs before tiers/recoupment in v2.
 * Distinct from `DistributionFeeRule` (v1) because v2 supports both a
 * flat-fee branch and a percentage branch via the FLATFEE extension on
 * the v1 type — we reuse the v1 shape here so a single processor handles
 * both schemas.
 */
export type DeductionRule = DistributionFeeRule;

/**
 * Complete v2 rule snapshot. The top-level `mode` discriminator drives
 * which sub-fields are required. The validator enforces:
 *
 *   - `revenue_share` mode: `tiers` must be empty; either `splits` (direct
 *     gross/net split) or `poolRevenueSources[]` populated.
 *   - `recoup` mode: exactly 1 tier in `tiers`.
 *   - `waterfall` mode: exactly 2 tiers in `tiers`, in tier-number order.
 *
 * `deductions[]` is optional and orthogonal to mode (any mode may have
 * pre-distribution deductions).
 *
 * Stored verbatim in `RuleSnapshot.rules: Json` — no Prisma migration.
 */
export interface RuleSnapshotRulesV2 {
  schemaVersion: 2;
  mode: SettlementMode;
  /** Optional pre-distribution deductions (distributor fees, marketing recoupment, etc.) */
  deductions?: DeductionRule[];
  /** Pool funding rules — at most one pool target per snapshot in v1 */
  poolRevenueSources?: PoolRevenueSourceRule[];
  /** Waterfall tiers — 0/1/2 entries depending on mode */
  tiers?: WaterfallTierRule[];
  /** Direct revenue_share splits (used only when mode === 'revenue_share' and no pool) */
  splits?: AllocationSplit[];
}

/**
 * Discriminated union of v1 and v2 rule shapes for the read path in
 * `extractSettlementRules()`. `RuleSnapshot.rules` is `Json` in Prisma so
 * the actual stored value is `unknown` — narrowing happens via
 * `getRulesSchemaVersion()`.
 */
export type StoredRuleSnapshot =
  | { schemaVersion?: 1; [key: string]: unknown }
  | RuleSnapshotRulesV2;

/**
 * Inspect a stored rules JSON blob and return its schema version.
 * `undefined` or `1` → v1; `2` → v2; anything else throws.
 *
 * The result is used by `extractSettlementRules()` to pick the right
 * read-path; v1 snapshots produce byte-identical output to before Run 2.
 */
export function getRulesSchemaVersion(rules: unknown): 1 | 2 {
  if (rules === null || typeof rules !== 'object') return 1;
  const sv = (rules as { schemaVersion?: unknown }).schemaVersion;
  if (sv === undefined || sv === 1) return 1;
  if (sv === 2) return 2;
  throw new Error(`Unsupported RuleSnapshot.schemaVersion: ${String(sv)}`);
}

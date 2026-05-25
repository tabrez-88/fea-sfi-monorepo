/**
 * Settlement Engine
 *
 * Pure computation class for settlement calculations.
 * NO NestJS, NO Prisma, NO I/O, NO side effects.
 *
 * Given a JSON input (rules + revenue batches + participants),
 * produces a deterministic JSON output (allocations + proof).
 *
 * v1 Waterfall phases (legacy):
 *   1. GROSS_RECEIPTS - Sum all revenue batches
 *   2. DISTRIBUTION_FEES - Deduct distributor fees
 *   3. RECOUPMENT - Investors recoup their investment (with caps)
 *   4. NET_PROFITS - Split remaining among participants
 *
 * v2 Orchestration (FB-003 Run 3) — engine takes this path when
 * `input.rulesV2` is set. Mode-driven:
 *   - revenue_share: gross + deductions + pool revenue source +
 *                    direct pool/split distribution + retained → creator
 *   - recoup: gross + deductions + pool revenue source + single-tier
 *             recoupment (with multiplier) + retained → creator
 *   - waterfall: gross + deductions + pool revenue source + Tier 1 +
 *                Tier 2 (each with exit conditions) + retained → creator
 */

import { processDistributionFees } from './phases/distribution-fees';
import { processGrossReceipts } from './phases/gross-receipts';
import { processNetProfits } from './phases/net-profits';
import { processPoolRevenueSource } from './phases/pool-revenue-source';
import { processRecoupment, RecoupmentResult } from './phases/recoupment';
import { processWaterfallTier, WaterfallTierResult } from './phases/waterfall-tier';
import {
  AllocationEntry,
  ParticipantBalanceOutput,
  PhaseResult,
  RecoupmentBalance,
  RuleSnapshotRulesV2,
  SettlementInput,
  SettlementOutput,
} from './types';
import { sum } from './utils/decimal';
import { generateProofRecord } from './utils/proof-hash';

export class SettlementEngine {
  /**
   * Calculate settlement allocations.
   *
   * Branches on `input.rulesV2`:
   *   - undefined → v1 legacy path (bit-identical to FB-001/FB-002 behavior;
   *     proof-hash regression bar locked at sha256:d75e8666…36ddf06)
   *   - defined   → v2 mode-aware orchestration
   *
   * @param input - Complete settlement input (rules, batches, participants)
   * @param timestamp - ISO timestamp for proof record (passed in for determinism)
   * @returns Complete settlement output with allocations and proof
   */
  calculate(input: SettlementInput, timestamp?: string): SettlementOutput {
    this.validateInput(input);

    const proofTimestamp = timestamp ?? new Date().toISOString();

    if (input.rulesV2) {
      return this.calculateV2(input, proofTimestamp);
    }
    return this.calculateV1(input, proofTimestamp);
  }

  // ──────────────────────────────────────────────────────────────────
  // v1 path — UNCHANGED. Preserves the proof-hash regression bar.
  // ──────────────────────────────────────────────────────────────────

  private calculateV1(input: SettlementInput, proofTimestamp: string): SettlementOutput {
    // Phase 1: Gross Receipts
    const grossResult = processGrossReceipts(input.revenueBatches);

    // Phase 2: Distribution Fees
    const feeResult = processDistributionFees(
      grossResult.remainingAmount,
      input.rules.distributionFees,
      input.participants,
    );

    // Phase 3: Recoupment
    const recoupResult: RecoupmentResult = processRecoupment(
      feeResult.remainingAmount,
      input.rules.recoupment,
      input.participants,
    );

    // Phase 4: Net Profits
    const profitResult = processNetProfits(
      recoupResult.remainingAmount,
      input.rules.netProfitSplit,
      input.participants,
    );

    // Collect all allocations across phases
    const allAllocations: AllocationEntry[] = [
      ...feeResult.allocations,
      ...recoupResult.allocations,
      ...profitResult.allocations,
    ];

    // Collect phase results
    const phaseResults: PhaseResult[] = [
      grossResult,
      feeResult,
      { ...recoupResult, balances: undefined } as PhaseResult,
      profitResult,
    ];

    // Recoupment balances
    const recoupmentBalances: RecoupmentBalance[] = recoupResult.balances;

    const totalAllocated = sum(allAllocations.map((a) => a.amount));

    // Generate proof hash
    const proof = generateProofRecord(input, allAllocations, proofTimestamp);

    return {
      settlementRunId: input.settlementRunId,
      totalRevenue: grossResult.inputAmount,
      totalAllocated,
      currency: input.currency,
      phaseResults,
      allocations: allAllocations,
      recoupmentBalances,
      proof,
    };
  }

  // ──────────────────────────────────────────────────────────────────
  // v2 path — mode-aware orchestration. Always extracts pool revenue
  // source up-front, then dispatches per mode for the rest.
  // ──────────────────────────────────────────────────────────────────

  private calculateV2(input: SettlementInput, proofTimestamp: string): SettlementOutput {
    const rulesV2 = input.rulesV2 as RuleSnapshotRulesV2;
    const priorBalances = new Map<string, number>(
      (input.priorBalances ?? []).map((b) => [b.participantId, b.cumulativePayout]),
    );

    // Phase 1: Gross Receipts (same as v1)
    const grossResult = processGrossReceipts(input.revenueBatches);

    // Phase 2: Distribution Fees / Deductions
    //   Read v2 deductions from `rulesV2.deductions` directly — single
    //   source of truth, no dependency on the upstream extractor having
    //   populated the legacy `input.rules.distributionFees` mirror.
    const feeResult = processDistributionFees(
      grossResult.remainingAmount,
      rulesV2.deductions ?? input.rules.distributionFees,
      input.participants,
    );

    // Phase 3: Pool Revenue Source — splits net into pool-bound + retained.
    //   For revenue_share / recoup / waterfall, this phase always runs.
    //   Default (no rule) = 100% of net to pool, 0% retained.
    const poolSrcResult = processPoolRevenueSource(
      grossResult.remainingAmount, // gross basis
      feeResult.remainingAmount, // net basis
      rulesV2.poolRevenueSources,
    );

    // Dispatch to mode-specific orchestration for the downstream phases.
    const downstream = this.runV2Downstream(input, rulesV2, poolSrcResult, priorBalances);

    // Collect everything.
    const allAllocations: AllocationEntry[] = [
      ...feeResult.allocations,
      ...downstream.allocations,
    ];

    const phaseResults: PhaseResult[] = [
      grossResult,
      feeResult,
      poolSrcResult,
      ...downstream.phaseResults,
    ];

    const totalAllocated = sum(allAllocations.map((a) => a.amount));
    const proof = generateProofRecord(input, allAllocations, proofTimestamp);

    return {
      settlementRunId: input.settlementRunId,
      totalRevenue: grossResult.inputAmount,
      totalAllocated,
      currency: input.currency,
      phaseResults,
      allocations: allAllocations,
      recoupmentBalances: downstream.recoupmentBalances,
      participantBalances: downstream.participantBalances,
      proof,
    };
  }

  /**
   * v2 downstream: mode-specific allocation logic. Consumes the pool
   * revenue source result and produces tier / recoup / split allocations
   * + cumulative balance write-backs.
   */
  private runV2Downstream(
    input: SettlementInput,
    rulesV2: RuleSnapshotRulesV2,
    poolSrc: ReturnType<typeof processPoolRevenueSource>,
    priorBalances: Map<string, number>,
  ): {
    allocations: AllocationEntry[];
    phaseResults: PhaseResult[];
    recoupmentBalances: RecoupmentBalance[];
    participantBalances: ParticipantBalanceOutput[];
  } {
    if (rulesV2.mode === 'waterfall') {
      return this.runWaterfall(input, rulesV2, poolSrc, priorBalances);
    }
    if (rulesV2.mode === 'recoup') {
      return this.runRecoupMode(input, rulesV2, poolSrc, priorBalances);
    }
    return this.runRevenueShare(input, rulesV2, poolSrc);
  }

  /**
   * Mode: revenue_share. No tiers, no recoup. Pool-bound feeds the pool
   * (or top-level splits); retained flows to non-pool participants via
   * the legacy net-profits phase using `input.rules.netProfitSplit`.
   */
  private runRevenueShare(
    input: SettlementInput,
    rulesV2: RuleSnapshotRulesV2,
    poolSrc: ReturnType<typeof processPoolRevenueSource>,
  ): ReturnType<SettlementEngine['runV2Downstream']> {
    const allocations: AllocationEntry[] = [];
    const phaseResults: PhaseResult[] = [];
    const participantBalances: ParticipantBalanceOutput[] = [];

    // Pool-bound — distribute via a single Tier-1-shaped rule if there's
    // a pool. We reuse processWaterfallTier with no cap to expand pool
    // members via the pool resolver. When the snapshot has top-level
    // splits[] but no pool, we route those through the legacy net-profits
    // phase via input.rules.netProfitSplit (already extracted).
    if (poolSrc.poolBound > 0 && hasPoolSplit(rulesV2)) {
      const tierResult = processWaterfallTier({
        tier: 1,
        inputAmount: poolSrc.poolBound,
        rule: synthesizeRevenueShareTier(rulesV2),
        participants: input.participants,
        runDate: input.runDate,
        priorBalances: new Map(), // no hard cap in revenue_share
      });
      allocations.push(...tierResult.allocations);
      phaseResults.push(tierResult);
      participantBalances.push(...tierResult.participantBalances);
    }

    // Retained slice + (when no pool) all of pool-bound → legacy net profits
    const netProfitInput =
      poolSrc.retained + (hasPoolSplit(rulesV2) ? 0 : poolSrc.poolBound);
    if (netProfitInput > 0 && input.rules.netProfitSplit.length > 0) {
      const profitResult = processNetProfits(
        netProfitInput,
        input.rules.netProfitSplit,
        input.participants,
      );
      allocations.push(...profitResult.allocations);
      phaseResults.push(profitResult);
    }

    return {
      allocations,
      phaseResults,
      recoupmentBalances: [],
      participantBalances,
    };
  }

  /**
   * Mode: recoup. Single recoupment phase (legacy processRecoupment with
   * multiplier support from Run 2) on the pool-bound slice. Retained slice
   * + any post-recoup remainder flow to non-pool participants via legacy
   * net-profits phase.
   */
  private runRecoupMode(
    input: SettlementInput,
    _rulesV2: RuleSnapshotRulesV2,
    poolSrc: ReturnType<typeof processPoolRevenueSource>,
    _priorBalances: Map<string, number>,
  ): ReturnType<SettlementEngine['runV2Downstream']> {
    const allocations: AllocationEntry[] = [];
    const phaseResults: PhaseResult[] = [];

    // Recoupment runs on pool-bound. The extractor populated
    // input.rules.recoupment from rulesV2.tiers[0] when mode === 'recoup'.
    const recoupResult: RecoupmentResult = processRecoupment(
      poolSrc.poolBound,
      input.rules.recoupment,
      input.participants,
    );
    allocations.push(...recoupResult.allocations);
    phaseResults.push({ ...recoupResult, balances: undefined } as PhaseResult);

    // Whatever didn't get recouped + the retained slice → net profits to
    // non-pool participants.
    const netProfitInput = poolSrc.retained + recoupResult.remainingAmount;
    if (netProfitInput > 0 && input.rules.netProfitSplit.length > 0) {
      const profitResult = processNetProfits(
        netProfitInput,
        input.rules.netProfitSplit,
        input.participants,
      );
      allocations.push(...profitResult.allocations);
      phaseResults.push(profitResult);
    }

    return {
      allocations,
      phaseResults,
      recoupmentBalances: recoupResult.balances,
      participantBalances: [],
    };
  }

  /**
   * Mode: waterfall. Full Tier 1 + Tier 2 + exit conditions.
   *
   *   pool-bound → Tier 1 (recoupMultiplier as cap, no hard cap unless set)
   *                  └→ tier 1 remainder → Tier 2 (splits + hardCapMultiplier)
   *                                          └→ tier 2 remainder → creator (residual)
   *   retained → creator (legacy net-profits)
   */
  private runWaterfall(
    input: SettlementInput,
    rulesV2: RuleSnapshotRulesV2,
    poolSrc: ReturnType<typeof processPoolRevenueSource>,
    priorBalances: Map<string, number>,
  ): ReturnType<SettlementEngine['runV2Downstream']> {
    const allocations: AllocationEntry[] = [];
    const phaseResults: PhaseResult[] = [];
    const participantBalances: ParticipantBalanceOutput[] = [];

    const tiers = rulesV2.tiers ?? [];
    const tier1Rule = tiers.find((t) => t.tier === 1);
    const tier2Rule = tiers.find((t) => t.tier === 2);

    let tierInput = poolSrc.poolBound;

    // Tier 1
    if (tier1Rule) {
      const tier1Result: WaterfallTierResult = processWaterfallTier({
        tier: 1,
        inputAmount: tierInput,
        rule: tier1Rule,
        participants: input.participants,
        runDate: input.runDate,
        priorBalances,
      });
      allocations.push(...tier1Result.allocations);
      phaseResults.push(tier1Result);
      participantBalances.push(...tier1Result.participantBalances);
      tierInput = tier1Result.remainingAmount;

      // Update priorBalances in-flight so Tier 2 sees Tier 1's payouts.
      for (const bal of tier1Result.participantBalances) {
        priorBalances.set(bal.participantId, bal.cumulativePayout);
      }
    }

    // Tier 2
    if (tier2Rule && tierInput > 0) {
      const tier2Result: WaterfallTierResult = processWaterfallTier({
        tier: 2,
        inputAmount: tierInput,
        rule: tier2Rule,
        participants: input.participants,
        runDate: input.runDate,
        priorBalances,
      });
      allocations.push(...tier2Result.allocations);
      phaseResults.push(tier2Result);
      // Merge Tier 2 balances onto Tier 1's (per-participant union).
      for (const bal of tier2Result.participantBalances) {
        const existing = participantBalances.find(
          (b) => b.participantId === bal.participantId,
        );
        if (existing) {
          existing.cumulativePayout = bal.cumulativePayout;
          existing.paidThisRun = (existing.paidThisRun ?? 0) + bal.paidThisRun;
          existing.exitConditions = bal.exitConditions;
        } else {
          participantBalances.push(bal);
        }
      }
      tierInput = tier2Result.remainingAmount;
    }

    // Retained slice + tier residual → creator(s) via legacy net-profits.
    const creatorAmount = poolSrc.retained + tierInput;
    if (creatorAmount > 0 && input.rules.netProfitSplit.length > 0) {
      const profitResult = processNetProfits(
        creatorAmount,
        input.rules.netProfitSplit,
        input.participants,
      );
      allocations.push(...profitResult.allocations);
      phaseResults.push(profitResult);
    }

    return {
      allocations,
      phaseResults,
      recoupmentBalances: [],
      participantBalances,
    };
  }

  /**
   * Validate engine input before processing.
   * Throws descriptive errors for invalid input.
   */
  private validateInput(input: SettlementInput): void {
    if (!input.revenueBatches || input.revenueBatches.length === 0) {
      throw new Error('At least one revenue batch is required');
    }

    if (!input.participants || input.participants.length === 0) {
      throw new Error('At least one participant is required');
    }

    if (!input.rules) {
      throw new Error('Settlement rules are required');
    }

    // Validate net profit percentages sum to 100 (v1 path uses these as the
    // primary distribution; v2 uses them as the "retained creator slice"
    // when present — same sum-to-100 invariant either way when non-empty).
    if (input.rules.netProfitSplit.length > 0) {
      const totalPercentage = input.rules.netProfitSplit.reduce(
        (s, r) => s + r.percentage,
        0,
      );
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new Error(
          `Net profit percentages must sum to 100%, got ${totalPercentage}%`,
        );
      }
    }

    // Validate no negative amounts in revenue batches
    for (const batch of input.revenueBatches) {
      if (batch.amount < 0) {
        throw new Error(
          `Revenue batch ${batch.id} has negative amount: ${batch.amount}`,
        );
      }
    }

    // Validate referenced participants exist
    const participantIds = new Set(input.participants.map((p) => p.id));

    for (const rule of input.rules.distributionFees) {
      if (!participantIds.has(rule.participantId)) {
        throw new Error(
          `Distribution fee references unknown participant: ${rule.participantId}`,
        );
      }
    }

    for (const rule of input.rules.recoupment) {
      if (!participantIds.has(rule.participantId)) {
        throw new Error(
          `Recoupment rule references unknown participant: ${rule.participantId}`,
        );
      }
    }

    for (const rule of input.rules.netProfitSplit) {
      if (!participantIds.has(rule.participantId)) {
        throw new Error(
          `Net profit rule references unknown participant: ${rule.participantId}`,
        );
      }
    }
  }
}

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

function hasPoolSplit(rulesV2: RuleSnapshotRulesV2): boolean {
  if (rulesV2.splits) {
    return rulesV2.splits.some((s) => s.target.type === 'pool');
  }
  return Boolean(
    rulesV2.poolRevenueSources && rulesV2.poolRevenueSources.length > 0,
  );
}

/**
 * For revenue_share mode with a pool target, synthesize a Tier-1-shaped
 * rule so `processWaterfallTier` can expand the pool via the resolver.
 * No tier-level cap (revenue_share has no cap concept).
 */
function synthesizeRevenueShareTier(
  rulesV2: RuleSnapshotRulesV2,
): import('./types').WaterfallTierRule {
  // Prefer top-level splits; fall back to a synthesized 100%→pool when
  // only poolRevenueSources is configured.
  if (rulesV2.splits && rulesV2.splits.length > 0) {
    return { tier: 1, splits: rulesV2.splits };
  }
  const poolId = rulesV2.poolRevenueSources?.[0]?.poolId ?? 'pool';
  return {
    tier: 1,
    splits: [{ target: { type: 'pool', poolId }, percentage: 100 }],
  };
}

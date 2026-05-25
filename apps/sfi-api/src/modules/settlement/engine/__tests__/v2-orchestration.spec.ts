/**
 * FB-003 Run 3 — 6-scenario engine test matrix (Round 1 §13).
 *
 *   1. Tour deal — Mode 1 Revenue Share, no deductions, 20% of Gross to pool
 *   2. Film deal — Mode 3 Waterfall, 12% + $50K deductions, 100% of Net, hard cap 140%
 *   3. Hybrid — Mode 3 Waterfall, deductions ON, 40% of Net, mixed exit
 *   4. Hard cap clip — multi-run scenario where run 2 pushes past cap
 *   5. Deadline skip — runDate > deadline halts Tier 2
 *   6. Legacy v1 — existing v1 rules unchanged (covered by settlement-engine.spec.ts;
 *      this file adds one extra cross-check that v2 + rulesV2=undefined === v1)
 */

import { SettlementEngine } from '../settlement-engine';
import {
  ParticipantBehavior,
  Phase,
  RuleSnapshotRulesV2,
  SettlementInput,
} from '../types';

const FIXED_TIMESTAMP = '2026-05-20T10:00:00.000Z';

describe('SettlementEngine — v2 Orchestration (FB-003 Run 3, 6-scenario matrix)', () => {
  const engine = new SettlementEngine();

  // ──────────────────────────────────────────────────────────────────
  // Scenario 1 — Tour deal — Mode 1 Revenue Share, 20% of Gross to pool
  // ──────────────────────────────────────────────────────────────────

  describe('Scenario 1 — Tour deal (Revenue Share, 20% of Gross to investor pool)', () => {
    it('routes 20% of $1M gross to a 2-investor pool, 80% retained by creator', () => {
      const rulesV2: RuleSnapshotRulesV2 = {
        schemaVersion: 2,
        mode: 'revenue_share',
        // No deductions for a tour deal — pool takes from gross directly
        poolRevenueSources: [{ poolId: 'investor-pool', percentage: 20, basis: 'GROSS' }],
        splits: [{ target: { type: 'pool', poolId: 'investor-pool' }, percentage: 100 }],
      };

      const input: SettlementInput = {
        settlementRunId: 'tour-run-1',
        ruleSnapshotVersion: 1,
        currency: 'USD',
        revenueBatches: [
          { id: 'batch-1', amount: 1_000_000, periodStart: '2026-06-01', periodEnd: '2026-06-30' },
        ],
        participants: [
          { id: 'creator', name: 'Tour Creator', roleName: 'Artist', behaviorType: ParticipantBehavior.NET_PROFIT_SHARE },
          { id: 'inv-a', name: 'Investor A', roleName: 'Investor', behaviorType: ParticipantBehavior.RECOUPMENT, poolMember: true, poolId: 'investor-pool', units: 60 },
          { id: 'inv-b', name: 'Investor B', roleName: 'Investor', behaviorType: ParticipantBehavior.RECOUPMENT, poolMember: true, poolId: 'investor-pool', units: 40 },
        ],
        rules: {
          distributionFees: [],
          recoupment: [],
          // Creator gets 100% of the retained (non-pool) slice
          netProfitSplit: [{ participantId: 'creator', percentage: 100 }],
        },
        runDate: FIXED_TIMESTAMP,
        rulesV2,
      };

      const result = engine.calculate(input, FIXED_TIMESTAMP);

      // 20% of $1M = $200K to pool, $800K retained for creator
      const poolSrcPhase = result.phaseResults.find((p) => p.phase === Phase.POOL_REVENUE_SOURCE);
      expect(poolSrcPhase).toBeDefined();
      expect((poolSrcPhase as unknown as { poolBound: number }).poolBound).toBe(200_000);

      // Pool split 60/40 by units → A gets $120K, B gets $80K
      const invA = result.allocations.find((a) => a.participantId === 'inv-a');
      const invB = result.allocations.find((a) => a.participantId === 'inv-b');
      expect(invA?.amount).toBe(120_000);
      expect(invB?.amount).toBe(80_000);

      // Creator gets the retained $800K via net-profits phase
      const creator = result.allocations.find((a) => a.participantId === 'creator');
      expect(creator?.amount).toBe(800_000);

      // Total allocations = $1M
      expect(result.totalAllocated).toBe(1_000_000);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Scenario 2 — Film deal — Mode 3 Waterfall, 12% + $50K deductions,
  //              100% of Net to pool, Tier 2 hard cap 140%
  // ──────────────────────────────────────────────────────────────────

  describe('Scenario 2 — Film deal (Waterfall, 12% + $50K deductions, 100% Net, hard cap 140%)', () => {
    it('runs the full waterfall: deductions → pool source → Tier 1 → Tier 2 with 140% cap', () => {
      const rulesV2: RuleSnapshotRulesV2 = {
        schemaVersion: 2,
        mode: 'waterfall',
        deductions: [
          { participantId: 'distributor', feePercentage: 12 },
          { participantId: 'distributor', feePercentage: 0, feeAmount: 50_000 },
        ],
        poolRevenueSources: [{ poolId: 'investor-pool', percentage: 100, basis: 'NET' }],
        tiers: [
          {
            tier: 1,
            recoupMultiplier: 1.2,
            splits: [{ target: { type: 'pool', poolId: 'investor-pool' }, percentage: 100 }],
          },
          {
            tier: 2,
            hardCapMultiplier: 1.4,
            splits: [
              { target: { type: 'pool', poolId: 'investor-pool' }, percentage: 20 },
              { target: { type: 'individual', participantId: 'studio' }, percentage: 80 },
            ],
          },
        ],
      };

      const input: SettlementInput = {
        settlementRunId: 'film-run-1',
        ruleSnapshotVersion: 1,
        currency: 'USD',
        revenueBatches: [
          { id: 'batch-1', amount: 10_000_000, periodStart: '2026-01-01', periodEnd: '2026-12-31' },
        ],
        participants: [
          { id: 'distributor', name: 'Distributor', roleName: 'Distributor', behaviorType: ParticipantBehavior.FEE_DEDUCTION },
          { id: 'studio', name: 'Studio', roleName: 'Studio', behaviorType: ParticipantBehavior.NET_PROFIT_SHARE },
          { id: 'inv-a', name: 'Investor A', roleName: 'Investor', behaviorType: ParticipantBehavior.RECOUPMENT, poolMember: true, poolId: 'investor-pool', investmentAmount: 500_000, units: 50 },
          { id: 'inv-b', name: 'Investor B', roleName: 'Investor', behaviorType: ParticipantBehavior.RECOUPMENT, poolMember: true, poolId: 'investor-pool', investmentAmount: 500_000, units: 50 },
        ],
        rules: { distributionFees: [], recoupment: [], netProfitSplit: [] },
        runDate: FIXED_TIMESTAMP,
        rulesV2,
      };

      const result = engine.calculate(input, FIXED_TIMESTAMP);

      // Deductions: 12% of $10M = $1.2M + $50K flat = $1.25M
      // Net: $10M − $1.25M = $8.75M
      const feePhase = result.phaseResults.find((p) => p.phase === Phase.DISTRIBUTION_FEES);
      expect(feePhase?.totalAllocated).toBe(1_250_000);

      // Pool source: 100% of $8.75M = $8.75M to pool
      const poolSrcPhase = result.phaseResults.find((p) => p.phase === Phase.POOL_REVENUE_SOURCE);
      expect((poolSrcPhase as unknown as { poolBound: number }).poolBound).toBe(8_750_000);

      // Engine produces phase results for both tiers
      const tier1 = result.phaseResults.find((p) => p.phase === Phase.WATERFALL_TIER_1);
      const tier2 = result.phaseResults.find((p) => p.phase === Phase.WATERFALL_TIER_2);
      expect(tier1).toBeDefined();
      expect(tier2).toBeDefined();

      // Each investor cap = $500K × 1.4 = $700K (Tier 2 hard cap binds)
      // Cumulative balance written back per investor
      expect(result.participantBalances?.length).toBe(2);
      for (const bal of result.participantBalances ?? []) {
        expect(bal.cumulativePayout).toBeLessThanOrEqual(700_000 + 0.01);
        // Each pool member should have exit-condition chips attached
        expect(bal.exitConditions.length).toBeGreaterThan(0);
      }

      // Hash is stable + non-empty
      expect(result.proof.proofHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Scenario 3 — Hybrid — Mode 3 Waterfall, deductions ON,
  //              40% of Net to pool, mixed exit (cap + deadline)
  // ──────────────────────────────────────────────────────────────────

  describe('Scenario 3 — Hybrid Waterfall (40% of Net, mixed exit)', () => {
    it('routes 40% of net into the waterfall and 60% retained for creator', () => {
      const rulesV2: RuleSnapshotRulesV2 = {
        schemaVersion: 2,
        mode: 'waterfall',
        deductions: [{ participantId: 'distributor', feePercentage: 10 }],
        poolRevenueSources: [{ poolId: 'investor-pool', percentage: 40, basis: 'NET' }],
        tiers: [
          {
            tier: 1,
            recoupMultiplier: 1,
            splits: [{ target: { type: 'pool', poolId: 'investor-pool' }, percentage: 100 }],
          },
          {
            tier: 2,
            hardCapMultiplier: 1.3,
            deadline: '2030-12-31',
            splits: [
              { target: { type: 'pool', poolId: 'investor-pool' }, percentage: 30 },
              { target: { type: 'individual', participantId: 'creator' }, percentage: 70 },
            ],
          },
        ],
      };

      const input: SettlementInput = {
        settlementRunId: 'hybrid-run-1',
        ruleSnapshotVersion: 1,
        currency: 'USD',
        revenueBatches: [
          { id: 'batch-1', amount: 5_000_000, periodStart: '2026-01-01', periodEnd: '2026-06-30' },
        ],
        participants: [
          { id: 'distributor', name: 'Distributor', roleName: 'Distributor', behaviorType: ParticipantBehavior.FEE_DEDUCTION },
          { id: 'creator', name: 'Creator', roleName: 'Artist', behaviorType: ParticipantBehavior.NET_PROFIT_SHARE },
          { id: 'inv-a', name: 'Investor A', roleName: 'Investor', behaviorType: ParticipantBehavior.RECOUPMENT, poolMember: true, poolId: 'investor-pool', investmentAmount: 200_000, units: 100 },
        ],
        rules: {
          distributionFees: [],
          recoupment: [],
          // Retained 60% slice flows to creator via legacy net-profits phase
          netProfitSplit: [{ participantId: 'creator', percentage: 100 }],
        },
        runDate: FIXED_TIMESTAMP,
        rulesV2,
      };

      const result = engine.calculate(input, FIXED_TIMESTAMP);

      // 10% deductions on $5M = $500K. Net = $4.5M.
      // Pool source: 40% of $4.5M = $1.8M to pool. Retained = $2.7M.
      const poolSrcPhase = result.phaseResults.find((p) => p.phase === Phase.POOL_REVENUE_SOURCE);
      expect((poolSrcPhase as unknown as { poolBound: number }).poolBound).toBe(1_800_000);
      expect((poolSrcPhase as unknown as { retained: number }).retained).toBe(2_700_000);

      // Creator gets retained $2.7M + Tier 2 cap surplus that flows
      // downstream when investor hits hard cap. With investment $200K:
      //   Tier 1 cap = $200K (recoupMultiplier 1.0) → investor recouped $200K, $1.6M flows to Tier 2
      //   Tier 2 split: 30% pool ($480K, clipped to $60K headroom), 70% creator ($1.12M)
      //   Tier 2 residual = $1.6M - $60K - $1.12M = $420K → creator (via net-profits)
      //   Creator total = $2.7M retained + $1.12M Tier 2 share + $420K residual = $4.24M
      const creator = result.allocations.find(
        (a) => a.participantId === 'creator' && a.phase === Phase.NET_PROFITS,
      );
      // Net profits phase receives retained + Tier 2 residual; creator
      // also receives the Tier 2 split directly from Tier 2 phase.
      expect(creator?.amount).toBe(3_120_000); // $2.7M retained + $420K Tier 2 residual

      // Investor was capped at $260K (Tier 1 $200K + Tier 2 $60K headroom)
      const investorBal = result.participantBalances?.find((b) => b.participantId === 'inv-a');
      expect(investorBal?.cumulativePayout).toBe(260_000);

      // Sum of all allocations must equal gross (modulo deductions, which
      // pay the distributor)
      const allTotal = result.allocations.reduce((s, a) => s + a.amount, 0);
      expect(allTotal).toBe(5_000_000); // $500K dist + $260K investor + $1.12M creator Tier 2 + $3.12M creator net-profits
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Scenario 4 — Hard cap clip multi-run
  //              Run 1 + Run 2 → cumulative payout clips at investor cap
  // ──────────────────────────────────────────────────────────────────

  describe('Scenario 4 — Hard cap clip across multi-run', () => {
    it('Run 2 clips pool member at remaining headroom (cumulative tracking)', () => {
      const rulesV2: RuleSnapshotRulesV2 = {
        schemaVersion: 2,
        mode: 'waterfall',
        poolRevenueSources: [{ poolId: 'investor-pool', percentage: 100, basis: 'NET' }],
        tiers: [
          {
            tier: 1,
            recoupMultiplier: 1,
            splits: [{ target: { type: 'pool', poolId: 'investor-pool' }, percentage: 100 }],
          },
          {
            tier: 2,
            hardCapMultiplier: 1.3, // $100 invested × 1.3 = $130 hard cap
            splits: [{ target: { type: 'pool', poolId: 'investor-pool' }, percentage: 100 }],
          },
        ],
      };

      const buildInput = (
        runId: string,
        revenue: number,
        priorBalance?: number,
      ): SettlementInput => ({
        settlementRunId: runId,
        ruleSnapshotVersion: 1,
        currency: 'USD',
        revenueBatches: [
          { id: `${runId}-batch`, amount: revenue, periodStart: '2026-01-01', periodEnd: '2026-12-31' },
        ],
        participants: [
          { id: 'inv-a', name: 'Investor A', roleName: 'Investor', behaviorType: ParticipantBehavior.RECOUPMENT, poolMember: true, poolId: 'investor-pool', investmentAmount: 100, units: 1 },
        ],
        rules: { distributionFees: [], recoupment: [], netProfitSplit: [] },
        runDate: FIXED_TIMESTAMP,
        rulesV2,
        ...(priorBalance !== undefined && {
          priorBalances: [{ participantId: 'inv-a', cumulativePayout: priorBalance }],
        }),
      });

      // Run 1 — pay $100 (Tier 1) then Tier 2 pays $100 more = $200. But cap
      // is $130, so cumulative should clip at $130.
      const run1 = engine.calculate(buildInput('run-1', 200), FIXED_TIMESTAMP);
      const run1Bal = run1.participantBalances?.find((b) => b.participantId === 'inv-a');
      expect(run1Bal?.cumulativePayout).toBeLessThanOrEqual(130 + 0.01);

      // Run 2 — start with prior balance of $100 (assume Run 1 paid only $100
      // via Tier 1, surrogate state). Tier 2 should then clip at $30 (headroom).
      const run2 = engine.calculate(buildInput('run-2', 200, 100), FIXED_TIMESTAMP);
      const run2Bal = run2.participantBalances?.find((b) => b.participantId === 'inv-a');
      // Cumulative ≤ cap
      expect(run2Bal?.cumulativePayout).toBeLessThanOrEqual(130 + 0.01);
      // paidThisRun ≤ remaining headroom from prior balance
      expect(run2Bal?.paidThisRun).toBeLessThanOrEqual(30 + 0.01);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Scenario 5 — Deadline skip — Tier 2 halted when runDate > deadline
  // ──────────────────────────────────────────────────────────────────

  describe('Scenario 5 — Deadline skip', () => {
    it('skips Tier 2 entirely when runDate is past the tier deadline; remainder flows downstream', () => {
      const rulesV2: RuleSnapshotRulesV2 = {
        schemaVersion: 2,
        mode: 'waterfall',
        poolRevenueSources: [{ poolId: 'investor-pool', percentage: 100, basis: 'NET' }],
        tiers: [
          {
            tier: 1,
            recoupMultiplier: 1,
            splits: [{ target: { type: 'pool', poolId: 'investor-pool' }, percentage: 100 }],
          },
          {
            tier: 2,
            deadline: '2025-01-01', // already past at FIXED_TIMESTAMP (2026-05-20)
            splits: [
              { target: { type: 'pool', poolId: 'investor-pool' }, percentage: 50 },
              { target: { type: 'individual', participantId: 'creator' }, percentage: 50 },
            ],
          },
        ],
      };

      const input: SettlementInput = {
        settlementRunId: 'deadline-run',
        ruleSnapshotVersion: 1,
        currency: 'USD',
        revenueBatches: [
          { id: 'batch-1', amount: 1_000, periodStart: '2026-01-01', periodEnd: '2026-12-31' },
        ],
        participants: [
          { id: 'creator', name: 'Creator', roleName: 'Artist', behaviorType: ParticipantBehavior.NET_PROFIT_SHARE },
          { id: 'inv-a', name: 'Investor A', roleName: 'Investor', behaviorType: ParticipantBehavior.RECOUPMENT, poolMember: true, poolId: 'investor-pool', investmentAmount: 100, units: 1 },
        ],
        rules: {
          distributionFees: [],
          recoupment: [],
          // Tier 2 remainder + retained flows here
          netProfitSplit: [{ participantId: 'creator', percentage: 100 }],
        },
        runDate: FIXED_TIMESTAMP,
        rulesV2,
      };

      const result = engine.calculate(input, FIXED_TIMESTAMP);

      const tier2 = result.phaseResults.find((p) => p.phase === Phase.WATERFALL_TIER_2);
      expect(tier2).toBeDefined();
      expect(tier2?.totalAllocated).toBe(0);
      expect((tier2 as { details: { skipped?: string } }).details.skipped).toBe(
        'deadline_reached',
      );

      // Tier 2 input flows downstream to net-profits → creator gets all
      // remaining (whatever Tier 1 didn't pay out).
      const creatorAlloc = result.allocations.find(
        (a) => a.participantId === 'creator' && a.phase === Phase.NET_PROFITS,
      );
      expect(creatorAlloc).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Scenario 6 — v1 regression — engine still walks legacy 4 phases
  //              when rulesV2 is undefined (proof-hash bar locked
  //              separately in settlement-engine.spec.ts; this is just
  //              the "v2 path code change didn't leak into v1" check).
  // ──────────────────────────────────────────────────────────────────

  describe('Scenario 6 — v1 regression: rulesV2-undefined still produces 4 legacy phases', () => {
    it('produces exactly 4 phase results (gross / fees / recoup / profits) for v1 input', () => {
      const input: SettlementInput = {
        settlementRunId: 'v1-run',
        ruleSnapshotVersion: 1,
        currency: 'USD',
        revenueBatches: [
          { id: 'b1', amount: 1_000_000, periodStart: '2026-01-01', periodEnd: '2026-12-31' },
        ],
        participants: [
          { id: 'studio', name: 'Studio', roleName: 'Studio', behaviorType: ParticipantBehavior.NET_PROFIT_SHARE },
          { id: 'investor', name: 'Investor', roleName: 'Investor', behaviorType: ParticipantBehavior.RECOUPMENT },
        ],
        rules: {
          distributionFees: [],
          recoupment: [
            { participantId: 'investor', recoupAmount: 200_000, recoupCap: 200_000, priority: 1 },
          ],
          netProfitSplit: [
            { participantId: 'studio', percentage: 70 },
            { participantId: 'investor', percentage: 30 },
          ],
        },
        // No rulesV2 → v1 path
      };

      const result = engine.calculate(input, FIXED_TIMESTAMP);

      expect(result.phaseResults).toHaveLength(4);
      expect(result.phaseResults.map((p) => p.phase)).toEqual([
        Phase.GROSS_RECEIPTS,
        Phase.DISTRIBUTION_FEES,
        Phase.RECOUPMENT,
        Phase.NET_PROFITS,
      ]);
      // No v2 balances in v1 output
      expect(result.participantBalances).toBeUndefined();
    });
  });
});

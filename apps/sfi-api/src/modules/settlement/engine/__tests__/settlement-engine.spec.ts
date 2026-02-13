import { SettlementEngine } from '../settlement-engine';
import {
  SettlementInput,
  SettlementOutput,
  Phase,
  ParticipantRole,
} from '../types';

describe('SettlementEngine', () => {
  let engine: SettlementEngine;
  const FIXED_TIMESTAMP = '2024-04-01T10:00:00.000Z';

  beforeEach(() => {
    engine = new SettlementEngine();
  });

  // ============================================
  // Helper: Build Blockbuster Film Scenario Input
  // ============================================
  function buildBlockbusterFilmInput(
    overrides: Partial<SettlementInput> = {},
  ): SettlementInput {
    return {
      settlementRunId: 'run-001',
      ruleSnapshotVersion: 1,
      currency: 'USD',
      participants: [
        { id: 'studio-001', name: 'Studio XYZ', role: ParticipantRole.STUDIO },
        {
          id: 'investor-a',
          name: 'Investor A',
          role: ParticipantRole.INVESTOR,
        },
        {
          id: 'investor-b',
          name: 'Investor B',
          role: ParticipantRole.INVESTOR,
        },
        {
          id: 'distributor-001',
          name: 'AMC Theatres',
          role: ParticipantRole.DISTRIBUTOR,
        },
        {
          id: 'talent-001',
          name: 'Lead Actors',
          role: ParticipantRole.TALENT,
        },
      ],
      revenueBatches: [
        {
          id: 'batch-001',
          amount: 80_000_000,
          periodStart: '2024-01-01',
          periodEnd: '2024-01-31',
        },
        {
          id: 'batch-002',
          amount: 40_000_000,
          periodStart: '2024-02-01',
          periodEnd: '2024-02-28',
        },
        {
          id: 'batch-003',
          amount: 30_000_000,
          periodStart: '2024-03-01',
          periodEnd: '2024-03-31',
        },
      ],
      rules: {
        distributionFees: [
          { participantId: 'distributor-001', feePercentage: 15 },
        ],
        recoupment: [
          {
            participantId: 'investor-a',
            recoupAmount: 30_000_000,
            recoupCap: 30_000_000,
            priority: 1,
          },
          {
            participantId: 'investor-b',
            recoupAmount: 20_000_000,
            recoupCap: 20_000_000,
            priority: 2,
          },
        ],
        netProfitSplit: [
          { participantId: 'studio-001', percentage: 70 },
          { participantId: 'talent-001', percentage: 5 },
          { participantId: 'investor-a', percentage: 15 },
          { participantId: 'investor-b', percentage: 10 },
        ],
      },
      ...overrides,
    };
  }

  // ============================================
  // Scenario 1: Blockbuster Film Full Scenario
  // $150M revenue, distributor 15% fee, 2 investors recoup, net profit split
  // ============================================
  describe('Blockbuster Film Full Scenario ($150M)', () => {
    let result: SettlementOutput;

    beforeEach(() => {
      const input = buildBlockbusterFilmInput();
      result = engine.calculate(input, FIXED_TIMESTAMP);
    });

    it('should calculate total revenue as $150M', () => {
      expect(result.totalRevenue).toBe(150_000_000);
    });

    it('should allocate exactly $150M total', () => {
      expect(result.totalAllocated).toBe(150_000_000);
    });

    it('should have 4 phase results', () => {
      expect(result.phaseResults).toHaveLength(4);
      expect(result.phaseResults.map((p) => p.phase)).toEqual([
        Phase.GROSS_RECEIPTS,
        Phase.DISTRIBUTION_FEES,
        Phase.RECOUPMENT,
        Phase.NET_PROFITS,
      ]);
    });

    // Phase 1: Gross Receipts
    it('should record $150M in gross receipts', () => {
      const gross = result.phaseResults[0];
      expect(gross.inputAmount).toBe(150_000_000);
      expect(gross.totalAllocated).toBe(0);
      expect(gross.remainingAmount).toBe(150_000_000);
    });

    // Phase 2: Distribution Fees
    it('should allocate $22.5M to distributor (15% of $150M)', () => {
      const feePhase = result.phaseResults[1];
      expect(feePhase.totalAllocated).toBe(22_500_000);
      expect(feePhase.remainingAmount).toBe(127_500_000);

      const distributorAlloc = feePhase.allocations.find(
        (a) => a.participantId === 'distributor-001',
      );
      expect(distributorAlloc).toBeDefined();
      expect(distributorAlloc!.amount).toBe(22_500_000);
    });

    // Phase 3: Recoupment
    it('should recoup Investor A fully ($30M)', () => {
      const recoupAlloc = result.allocations.find(
        (a) =>
          a.participantId === 'investor-a' && a.phase === Phase.RECOUPMENT,
      );
      expect(recoupAlloc).toBeDefined();
      expect(recoupAlloc!.amount).toBe(30_000_000);
    });

    it('should recoup Investor B fully ($20M)', () => {
      const recoupAlloc = result.allocations.find(
        (a) =>
          a.participantId === 'investor-b' && a.phase === Phase.RECOUPMENT,
      );
      expect(recoupAlloc).toBeDefined();
      expect(recoupAlloc!.amount).toBe(20_000_000);
    });

    it('should have $77.5M remaining after recoupment ($127.5M - $50M)', () => {
      const recoupPhase = result.phaseResults[2];
      expect(recoupPhase.remainingAmount).toBe(77_500_000);
    });

    it('should mark both investors as fully recouped', () => {
      expect(
        result.recoupmentBalances.find((b) => b.participantId === 'investor-a')
          ?.fullyRecouped,
      ).toBe(true);
      expect(
        result.recoupmentBalances.find((b) => b.participantId === 'investor-b')
          ?.fullyRecouped,
      ).toBe(true);
    });

    // Phase 4: Net Profits ($77.5M split 70/5/15/10)
    it('should allocate Studio $54.25M (70% of $77.5M)', () => {
      const studioAlloc = result.allocations.find(
        (a) =>
          a.participantId === 'studio-001' && a.phase === Phase.NET_PROFITS,
      );
      expect(studioAlloc).toBeDefined();
      expect(studioAlloc!.amount).toBe(54_250_000);
    });

    it('should allocate Talent $3.875M (5% of $77.5M)', () => {
      const talentAlloc = result.allocations.find(
        (a) =>
          a.participantId === 'talent-001' && a.phase === Phase.NET_PROFITS,
      );
      expect(talentAlloc).toBeDefined();
      expect(talentAlloc!.amount).toBe(3_875_000);
    });

    it('should allocate Investor A net profit $11.625M (15% of $77.5M)', () => {
      const investorAProfit = result.allocations.find(
        (a) =>
          a.participantId === 'investor-a' && a.phase === Phase.NET_PROFITS,
      );
      expect(investorAProfit).toBeDefined();
      expect(investorAProfit!.amount).toBe(11_625_000);
    });

    it('should allocate Investor B net profit $7.75M (10% of $77.5M)', () => {
      const investorBProfit = result.allocations.find(
        (a) =>
          a.participantId === 'investor-b' && a.phase === Phase.NET_PROFITS,
      );
      expect(investorBProfit).toBeDefined();
      expect(investorBProfit!.amount).toBe(7_750_000);
    });

    // Final totals per participant
    it('should calculate correct total per participant', () => {
      const totals = new Map<string, number>();
      for (const a of result.allocations) {
        totals.set(a.participantId, (totals.get(a.participantId) ?? 0) + a.amount);
      }

      expect(totals.get('distributor-001')).toBe(22_500_000); // fee only
      expect(totals.get('investor-a')).toBe(41_625_000); // 30M recoup + 11.625M profit
      expect(totals.get('investor-b')).toBe(27_750_000); // 20M recoup + 7.75M profit
      expect(totals.get('studio-001')).toBe(54_250_000); // profit only
      expect(totals.get('talent-001')).toBe(3_875_000); // profit only
    });

    // Proof hash
    it('should generate a proof hash', () => {
      expect(result.proof.proofHash).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(result.proof.algorithm).toBe('SHA-256');
    });
  });

  // ============================================
  // Scenario 2: Basic Recoup
  // $1M revenue, single investor with $500K cap
  // ============================================
  describe('Basic Recoup ($1M revenue, $500K cap)', () => {
    it('should recoup $500K and split $500K as net profit', () => {
      const input: SettlementInput = {
        settlementRunId: 'run-basic',
        ruleSnapshotVersion: 1,
        currency: 'USD',
        participants: [
          {
            id: 'investor-1',
            name: 'Solo Investor',
            role: ParticipantRole.INVESTOR,
          },
          {
            id: 'producer-1',
            name: 'Producer',
            role: ParticipantRole.PRODUCER,
          },
        ],
        revenueBatches: [
          {
            id: 'batch-1',
            amount: 1_000_000,
            periodStart: '2024-01-01',
            periodEnd: '2024-03-31',
          },
        ],
        rules: {
          distributionFees: [],
          recoupment: [
            {
              participantId: 'investor-1',
              recoupAmount: 500_000,
              recoupCap: 500_000,
              priority: 1,
            },
          ],
          netProfitSplit: [
            { participantId: 'producer-1', percentage: 60 },
            { participantId: 'investor-1', percentage: 40 },
          ],
        },
      };

      const result = engine.calculate(input, FIXED_TIMESTAMP);

      // Investor recoups $500K
      const recoup = result.allocations.find(
        (a) =>
          a.participantId === 'investor-1' && a.phase === Phase.RECOUPMENT,
      );
      expect(recoup!.amount).toBe(500_000);

      // Remaining $500K split 60/40
      const producerProfit = result.allocations.find(
        (a) =>
          a.participantId === 'producer-1' && a.phase === Phase.NET_PROFITS,
      );
      expect(producerProfit!.amount).toBe(300_000);

      const investorProfit = result.allocations.find(
        (a) =>
          a.participantId === 'investor-1' && a.phase === Phase.NET_PROFITS,
      );
      expect(investorProfit!.amount).toBe(200_000);

      expect(result.totalAllocated).toBe(1_000_000);
    });
  });

  // ============================================
  // Scenario 3: Revenue Less Than Recoup Cap
  // $300K revenue but $500K cap → investor gets all
  // ============================================
  describe('Revenue Less Than Recoup ($300K revenue, $500K cap)', () => {
    it('should give all revenue to investor recoup with no profit split', () => {
      const input: SettlementInput = {
        settlementRunId: 'run-underfunded',
        ruleSnapshotVersion: 1,
        currency: 'USD',
        participants: [
          {
            id: 'investor-1',
            name: 'Investor',
            role: ParticipantRole.INVESTOR,
          },
          {
            id: 'producer-1',
            name: 'Producer',
            role: ParticipantRole.PRODUCER,
          },
        ],
        revenueBatches: [
          {
            id: 'batch-1',
            amount: 300_000,
            periodStart: '2024-01-01',
            periodEnd: '2024-03-31',
          },
        ],
        rules: {
          distributionFees: [],
          recoupment: [
            {
              participantId: 'investor-1',
              recoupAmount: 500_000,
              recoupCap: 500_000,
              priority: 1,
            },
          ],
          netProfitSplit: [
            { participantId: 'producer-1', percentage: 60 },
            { participantId: 'investor-1', percentage: 40 },
          ],
        },
      };

      const result = engine.calculate(input, FIXED_TIMESTAMP);

      // Investor gets all $300K for recoup
      const recoup = result.allocations.find(
        (a) =>
          a.participantId === 'investor-1' && a.phase === Phase.RECOUPMENT,
      );
      expect(recoup!.amount).toBe(300_000);

      // No net profit allocations (no remaining)
      const profitAllocations = result.allocations.filter(
        (a) => a.phase === Phase.NET_PROFITS,
      );
      expect(profitAllocations).toHaveLength(0);

      // Investor NOT fully recouped
      const balance = result.recoupmentBalances.find(
        (b) => b.participantId === 'investor-1',
      );
      expect(balance!.fullyRecouped).toBe(false);
      expect(balance!.remainingToRecoup).toBe(200_000);

      expect(result.totalAllocated).toBe(300_000);
    });
  });

  // ============================================
  // Scenario 4: Multi-Investor Waterfall
  // 2 investors, different priorities
  // ============================================
  describe('Multi-Investor Waterfall (insufficient funds)', () => {
    it('should prioritize higher-priority investor when funds are limited', () => {
      const input: SettlementInput = {
        settlementRunId: 'run-waterfall',
        ruleSnapshotVersion: 1,
        currency: 'USD',
        participants: [
          {
            id: 'investor-a',
            name: 'Priority Investor',
            role: ParticipantRole.INVESTOR,
          },
          {
            id: 'investor-b',
            name: 'Secondary Investor',
            role: ParticipantRole.INVESTOR,
          },
          {
            id: 'producer-1',
            name: 'Producer',
            role: ParticipantRole.PRODUCER,
          },
        ],
        revenueBatches: [
          {
            id: 'batch-1',
            amount: 400_000,
            periodStart: '2024-01-01',
            periodEnd: '2024-03-31',
          },
        ],
        rules: {
          distributionFees: [],
          recoupment: [
            {
              participantId: 'investor-a',
              recoupAmount: 300_000,
              recoupCap: 300_000,
              priority: 1,
            },
            {
              participantId: 'investor-b',
              recoupAmount: 200_000,
              recoupCap: 200_000,
              priority: 2,
            },
          ],
          netProfitSplit: [
            { participantId: 'producer-1', percentage: 50 },
            { participantId: 'investor-a', percentage: 30 },
            { participantId: 'investor-b', percentage: 20 },
          ],
        },
      };

      const result = engine.calculate(input, FIXED_TIMESTAMP);

      // Investor A (priority 1) gets full $300K
      const recoupA = result.allocations.find(
        (a) =>
          a.participantId === 'investor-a' && a.phase === Phase.RECOUPMENT,
      );
      expect(recoupA!.amount).toBe(300_000);

      // Investor B (priority 2) gets remaining $100K (out of $200K needed)
      const recoupB = result.allocations.find(
        (a) =>
          a.participantId === 'investor-b' && a.phase === Phase.RECOUPMENT,
      );
      expect(recoupB!.amount).toBe(100_000);

      // No net profits (nothing remaining)
      const profitAllocations = result.allocations.filter(
        (a) => a.phase === Phase.NET_PROFITS,
      );
      expect(profitAllocations).toHaveLength(0);

      // Investor A fully recouped, B not
      expect(
        result.recoupmentBalances.find((b) => b.participantId === 'investor-a')
          ?.fullyRecouped,
      ).toBe(true);
      expect(
        result.recoupmentBalances.find((b) => b.participantId === 'investor-b')
          ?.fullyRecouped,
      ).toBe(false);
      expect(
        result.recoupmentBalances.find((b) => b.participantId === 'investor-b')
          ?.remainingToRecoup,
      ).toBe(100_000);
    });
  });

  // ============================================
  // Scenario 5: Carry-Forward (Multi-Batch)
  // Batch 1 partially recoups, Batch 2 finishes recoup + profit split
  // ============================================
  describe('Carry-Forward Balance (Multi-Batch)', () => {
    it('should account for previously recouped amounts', () => {
      // Simulate: Investor had $500K to recoup, already recouped $300K in prior run
      // This run has $400K revenue, should recoup remaining $200K then profit split
      const input: SettlementInput = {
        settlementRunId: 'run-carryforward',
        ruleSnapshotVersion: 1,
        currency: 'USD',
        participants: [
          {
            id: 'investor-1',
            name: 'Investor',
            role: ParticipantRole.INVESTOR,
          },
          {
            id: 'producer-1',
            name: 'Producer',
            role: ParticipantRole.PRODUCER,
          },
        ],
        revenueBatches: [
          {
            id: 'batch-2',
            amount: 400_000,
            periodStart: '2024-04-01',
            periodEnd: '2024-06-30',
          },
        ],
        rules: {
          distributionFees: [],
          recoupment: [
            {
              participantId: 'investor-1',
              recoupAmount: 500_000,
              recoupCap: 500_000,
              priority: 1,
              previouslyRecouped: 300_000, // Already got $300K in prior run
            },
          ],
          netProfitSplit: [
            { participantId: 'producer-1', percentage: 60 },
            { participantId: 'investor-1', percentage: 40 },
          ],
        },
      };

      const result = engine.calculate(input, FIXED_TIMESTAMP);

      // Investor recoups remaining $200K (500K cap - 300K already recouped)
      const recoup = result.allocations.find(
        (a) =>
          a.participantId === 'investor-1' && a.phase === Phase.RECOUPMENT,
      );
      expect(recoup!.amount).toBe(200_000);

      // Remaining $200K split 60/40
      const producerProfit = result.allocations.find(
        (a) =>
          a.participantId === 'producer-1' && a.phase === Phase.NET_PROFITS,
      );
      expect(producerProfit!.amount).toBe(120_000);

      const investorProfit = result.allocations.find(
        (a) =>
          a.participantId === 'investor-1' && a.phase === Phase.NET_PROFITS,
      );
      expect(investorProfit!.amount).toBe(80_000);

      // Investor fully recouped now
      const balance = result.recoupmentBalances.find(
        (b) => b.participantId === 'investor-1',
      );
      expect(balance!.fullyRecouped).toBe(true);
      expect(balance!.remainingToRecoup).toBe(0);
      expect(balance!.previouslyRecouped).toBe(300_000);
      expect(balance!.recoupedThisRun).toBe(200_000);

      expect(result.totalAllocated).toBe(400_000);
    });
  });

  // ============================================
  // Scenario 6: No Recoupment (Simple Profit Split)
  // ============================================
  describe('No Recoupment (Simple Percentage Split)', () => {
    it('should skip recoupment phase and go straight to net profits', () => {
      const input: SettlementInput = {
        settlementRunId: 'run-simple',
        ruleSnapshotVersion: 1,
        currency: 'USD',
        participants: [
          {
            id: 'producer-1',
            name: 'Producer',
            role: ParticipantRole.PRODUCER,
          },
          {
            id: 'talent-1',
            name: 'Talent',
            role: ParticipantRole.TALENT,
          },
        ],
        revenueBatches: [
          {
            id: 'batch-1',
            amount: 1_000_000,
            periodStart: '2024-01-01',
            periodEnd: '2024-03-31',
          },
        ],
        rules: {
          distributionFees: [],
          recoupment: [],
          netProfitSplit: [
            { participantId: 'producer-1', percentage: 70 },
            { participantId: 'talent-1', percentage: 30 },
          ],
        },
      };

      const result = engine.calculate(input, FIXED_TIMESTAMP);

      expect(result.allocations).toHaveLength(2);

      const producer = result.allocations.find(
        (a) => a.participantId === 'producer-1',
      );
      expect(producer!.amount).toBe(700_000);
      expect(producer!.phase).toBe(Phase.NET_PROFITS);

      const talent = result.allocations.find(
        (a) => a.participantId === 'talent-1',
      );
      expect(talent!.amount).toBe(300_000);
      expect(talent!.phase).toBe(Phase.NET_PROFITS);

      expect(result.totalAllocated).toBe(1_000_000);
      expect(result.recoupmentBalances).toHaveLength(0);
    });
  });

  // ============================================
  // Scenario 7: Zero Revenue
  // ============================================
  describe('Zero Revenue', () => {
    it('should produce zero allocations', () => {
      const input: SettlementInput = {
        settlementRunId: 'run-zero',
        ruleSnapshotVersion: 1,
        currency: 'USD',
        participants: [
          {
            id: 'producer-1',
            name: 'Producer',
            role: ParticipantRole.PRODUCER,
          },
        ],
        revenueBatches: [
          {
            id: 'batch-1',
            amount: 0,
            periodStart: '2024-01-01',
            periodEnd: '2024-03-31',
          },
        ],
        rules: {
          distributionFees: [],
          recoupment: [],
          netProfitSplit: [
            { participantId: 'producer-1', percentage: 100 },
          ],
        },
      };

      const result = engine.calculate(input, FIXED_TIMESTAMP);

      expect(result.totalRevenue).toBe(0);
      expect(result.totalAllocated).toBe(0);
    });
  });

  // ============================================
  // Scenario 8: Determinism
  // Same input always produces same output
  // ============================================
  describe('Determinism', () => {
    it('should produce identical results for the same input (100 runs)', () => {
      const input = buildBlockbusterFilmInput();

      const firstResult = engine.calculate(input, FIXED_TIMESTAMP);

      for (let i = 0; i < 100; i++) {
        const result = engine.calculate(input, FIXED_TIMESTAMP);

        expect(result.totalAllocated).toBe(firstResult.totalAllocated);
        expect(result.proof.proofHash).toBe(firstResult.proof.proofHash);
        expect(result.allocations.length).toBe(firstResult.allocations.length);

        for (let j = 0; j < result.allocations.length; j++) {
          expect(result.allocations[j].amount).toBe(
            firstResult.allocations[j].amount,
          );
          expect(result.allocations[j].participantId).toBe(
            firstResult.allocations[j].participantId,
          );
        }
      }
    });

    it('should produce different hash for different input', () => {
      const input1 = buildBlockbusterFilmInput();
      const input2 = buildBlockbusterFilmInput({
        revenueBatches: [
          {
            id: 'batch-1',
            amount: 100_000_000,
            periodStart: '2024-01-01',
            periodEnd: '2024-03-31',
          },
        ],
      });

      const result1 = engine.calculate(input1, FIXED_TIMESTAMP);
      const result2 = engine.calculate(input2, FIXED_TIMESTAMP);

      expect(result1.proof.proofHash).not.toBe(result2.proof.proofHash);
    });
  });

  // ============================================
  // Scenario 9: Distribution Fees with Recoup
  // ============================================
  describe('Distribution Fees + Recoup Combined', () => {
    it('should deduct fees before recoupment', () => {
      const input: SettlementInput = {
        settlementRunId: 'run-fees-recoup',
        ruleSnapshotVersion: 1,
        currency: 'USD',
        participants: [
          {
            id: 'distributor-1',
            name: 'Distributor',
            role: ParticipantRole.DISTRIBUTOR,
          },
          {
            id: 'investor-1',
            name: 'Investor',
            role: ParticipantRole.INVESTOR,
          },
          {
            id: 'producer-1',
            name: 'Producer',
            role: ParticipantRole.PRODUCER,
          },
        ],
        revenueBatches: [
          {
            id: 'batch-1',
            amount: 1_000_000,
            periodStart: '2024-01-01',
            periodEnd: '2024-03-31',
          },
        ],
        rules: {
          distributionFees: [
            { participantId: 'distributor-1', feePercentage: 20 },
          ],
          recoupment: [
            {
              participantId: 'investor-1',
              recoupAmount: 500_000,
              recoupCap: 500_000,
              priority: 1,
            },
          ],
          netProfitSplit: [
            { participantId: 'producer-1', percentage: 70 },
            { participantId: 'investor-1', percentage: 30 },
          ],
        },
      };

      const result = engine.calculate(input, FIXED_TIMESTAMP);

      // Distributor gets 20% = $200K
      const distribAlloc = result.allocations.find(
        (a) => a.participantId === 'distributor-1',
      );
      expect(distribAlloc!.amount).toBe(200_000);

      // After fees: $800K. Investor recoups $500K.
      const recoup = result.allocations.find(
        (a) =>
          a.participantId === 'investor-1' && a.phase === Phase.RECOUPMENT,
      );
      expect(recoup!.amount).toBe(500_000);

      // Remaining $300K split 70/30
      const producerProfit = result.allocations.find(
        (a) =>
          a.participantId === 'producer-1' && a.phase === Phase.NET_PROFITS,
      );
      expect(producerProfit!.amount).toBe(210_000);

      const investorProfit = result.allocations.find(
        (a) =>
          a.participantId === 'investor-1' && a.phase === Phase.NET_PROFITS,
      );
      expect(investorProfit!.amount).toBe(90_000);

      expect(result.totalAllocated).toBe(1_000_000);
    });
  });

  // ============================================
  // Input Validation
  // ============================================
  describe('Input Validation', () => {
    it('should throw error when no revenue batches', () => {
      const input = buildBlockbusterFilmInput({ revenueBatches: [] });
      expect(() => engine.calculate(input, FIXED_TIMESTAMP)).toThrow(
        'At least one revenue batch is required',
      );
    });

    it('should throw error when no participants', () => {
      const input = buildBlockbusterFilmInput({ participants: [] });
      expect(() => engine.calculate(input, FIXED_TIMESTAMP)).toThrow(
        'At least one participant is required',
      );
    });

    it('should throw error when net profit percentages do not sum to 100', () => {
      const input = buildBlockbusterFilmInput();
      input.rules.netProfitSplit = [
        { participantId: 'studio-001', percentage: 50 },
        { participantId: 'investor-a', percentage: 30 },
      ];
      expect(() => engine.calculate(input, FIXED_TIMESTAMP)).toThrow(
        'Net profit percentages must sum to 100%',
      );
    });

    it('should throw error when revenue batch has negative amount', () => {
      const input = buildBlockbusterFilmInput({
        revenueBatches: [
          {
            id: 'batch-neg',
            amount: -100,
            periodStart: '2024-01-01',
            periodEnd: '2024-03-31',
          },
        ],
      });
      expect(() => engine.calculate(input, FIXED_TIMESTAMP)).toThrow(
        'negative amount',
      );
    });

    it('should throw error when rule references unknown participant', () => {
      const input = buildBlockbusterFilmInput();
      input.rules.distributionFees = [
        { participantId: 'nonexistent-id', feePercentage: 10 },
      ];
      expect(() => engine.calculate(input, FIXED_TIMESTAMP)).toThrow(
        'unknown participant',
      );
    });
  });
});

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../prisma/prisma.service';
import { RecoupmentStatusEnum } from '../dto';

import { ReportsService } from './reports.service';

jest.mock('@prisma/client', () => ({
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  PrismaClient: class PrismaClient {
    static readonly __mock = true;
  },
  SettlementRunStatus: {
    DRAFT: 'DRAFT',
    PREVIEWED: 'PREVIEWED',
    FINALIZED: 'FINALIZED',
    VOIDED: 'VOIDED',
    CANCELLED: 'CANCELLED',
  },
}));

const USER_ID = 'user-1';
const DEAL_ID = 'deal-1';
const SNAP_WATERFALL = 'snap-waterfall';
const SNAP_RECOUP = 'snap-recoup';
const SNAP_REVSHARE = 'snap-revshare';

/** Waterfall snapshot with a 1.25x recoup cap on Tier 1, tier 2 listed first. */
const waterfallSnapshot = (id = SNAP_WATERFALL, version = 3) => ({
  id,
  version,
  effectiveTo: null,
  rules: {
    schemaVersion: 2,
    mode: 'waterfall',
    tiers: [
      // Deliberately out of order: the service must select by tier number.
      { tier: 2, splits: [], hardCapMultiplier: 3 },
      { tier: 1, splits: [], recoupMultiplier: 1.25 },
    ],
  },
});

const recoupSnapshot = (id = SNAP_RECOUP, version = 2) => ({
  id,
  version,
  effectiveTo: null,
  rules: {
    schemaVersion: 2,
    mode: 'recoup',
    tiers: [{ tier: 1, splits: [], recoupMultiplier: 1.2 }],
  },
});

const revShareSnapshot = (id = SNAP_REVSHARE, version = 1) => ({
  id,
  version,
  effectiveTo: null,
  rules: { schemaVersion: 2, mode: 'revenue_share', splits: [] },
});

function investor(id: string, name: string, investmentAmount: number) {
  return {
    id,
    name,
    roleName: 'Investor',
    metadata: { investmentAmount, poolMember: true },
  };
}

function allocation(
  participantId: string,
  amount: number,
  runNumber: number,
  phase: string,
  ruleSnapshotId = SNAP_WATERFALL,
) {
  return {
    participantId,
    amount,
    phase,
    settlementRunId: `run-${runNumber}`,
    settlementRun: {
      runNumber,
      runType: 'NORMAL',
      ruleSnapshotId,
      executedAt: new Date('2026-03-05T10:30:00.000Z'),
      createdAt: new Date('2026-03-01T10:30:00.000Z'),
      proofRecords: [{ proofHash: `sha256:run${runNumber}` }],
    },
  };
}

describe('ReportsService', () => {
  let service: ReportsService;

  const mockPrisma = {
    deal: { findUnique: jest.fn() },
    ruleSnapshot: { findMany: jest.fn() },
    participant: { findMany: jest.fn(), findUnique: jest.fn() },
    settlementAllocation: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<ReportsService>(ReportsService);

    mockPrisma.deal.findUnique.mockReset().mockResolvedValue({
      id: DEAL_ID,
      name: 'The Last Horizon',
      currency: 'USD',
      userId: USER_ID,
    });
    mockPrisma.ruleSnapshot.findMany
      .mockReset()
      .mockResolvedValue([waterfallSnapshot()]);
    mockPrisma.participant.findMany.mockReset().mockResolvedValue([]);
    mockPrisma.participant.findUnique.mockReset();
    mockPrisma.settlementAllocation.findMany.mockReset().mockResolvedValue([]);
  });

  describe('getRecoupmentReport', () => {
    it('rejects a deal owned by another user', async () => {
      mockPrisma.deal.findUnique.mockResolvedValue({
        id: DEAL_ID,
        name: 'x',
        currency: 'USD',
        userId: 'someone-else',
      });

      await expect(
        service.getRecoupmentReport(USER_ID, DEAL_ID),
      ).rejects.toThrow(NotFoundException);
    });

    // The engine writes WATERFALL_TIER_1 (not RECOUPMENT) in waterfall mode,
    // which is how Liang's Deal 05/06 settle. Counting only RECOUPMENT made
    // every waterfall deal report zero progress.
    it('counts WATERFALL_TIER_1 payouts as recoupment in waterfall mode', async () => {
      mockPrisma.participant.findMany.mockResolvedValue([
        investor('p1', 'Horizon Ventures Fund', 100_000),
      ]);
      mockPrisma.settlementAllocation.findMany.mockResolvedValue([
        allocation('p1', 40_000, 1, 'WATERFALL_TIER_1'),
        allocation('p1', 35_000, 2, 'WATERFALL_TIER_1'),
      ]);

      const report = await service.getRecoupmentReport(USER_ID, DEAL_ID);
      const row = report.investors[0]!;

      expect(row.capMultiplier).toBe(1.25);
      expect(row.capAmount).toBe(125_000);
      expect(row.totalRecouped).toBe(75_000);
      expect(row.remaining).toBe(50_000);
      expect(row.progressPercentage).toBe(60);
      expect(row.status).toBe(RecoupmentStatusEnum.IN_PROGRESS);
      expect(row.history).toHaveLength(2);
      expect(row.history[1]).toMatchObject({
        runLabel: 'Run #2',
        cumulative: 75_000,
        carryForward: 50_000,
      });
    });

    it('counts RECOUPMENT payouts in recoup mode', async () => {
      mockPrisma.ruleSnapshot.findMany.mockResolvedValue([recoupSnapshot()]);
      mockPrisma.participant.findMany.mockResolvedValue([
        investor('p1', 'Pacific Capital Group', 100_000),
      ]);
      mockPrisma.settlementAllocation.findMany.mockResolvedValue([
        allocation('p1', 60_000, 1, 'RECOUPMENT', SNAP_RECOUP),
      ]);

      const report = await service.getRecoupmentReport(USER_ID, DEAL_ID);

      expect(report.investors[0]!.capAmount).toBe(120_000);
      expect(report.investors[0]!.totalRecouped).toBe(60_000);
      expect(report.investors[0]!.status).toBe(RecoupmentStatusEnum.IN_PROGRESS);
    });

    // In revenue_share mode tier 1 is a profit share, not capital recovery.
    it('does NOT count WATERFALL_TIER_1 as recoupment in revenue_share mode', async () => {
      mockPrisma.ruleSnapshot.findMany.mockResolvedValue([revShareSnapshot()]);
      mockPrisma.participant.findMany.mockResolvedValue([
        investor('p1', 'Investor A', 10_000),
      ]);
      mockPrisma.settlementAllocation.findMany.mockResolvedValue([
        allocation('p1', 5_000, 1, 'WATERFALL_TIER_1', SNAP_REVSHARE),
      ]);

      const report = await service.getRecoupmentReport(USER_ID, DEAL_ID);

      expect(report.investors[0]!.status).toBe(RecoupmentStatusEnum.NO_CAP);
      expect(report.investors[0]!.totalRecouped).toBe(0);
      expect(report.investors[0]!.history).toEqual([]);
    });

    it('ignores tier 2 (post-recoup) payouts', async () => {
      mockPrisma.participant.findMany.mockResolvedValue([
        investor('p1', 'Horizon Ventures Fund', 100_000),
      ]);
      mockPrisma.settlementAllocation.findMany.mockResolvedValue([
        allocation('p1', 40_000, 1, 'WATERFALL_TIER_1'),
        allocation('p1', 9_000, 1, 'WATERFALL_TIER_2'),
      ]);

      const report = await service.getRecoupmentReport(USER_ID, DEAL_ID);

      expect(report.investors[0]!.totalRecouped).toBe(40_000);
    });

    it('folds several tier-1 allocations from one run into a single history entry', async () => {
      mockPrisma.participant.findMany.mockResolvedValue([
        investor('p1', 'Horizon Ventures Fund', 100_000),
      ]);
      mockPrisma.settlementAllocation.findMany.mockResolvedValue([
        allocation('p1', 20_000, 1, 'WATERFALL_TIER_1'),
        allocation('p1', 15_000, 1, 'WATERFALL_TIER_1'),
      ]);

      const report = await service.getRecoupmentReport(USER_ID, DEAL_ID);

      expect(report.investors[0]!.history).toHaveLength(1);
      expect(report.investors[0]!.history[0]!.amount).toBe(35_000);
      expect(report.investors[0]!.totalRecouped).toBe(35_000);
    });

    it('selects the cap by tier number, not array position', async () => {
      // The fixture stores tier 2 (hardCap 3) before tier 1 (recoup 1.25).
      mockPrisma.participant.findMany.mockResolvedValue([
        investor('p1', 'Investor A', 100_000),
      ]);

      const report = await service.getRecoupmentReport(USER_ID, DEAL_ID);

      expect(report.investors[0]!.capMultiplier).toBe(1.25);
      expect(report.investors[0]!.capAmount).toBe(125_000);
    });

    it('takes the stricter multiplier when a tier sets both recoup and hard cap', async () => {
      mockPrisma.ruleSnapshot.findMany.mockResolvedValue([
        {
          id: SNAP_WATERFALL,
          version: 2,
          effectiveTo: null,
          rules: {
            schemaVersion: 2,
            mode: 'waterfall',
            tiers: [
              { tier: 1, splits: [], recoupMultiplier: 1.2, hardCapMultiplier: 1.5 },
            ],
          },
        },
      ]);
      mockPrisma.participant.findMany.mockResolvedValue([
        investor('p1', 'Investor A', 100_000),
      ]);

      const report = await service.getRecoupmentReport(USER_ID, DEAL_ID);

      expect(report.investors[0]!.capMultiplier).toBe(1.2);
      expect(report.investors[0]!.capAmount).toBe(120_000);
    });

    it('marks an investor RECOUPED at the cap and never reports negative remaining', async () => {
      mockPrisma.participant.findMany.mockResolvedValue([
        investor('p1', 'Pacific Capital Group', 100_000),
      ]);
      mockPrisma.settlementAllocation.findMany.mockResolvedValue([
        allocation('p1', 125_000, 1, 'WATERFALL_TIER_1'),
      ]);

      const report = await service.getRecoupmentReport(USER_ID, DEAL_ID);

      expect(report.investors[0]!.status).toBe(RecoupmentStatusEnum.RECOUPED);
      expect(report.investors[0]!.remaining).toBe(0);
      expect(report.investors[0]!.progressPercentage).toBe(100);
      expect(report.summary.fullyRecoupedCount).toBe(1);
    });

    it('reports NOT_STARTED when no finalized run has paid the investor', async () => {
      mockPrisma.participant.findMany.mockResolvedValue([
        investor('p1', 'Zenith Pictures', 50_000),
      ]);

      const report = await service.getRecoupmentReport(USER_ID, DEAL_ID);

      expect(report.investors[0]!.status).toBe(RecoupmentStatusEnum.NOT_STARTED);
      expect(report.investors[0]!.remaining).toBe(62_500);
    });

    it('excludes non-pool participants with no invested capital', async () => {
      mockPrisma.participant.findMany.mockResolvedValue([
        investor('p1', 'Investor A', 10_000),
        {
          id: 'p2',
          name: 'Distribution Fee',
          roleName: 'Distributor',
          metadata: { poolMember: false },
        },
      ]);

      const report = await service.getRecoupmentReport(USER_ID, DEAL_ID);

      expect(report.investors).toHaveLength(1);
      expect(report.investors[0]!.participantId).toBe('p1');
    });
  });

  describe('getParticipantStatement', () => {
    beforeEach(() => {
      mockPrisma.participant.findUnique.mockResolvedValue({
        id: 'p1',
        dealId: DEAL_ID,
        name: 'Horizon Ventures Fund',
        roleName: 'Investor',
        behaviorType: 'RECOUPMENT',
      });
    });

    it('rejects a participant that belongs to a different deal', async () => {
      mockPrisma.participant.findUnique.mockResolvedValue({
        id: 'p1',
        dealId: 'other-deal',
        name: 'x',
        roleName: 'Investor',
        behaviorType: 'RECOUPMENT',
      });

      await expect(
        service.getParticipantStatement(USER_ID, DEAL_ID, 'p1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('categorises waterfall tier phases so the summary reconciles with the total', async () => {
      mockPrisma.settlementAllocation.findMany.mockResolvedValue([
        allocation('p1', 45_000, 2, 'WATERFALL_TIER_1'),
        allocation('p1', 15_900, 2, 'WATERFALL_TIER_2'),
        allocation('p1', 30_000, 1, 'WATERFALL_TIER_1'),
      ]);

      const statement = await service.getParticipantStatement(
        USER_ID,
        DEAL_ID,
        'p1',
      );

      expect(statement.settlements).toHaveLength(2);
      const runTwo = statement.settlements.find((s) => s.runLabel === 'Run #2')!;
      expect(runTwo.total).toBe(60_900);
      expect(runTwo.byPhase.RECOUPMENT).toBe(45_000);
      expect(runTwo.byPhase.NET_PROFIT).toBe(15_900);
      expect(runTwo.proofHash).toBe('sha256:run2');

      expect(statement.summary.totalRecoupment).toBe(75_000);
      expect(statement.summary.totalNetProfit).toBe(15_900);
      // The whole point: the parts must add up to the whole.
      expect(
        statement.summary.totalRecoupment +
          statement.summary.totalNetProfit +
          statement.summary.totalFees,
      ).toBe(statement.summary.totalReceived);
    });

    it('reports tier 1 as net profit for a revenue_share snapshot', async () => {
      mockPrisma.ruleSnapshot.findMany.mockResolvedValue([revShareSnapshot()]);
      mockPrisma.settlementAllocation.findMany.mockResolvedValue([
        allocation('p1', 20_000, 1, 'WATERFALL_TIER_1', SNAP_REVSHARE),
      ]);

      const statement = await service.getParticipantStatement(
        USER_ID,
        DEAL_ID,
        'p1',
      );

      expect(statement.summary.totalNetProfit).toBe(20_000);
      expect(statement.summary.totalRecoupment).toBe(0);
    });

    it('splits fees into their own category', async () => {
      mockPrisma.settlementAllocation.findMany.mockResolvedValue([
        allocation('p1', 24_000, 1, 'DISTRIBUTION_FEES'),
      ]);

      const statement = await service.getParticipantStatement(
        USER_ID,
        DEAL_ID,
        'p1',
      );

      expect(statement.summary.totalFees).toBe(24_000);
      expect(statement.summary.totalReceived).toBe(24_000);
    });

    it('returns an empty statement when the participant has never been paid', async () => {
      const statement = await service.getParticipantStatement(
        USER_ID,
        DEAL_ID,
        'p1',
      );

      expect(statement.settlements).toEqual([]);
      expect(statement.summary.totalReceived).toBe(0);
      expect(statement.summary.settlementCount).toBe(0);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../prisma/prisma.service';

import { DashboardService } from './dashboard.service';

jest.mock('@prisma/client', () => ({
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  PrismaClient: class PrismaClient {
    static readonly __mock = true;
  },
  DealStatus: {
    DRAFT: 'DRAFT',
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    CLOSED: 'CLOSED',
  },
  RevenueBatchStatus: {
    PENDING: 'PENDING',
    VALIDATED: 'VALIDATED',
    PROCESSED: 'PROCESSED',
    REJECTED: 'REJECTED',
  },
  SettlementRunStatus: {
    DRAFT: 'DRAFT',
    PREVIEWED: 'PREVIEWED',
    FINALIZED: 'FINALIZED',
    VOIDED: 'VOIDED',
    CANCELLED: 'CANCELLED',
  },
}));

describe('DashboardService', () => {
  let service: DashboardService;

  const mockPrismaService = {
    deal: {
      count: jest.fn(),
    },
    revenueBatch: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    settlementRun: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getSummary ─────────────────────────────────────────────────────────────

  describe('getSummary', () => {
    it('should aggregate the four headline stats from Prisma', async () => {
      mockPrismaService.deal.count
        .mockResolvedValueOnce(18) // totalDeals
        .mockResolvedValueOnce(9); // activeDeals
      mockPrismaService.revenueBatch.count.mockResolvedValueOnce(7); // pending batches
      mockPrismaService.settlementRun.count.mockResolvedValueOnce(2); // previewed runs
      mockPrismaService.settlementRun.aggregate.mockResolvedValueOnce({
        _sum: { totalAllocated: 450000000 },
      });

      const result = await service.getSummary('user-123');

      expect(result.totalDeals).toBe(18);
      expect(result.activeDeals).toBe(9);
      expect(result.pendingReview).toBe(9); // 7 batches + 2 runs
      expect(result.totalSettled).toBe(450000000);
    });

    it('should return all zeros when there is no data (empty state)', async () => {
      mockPrismaService.deal.count.mockResolvedValue(0);
      mockPrismaService.revenueBatch.count.mockResolvedValue(0);
      mockPrismaService.settlementRun.count.mockResolvedValue(0);
      mockPrismaService.settlementRun.aggregate.mockResolvedValue({
        _sum: { totalAllocated: null },
      });

      const result = await service.getSummary('user-123');

      expect(result.totalDeals).toBe(0);
      expect(result.activeDeals).toBe(0);
      expect(result.pendingReview).toBe(0);
      expect(result.totalSettled).toBe(0);
    });
  });

  // ─── getPendingReviews ──────────────────────────────────────────────────────

  describe('getPendingReviews', () => {
    it('should return revenue batches and settlement runs joined with deal name', async () => {
      mockPrismaService.revenueBatch.findMany.mockResolvedValueOnce([
        {
          id: 'batch-1',
          dealId: 'deal-1',
          deal: { name: 'The Last Horizon' },
          batchNumber: 'RB-2026-004',
          totalAmount: 50000000,
          currency: 'USD',
          status: 'PENDING',
          periodStart: new Date('2026-10-01T00:00:00Z'),
          periodEnd: new Date('2026-12-31T23:59:59Z'),
          createdAt: new Date('2026-01-15T10:30:00Z'),
        },
      ]);
      mockPrismaService.settlementRun.findMany.mockResolvedValueOnce([
        {
          id: 'run-1',
          dealId: 'deal-1',
          deal: { name: 'The Last Horizon' },
          totalAllocated: 5000000,
          currency: 'USD',
          status: 'PREVIEWED',
          runType: 'NORMAL',
          createdAt: new Date('2026-01-16T10:30:00Z'),
        },
      ]);
      // For the run position lookup
      mockPrismaService.settlementRun.count.mockResolvedValueOnce(3);

      const result = await service.getPendingReviews('user-123');

      expect(result.revenueBatches).toHaveLength(1);
      expect(result.revenueBatches[0]).toMatchObject({
        id: 'batch-1',
        dealName: 'The Last Horizon',
        batchNumber: 'RB-2026-004',
        totalAmount: 50000000,
        status: 'PENDING',
      });

      expect(result.settlementRuns).toHaveLength(1);
      expect(result.settlementRuns[0]).toMatchObject({
        id: 'run-1',
        dealName: 'The Last Horizon',
        runLabel: 'Run #3',
        totalAllocated: 5000000,
        status: 'PREVIEWED',
      });

      expect(result.totalCount).toBe(2);
    });

    it('should return empty arrays when nothing is pending (empty state)', async () => {
      mockPrismaService.revenueBatch.findMany.mockResolvedValueOnce([]);
      mockPrismaService.settlementRun.findMany.mockResolvedValueOnce([]);

      const result = await service.getPendingReviews('user-123');

      expect(result.revenueBatches).toEqual([]);
      expect(result.settlementRuns).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });
});

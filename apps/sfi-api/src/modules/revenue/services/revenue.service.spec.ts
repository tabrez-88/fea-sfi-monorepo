import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import { CurrencyEnum } from '../dto';

import { RevenueService } from './revenue.service';

jest.mock('@prisma/client', () => ({
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  PrismaClient: class PrismaClient {
    static readonly __mock = true;
  },
  RevenueBatchStatus: {
    PENDING: 'PENDING',
    VALIDATED: 'VALIDATED',
    PROCESSED: 'PROCESSED',
    REJECTED: 'REJECTED',
  },
  Currency: {
    USD: 'USD',
    EUR: 'EUR',
  },
  Prisma: {
    JsonNull: 'DbNull',
    // Decimal stub — preserves the `.toString()` round-trip the mapper relies on
    Decimal: class Decimal {
      private readonly value: string;
      constructor(v: number | string) {
        this.value = String(v);
      }
      toString(): string {
        return this.value;
      }
      // jest's deep equality reads this when comparing
      valueOf(): string {
        return this.value;
      }
    },
  },
}));

const MOCK_USER_ID = 'user-uuid-mock';
const MOCK_DEAL_ID = 'deal-uuid-mock';

interface MockBatchRow {
  id: string;
  dealId: string;
  batchNumber: string;
  periodStart: Date;
  periodEnd: Date;
  totalAmount: { toString: () => string };
  currency: string;
  status: string;
  source: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { settlementRevenueLinks: number };
}

function buildBatchRow(overrides: Partial<MockBatchRow> = {}): MockBatchRow {
  return {
    id: 'batch-uuid-1',
    dealId: MOCK_DEAL_ID,
    batchNumber: 'RB-2026-001',
    periodStart: new Date('2026-01-01T00:00:00.000Z'),
    periodEnd: new Date('2026-03-31T23:59:59.999Z'),
    totalAmount: { toString: () => '150000' },
    currency: 'USD',
    status: 'PENDING',
    source: null,
    metadata: null,
    createdAt: new Date('2026-05-20T00:00:00.000Z'),
    updatedAt: new Date('2026-05-20T00:00:00.000Z'),
    _count: { settlementRevenueLinks: 0 },
    ...overrides,
  };
}

describe('RevenueService', () => {
  let service: RevenueService;

  const mockPrismaService = {
    deal: { findUnique: jest.fn() },
    revenueBatch: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
    revenueLineItem: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    // Passes the callback its own tx-scoped instance; for tests we reuse
    // the outer mocks so a callback that hits `tx.revenueLineItem.create`
    // still lands on our stubs.
    $transaction: jest.fn().mockImplementation((cb: (tx: unknown) => unknown) => cb(mockPrismaService)),
  };

  const mockAuditLogService = {
    create: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevenueService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    service = module.get<RevenueService>(RevenueService);

    // Default to deal-owner check passing
    mockPrismaService.deal.findUnique.mockResolvedValue({
      id: MOCK_DEAL_ID,
      userId: MOCK_USER_ID,
    });
    mockPrismaService.revenueBatch.count.mockResolvedValue(0);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── createBatch — categorization (Run 5) ────────────────────────────────

  describe('createBatch — categorization', () => {
    it('persists territory / revenueType / reportingEntity into metadata and surfaces them at the top level', async () => {
      mockPrismaService.revenueBatch.create.mockResolvedValue(
        buildBatchRow({
          metadata: {
            territory: 'US',
            revenueType: 'Streaming',
            reportingEntity: 'Spotify',
          },
        }),
      );

      const result = await service.createBatch(MOCK_USER_ID, MOCK_DEAL_ID, {
        periodStart: '2026-01-01T00:00:00.000Z',
        periodEnd: '2026-03-31T23:59:59.999Z',
        totalAmount: 150000,
        currency: CurrencyEnum.USD,
        territory: 'US',
        revenueType: 'Streaming',
        reportingEntity: 'Spotify',
      });

      expect(mockPrismaService.revenueBatch.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: expect.objectContaining({
              territory: 'US',
              revenueType: 'Streaming',
              reportingEntity: 'Spotify',
            }),
          }),
        }),
      );

      expect(result.territory).toBe('US');
      expect(result.revenueType).toBe('Streaming');
      expect(result.reportingEntity).toBe('Spotify');
      // metadata in the response should NOT duplicate the surfaced fields
      expect(result.metadata).toBeNull();
    });

    it('falls back to Prisma JsonNull when no metadata and no categorization is provided', async () => {
      mockPrismaService.revenueBatch.create.mockResolvedValue(buildBatchRow());

      await service.createBatch(MOCK_USER_ID, MOCK_DEAL_ID, {
        periodStart: '2026-01-01T00:00:00.000Z',
        periodEnd: '2026-03-31T23:59:59.999Z',
        totalAmount: 1000,
        currency: CurrencyEnum.USD,
      });

      expect(mockPrismaService.revenueBatch.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ metadata: 'DbNull' }),
        }),
      );
    });

    it('preserves caller-supplied metadata alongside categorization fields', async () => {
      mockPrismaService.revenueBatch.create.mockResolvedValue(
        buildBatchRow({
          metadata: {
            channel: 'hotel-operations',
            territory: 'EU',
          },
        }),
      );

      await service.createBatch(MOCK_USER_ID, MOCK_DEAL_ID, {
        periodStart: '2026-01-01T00:00:00.000Z',
        periodEnd: '2026-03-31T23:59:59.999Z',
        totalAmount: 1000,
        currency: CurrencyEnum.USD,
        territory: 'EU',
        metadata: { channel: 'hotel-operations' },
      });

      const persistedMetadata = mockPrismaService.revenueBatch.create.mock.calls[0][0].data.metadata;
      expect(persistedMetadata).toEqual({
        channel: 'hotel-operations',
        territory: 'EU',
      });
    });

    it('records categorization fields on the audit-log metadata when supplied', async () => {
      mockPrismaService.revenueBatch.create.mockResolvedValue(
        buildBatchRow({ metadata: { territory: 'APAC' } }),
      );

      await service.createBatch(MOCK_USER_ID, MOCK_DEAL_ID, {
        periodStart: '2026-01-01T00:00:00.000Z',
        periodEnd: '2026-03-31T23:59:59.999Z',
        totalAmount: 1000,
        currency: CurrencyEnum.USD,
        territory: 'APAC',
      });

      expect(mockAuditLogService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ territory: 'APAC' }),
        }),
      );
    });
  });

  // ─── listBatches — categorization filters (Run 5) ────────────────────────

  describe('listBatches — categorization filters', () => {
    it('applies no extra where clauses when filter is empty', async () => {
      mockPrismaService.revenueBatch.findMany.mockResolvedValue([]);
      mockPrismaService.revenueBatch.count.mockResolvedValue(0);

      await service.listBatches(MOCK_USER_ID, MOCK_DEAL_ID, {});

      expect(mockPrismaService.revenueBatch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { dealId: MOCK_DEAL_ID } }),
      );
    });

    it('builds metadata path filters when territory / revenueType / reportingEntity are provided', async () => {
      mockPrismaService.revenueBatch.findMany.mockResolvedValue([]);
      mockPrismaService.revenueBatch.count.mockResolvedValue(0);

      await service.listBatches(MOCK_USER_ID, MOCK_DEAL_ID, {
        territory: 'US',
        revenueType: 'Streaming',
        reportingEntity: 'Spotify',
      });

      const whereArg = mockPrismaService.revenueBatch.findMany.mock.calls[0][0].where;
      expect(whereArg.dealId).toBe(MOCK_DEAL_ID);
      expect(whereArg.AND).toEqual([
        { metadata: { path: ['territory'], equals: 'US' } },
        { metadata: { path: ['revenueType'], equals: 'Streaming' } },
        { metadata: { path: ['reportingEntity'], equals: 'Spotify' } },
      ]);
    });

    it('applies a single metadata path filter when only one categorization field is provided', async () => {
      mockPrismaService.revenueBatch.findMany.mockResolvedValue([]);
      mockPrismaService.revenueBatch.count.mockResolvedValue(0);

      await service.listBatches(MOCK_USER_ID, MOCK_DEAL_ID, { revenueType: 'Live' });

      const whereArg = mockPrismaService.revenueBatch.findMany.mock.calls[0][0].where;
      expect(whereArg.AND).toEqual([
        { metadata: { path: ['revenueType'], equals: 'Live' } },
      ]);
    });

    it('surfaces categorization fields at the top level on every row in the response', async () => {
      mockPrismaService.revenueBatch.findMany.mockResolvedValue([
        buildBatchRow({
          id: 'b-1',
          metadata: { territory: 'US', revenueType: 'Streaming' },
        }),
        buildBatchRow({
          id: 'b-2',
          metadata: { reportingEntity: 'Netflix', lineItems: [{ amount: 100 }] },
        }),
      ]);
      mockPrismaService.revenueBatch.count.mockResolvedValue(2);

      const result = await service.listBatches(MOCK_USER_ID, MOCK_DEAL_ID, {});

      expect(result.data[0].territory).toBe('US');
      expect(result.data[0].revenueType).toBe('Streaming');
      expect(result.data[0].reportingEntity).toBeNull();
      expect(result.data[0].metadata).toBeNull();

      expect(result.data[1].territory).toBeNull();
      expect(result.data[1].reportingEntity).toBe('Netflix');
      // Non-categorization metadata keys are preserved on the response
      expect(result.data[1].metadata).toEqual({ lineItems: [{ amount: 100 }] });
    });
  });

  // ─── listBatches — status filter (MS3 Screen 3.1 filter tabs) ────────────

  describe('listBatches — status filter', () => {
    it('applies status filter when provided', async () => {
      mockPrismaService.revenueBatch.findMany.mockResolvedValue([]);
      mockPrismaService.revenueBatch.count.mockResolvedValue(0);

      await service.listBatches(MOCK_USER_ID, MOCK_DEAL_ID, {
        status: 'PENDING' as never,
      });

      const whereArg = mockPrismaService.revenueBatch.findMany.mock.calls[0][0].where;
      expect(whereArg.status).toBe('PENDING');
      expect(whereArg.dealId).toBe(MOCK_DEAL_ID);
    });

    it('omits the status clause entirely when not provided', async () => {
      mockPrismaService.revenueBatch.findMany.mockResolvedValue([]);
      mockPrismaService.revenueBatch.count.mockResolvedValue(0);

      await service.listBatches(MOCK_USER_ID, MOCK_DEAL_ID, {});

      const whereArg = mockPrismaService.revenueBatch.findMany.mock.calls[0][0].where;
      expect(whereArg.status).toBeUndefined();
    });

    it('combines status + categorization filters (AND)', async () => {
      mockPrismaService.revenueBatch.findMany.mockResolvedValue([]);
      mockPrismaService.revenueBatch.count.mockResolvedValue(0);

      await service.listBatches(MOCK_USER_ID, MOCK_DEAL_ID, {
        status: 'VALIDATED' as never,
        territory: 'US',
      });

      const whereArg = mockPrismaService.revenueBatch.findMany.mock.calls[0][0].where;
      expect(whereArg.status).toBe('VALIDATED');
      expect(whereArg.AND).toEqual([
        { metadata: { path: ['territory'], equals: 'US' } },
      ]);
    });
  });

  // ─── getSummary — Screen 3.1 filter-tab counts + summary-bar amounts ─────

  describe('getSummary', () => {
    it('returns zero-filled per-status shape when the deal has no batches', async () => {
      mockPrismaService.revenueBatch.groupBy.mockResolvedValue([]);

      const result = await service.getSummary(MOCK_USER_ID, MOCK_DEAL_ID);

      expect(result).toEqual({
        totalCount: 0,
        totalAmount: 0,
        currency: null,
        byStatus: {
          PENDING: { count: 0, amount: 0 },
          VALIDATED: { count: 0, amount: 0 },
          PROCESSED: { count: 0, amount: 0 },
          REJECTED: { count: 0, amount: 0 },
        },
      });
    });

    it('aggregates counts + amounts per status and derives shared currency', async () => {
      mockPrismaService.revenueBatch.groupBy
        .mockResolvedValueOnce([
          { status: 'PENDING', _count: { _all: 1 }, _sum: { totalAmount: 50000000 } },
          { status: 'VALIDATED', _count: { _all: 1 }, _sum: { totalAmount: 75000000 } },
          { status: 'PROCESSED', _count: { _all: 2 }, _sum: { totalAmount: 100000000 } },
        ])
        .mockResolvedValueOnce([{ currency: 'USD', _count: { _all: 4 } }]);

      const result = await service.getSummary(MOCK_USER_ID, MOCK_DEAL_ID);

      expect(result.totalCount).toBe(4);
      expect(result.totalAmount).toBe(225000000);
      expect(result.currency).toBe('USD');
      expect(result.byStatus.PENDING).toEqual({ count: 1, amount: 50000000 });
      expect(result.byStatus.VALIDATED).toEqual({ count: 1, amount: 75000000 });
      expect(result.byStatus.PROCESSED).toEqual({ count: 2, amount: 100000000 });
      // Zero-filled for the missing REJECTED bucket
      expect(result.byStatus.REJECTED).toEqual({ count: 0, amount: 0 });
    });

    it('returns null currency when batches span multiple currencies', async () => {
      mockPrismaService.revenueBatch.groupBy
        .mockResolvedValueOnce([
          { status: 'PENDING', _count: { _all: 1 }, _sum: { totalAmount: 50000000 } },
        ])
        .mockResolvedValueOnce([
          { currency: 'USD', _count: { _all: 1 } },
          { currency: 'EUR', _count: { _all: 1 } },
        ]);

      const result = await service.getSummary(MOCK_USER_ID, MOCK_DEAL_ID);

      expect(result.currency).toBeNull();
    });

    it('coerces Prisma Decimal sums to plain numbers on the response', async () => {
      // Prisma returns Decimal-shaped objects; the service should normalize.
      // Simulate with a Number-castable-but-not-primitive value.
      const decimalLike = { toString: () => '42500000' };
      mockPrismaService.revenueBatch.groupBy
        .mockResolvedValueOnce([
          { status: 'VALIDATED', _count: { _all: 1 }, _sum: { totalAmount: decimalLike } },
        ])
        .mockResolvedValueOnce([{ currency: 'USD', _count: { _all: 1 } }]);

      const result = await service.getSummary(MOCK_USER_ID, MOCK_DEAL_ID);

      expect(result.byStatus.VALIDATED.amount).toBe(42500000);
      expect(typeof result.byStatus.VALIDATED.amount).toBe('number');
    });

    it('rejects with 404 when the caller does not own the deal', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValueOnce({
        id: MOCK_DEAL_ID,
        userId: 'other-user-uuid',
      });

      await expect(
        service.getSummary(MOCK_USER_ID, MOCK_DEAL_ID),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.revenueBatch.groupBy).not.toHaveBeenCalled();
    });
  });

  // ─── Audit-pass gap: status transitions preserve categorization ──────────

  describe('validateBatch + rejectBatch — categorization preservation (audit-pass gap fix)', () => {
    it('validateBatch preserves categorization keys when validationNotes is supplied (metadata spread)', async () => {
      const existing = {
        ...buildBatchRow({
          status: 'PENDING',
          metadata: { territory: 'US', revenueType: 'Streaming', reportingEntity: 'Spotify' },
        }),
        // assertBatchOwner reads this nested shape from findUnique
        deal: { userId: MOCK_USER_ID },
      };
      mockPrismaService.revenueBatch.findUnique.mockResolvedValue(existing);
      // The mock just echoes back the merged metadata so the test can inspect it
      mockPrismaService.revenueBatch.update.mockImplementation(({ data }) =>
        Promise.resolve(
          buildBatchRow({ status: 'VALIDATED', metadata: data.metadata as Record<string, unknown> }),
        ),
      );

      const result = await service.validateBatch(MOCK_USER_ID, 'batch-uuid-1', {
        validationNotes: 'Verified against source documents',
      });

      // Categorization fields still surfaced at the top level on the response
      expect(result.territory).toBe('US');
      expect(result.revenueType).toBe('Streaming');
      expect(result.reportingEntity).toBe('Spotify');
      // validationNotes lives on the metadata payload (not a top-level surfaced field)
      expect(result.metadata).toEqual(
        expect.objectContaining({
          validationNotes: 'Verified against source documents',
          validatedAt: expect.any(String),
        }),
      );
    });

    it('validateBatch preserves categorization keys when validationNotes is NOT supplied (metadata passthrough)', async () => {
      const existing = {
        ...buildBatchRow({
          status: 'PENDING',
          metadata: { territory: 'APAC', revenueType: 'Live' },
        }),
        deal: { userId: MOCK_USER_ID },
      };
      mockPrismaService.revenueBatch.findUnique.mockResolvedValue(existing);
      mockPrismaService.revenueBatch.update.mockImplementation(({ data }) =>
        Promise.resolve(
          buildBatchRow({
            status: 'VALIDATED',
            // Service passes existing metadata through unchanged when no validationNotes
            metadata: (data.metadata as Record<string, unknown> | undefined) ?? existing.metadata,
          }),
        ),
      );

      const result = await service.validateBatch(MOCK_USER_ID, 'batch-uuid-1', {});

      expect(result.territory).toBe('APAC');
      expect(result.revenueType).toBe('Live');
    });

    it('rejectBatch preserves categorization keys (always spreads existing metadata)', async () => {
      const existing = {
        ...buildBatchRow({
          status: 'PENDING',
          metadata: { territory: 'EU', reportingEntity: 'Netflix' },
        }),
        deal: { userId: MOCK_USER_ID },
      };
      mockPrismaService.revenueBatch.findUnique.mockResolvedValue(existing);
      mockPrismaService.revenueBatch.update.mockImplementation(({ data }) =>
        Promise.resolve(
          buildBatchRow({ status: 'REJECTED', metadata: data.metadata as Record<string, unknown> }),
        ),
      );

      const result = await service.rejectBatch(MOCK_USER_ID, 'batch-uuid-1', {
        rejectionReason: 'Amounts do not match',
      });

      expect(result.territory).toBe('EU');
      expect(result.reportingEntity).toBe('Netflix');
      // rejectionReason persisted in metadata alongside categorization
      expect(result.metadata).toEqual(
        expect.objectContaining({ rejectionReason: 'Amounts do not match' }),
      );
    });
  });

  // ─── MS-3 Wave 3 (Liang MS3-R1) — RevenueLineItem CRUD ─────────────────

  describe('createBatch — line items', () => {
    function buildLineItemRow(overrides: Record<string, unknown> = {}) {
      return {
        id: 'li-uuid-1',
        batchId: 'batch-uuid-1',
        platformSource: 'Netflix',
        amount: { toString: () => '30000000' },
        currency: 'USD',
        territory: 'US',
        revenueType: 'Streaming',
        reportingEntity: 'Netflix',
        notes: null,
        createdAt: new Date('2026-05-20T00:00:00.000Z'),
        updatedAt: new Date('2026-05-20T00:00:00.000Z'),
        ...overrides,
      };
    }

    it('persists lineItems atomically with the batch and surfaces them on the response', async () => {
      mockPrismaService.revenueBatch.create.mockResolvedValue({
        ...buildBatchRow({ id: 'batch-1' }),
        lineItems: [
          buildLineItemRow({ platformSource: 'Netflix', amount: { toString: () => '30000000' } }),
          buildLineItemRow({ id: 'li-uuid-2', platformSource: 'Disney+', amount: { toString: () => '15000000' } }),
        ],
      });

      const result = await service.createBatch(MOCK_USER_ID, MOCK_DEAL_ID, {
        periodStart: '2026-10-01',
        periodEnd: '2026-12-31',
        totalAmount: 45000000,
        currency: CurrencyEnum.USD,
        lineItems: [
          { platformSource: 'Netflix', amount: 30000000, territory: 'US', revenueType: 'Streaming' },
          { platformSource: 'Disney+', amount: 15000000, territory: 'EU', revenueType: 'Licensing' },
        ],
      });

      // Create call included the nested lineItems.create block
      const createArg = mockPrismaService.revenueBatch.create.mock.calls[0][0];
      expect(createArg.data.lineItems.create).toHaveLength(2);
      expect(createArg.include.lineItems).toBe(true);

      // Response surfaces the persisted rows
      expect(result.lineItems).toHaveLength(2);
      expect(result.lineItems![0].platformSource).toBe('Netflix');
      expect(result.lineItems![0].amount).toBe(30000000);
    });

    it('rejects when a lineItem currency disagrees with the batch currency', async () => {
      await expect(
        service.createBatch(MOCK_USER_ID, MOCK_DEAL_ID, {
          periodStart: '2026-10-01',
          periodEnd: '2026-12-31',
          totalAmount: 45000000,
          currency: CurrencyEnum.USD,
          lineItems: [
            { platformSource: 'Netflix', amount: 30000000, currency: CurrencyEnum.EUR },
          ],
        }),
      ).rejects.toThrow(/currency/);
      expect(mockPrismaService.revenueBatch.create).not.toHaveBeenCalled();
    });

    it('accepts a batch with no lineItems (backward compat)', async () => {
      mockPrismaService.revenueBatch.create.mockResolvedValue({
        ...buildBatchRow({ id: 'batch-2' }),
        lineItems: [],
      });

      const result = await service.createBatch(MOCK_USER_ID, MOCK_DEAL_ID, {
        periodStart: '2026-10-01',
        periodEnd: '2026-12-31',
        totalAmount: 45000000,
        currency: CurrencyEnum.USD,
      });

      const createArg = mockPrismaService.revenueBatch.create.mock.calls[0][0];
      expect(createArg.data.lineItems).toBeUndefined();
      expect(result.lineItems).toEqual([]);
    });
  });

  describe('addLineItems', () => {
    function buildLineItemRow(overrides: Record<string, unknown> = {}) {
      return {
        id: 'li-uuid-3',
        batchId: 'batch-uuid-1',
        platformSource: 'Spotify',
        amount: { toString: () => '10000000' },
        currency: 'USD',
        territory: null,
        revenueType: null,
        reportingEntity: null,
        notes: null,
        createdAt: new Date('2026-05-20T00:00:00.000Z'),
        updatedAt: new Date('2026-05-20T00:00:00.000Z'),
        ...overrides,
      };
    }

    beforeEach(() => {
      // assertBatchOwner passes
      mockPrismaService.revenueBatch.findUnique
        .mockResolvedValueOnce({ id: 'batch-uuid-1', deal: { userId: MOCK_USER_ID } })
        // batch load for mutability guard
        .mockResolvedValueOnce({
          id: 'batch-uuid-1',
          currency: 'USD',
          status: 'PENDING',
          dealId: MOCK_DEAL_ID,
        });
    });

    it('bulk-inserts rows inside a transaction and returns them mapped', async () => {
      mockPrismaService.revenueLineItem.create
        .mockResolvedValueOnce(buildLineItemRow({ platformSource: 'Spotify' }))
        .mockResolvedValueOnce(buildLineItemRow({ id: 'li-uuid-4', platformSource: 'Apple Music' }));
      mockPrismaService.revenueBatch.update.mockResolvedValue({});

      const result = await service.addLineItems(MOCK_USER_ID, 'batch-uuid-1', {
        lineItems: [
          { platformSource: 'Spotify', amount: 10000000 },
          { platformSource: 'Apple Music', amount: 5000000 },
        ],
      });

      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.revenueLineItem.create).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.revenueBatch.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'batch-uuid-1' } }),
      );
      expect(result).toHaveLength(2);
      expect(result[0].platformSource).toBe('Spotify');
    });

    it('rejects when the batch is not PENDING', async () => {
      // Override the mutability lookup to return a VALIDATED batch
      mockPrismaService.revenueBatch.findUnique.mockReset();
      mockPrismaService.revenueBatch.findUnique
        .mockResolvedValueOnce({ id: 'batch-uuid-1', deal: { userId: MOCK_USER_ID } })
        .mockResolvedValueOnce({
          id: 'batch-uuid-1',
          currency: 'USD',
          status: 'VALIDATED',
          dealId: MOCK_DEAL_ID,
        });

      await expect(
        service.addLineItems(MOCK_USER_ID, 'batch-uuid-1', {
          lineItems: [{ platformSource: 'Spotify', amount: 10000000 }],
        }),
      ).rejects.toThrow(/PENDING/);
      expect(mockPrismaService.revenueLineItem.create).not.toHaveBeenCalled();
    });

    it('rejects when any row currency disagrees with the batch', async () => {
      await expect(
        service.addLineItems(MOCK_USER_ID, 'batch-uuid-1', {
          lineItems: [
            { platformSource: 'Spotify', amount: 10000000 },
            { platformSource: 'Apple Music', amount: 5000000, currency: CurrencyEnum.EUR },
          ],
        }),
      ).rejects.toThrow(/currency/);
      expect(mockPrismaService.revenueLineItem.create).not.toHaveBeenCalled();
    });
  });

  describe('updateLineItem', () => {
    function buildLineItemRow(overrides: Record<string, unknown> = {}) {
      return {
        id: 'li-uuid-5',
        batchId: 'batch-uuid-1',
        platformSource: 'Netflix',
        amount: { toString: () => '30000000' },
        currency: 'USD',
        territory: 'US',
        revenueType: 'Streaming',
        reportingEntity: 'Netflix',
        notes: null,
        createdAt: new Date('2026-05-20T00:00:00.000Z'),
        updatedAt: new Date('2026-05-20T00:00:00.000Z'),
        ...overrides,
      };
    }

    beforeEach(() => {
      mockPrismaService.revenueBatch.findUnique
        .mockResolvedValueOnce({ id: 'batch-uuid-1', deal: { userId: MOCK_USER_ID } })
        .mockResolvedValueOnce({
          id: 'batch-uuid-1',
          currency: 'USD',
          status: 'PENDING',
          dealId: MOCK_DEAL_ID,
        });
    });

    it('applies patch and returns the updated row', async () => {
      mockPrismaService.revenueLineItem.findUnique.mockResolvedValue({
        id: 'li-uuid-5',
        batchId: 'batch-uuid-1',
      });
      mockPrismaService.revenueLineItem.update.mockResolvedValue(
        buildLineItemRow({ platformSource: 'Netflix (renamed)' }),
      );

      const result = await service.updateLineItem(MOCK_USER_ID, 'batch-uuid-1', 'li-uuid-5', {
        platformSource: 'Netflix (renamed)',
      });

      expect(mockPrismaService.revenueLineItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'li-uuid-5' },
          data: { platformSource: 'Netflix (renamed)' },
        }),
      );
      expect(result.platformSource).toBe('Netflix (renamed)');
    });

    it('returns 404 when the line item belongs to a different batch', async () => {
      mockPrismaService.revenueLineItem.findUnique.mockResolvedValue({
        id: 'li-uuid-5',
        batchId: 'other-batch',
      });

      await expect(
        service.updateLineItem(MOCK_USER_ID, 'batch-uuid-1', 'li-uuid-5', { amount: 42 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects when patched currency disagrees with batch currency', async () => {
      mockPrismaService.revenueLineItem.findUnique.mockResolvedValue({
        id: 'li-uuid-5',
        batchId: 'batch-uuid-1',
      });

      await expect(
        service.updateLineItem(MOCK_USER_ID, 'batch-uuid-1', 'li-uuid-5', {
          currency: CurrencyEnum.EUR,
        }),
      ).rejects.toThrow(/currency/);
    });
  });

  describe('deleteLineItem', () => {
    beforeEach(() => {
      mockPrismaService.revenueBatch.findUnique
        .mockResolvedValueOnce({ id: 'batch-uuid-1', deal: { userId: MOCK_USER_ID } })
        .mockResolvedValueOnce({ id: 'batch-uuid-1', status: 'PENDING' });
    });

    it('deletes the row when it belongs to the batch', async () => {
      mockPrismaService.revenueLineItem.findUnique.mockResolvedValue({
        id: 'li-uuid-9',
        batchId: 'batch-uuid-1',
      });
      mockPrismaService.revenueLineItem.delete.mockResolvedValue({});

      const result = await service.deleteLineItem(MOCK_USER_ID, 'batch-uuid-1', 'li-uuid-9');

      expect(result).toEqual({ success: true });
      expect(mockPrismaService.revenueLineItem.delete).toHaveBeenCalledWith({
        where: { id: 'li-uuid-9' },
      });
    });

    it('returns 404 when the line item does not exist', async () => {
      mockPrismaService.revenueLineItem.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteLineItem(MOCK_USER_ID, 'batch-uuid-1', 'missing-li'),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.revenueLineItem.delete).not.toHaveBeenCalled();
    });
  });
});

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
    },
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
});

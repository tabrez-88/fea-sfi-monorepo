import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import { DealStatusDto } from '../dto';

import { DealsService } from './deals.service';

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
    TERMINATED: 'TERMINATED',
    ARCHIVED: 'ARCHIVED',
  },
  DealCategory: {
    MUSIC: 'MUSIC',
    FILM_AND_TV: 'FILM_AND_TV',
    LIVE_EVENTS_AND_SPORTS: 'LIVE_EVENTS_AND_SPORTS',
    GAMES_AND_INTERACTIVE_MEDIA: 'GAMES_AND_INTERACTIVE_MEDIA',
    CREATOR_AND_CONSUMER_IP: 'CREATOR_AND_CONSUMER_IP',
    AI_AND_FUTURE_MEDIA: 'AI_AND_FUTURE_MEDIA',
  },
  Currency: {
    USD: 'USD',
    EUR: 'EUR',
    GBP: 'GBP',
    JPY: 'JPY',
    CHF: 'CHF',
    CAD: 'CAD',
    AUD: 'AUD',
  },
  Prisma: {
    JsonNull: 'DbNull',
  },
}));

const MOCK_USER_ID = 'user-uuid-mock';

describe('DealsService', () => {
  let service: DealsService;

  const mockPrismaService: {
    deal: Record<string, jest.Mock>;
    revenueBatch: Record<string, jest.Mock>;
    $transaction: jest.Mock;
  } = {
    deal: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    revenueBatch: {
      aggregate: jest.fn(),
    },
    // Runs the callback with the same mocks so tx.deal.* hits our stubs.
    $transaction: jest.fn().mockImplementation((cb: (tx: unknown) => unknown) => cb(mockPrismaService)),
  };

  const mockAuditLogService = {
    create: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    service = module.get<DealsService>(DealsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a deal with default currency USD', async () => {
      const createDto = {
        name: 'Test Deal',
        effectiveDate: '2024-01-01T00:00:00.000Z',
      };

      const mockDeal = {
        id: 'uuid-123',
        name: 'Test Deal',
        description: null,
        status: 'DRAFT',
        currency: 'USD',
        effectiveDate: new Date('2024-01-01'),
        terminationDate: null,
        notes: null,
        metadata: {},
        userId: MOCK_USER_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.deal.create.mockResolvedValue(mockDeal);

      const result = await service.create(MOCK_USER_ID, createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('uuid-123');
      expect(result.currency).toBe('USD');
      expect(mockAuditLogService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATED', entityType: 'Deal' }),
      );
    });

    it('should reject creation when terminationDate is before effectiveDate', async () => {
      const createDto = {
        name: 'Bad Dates Deal',
        effectiveDate: '2024-12-01T00:00:00.000Z',
        terminationDate: '2024-01-01T00:00:00.000Z',
      };

      await expect(service.create(MOCK_USER_ID, createDto)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.deal.create).not.toHaveBeenCalled();
    });
  });

  // ─── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated deals with participantsCount', async () => {
      const mockDeals = [
        {
          id: 'uuid-1',
          name: 'Deal 1',
          description: null,
          status: 'DRAFT',
          currency: 'USD',
          effectiveDate: new Date(),
          terminationDate: null,
          notes: null,
          metadata: {},
          userId: MOCK_USER_ID,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { participants: 5 },
        },
      ];

      mockPrismaService.deal.findMany.mockResolvedValue(mockDeals);
      mockPrismaService.deal.count.mockResolvedValue(1);

      const result = await service.findAll(MOCK_USER_ID, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.participantsCount).toBe(5);
      expect(result.meta.total).toBe(1);
    });

    it('should scope query to the authenticated user', async () => {
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.deal.count.mockResolvedValue(0);

      await service.findAll(MOCK_USER_ID, {});

      expect(mockPrismaService.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: MOCK_USER_ID }),
        }),
      );
    });

    it('should apply status filter when provided', async () => {
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.deal.count.mockResolvedValue(0);

      await service.findAll(MOCK_USER_ID, { status: DealStatusDto.ACTIVE });

      expect(mockPrismaService.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: MOCK_USER_ID, status: 'ACTIVE' }),
        }),
      );
    });

    it('should apply case-insensitive search on name and description', async () => {
      mockPrismaService.deal.findMany.mockResolvedValue([]);
      mockPrismaService.deal.count.mockResolvedValue(0);

      await service.findAll(MOCK_USER_ID, { search: 'horizon' });

      expect(mockPrismaService.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'horizon', mode: 'insensitive' } },
              { description: { contains: 'horizon', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });
  });

  // ─── findOne ────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a deal with all aggregate counts and totalRevenue', async () => {
      const mockDeal = {
        id: 'uuid-123',
        name: 'Test Deal',
        description: null,
        status: 'ACTIVE',
        currency: 'USD',
        effectiveDate: new Date(),
        terminationDate: null,
        notes: null,
        metadata: {},
        userId: MOCK_USER_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          participants: 18,
          ruleSnapshots: 9,
          revenueBatches: 12,
          settlementRuns: 2,
        },
      };

      mockPrismaService.deal.findUnique.mockResolvedValue(mockDeal);
      mockPrismaService.revenueBatch.aggregate.mockResolvedValue({
        _sum: { totalAmount: 200000000 },
      });

      const result = await service.findOne(MOCK_USER_ID, 'uuid-123');

      expect(result.id).toBe('uuid-123');
      expect(result.participantsCount).toBe(18);
      expect(result.ruleSnapshotsCount).toBe(9);
      expect(result.revenueBatchesCount).toBe(12);
      expect(result.settlementRunsCount).toBe(2);
      expect(result.totalRevenue).toBe(200000000);
    });

    it('should return totalRevenue=0 when no revenue batches exist', async () => {
      const mockDeal = {
        id: 'uuid-empty',
        name: 'Empty Deal',
        description: null,
        status: 'DRAFT',
        currency: 'USD',
        effectiveDate: new Date(),
        terminationDate: null,
        notes: null,
        metadata: {},
        userId: MOCK_USER_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: {
          participants: 0,
          ruleSnapshots: 0,
          revenueBatches: 0,
          settlementRuns: 0,
        },
      };

      mockPrismaService.deal.findUnique.mockResolvedValue(mockDeal);
      mockPrismaService.revenueBatch.aggregate.mockResolvedValue({
        _sum: { totalAmount: null },
      });

      const result = await service.findOne(MOCK_USER_ID, 'uuid-empty');

      expect(result.totalRevenue).toBe(0);
    });

    it('should throw NotFoundException when deal not found', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue(null);

      await expect(service.findOne(MOCK_USER_ID, 'non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when deal belongs to another user', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: 'uuid-other',
        userId: 'other-user-id',
        _count: { participants: 0, ruleSnapshots: 0, revenueBatches: 0, settlementRuns: 0 },
      });

      await expect(service.findOne(MOCK_USER_ID, 'uuid-other')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    const existingDeal = {
      id: 'uuid-123',
      userId: MOCK_USER_ID,
      status: 'ACTIVE',
      effectiveDate: new Date('2024-01-01'),
      terminationDate: new Date('2025-01-01'),
    };

    it('should update a deal and emit UPDATED audit log', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue(existingDeal);
      mockPrismaService.deal.update.mockResolvedValue({
        ...existingDeal,
        name: 'New Name',
        description: null,
        currency: 'USD',
        notes: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.update(MOCK_USER_ID, 'uuid-123', { name: 'New Name' });

      expect(result.name).toBe('New Name');
      expect(mockAuditLogService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATED' }),
      );
    });

    it('should emit STATUS_CHANGED audit log when status changes', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue(existingDeal);
      mockPrismaService.deal.update.mockResolvedValue({
        ...existingDeal,
        name: 'Test',
        description: null,
        currency: 'USD',
        status: 'SUSPENDED',
        notes: 'Client unresponsive',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.update(MOCK_USER_ID, 'uuid-123', {
        status: DealStatusDto.SUSPENDED,
        notes: 'Client unresponsive',
      });

      expect(mockAuditLogService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'STATUS_CHANGED',
          metadata: expect.objectContaining({
            previousStatus: 'ACTIVE',
            newStatus: 'SUSPENDED',
            notes: 'Client unresponsive',
          }),
        }),
      );
    });

    it('should reject update when new terminationDate is before existing effectiveDate', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue(existingDeal);

      await expect(
        service.update(MOCK_USER_ID, 'uuid-123', { terminationDate: '2023-01-01T00:00:00.000Z' }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.deal.update).not.toHaveBeenCalled();
    });

    it('should clear notes when status moves out of SUSPENDED', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue({
        ...existingDeal,
        status: 'SUSPENDED',
      });
      mockPrismaService.deal.update.mockResolvedValue({
        ...existingDeal,
        name: 'Test',
        description: null,
        currency: 'USD',
        status: 'ACTIVE',
        notes: null,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.update(MOCK_USER_ID, 'uuid-123', { status: DealStatusDto.ACTIVE });

      expect(mockPrismaService.deal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ notes: null }),
        }),
      );
    });

    it('should throw NotFoundException when updating a non-existent deal', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue(null);

      await expect(service.update(MOCK_USER_ID, 'bad-id', { name: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when deal belongs to another user', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue({
        ...existingDeal,
        userId: 'other-user-id',
      });

      await expect(service.update(MOCK_USER_ID, 'uuid-123', { name: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── getCounts ──────────────────────────────────────────────────────────────

  describe('getCounts', () => {
    it('should return counts grouped by status scoped to the user', async () => {
      mockPrismaService.deal.groupBy.mockResolvedValue([
        { status: 'DRAFT', _count: { _all: 6 } },
        { status: 'ACTIVE', _count: { _all: 6 } },
        { status: 'CLOSED', _count: { _all: 6 } },
      ]);

      const result = await service.getCounts(MOCK_USER_ID);

      expect(result.all).toBe(18);
      expect(result.draft).toBe(6);
      expect(result.active).toBe(6);
      expect(result.closed).toBe(6);
      expect(result.suspended).toBe(0);
      expect(mockPrismaService.deal.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: MOCK_USER_ID } }),
      );
    });

    it('should return all zeros when no deals exist', async () => {
      mockPrismaService.deal.groupBy.mockResolvedValue([]);

      const result = await service.getCounts(MOCK_USER_ID);

      expect(result.all).toBe(0);
      expect(result.draft).toBe(0);
      expect(result.active).toBe(0);
      expect(result.suspended).toBe(0);
      expect(result.closed).toBe(0);
    });
  });

  // ─── importFromCsv (MS-3 Wave 6 / Liang MS3-R2) ─────────────────────────

  describe('importFromCsv', () => {
    function buildCsv(rows: string[]): Buffer {
      return Buffer.from(rows.join('\n'), 'utf8');
    }

    it('rejects an empty CSV with a friendly error', async () => {
      const buffer = buildCsv(['name,effectiveDate']);
      await expect(
        service.importFromCsv(MOCK_USER_ID, buffer),
      ).rejects.toThrow(/at least one data row/);
    });

    it('rejects when the header is missing required columns', async () => {
      const buffer = buildCsv([
        'externalDealId,category',
        'FEA-1,MUSIC',
      ]);
      await expect(
        service.importFromCsv(MOCK_USER_ID, buffer),
      ).rejects.toThrow(/name.*effectiveDate/);
    });

    it('creates new deals when no externalDealId matches an existing row', async () => {
      const buffer = buildCsv([
        'name,effectiveDate,category,currency,externalDealId',
        'The Last Horizon,2026-01-01,FILM_AND_TV,USD,FEA-DEAL-1',
        'Album X,2026-02-15,MUSIC,EUR,FEA-DEAL-2',
      ]);
      mockPrismaService.deal.findFirst.mockResolvedValue(null);
      mockPrismaService.deal.create
        .mockResolvedValueOnce({ id: 'deal-1' })
        .mockResolvedValueOnce({ id: 'deal-2' });

      const result = await service.importFromCsv(MOCK_USER_ID, buffer);

      expect(result.imported).toBe(2);
      expect(result.failed).toBe(0);
      expect(mockPrismaService.deal.create).toHaveBeenCalledTimes(2);
      expect(result.rows[0].outcome).toBe('CREATED');
      expect(result.rows[0].dealId).toBe('deal-1');
    });

    it('upserts on (userId, externalDealId) when a match exists', async () => {
      const buffer = buildCsv([
        'name,effectiveDate,externalDealId',
        'Renamed Deal,2026-01-01,FEA-DEAL-1',
      ]);
      mockPrismaService.deal.findFirst.mockResolvedValue({ id: 'existing-deal-uuid' });
      mockPrismaService.deal.update.mockResolvedValue({ id: 'existing-deal-uuid' });

      const result = await service.importFromCsv(MOCK_USER_ID, buffer);

      expect(mockPrismaService.deal.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: MOCK_USER_ID, externalDealId: 'FEA-DEAL-1' },
        }),
      );
      expect(mockPrismaService.deal.update).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.deal.create).not.toHaveBeenCalled();
      expect(result.rows[0].outcome).toBe('UPDATED');
    });

    it('honors skipErrors=true — reports bad rows, imports the good ones', async () => {
      const buffer = buildCsv([
        'name,effectiveDate',
        'Valid Deal,2026-01-01',
        ',missing name',
        'Another Valid,2026-06-01',
      ]);
      mockPrismaService.deal.findFirst.mockResolvedValue(null);
      mockPrismaService.deal.create
        .mockResolvedValueOnce({ id: 'ok-1' })
        .mockResolvedValueOnce({ id: 'ok-2' });

      const result = await service.importFromCsv(MOCK_USER_ID, buffer, true);

      expect(result.imported).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.rows[1].success).toBe(false);
      expect(result.rows[1].error).toMatch(/name/);
    });

    it('aborts on the first bad row when skipErrors=false', async () => {
      const buffer = buildCsv([
        'name,effectiveDate',
        ',2026-01-01',
      ]);
      await expect(
        service.importFromCsv(MOCK_USER_ID, buffer),
      ).rejects.toThrow(/name/);
      expect(mockPrismaService.deal.create).not.toHaveBeenCalled();
    });

    it('dryRun=true validates without persisting', async () => {
      const buffer = buildCsv([
        'name,effectiveDate',
        'Preview Deal,2026-01-01',
      ]);

      const result = await service.importFromCsv(MOCK_USER_ID, buffer, false, true);

      expect(result.imported).toBe(0);
      expect(result.rows[0].outcome).toBe('SKIPPED');
      expect(mockPrismaService.deal.create).not.toHaveBeenCalled();
      expect(mockPrismaService.deal.update).not.toHaveBeenCalled();
    });

    it('normalizes casing on category/currency/status and reports unknown values as warnings', async () => {
      const buffer = buildCsv([
        'name,effectiveDate,category,currency,status',
        'Deal A,2026-01-01,music,usd,active',
        'Deal B,2026-01-01,Unknown Category,ZZZ,Frozen',
      ]);
      mockPrismaService.deal.findFirst.mockResolvedValue(null);
      mockPrismaService.deal.create
        .mockResolvedValueOnce({ id: 'a' })
        .mockResolvedValueOnce({ id: 'b' });

      const result = await service.importFromCsv(MOCK_USER_ID, buffer);

      const rowB = result.rows.find((r) => r.row === 2)!;
      expect(rowB.warnings?.some((w) => w.includes('category'))).toBe(true);
      expect(rowB.warnings?.some((w) => w.includes('currency'))).toBe(true);
      expect(rowB.warnings?.some((w) => w.includes('status'))).toBe(true);
    });
  });
});

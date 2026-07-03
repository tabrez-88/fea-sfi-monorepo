import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import { PerkDeliveryStatusEnum } from '../dto';

import { PerkDeliveryService } from './perk-delivery.service';

jest.mock('@prisma/client', () => ({
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  PrismaClient: class PrismaClient {
    static readonly __mock = true;
  },
  PerkDeliveryStatus: {
    PENDING: 'PENDING',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    RETURNED: 'RETURNED',
    CANCELLED: 'CANCELLED',
  },
  Prisma: {},
}));

const MOCK_USER_ID = 'user-uuid';
const MOCK_DEAL_ID = 'deal-uuid';

function buildRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'perk-1',
    dealId: MOCK_DEAL_ID,
    participantId: 'participant-1',
    settlementRunId: null,
    trackingNumber: null,
    carrier: null,
    shippedAt: null,
    deliveredAt: null,
    status: 'PENDING',
    notes: null,
    createdAt: new Date('2026-05-01T00:00:00.000Z'),
    updatedAt: new Date('2026-05-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('PerkDeliveryService', () => {
  let service: PerkDeliveryService;

  const mockPrismaService: {
    deal: Record<string, jest.Mock>;
    participant: Record<string, jest.Mock>;
    perkDelivery: Record<string, jest.Mock>;
    $transaction: jest.Mock;
  } = {
    deal: { findUnique: jest.fn() },
    participant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    perkDelivery: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((cb: (tx: unknown) => unknown) => cb(mockPrismaService)),
  };

  const mockAuditLog = { create: jest.fn().mockResolvedValue({}) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerkDeliveryService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditLogService, useValue: mockAuditLog },
      ],
    }).compile();

    service = module.get<PerkDeliveryService>(PerkDeliveryService);

    // Default owner-check passes
    mockPrismaService.deal.findUnique.mockResolvedValue({
      id: MOCK_DEAL_ID,
      userId: MOCK_USER_ID,
    });
  });

  afterEach(() => jest.clearAllMocks());

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    beforeEach(() => {
      mockPrismaService.participant.findUnique.mockResolvedValue({
        dealId: MOCK_DEAL_ID,
      });
    });

    it('persists a single perk delivery and audits CREATED', async () => {
      mockPrismaService.perkDelivery.create.mockResolvedValue(
        buildRow({ status: 'SHIPPED', trackingNumber: '1Z' }),
      );

      const result = await service.create(MOCK_USER_ID, MOCK_DEAL_ID, {
        participantId: 'participant-1',
        trackingNumber: '1Z',
        carrier: 'UPS',
        status: PerkDeliveryStatusEnum.SHIPPED,
      });

      expect(result.status).toBe('SHIPPED');
      expect(result.trackingNumber).toBe('1Z');
      expect(mockAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATED', entityType: 'PerkDelivery' }),
      );
    });

    it('rejects when participant belongs to a different deal', async () => {
      mockPrismaService.participant.findUnique.mockResolvedValue({
        dealId: 'some-other-deal',
      });

      await expect(
        service.create(MOCK_USER_ID, MOCK_DEAL_ID, { participantId: 'participant-1' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.perkDelivery.create).not.toHaveBeenCalled();
    });

    it('rejects when caller does not own the deal', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValueOnce({
        id: MOCK_DEAL_ID,
        userId: 'someone-else',
      });

      await expect(
        service.create(MOCK_USER_ID, MOCK_DEAL_ID, { participantId: 'participant-1' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update / remove owner checks ────────────────────────────────────────

  describe('owner-scoped update / remove', () => {
    it('update rejects when caller does not own the parent deal', async () => {
      mockPrismaService.perkDelivery.findUnique.mockResolvedValue({
        id: 'perk-1',
        deal: { userId: 'someone-else' },
      });

      await expect(
        service.update(MOCK_USER_ID, 'perk-1', { status: PerkDeliveryStatusEnum.DELIVERED }),
      ).rejects.toThrow(NotFoundException);
    });

    it('remove deletes when owner check passes', async () => {
      mockPrismaService.perkDelivery.findUnique.mockResolvedValue({
        id: 'perk-1',
        deal: { userId: MOCK_USER_ID },
      });
      mockPrismaService.perkDelivery.delete.mockResolvedValue(buildRow());

      const result = await service.remove(MOCK_USER_ID, 'perk-1');

      expect(result).toEqual({ success: true });
      expect(mockPrismaService.perkDelivery.delete).toHaveBeenCalledWith({
        where: { id: 'perk-1' },
      });
    });
  });

  // ─── importFromCsv ───────────────────────────────────────────────────────

  describe('importFromCsv', () => {
    function buildCsv(rows: string[]): Buffer {
      return Buffer.from(rows.join('\n'), 'utf8');
    }

    beforeEach(() => {
      mockPrismaService.participant.findMany.mockResolvedValue([
        { id: 'participant-1', email: 'alice@example.com' },
        { id: 'participant-2', email: 'bob@example.com' },
      ]);
    });

    it('rejects an empty CSV', async () => {
      const buffer = buildCsv(['participantId,trackingNumber']);
      await expect(
        service.importFromCsv(MOCK_USER_ID, MOCK_DEAL_ID, buffer),
      ).rejects.toThrow(/at least one data row/);
    });

    it('rejects when the header is missing a participant column', async () => {
      const buffer = buildCsv([
        'trackingNumber,carrier',
        '1Z,UPS',
      ]);
      await expect(
        service.importFromCsv(MOCK_USER_ID, MOCK_DEAL_ID, buffer),
      ).rejects.toThrow(/participant/);
    });

    it('resolves participantId column directly and creates new rows', async () => {
      const buffer = buildCsv([
        'participantId,trackingNumber,carrier',
        'participant-1,1Z-A,UPS',
        'participant-2,1Z-B,FedEx',
      ]);
      mockPrismaService.perkDelivery.findFirst.mockResolvedValue(null);
      mockPrismaService.perkDelivery.create
        .mockResolvedValueOnce(buildRow({ id: 'pd-a' }))
        .mockResolvedValueOnce(buildRow({ id: 'pd-b', participantId: 'participant-2' }));

      const result = await service.importFromCsv(MOCK_USER_ID, MOCK_DEAL_ID, buffer);

      expect(result.imported).toBe(2);
      expect(mockPrismaService.perkDelivery.create).toHaveBeenCalledTimes(2);
      expect(result.rows[0].outcome).toBe('CREATED');
    });

    it('resolves email column case-insensitively', async () => {
      const buffer = buildCsv([
        'email,trackingNumber',
        'ALICE@example.com,1Z-A',
      ]);
      mockPrismaService.perkDelivery.findFirst.mockResolvedValue(null);
      mockPrismaService.perkDelivery.create.mockResolvedValue(buildRow({ id: 'pd-a' }));

      const result = await service.importFromCsv(MOCK_USER_ID, MOCK_DEAL_ID, buffer);

      expect(result.imported).toBe(1);
      expect(mockPrismaService.perkDelivery.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ participantId: 'participant-1' }),
        }),
      );
    });

    it('reports unknown participant references when skipErrors=true', async () => {
      const buffer = buildCsv([
        'email,trackingNumber',
        'alice@example.com,1Z-OK',
        'unknown@example.com,1Z-BAD',
      ]);
      mockPrismaService.perkDelivery.findFirst.mockResolvedValue(null);
      mockPrismaService.perkDelivery.create.mockResolvedValue(buildRow({ id: 'pd-a' }));

      const result = await service.importFromCsv(
        MOCK_USER_ID,
        MOCK_DEAL_ID,
        buffer,
        true,
      );

      expect(result.imported).toBe(1);
      expect(result.failed).toBe(1);
      const badRow = result.rows.find((r) => !r.success)!;
      expect(badRow.error).toMatch(/not found/);
    });

    it('upserts on (dealId, participantId) — updates when a row already exists', async () => {
      const buffer = buildCsv([
        'participantId,trackingNumber',
        'participant-1,1Z-UPDATED',
      ]);
      mockPrismaService.perkDelivery.findFirst.mockResolvedValue({ id: 'existing-pd' });
      mockPrismaService.perkDelivery.update.mockResolvedValue(buildRow({ id: 'existing-pd' }));

      const result = await service.importFromCsv(MOCK_USER_ID, MOCK_DEAL_ID, buffer);

      expect(mockPrismaService.perkDelivery.update).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.perkDelivery.create).not.toHaveBeenCalled();
      expect(result.rows[0].outcome).toBe('UPDATED');
    });

    it('auto-infers SHIPPED status when trackingNumber is present but status column is empty', async () => {
      const buffer = buildCsv([
        'participantId,trackingNumber',
        'participant-1,1Z-A',
      ]);
      mockPrismaService.perkDelivery.findFirst.mockResolvedValue(null);
      mockPrismaService.perkDelivery.create.mockResolvedValue(buildRow({ id: 'pd-a' }));

      await service.importFromCsv(MOCK_USER_ID, MOCK_DEAL_ID, buffer);

      const call = mockPrismaService.perkDelivery.create.mock.calls[0][0];
      expect(call.data.status).toBe('SHIPPED');
    });

    it('dryRun=true validates without persisting', async () => {
      const buffer = buildCsv([
        'participantId,trackingNumber',
        'participant-1,1Z',
      ]);

      const result = await service.importFromCsv(
        MOCK_USER_ID,
        MOCK_DEAL_ID,
        buffer,
        false,
        true,
      );

      expect(result.imported).toBe(0);
      expect(mockPrismaService.perkDelivery.create).not.toHaveBeenCalled();
      expect(mockPrismaService.perkDelivery.update).not.toHaveBeenCalled();
    });
  });
});

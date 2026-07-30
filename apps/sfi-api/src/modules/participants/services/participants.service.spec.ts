import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantBehavior } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import { DealsService } from '../../deals/services/deals.service';
import { ImportRowOutcomeDto, ParticipantBehaviorDto } from '../dto';

import { ParticipantsService } from './participants.service';

jest.mock('@prisma/client', () => ({
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  PrismaClient: class PrismaClient {
    static readonly __mock = true;
  },
  ParticipantBehavior: {
    FEE_DEDUCTION: 'FEE_DEDUCTION',
    RECOUPMENT: 'RECOUPMENT',
    NET_PROFIT_SHARE: 'NET_PROFIT_SHARE',
    FLAT_FEE: 'FLAT_FEE',
    PASS_THROUGH: 'PASS_THROUGH',
  },
  Prisma: {
    JsonNull: 'DbNull',
  },
}));

const MOCK_USER_ID = 'user-uuid-mock';
const MOCK_DEAL_ID = 'deal-uuid-mock';

// ---------- Mock helpers ----------

interface MockParticipantRow {
  id: string;
  dealId: string;
  name: string;
  roleName: string;
  behaviorType: string;
  email: string | null;
  externalId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

function buildParticipantRow(overrides: Partial<MockParticipantRow> = {}): MockParticipantRow {
  return {
    id: 'participant-uuid-1',
    dealId: MOCK_DEAL_ID,
    name: 'Test Participant',
    roleName: 'Investor',
    behaviorType: 'RECOUPMENT',
    email: null,
    externalId: null,
    metadata: null,
    createdAt: new Date('2026-05-20T00:00:00.000Z'),
    updatedAt: new Date('2026-05-20T00:00:00.000Z'),
    ...overrides,
  };
}

describe('ParticipantsService', () => {
  let service: ParticipantsService;

  const mockPrismaService = {
    participant: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockDealsService = {
    assertDealOwner: jest.fn().mockResolvedValue(undefined),
  };

  const mockAuditLogService = {
    create: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: DealsService, useValue: mockDealsService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    service = module.get<ParticipantsService>(ParticipantsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('persists optional investment fields inside metadata and surfaces them at the top level on response', async () => {
      mockPrismaService.participant.findFirst.mockResolvedValue(null);
      mockPrismaService.participant.create.mockResolvedValue(
        buildParticipantRow({
          metadata: { investmentAmount: 50000, units: 1000, pricePerUnit: 50, poolMember: true },
        }),
      );

      const result = await service.create(MOCK_USER_ID, MOCK_DEAL_ID, {
        name: 'Alice',
        roleName: 'Anchor Investor',
        behaviorType: ParticipantBehaviorDto.RECOUPMENT,
        email: 'alice@example.com',
        investmentAmount: 50000,
        units: 1000,
        pricePerUnit: 50,
        poolMember: true,
      });

      expect(mockPrismaService.participant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          dealId: MOCK_DEAL_ID,
          name: 'Alice',
          roleName: 'Anchor Investor',
          behaviorType: 'RECOUPMENT',
          metadata: expect.objectContaining({
            investmentAmount: 50000,
            units: 1000,
            pricePerUnit: 50,
            poolMember: true,
          }),
        }),
      });

      expect(result.investmentAmount).toBe(50000);
      expect(result.units).toBe(1000);
      expect(result.pricePerUnit).toBe(50);
      expect(result.poolMember).toBe(true);
      // metadata in the response should NOT duplicate the surfaced fields
      expect(result.metadata).toBeNull();
    });

    it('falls back to Prisma JsonNull when no metadata and no investment fields are provided', async () => {
      mockPrismaService.participant.findFirst.mockResolvedValue(null);
      mockPrismaService.participant.create.mockResolvedValue(buildParticipantRow());

      await service.create(MOCK_USER_ID, MOCK_DEAL_ID, {
        name: 'Bob',
        roleName: 'Operator',
        behaviorType: ParticipantBehaviorDto.FLAT_FEE,
      });

      expect(mockPrismaService.participant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ metadata: 'DbNull' }),
      });
    });

    it('upserts on (dealId, email) when the email already exists — updates instead of creating a duplicate, preserving existing custom metadata', async () => {
      const existing = buildParticipantRow({
        id: 'existing-uuid',
        email: 'alice@example.com',
        metadata: { customField: 'preserve-me', investmentAmount: 100 },
      });
      mockPrismaService.participant.findFirst.mockResolvedValue(existing);
      mockPrismaService.participant.update.mockResolvedValue(
        buildParticipantRow({
          id: 'existing-uuid',
          email: 'alice@example.com',
          metadata: { customField: 'preserve-me', investmentAmount: 500 },
        }),
      );

      await service.create(MOCK_USER_ID, MOCK_DEAL_ID, {
        name: 'Alice (updated)',
        roleName: 'Anchor Investor',
        behaviorType: ParticipantBehaviorDto.RECOUPMENT,
        email: 'alice@example.com',
        investmentAmount: 500,
      });

      expect(mockPrismaService.participant.create).not.toHaveBeenCalled();
      expect(mockPrismaService.participant.update).toHaveBeenCalledWith({
        where: { id: 'existing-uuid' },
        data: expect.objectContaining({
          // customField should be preserved alongside the new investmentAmount
          metadata: expect.objectContaining({
            customField: 'preserve-me',
            investmentAmount: 500,
          }),
        }),
      });
      expect(mockAuditLogService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATED' }),
      );
    });

    it('falls through to (dealId, externalId) when email is missing', async () => {
      const existing = buildParticipantRow({ id: 'existing-uuid', externalId: 'EXT-1' });
      // First findFirst call: no email lookup happens (email undefined) — so
      // the FIRST call is the externalId lookup.
      mockPrismaService.participant.findFirst.mockResolvedValueOnce(existing);
      mockPrismaService.participant.update.mockResolvedValue(existing);

      await service.create(MOCK_USER_ID, MOCK_DEAL_ID, {
        name: 'Alice',
        roleName: 'Investor',
        behaviorType: ParticipantBehaviorDto.RECOUPMENT,
        externalId: 'EXT-1',
      });

      expect(mockPrismaService.participant.findFirst).toHaveBeenCalledWith({
        where: { dealId: MOCK_DEAL_ID, externalId: 'EXT-1' },
      });
      expect(mockPrismaService.participant.create).not.toHaveBeenCalled();
    });

    it('upserts a pool member by name when matchByName is set (pool CSV re-import)', async () => {
      const existing = buildParticipantRow({ id: 'pool-1', name: 'Investor A' });
      mockPrismaService.participant.findFirst.mockResolvedValueOnce(existing);
      mockPrismaService.participant.update.mockResolvedValue(existing);

      await service.create(MOCK_USER_ID, MOCK_DEAL_ID, {
        name: 'Investor A',
        roleName: 'Investor',
        behaviorType: ParticipantBehaviorDto.RECOUPMENT,
        poolMember: true,
        matchByName: true,
        units: 40,
        investmentAmount: 20000,
      });

      expect(mockPrismaService.participant.findFirst).toHaveBeenCalledWith({
        where: {
          dealId: MOCK_DEAL_ID,
          name: { equals: 'Investor A', mode: 'insensitive' },
          metadata: { path: ['poolMember'], equals: true },
        },
      });
      expect(mockPrismaService.participant.update).toHaveBeenCalled();
      expect(mockPrismaService.participant.create).not.toHaveBeenCalled();
    });

    it('ignores matchByName when the row is not a pool member', async () => {
      mockPrismaService.participant.findFirst.mockResolvedValue(null);
      mockPrismaService.participant.create.mockResolvedValue(
        buildParticipantRow({ id: 'solo-1', name: 'Publisher' }),
      );

      await service.create(MOCK_USER_ID, MOCK_DEAL_ID, {
        name: 'Publisher',
        roleName: 'Publisher',
        behaviorType: ParticipantBehaviorDto.NET_PROFIT_SHARE,
        matchByName: true,
        poolMember: false,
      });

      // No name lookup at all: a non-pool upsert must not be able to absorb
      // an existing participant that merely shares a name.
      expect(mockPrismaService.participant.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.participant.create).toHaveBeenCalled();
    });
  });

  // ─── Bulk actions (Liang 07/27) ─────────────────────────────────────────────

  describe('removeMany', () => {
    it('deletes only rows belonging to the deal and reports the rest as skipped', async () => {
      const owned = [
        buildParticipantRow({ id: 'p-1', name: 'Investor A' }),
        buildParticipantRow({ id: 'p-2', name: 'Investor B' }),
      ];
      mockPrismaService.participant.findMany.mockResolvedValue(owned);
      mockPrismaService.participant.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.removeMany(MOCK_USER_ID, MOCK_DEAL_ID, [
        'p-1',
        'p-2',
        'other-deal-row',
      ]);

      expect(result.affected).toBe(2);
      expect(result.skipped).toEqual(['other-deal-row']);
      expect(mockPrismaService.participant.deleteMany).toHaveBeenCalledWith({
        where: { dealId: MOCK_DEAL_ID, id: { in: ['p-1', 'p-2'] } },
      });
      // One audit row per deletion, not one for the batch.
      expect(mockAuditLogService.create).toHaveBeenCalledTimes(2);
    });

    it('is a no-op when none of the ids belong to the deal', async () => {
      mockPrismaService.participant.findMany.mockResolvedValue([]);

      const result = await service.removeMany(MOCK_USER_ID, MOCK_DEAL_ID, ['nope']);

      expect(result).toEqual({ affected: 0, skipped: ['nope'] });
      expect(mockPrismaService.participant.deleteMany).not.toHaveBeenCalled();
      expect(mockAuditLogService.create).not.toHaveBeenCalled();
    });
  });

  describe('updateBehaviorMany', () => {
    it('applies the behavior to owned rows and audits the before / after value', async () => {
      const owned = [
        buildParticipantRow({ id: 'p-1', behaviorType: ParticipantBehavior.RECOUPMENT }),
      ];
      mockPrismaService.participant.findMany.mockResolvedValue(owned);
      mockPrismaService.participant.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.updateBehaviorMany(
        MOCK_USER_ID,
        MOCK_DEAL_ID,
        ['p-1'],
        ParticipantBehavior.NET_PROFIT_SHARE,
      );

      expect(result.affected).toBe(1);
      expect(mockPrismaService.participant.updateMany).toHaveBeenCalledWith({
        where: { dealId: MOCK_DEAL_ID, id: { in: ['p-1'] } },
        data: { behaviorType: ParticipantBehavior.NET_PROFIT_SHARE },
      });
      expect(mockAuditLogService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATED',
          metadata: expect.objectContaining({
            behaviorTypeBefore: ParticipantBehavior.RECOUPMENT,
            behaviorTypeAfter: ParticipantBehavior.NET_PROFIT_SHARE,
          }),
        }),
      );
    });
  });

  // ─── findOne / update / remove ──────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the participant when found and the caller owns the deal', async () => {
      const row = buildParticipantRow({ id: 'p-1', name: 'Alice' });
      mockPrismaService.participant.findUnique.mockResolvedValue(row);

      const result = await service.findOne(MOCK_USER_ID, 'p-1');

      expect(result.name).toBe('Alice');
      expect(mockDealsService.assertDealOwner).toHaveBeenCalledWith(MOCK_DEAL_ID, MOCK_USER_ID);
    });

    it('throws NotFoundException when the participant does not exist', async () => {
      mockPrismaService.participant.findUnique.mockResolvedValue(null);

      await expect(service.findOne(MOCK_USER_ID, 'missing')).rejects.toThrow(NotFoundException);
      expect(mockDealsService.assertDealOwner).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('writes only the keys present in the DTO and merges investment fields into existing metadata', async () => {
      mockPrismaService.participant.findUnique.mockResolvedValue(
        buildParticipantRow({
          id: 'p-1',
          name: 'Old name',
          metadata: { customNote: 'preserve me', investmentAmount: 1000 },
        }),
      );
      mockPrismaService.participant.update.mockResolvedValue(
        buildParticipantRow({
          id: 'p-1',
          name: 'New name',
          metadata: { customNote: 'preserve me', investmentAmount: 5000, units: 50 },
        }),
      );

      const result = await service.update(MOCK_USER_ID, 'p-1', {
        name: 'New name',
        investmentAmount: 5000,
        units: 50,
      });

      const call = mockPrismaService.participant.update.mock.calls[0][0];
      expect(call.where).toEqual({ id: 'p-1' });
      expect(call.data.name).toBe('New name');
      // Unspecified DTO fields (roleName / behaviorType / email / externalId) NOT
      // forwarded to the update.
      expect(call.data.roleName).toBeUndefined();
      expect(call.data.behaviorType).toBeUndefined();
      // Investment merge: customNote preserved, investmentAmount overwritten,
      // units added.
      expect(call.data.metadata).toEqual({
        customNote: 'preserve me',
        investmentAmount: 5000,
        units: 50,
      });
      expect(mockAuditLogService.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATED', entityType: 'Participant', entityId: 'p-1' }),
      );
      expect(result.name).toBe('New name');
    });

    it('throws NotFoundException when the participant does not exist', async () => {
      mockPrismaService.participant.findUnique.mockResolvedValue(null);

      await expect(
        service.update(MOCK_USER_ID, 'missing', { name: 'New name' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.participant.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('hard-deletes the participant and writes a DELETED audit entry with identifying fields', async () => {
      mockPrismaService.participant.findUnique.mockResolvedValue(
        buildParticipantRow({
          id: 'p-1',
          name: 'Alice',
          roleName: 'Investor',
          email: 'alice@example.com',
          behaviorType: 'RECOUPMENT',
        }),
      );
      mockPrismaService.participant.delete.mockResolvedValue({ id: 'p-1' });

      await service.remove(MOCK_USER_ID, 'p-1');

      expect(mockPrismaService.participant.delete).toHaveBeenCalledWith({ where: { id: 'p-1' } });
      expect(mockAuditLogService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETED',
          entityType: 'Participant',
          entityId: 'p-1',
          metadata: expect.objectContaining({
            name: 'Alice',
            roleName: 'Investor',
            email: 'alice@example.com',
            behaviorType: 'RECOUPMENT',
          }),
        }),
      );
    });

    it('throws NotFoundException when the participant does not exist', async () => {
      mockPrismaService.participant.findUnique.mockResolvedValue(null);

      await expect(service.remove(MOCK_USER_ID, 'missing')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.participant.delete).not.toHaveBeenCalled();
    });
  });

  // ─── importFromCsv ──────────────────────────────────────────────────────────

  describe('importFromCsv', () => {
    /**
     * Run the importer against a fake `$transaction` that supports the
     * tx-as-callback style we use in production code. The transaction
     * receives a thin proxy whose `participant.findFirst`, `update`, and
     * `create` are jest.fn() — so individual tests can stage results.
     */
    function stageTransaction(
      ops: {
        findFirst?: jest.Mock;
        update?: jest.Mock;
        create?: jest.Mock;
      } = {},
    ) {
      const tx = {
        participant: {
          findFirst: ops.findFirst ?? jest.fn().mockResolvedValue(null),
          update: ops.update ?? jest.fn(),
          create:
            ops.create ??
            jest.fn().mockImplementation(({ data }) =>
              Promise.resolve(
                buildParticipantRow({
                  id: `created-${Math.random().toString(36).slice(2, 8)}`,
                  name: data.name,
                  roleName: data.roleName,
                  behaviorType: data.behaviorType,
                  email: data.email ?? null,
                  externalId: data.externalId ?? null,
                  metadata: data.metadata === 'DbNull' ? null : data.metadata,
                }),
              ),
            ),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (cb) => cb(tx));
      return tx;
    }

    it('accepts the legacy 5-column header and creates all rows with no investment metadata', async () => {
      const tx = stageTransaction();

      const csv = [
        'name,roleName,behaviorType,email,externalId',
        'Alice,Investor,RECOUPMENT,alice@example.com,EXT-1',
        'Bob,Operator,FLAT_FEE,,EXT-2',
      ].join('\r\n');

      const result = await service.importFromCsv(MOCK_USER_ID, MOCK_DEAL_ID, Buffer.from(csv), true);

      expect(result.imported).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.rows).toHaveLength(2);
      expect(result.rows.every((r) => r.outcome === ImportRowOutcomeDto.CREATED)).toBe(true);
      expect(tx.participant.create).toHaveBeenCalledTimes(2);

      // Legacy header → no investment fields stored
      const firstCall = tx.participant.create.mock.calls[0][0].data;
      expect(firstCall.metadata).toBe('DbNull');
    });

    it('accepts the 9-column header and parses investment fields into metadata', async () => {
      const tx = stageTransaction();

      const csv = [
        'name,roleName,behaviorType,email,externalId,investmentAmount,units,pricePerUnit,poolMember',
        'Alice,Investor,RECOUPMENT,alice@example.com,EXT-1,50000,1000,50,true',
      ].join('\r\n');

      const result = await service.importFromCsv(MOCK_USER_ID, MOCK_DEAL_ID, Buffer.from(csv), true);

      expect(result.rows[0].outcome).toBe(ImportRowOutcomeDto.CREATED);
      expect(result.rows[0].warnings).toBeUndefined();

      const created = tx.participant.create.mock.calls[0][0].data;
      expect(created.metadata).toEqual({
        investmentAmount: 50000,
        units: 1000,
        pricePerUnit: 50,
        poolMember: true,
      });
    });

    it('rejects an unknown header shape with BadRequestException', async () => {
      stageTransaction();
      const csv = ['foo,bar,baz', 'a,b,c'].join('\r\n');

      await expect(
        service.importFromCsv(MOCK_USER_ID, MOCK_DEAL_ID, Buffer.from(csv), true),
      ).rejects.toThrow(BadRequestException);
    });

    it('soft-validates bad numeric/boolean fields — row imports with warnings rather than failing', async () => {
      const tx = stageTransaction();

      // Use FLAT_FEE here (not RECOUPMENT) so the row is only producing the
      // 4 parse-failure warnings — the RECOUPMENT-without-investmentAmount
      // warning is covered by its own dedicated test below.
      const csv = [
        'name,roleName,behaviorType,email,externalId,investmentAmount,units,pricePerUnit,poolMember',
        'Alice,Investor,FLAT_FEE,alice@example.com,EXT-1,not-a-number,-1,abc,maybe',
      ].join('\r\n');

      const result = await service.importFromCsv(MOCK_USER_ID, MOCK_DEAL_ID, Buffer.from(csv), true);

      expect(result.imported).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.rows[0].outcome).toBe(ImportRowOutcomeDto.CREATED);
      expect(result.rows[0].warnings).toBeDefined();
      expect(result.rows[0].warnings).toHaveLength(4);

      // None of the bad fields should be persisted
      const created = tx.participant.create.mock.calls[0][0].data;
      expect(created.metadata).toBe('DbNull');
    });

    it('upserts on (dealId, email) when a matching row already exists — outcome is updated', async () => {
      const existing = buildParticipantRow({
        id: 'existing-uuid',
        email: 'alice@example.com',
        name: 'Alice Old',
      });

      const findFirst = jest.fn().mockResolvedValue(existing);
      const update = jest.fn().mockResolvedValue(
        buildParticipantRow({ id: 'existing-uuid', email: 'alice@example.com', name: 'Alice New' }),
      );
      const create = jest.fn();

      stageTransaction({ findFirst, update, create });

      const csv = [
        'name,roleName,behaviorType,email,externalId',
        'Alice New,Investor,RECOUPMENT,alice@example.com,',
      ].join('\r\n');

      const result = await service.importFromCsv(MOCK_USER_ID, MOCK_DEAL_ID, Buffer.from(csv), true);

      expect(result.rows[0].outcome).toBe(ImportRowOutcomeDto.UPDATED);
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'existing-uuid' } }),
      );
      expect(create).not.toHaveBeenCalled();
    });

    it('falls back to (dealId, externalId) when email is blank but externalId matches an existing row', async () => {
      const existing = buildParticipantRow({ id: 'existing-uuid', externalId: 'EXT-1' });

      const findFirst = jest
        .fn()
        // First call uses email which is blank → not called; the service skips to externalId
        .mockResolvedValueOnce(existing);

      const update = jest.fn().mockResolvedValue(existing);

      stageTransaction({ findFirst, update });

      const csv = [
        'name,roleName,behaviorType,email,externalId',
        'Alice,Investor,RECOUPMENT,,EXT-1',
      ].join('\r\n');

      const result = await service.importFromCsv(MOCK_USER_ID, MOCK_DEAL_ID, Buffer.from(csv), true);

      expect(result.rows[0].outcome).toBe(ImportRowOutcomeDto.UPDATED);
      expect(findFirst).toHaveBeenCalledWith({
        where: { dealId: MOCK_DEAL_ID, externalId: 'EXT-1' },
      });
    });

    it('with skipErrors=true, reports hard-failed rows as outcome=skipped without aborting valid rows', async () => {
      stageTransaction();

      const csv = [
        'name,roleName,behaviorType,email,externalId',
        ',Investor,RECOUPMENT,,', // row 1 — missing name
        'Bob,Operator,FLAT_FEE,bob@example.com,', // row 2 — valid
      ].join('\r\n');

      const result = await service.importFromCsv(MOCK_USER_ID, MOCK_DEAL_ID, Buffer.from(csv), true);

      expect(result.imported).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.rows[0].outcome).toBe(ImportRowOutcomeDto.SKIPPED);
      expect(result.rows[0].success).toBe(false);
      expect(result.rows[0].error).toMatch(/name is required/i);
      expect(result.rows[1].outcome).toBe(ImportRowOutcomeDto.CREATED);
    });

    it('auto-infers poolMember=true when units > 0 and the poolMember column is blank', async () => {
      const tx = stageTransaction();

      const csv = [
        'name,roleName,behaviorType,email,externalId,investmentAmount,units,pricePerUnit,poolMember',
        'Alice,Investor,RECOUPMENT,alice@example.com,EXT-1,50000,1000,50,',
      ].join('\r\n');

      const result = await service.importFromCsv(MOCK_USER_ID, MOCK_DEAL_ID, Buffer.from(csv), true);

      expect(result.rows[0].outcome).toBe(ImportRowOutcomeDto.CREATED);
      const created = tx.participant.create.mock.calls[0][0].data;
      expect(created.metadata).toEqual(
        expect.objectContaining({ units: 1000, poolMember: true }),
      );
    });

    it('does NOT override an explicit poolMember=false even when units > 0', async () => {
      const tx = stageTransaction();

      const csv = [
        'name,roleName,behaviorType,email,externalId,investmentAmount,units,pricePerUnit,poolMember',
        'Alice,Investor,RECOUPMENT,alice@example.com,EXT-1,50000,1000,50,false',
      ].join('\r\n');

      await service.importFromCsv(MOCK_USER_ID, MOCK_DEAL_ID, Buffer.from(csv), true);

      const created = tx.participant.create.mock.calls[0][0].data;
      expect(created.metadata).toEqual(
        expect.objectContaining({ units: 1000, poolMember: false }),
      );
    });

    it('emits a soft warning when a RECOUPMENT row is missing investmentAmount (Round 2.1 f3/f4)', async () => {
      stageTransaction();

      const csv = [
        'name,roleName,behaviorType,email,externalId,investmentAmount,units,pricePerUnit,poolMember',
        'Alice,Investor,RECOUPMENT,alice@example.com,EXT-1,,,,',
      ].join('\r\n');

      const result = await service.importFromCsv(MOCK_USER_ID, MOCK_DEAL_ID, Buffer.from(csv), true);

      expect(result.rows[0].success).toBe(true);
      expect(result.rows[0].outcome).toBe(ImportRowOutcomeDto.CREATED);
      expect(result.rows[0].warnings).toBeDefined();
      expect(result.rows[0].warnings!.some((w) => /RECOUPMENT/i.test(w))).toBe(true);
    });

    it('does NOT emit a RECOUPMENT warning for non-RECOUPMENT behaviors that omit investmentAmount', async () => {
      stageTransaction();

      const csv = [
        'name,roleName,behaviorType,email,externalId,investmentAmount,units,pricePerUnit,poolMember',
        'Bob,Operator,FLAT_FEE,bob@example.com,,,,,',
      ].join('\r\n');

      const result = await service.importFromCsv(MOCK_USER_ID, MOCK_DEAL_ID, Buffer.from(csv), true);

      expect(result.rows[0].warnings).toBeUndefined();
    });

    it('on update, preserves existing custom metadata while merging new investment fields', async () => {
      const existing = buildParticipantRow({
        id: 'existing-uuid',
        email: 'alice@example.com',
        metadata: { customNotes: 'VIP investor', investmentAmount: 100 },
      });

      const findFirst = jest.fn().mockResolvedValue(existing);
      const update = jest.fn().mockImplementation(({ data }) =>
        Promise.resolve(buildParticipantRow({ id: 'existing-uuid', metadata: data.metadata })),
      );
      stageTransaction({ findFirst, update });

      const csv = [
        'name,roleName,behaviorType,email,externalId,investmentAmount,units,pricePerUnit,poolMember',
        'Alice (updated),Investor,RECOUPMENT,alice@example.com,,500,,,',
      ].join('\r\n');

      await service.importFromCsv(MOCK_USER_ID, MOCK_DEAL_ID, Buffer.from(csv), true);

      const updatedData = update.mock.calls[0][0].data;
      expect(updatedData.metadata).toEqual(
        expect.objectContaining({
          customNotes: 'VIP investor', // preserved
          investmentAmount: 500, // overwritten by CSV
        }),
      );
    });

    it('with skipErrors=false (default), throws on the first hard-failed row', async () => {
      stageTransaction();

      const csv = [
        'name,roleName,behaviorType,email,externalId',
        'Alice,Investor,NOT_A_BEHAVIOR,,', // bad behaviorType
      ].join('\r\n');

      await expect(
        service.importFromCsv(MOCK_USER_ID, MOCK_DEAL_ID, Buffer.from(csv)),
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts the 8-column header without externalId and parses investment fields into metadata', async () => {
      const tx = stageTransaction();

      const csv = [
        'name,roleName,behaviorType,email,investmentAmount,units,pricePerUnit,poolMember',
        'Alice,Investor,RECOUPMENT,alice@example.com,50000,1000,50,true',
      ].join('\r\n');

      const result = await service.importFromCsv(MOCK_USER_ID, MOCK_DEAL_ID, Buffer.from(csv), true);

      expect(result.rows[0].outcome).toBe(ImportRowOutcomeDto.CREATED);
      const created = tx.participant.create.mock.calls[0][0].data;
      expect(created.externalId).toBeUndefined();
      expect(created.metadata).toEqual({
        investmentAmount: 50000,
        units: 1000,
        pricePerUnit: 50,
        poolMember: true,
      });
    });

    it('rejects a header that is the right column count but a different shape (between variants)', async () => {
      stageTransaction();

      const csv = [
        // 7 cols, doesn't match any of the 3 variants
        'name,roleName,behaviorType,email,units,pricePerUnit,poolMember',
        'Alice,Investor,RECOUPMENT,alice@example.com,1000,50,true',
      ].join('\r\n');

      await expect(
        service.importFromCsv(MOCK_USER_ID, MOCK_DEAL_ID, Buffer.from(csv)),
      ).rejects.toThrow(BadRequestException);
    });

    it('with dryRun=true, parses + validates without writing to the DB; valid rows come back as skipped with parsed participant data attached', async () => {
      const tx = stageTransaction();

      const csv = [
        'name,roleName,behaviorType,email,investmentAmount,units,pricePerUnit,poolMember',
        'Alice,Investor,RECOUPMENT,alice@example.com,5000,50,100,true',
        'Bob,Investor,RECOUPMENT,bob@example.com,10000,100,100,true',
      ].join('\r\n');

      const result = await service.importFromCsv(
        MOCK_USER_ID,
        MOCK_DEAL_ID,
        Buffer.from(csv),
        true, // skipErrors
        true, // dryRun
      );

      // No DB writes
      expect(tx.participant.create).not.toHaveBeenCalled();
      expect(tx.participant.update).not.toHaveBeenCalled();
      // Imported count is 0 in dry-run mode
      expect(result.imported).toBe(0);
      // Valid rows surface as `skipped` (nothing persisted)
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].success).toBe(true);
      expect(result.rows[0].outcome).toBe(ImportRowOutcomeDto.SKIPPED);
      expect(result.rows[1].outcome).toBe(ImportRowOutcomeDto.SKIPPED);

      // Synthetic participant payload is attached so the FE Preview table
      // can render row content (name / behavior / email / investment).
      expect(result.rows[0].participant).toEqual(
        expect.objectContaining({
          name: 'Alice',
          roleName: 'Investor',
          behaviorType: 'RECOUPMENT',
          email: 'alice@example.com',
          investmentAmount: 5000,
          units: 50,
          pricePerUnit: 100,
          poolMember: true,
        }),
      );
      expect(result.rows[1].participant).toEqual(
        expect.objectContaining({
          name: 'Bob',
          email: 'bob@example.com',
          investmentAmount: 10000,
        }),
      );
    });

    it('with dryRun=true, hard-failed rows keep their parse error and skipped outcome', async () => {
      const tx = stageTransaction();

      const csv = [
        'name,roleName,behaviorType,email,externalId',
        'Alice,Investor,RECOUPMENT,alice@example.com,',
        'Bob,Investor,NOT_A_BEHAVIOR,bob@example.com,', // bad behaviorType
      ].join('\r\n');

      const result = await service.importFromCsv(
        MOCK_USER_ID,
        MOCK_DEAL_ID,
        Buffer.from(csv),
        true, // skipErrors so the bad row doesn't abort
        true, // dryRun
      );

      expect(tx.participant.create).not.toHaveBeenCalled();
      expect(result.imported).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.rows[0]).toMatchObject({ success: true, outcome: ImportRowOutcomeDto.SKIPPED });
      expect(result.rows[1]).toMatchObject({
        success: false,
        outcome: ImportRowOutcomeDto.SKIPPED,
        error: expect.stringContaining('behaviorType must be one of'),
      });
    });

    it('hard-failed rows still surface whatever raw column data was extractable (so the FE preview can render partial rows)', async () => {
      stageTransaction();

      const csv = [
        'name,roleName,behaviorType,email,investmentAmount,units,pricePerUnit,poolMember',
        ',Investor,RECOUPMENT,sam@example.com,,,,', // missing name, fails
        'Alice,Investor,RECOUPMENT,alice@example.com,5000,50,100,true', // valid (anchor row)
        'Bob,Investor,NOT_A_BEHAVIOR,bob@example.com,5000,50,100,true', // bad behavior, fails but other data present
      ].join('\r\n');

      const result = await service.importFromCsv(
        MOCK_USER_ID,
        MOCK_DEAL_ID,
        Buffer.from(csv),
        true, // skipErrors so all rows surface in the response
        true, // dryRun
      );

      // Row 1: missing name. Email + role still extractable.
      expect(result.rows[0]).toMatchObject({
        success: false,
        outcome: ImportRowOutcomeDto.SKIPPED,
        error: 'name is required',
        participant: expect.objectContaining({
          name: '',
          roleName: 'Investor',
          behaviorType: 'RECOUPMENT', // valid enum, so preserved
          email: 'sam@example.com',
        }),
      });

      // Row 2 is the valid anchor.
      expect(result.rows[1]).toMatchObject({
        success: true,
        outcome: ImportRowOutcomeDto.SKIPPED,
        participant: expect.objectContaining({ name: 'Alice' }),
      });

      // Row 3: bad behaviorType. Name + investment fields still extractable.
      // Invalid behavior comes back as null so the FE renders "N/A" instead
      // of crashing the badge lookup.
      expect(result.rows[2]).toMatchObject({
        success: false,
        outcome: ImportRowOutcomeDto.SKIPPED,
        error: expect.stringContaining('behaviorType must be one of'),
        participant: expect.objectContaining({
          name: 'Bob',
          roleName: 'Investor',
          behaviorType: null,
          email: 'bob@example.com',
          investmentAmount: 5000,
          units: 50,
          pricePerUnit: 100,
          poolMember: true,
        }),
      });
    });
  });

  // ─── exportToCsv ────────────────────────────────────────────────────────────

  describe('exportToCsv', () => {
    it('emits the 9-column header and serializes investment metadata back into columns', async () => {
      mockPrismaService.participant.findMany.mockResolvedValue([
        buildParticipantRow({
          name: 'Alice',
          email: 'alice@example.com',
          externalId: 'EXT-1',
          metadata: { investmentAmount: 50000, units: 1000, pricePerUnit: 50, poolMember: true },
        }),
        buildParticipantRow({
          id: 'p-2',
          name: 'Bob',
          email: null,
          externalId: 'EXT-2',
          metadata: null,
        }),
      ]);

      const csv = await service.exportToCsv(MOCK_USER_ID, MOCK_DEAL_ID);
      const lines = csv.split('\r\n');

      expect(lines[0]).toBe(
        'name,roleName,behaviorType,email,externalId,investmentAmount,units,pricePerUnit,poolMember',
      );
      expect(lines[1]).toBe('Alice,Investor,RECOUPMENT,alice@example.com,EXT-1,50000,1000,50,true');
      expect(lines[2]).toBe('Bob,Investor,RECOUPMENT,,EXT-2,,,,');
    });
  });
});

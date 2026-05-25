import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

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

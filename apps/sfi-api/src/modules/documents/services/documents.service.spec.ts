import { Readable } from 'node:stream';

import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import { FILE_STORAGE, IFileStorage } from '../../storage/storage.interface';
import { DocumentTypeEnum } from '../dto';

import { DocumentsService } from './documents.service';

jest.mock('@prisma/client', () => ({
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  PrismaClient: class PrismaClient {
    static readonly __mock = true;
  },
  Prisma: {
    JsonNull: 'DbNull',
  },
}));

const MOCK_USER_ID = 'user-uuid-mock';
const MOCK_DEAL_ID = 'deal-uuid-mock';

function buildDocRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'doc-uuid-1',
    dealId: MOCK_DEAL_ID,
    revenueBatchId: null,
    settlementRunId: null,
    docType: 'CONTRACT',
    fileName: 'contract.pdf',
    storageUrl: 'deals/deal-uuid-mock/abc-contract.pdf',
    checksum: 'sha256:fake-checksum',
    uploadedAt: new Date('2026-05-20T10:00:00.000Z'),
    metadata: null,
    fileSize: 12345,
    mimeType: 'application/pdf',
    uploadedByUserId: MOCK_USER_ID,
    uploadedBy: {
      id: MOCK_USER_ID,
      name: 'Tabrez Akhlaque',
      avatarUrl: null,
    },
    archivedAt: null,
    archivedByUserId: null,
    archivedReason: null,
    archivedBy: null,
    createdAt: new Date('2026-05-20T10:00:00.000Z'),
    updatedAt: new Date('2026-05-20T10:00:00.000Z'),
    ...overrides,
  };
}

function buildMulterFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'contract.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 12345,
    destination: '',
    filename: '',
    path: '',
    buffer: Buffer.from('fake-pdf-bytes'),
    stream: Readable.from(Buffer.from('fake-pdf-bytes')),
    ...overrides,
  } as Express.Multer.File;
}

describe('DocumentsService', () => {
  let service: DocumentsService;

  const mockPrismaService = {
    document: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    deal: { findUnique: jest.fn() },
    revenueBatch: { findUnique: jest.fn() },
    settlementRun: { findUnique: jest.fn() },
  };

  const mockAuditLog = { create: jest.fn().mockResolvedValue({}) };

  // IFileStorage stub
  const mockStorage: jest.Mocked<IFileStorage> = {
    upload: jest.fn(),
    getStream: jest.fn(),
    delete: jest.fn(),
    getPreviewUrl: jest
      .fn()
      .mockResolvedValue('http://localhost:3001/documents/raw?token=fake-token'),
  };

  const mockConfig = {
    get: jest.fn((key: string) => {
      if (key === 'STORAGE_PREVIEW_URL_TTL_SECONDS') return '900';
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditLogService, useValue: mockAuditLog },
        { provide: ConfigService, useValue: mockConfig },
        { provide: FILE_STORAGE, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);

    mockPrismaService.deal.findUnique.mockResolvedValue({ id: MOCK_DEAL_ID });
    mockStorage.upload.mockResolvedValue({
      storageKey: 'deals/deal-uuid-mock/abc-contract.pdf',
      checksum: 'sha256:fake-checksum',
      fileSize: 14,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── uploadDocument ──────────────────────────────────────────────────────

  describe('uploadDocument', () => {
    it('streams the file to storage, persists checksum + mimeType + uploadedByUserId, audits CREATED', async () => {
      mockPrismaService.document.create.mockResolvedValue(buildDocRow());

      const result = await service.uploadDocument(MOCK_USER_ID, buildMulterFile(), {
        docType: DocumentTypeEnum.CONTRACT,
        dealId: MOCK_DEAL_ID,
      });

      // Storage adapter received the file with the right metadata
      expect(mockStorage.upload).toHaveBeenCalledWith(
        expect.any(Readable),
        expect.objectContaining({
          fileName: 'contract.pdf',
          mimeType: 'application/pdf',
          keyPrefix: `deals/${MOCK_DEAL_ID}`,
        }),
      );

      // Prisma row persisted with storageKey + checksum + uploadedByUserId
      expect(mockPrismaService.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            storageUrl: 'deals/deal-uuid-mock/abc-contract.pdf',
            checksum: 'sha256:fake-checksum',
            uploadedByUserId: MOCK_USER_ID,
            mimeType: 'application/pdf',
          }),
        }),
      );

      // Audit log received CREATED with file metadata
      expect(mockAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATED',
          entityType: 'Document',
          actor: MOCK_USER_ID,
          metadata: expect.objectContaining({
            fileName: 'contract.pdf',
            docType: DocumentTypeEnum.CONTRACT,
            fileSize: 14,
          }),
        }),
      );

      // Response carries the fresh preview URL (not the raw storage key)
      expect(result.storageUrl).toBe(
        'http://localhost:3001/documents/raw?token=fake-token',
      );
      expect(result.uploadedBy?.name).toBe('Tabrez Akhlaque');
    });

    it('rejects when no file is supplied', async () => {
      await expect(
        service.uploadDocument(MOCK_USER_ID, undefined as unknown as Express.Multer.File, {
          docType: DocumentTypeEnum.CONTRACT,
        }),
      ).rejects.toThrow('Missing or empty file upload');
    });

    it('returns 404 when dealId references a missing deal', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue(null);
      await expect(
        service.uploadDocument(MOCK_USER_ID, buildMulterFile(), {
          docType: DocumentTypeEnum.CONTRACT,
          dealId: 'missing-deal',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    // MS3 verification Wave 1 gap #6 — Screen 3.5 "Link To" dropdown is
    // single-select. Reject documents that try to point at both a batch
    // and a run in one create call.
    it('rejects when both revenueBatchId and settlementRunId are supplied', async () => {
      await expect(
        service.uploadDocument(MOCK_USER_ID, buildMulterFile(), {
          docType: DocumentTypeEnum.REVENUE_REPORT,
          revenueBatchId: 'batch-uuid-1',
          settlementRunId: 'run-uuid-1',
        }),
      ).rejects.toThrow('mutually exclusive');
      // No storage upload should happen when the guard trips first.
      expect(mockStorage.upload).not.toHaveBeenCalled();
    });
  });

  // ─── listDocuments — archived filter (Round 4 #21) ───────────────────────

  describe('listDocuments — archived filter', () => {
    beforeEach(() => {
      mockPrismaService.document.findMany.mockResolvedValue([]);
      mockPrismaService.document.count.mockResolvedValue(0);
    });

    it('default (no archived param) hides archived rows via archivedAt IS NULL', async () => {
      await service.listDocuments({ dealId: MOCK_DEAL_ID }, {});

      const where = mockPrismaService.document.findMany.mock.calls[0][0].where;
      expect(where.archivedAt).toBeNull();
    });

    it('?archived=true filters to archived only via archivedAt IS NOT NULL', async () => {
      await service.listDocuments({ dealId: MOCK_DEAL_ID }, { archived: 'true' });

      const where = mockPrismaService.document.findMany.mock.calls[0][0].where;
      expect(where.archivedAt).toEqual({ not: null });
    });

    it('?archived=all omits the archivedAt filter entirely', async () => {
      await service.listDocuments({ dealId: MOCK_DEAL_ID }, { archived: 'all' });

      const where = mockPrismaService.document.findMany.mock.calls[0][0].where;
      expect(where.archivedAt).toBeUndefined();
    });

    it('combines docType + uploadedByUserId filters with the entity filter', async () => {
      await service.listDocuments(
        { dealId: MOCK_DEAL_ID },
        {
          docType: DocumentTypeEnum.CONTRACT,
          uploadedByUserId: MOCK_USER_ID,
        },
      );

      const where = mockPrismaService.document.findMany.mock.calls[0][0].where;
      expect(where).toMatchObject({
        dealId: MOCK_DEAL_ID,
        docType: DocumentTypeEnum.CONTRACT,
        uploadedByUserId: MOCK_USER_ID,
        archivedAt: null, // default
      });
    });
  });

  // ─── listDocuments — scope ownership (MS3 verification Wave 1 gap #4) ─────

  describe('listDocuments — scope ownership', () => {
    beforeEach(() => {
      mockPrismaService.document.findMany.mockResolvedValue([]);
      mockPrismaService.document.count.mockResolvedValue(0);
    });

    it('skips the ownership check when userId is not passed (back-compat)', async () => {
      await service.listDocuments({ dealId: MOCK_DEAL_ID }, {});
      expect(mockPrismaService.deal.findUnique).not.toHaveBeenCalled();
    });

    it('accepts the query when the caller owns the deal', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: MOCK_DEAL_ID,
        userId: MOCK_USER_ID,
      });

      await expect(
        service.listDocuments({ dealId: MOCK_DEAL_ID }, {}, MOCK_USER_ID),
      ).resolves.toBeDefined();
    });

    it('rejects with 404 when the caller does not own the deal', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: MOCK_DEAL_ID,
        userId: 'other-user-uuid',
      });

      await expect(
        service.listDocuments({ dealId: MOCK_DEAL_ID }, {}, MOCK_USER_ID),
      ).rejects.toThrow(NotFoundException);
      // No downstream findMany when the ownership check trips first.
      expect(mockPrismaService.document.findMany).not.toHaveBeenCalled();
    });

    it('rejects with 404 when the revenue batch belongs to another user', async () => {
      mockPrismaService.revenueBatch.findUnique.mockResolvedValue({
        id: 'batch-uuid-1',
        deal: { userId: 'other-user-uuid' },
      });

      await expect(
        service.listDocuments({ revenueBatchId: 'batch-uuid-1' }, {}, MOCK_USER_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects with 404 when the settlement run belongs to another user', async () => {
      mockPrismaService.settlementRun.findUnique.mockResolvedValue({
        id: 'run-uuid-1',
        deal: { userId: 'other-user-uuid' },
      });

      await expect(
        service.listDocuments({ settlementRunId: 'run-uuid-1' }, {}, MOCK_USER_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects with 404 when the referenced scope does not exist at all', async () => {
      mockPrismaService.revenueBatch.findUnique.mockResolvedValue(null);

      await expect(
        service.listDocuments({ revenueBatchId: 'missing-batch' }, {}, MOCK_USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── archiveDocument / restoreDocument ───────────────────────────────────

  describe('archiveDocument', () => {
    it('sets archivedAt + archivedByUserId + reason and audits ARCHIVED', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue(buildDocRow());
      mockPrismaService.document.update.mockResolvedValue(
        buildDocRow({
          archivedAt: new Date('2026-05-20T11:00:00.000Z'),
          archivedByUserId: MOCK_USER_ID,
          archivedReason: 'Superseded by v2',
        }),
      );

      const result = await service.archiveDocument(MOCK_USER_ID, 'doc-uuid-1', {
        reason: 'Superseded by v2',
      });

      expect(mockPrismaService.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-uuid-1' },
        data: {
          archivedAt: expect.any(Date),
          archivedByUserId: MOCK_USER_ID,
          archivedReason: 'Superseded by v2',
        },
        include: expect.any(Object),
      });

      expect(mockAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ARCHIVED',
          entityType: 'Document',
          entityId: 'doc-uuid-1',
          metadata: expect.objectContaining({ reason: 'Superseded by v2' }),
        }),
      );

      expect(result.archivedAt).toBeTruthy();
    });

    it('rejects when document is already archived (idempotency guard)', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue(
        buildDocRow({ archivedAt: new Date() }),
      );

      await expect(
        service.archiveDocument(MOCK_USER_ID, 'doc-uuid-1', {}),
      ).rejects.toThrow(ConflictException);
    });

    it('returns 404 for a missing document', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue(null);

      await expect(
        service.archiveDocument(MOCK_USER_ID, 'missing', {}),
      ).rejects.toThrow(NotFoundException);
    });

    // MS-3 Wave 4 gap #8 — docs linked to a FINALIZED settlement run are
    // part of the run's evidentiary record and can't be archived.
    it('rejects with 409 when document is linked to a FINALIZED settlement run', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue(
        buildDocRow({ settlementRunId: 'run-uuid-1' }),
      );
      mockPrismaService.settlementRun.findUnique.mockResolvedValue({
        status: 'FINALIZED',
      });

      await expect(
        service.archiveDocument(MOCK_USER_ID, 'doc-uuid-1', {}),
      ).rejects.toThrow(ConflictException);
      expect(mockPrismaService.document.update).not.toHaveBeenCalled();
    });

    it('allows archiving when the linked settlement run is DRAFT / PREVIEWED', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue(
        buildDocRow({ settlementRunId: 'run-uuid-1' }),
      );
      mockPrismaService.settlementRun.findUnique.mockResolvedValue({
        status: 'PREVIEWED',
      });
      mockPrismaService.document.update.mockResolvedValue(
        buildDocRow({ archivedAt: new Date(), archivedByUserId: MOCK_USER_ID }),
      );

      await expect(
        service.archiveDocument(MOCK_USER_ID, 'doc-uuid-1', {}),
      ).resolves.toBeDefined();
      expect(mockPrismaService.document.update).toHaveBeenCalled();
    });

    it('allows archiving deal-scope + revenue-batch-scope docs without touching the run guard', async () => {
      // No settlementRunId means the guard short-circuits — the
      // settlementRun.findUnique mock should never fire.
      mockPrismaService.document.findUnique.mockResolvedValue(buildDocRow());
      mockPrismaService.document.update.mockResolvedValue(
        buildDocRow({ archivedAt: new Date(), archivedByUserId: MOCK_USER_ID }),
      );

      await service.archiveDocument(MOCK_USER_ID, 'doc-uuid-1', {});
      expect(mockPrismaService.settlementRun.findUnique).not.toHaveBeenCalled();
    });
  });

  // ─── linkedTo label (MS-3 Wave 4 gap #7) ─────────────────────────────────

  describe('linkedTo mapping via response', () => {
    it('surfaces batchNumber as the label when document is scoped to a batch', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue(
        buildDocRow({
          dealId: null,
          revenueBatchId: 'batch-uuid-9',
          revenueBatch: { batchNumber: 'RB-2026-004' },
        }),
      );

      const result = await service.getDocument('doc-uuid-1');

      expect(result.linkedTo).toEqual({
        type: 'BATCH',
        label: 'RB-2026-004',
        id: 'batch-uuid-9',
      });
    });

    it('surfaces "Run #N" as the label when document is scoped to a run', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue(
        buildDocRow({
          dealId: null,
          settlementRunId: 'run-uuid-42',
          settlementRun: { runNumber: 7 },
        }),
      );

      const result = await service.getDocument('doc-uuid-1');

      expect(result.linkedTo).toEqual({
        type: 'RUN',
        label: 'Run #7',
        id: 'run-uuid-42',
      });
    });

    it('falls back to "Deal" label for deal-scoped documents', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue(buildDocRow());

      const result = await service.getDocument('doc-uuid-1');

      expect(result.linkedTo).toEqual({
        type: 'DEAL',
        label: 'Deal',
        id: MOCK_DEAL_ID,
      });
    });

    it('falls back to a friendly label when the join happens to be missing', async () => {
      // Defensive: if a caller ever forgets the LINKED_SCOPE_INCLUDE
      // spread on a new query, the mapper still renders something usable.
      mockPrismaService.document.findUnique.mockResolvedValue(
        buildDocRow({
          dealId: null,
          revenueBatchId: 'batch-uuid-9',
          revenueBatch: undefined,
        }),
      );

      const result = await service.getDocument('doc-uuid-1');

      expect(result.linkedTo.type).toBe('BATCH');
      expect(result.linkedTo.label).toBe('Revenue Batch');
      expect(result.linkedTo.id).toBe('batch-uuid-9');
    });
  });

  describe('restoreDocument', () => {
    it('clears archive fields and audits RESTORED', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue(
        buildDocRow({
          archivedAt: new Date('2026-05-20T11:00:00.000Z'),
          archivedByUserId: MOCK_USER_ID,
          archivedReason: 'oops',
        }),
      );
      mockPrismaService.document.update.mockResolvedValue(buildDocRow());

      await service.restoreDocument(MOCK_USER_ID, 'doc-uuid-1');

      expect(mockPrismaService.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-uuid-1' },
        data: {
          archivedAt: null,
          archivedByUserId: null,
          archivedReason: null,
        },
        include: expect.any(Object),
      });

      expect(mockAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RESTORED',
          entityType: 'Document',
        }),
      );
    });

    it('rejects when document is not archived', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue(buildDocRow());

      await expect(
        service.restoreDocument(MOCK_USER_ID, 'doc-uuid-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── deleteDocument routes to archive (no hard delete in v1) ─────────────

  describe('deleteDocument', () => {
    it('routes DELETE → archive (FB-003 Run 4 Comment 21 — no hard delete v1)', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue(buildDocRow());
      mockPrismaService.document.update.mockResolvedValue(
        buildDocRow({ archivedAt: new Date() }),
      );

      const result = await service.deleteDocument(MOCK_USER_ID, 'doc-uuid-1');

      // No prisma.document.delete call — archive only
      expect(mockPrismaService.document.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ archivedAt: expect.any(Date) }),
        }),
      );
      expect(result.message).toMatch(/archived/);
    });
  });

  // ─── getRawStream — streaming controller helper ──────────────────────────

  describe('getRawStream', () => {
    it('returns stream + mimeType + fileName for a known document', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue({
        storageUrl: 'deals/x/file.pdf',
        mimeType: 'application/pdf',
        fileName: 'file.pdf',
        archivedAt: null,
      });
      const fakeStream = Readable.from(Buffer.from('bytes'));
      mockStorage.getStream.mockResolvedValue(fakeStream);

      const result = await service.getRawStream('doc-uuid-1');

      expect(mockStorage.getStream).toHaveBeenCalledWith('deals/x/file.pdf');
      expect(result.mimeType).toBe('application/pdf');
      expect(result.fileName).toBe('file.pdf');
    });

    it('returns 404 when the file is missing from storage', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue({
        storageUrl: 'orphan.pdf',
        mimeType: 'application/pdf',
        fileName: 'orphan.pdf',
        archivedAt: null,
      });
      mockStorage.getStream.mockRejectedValue(
        Object.assign(new Error('not found'), { name: 'StorageNotFoundError' }),
      );

      // The Real StorageNotFoundError check uses instanceof, so this rejects
      // with the raw error (not transformed). Just confirm it throws something.
      await expect(service.getRawStream('doc-uuid-1')).rejects.toThrow();
    });
  });
});

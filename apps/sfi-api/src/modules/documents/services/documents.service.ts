import { Readable } from 'node:stream';

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Document, Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import { FILE_STORAGE, IFileStorage, StorageNotFoundError } from '../../storage/storage.interface';
import {
  ArchiveDocumentDto,
  DocumentListQueryDto,
  DocumentListResponseDto,
  DocumentResponseDto,
  UploadDocumentDto,
} from '../dto';
import { DocumentMapper, DocumentWithJoins } from '../mappers/document.mapper';

interface DocumentFilter {
  dealId?: string;
  revenueBatchId?: string;
  settlementRunId?: string;
}

/**
 * Documents Service (FB-003 Run 4 — real implementation)
 *
 * Replaces the FB-003 Run 4 stub with real Prisma + storage-adapter
 * persistence. Highlights:
 *
 *   - Upload streams to the configured storage backend (default: local FS;
 *     see StorageModule). SHA-256 checksum computed server-side.
 *   - Captures `uploadedByUserId` from `req.user` automatically.
 *   - Soft-delete via archive (`archivedAt + archivedByUserId + archivedReason`);
 *     list endpoints default-filter to `archivedAt IS NULL`.
 *   - Preview URLs generated fresh on every fetch (signed/proxy URL with
 *     TTL from `STORAGE_PREVIEW_URL_TTL_SECONDS`).
 *   - Audit log on every create / archive / restore.
 */
@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly previewTtlSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly config: ConfigService,
    @Inject(FILE_STORAGE) private readonly storage: IFileStorage,
  ) {
    this.previewTtlSeconds = Number(
      this.config.get<string>('STORAGE_PREVIEW_URL_TTL_SECONDS') ?? 900,
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // Upload
  // ──────────────────────────────────────────────────────────────────

  async uploadDocument(
    userId: string,
    file: Express.Multer.File,
    dto: UploadDocumentDto,
  ): Promise<DocumentResponseDto> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Missing or empty file upload');
    }

    await this.assertLinkedEntitiesValid(dto);

    const keyPrefix = dto.dealId
      ? `deals/${dto.dealId}`
      : dto.revenueBatchId
        ? `revenue-batches/${dto.revenueBatchId}`
        : dto.settlementRunId
          ? `settlement-runs/${dto.settlementRunId}`
          : 'unlinked';

    // Stream from Multer's in-memory buffer through the storage adapter.
    // For very large files, swap MemoryStorage → DiskStorage at the
    // controller's FileInterceptor — the adapter contract stays the same.
    const stream = Readable.from(file.buffer);
    const uploaded = await this.storage.upload(stream, {
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      keyPrefix,
    });

    const document = await this.prisma.document.create({
      data: {
        dealId: dto.dealId,
        revenueBatchId: dto.revenueBatchId,
        settlementRunId: dto.settlementRunId,
        docType: dto.docType,
        fileName: file.originalname,
        storageUrl: uploaded.storageKey, // column historically named "url"; now stores the opaque storage key
        checksum: uploaded.checksum,
        uploadedAt: new Date(),
        metadata: dto.metadata
          ? (dto.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        fileSize: uploaded.fileSize,
        mimeType: file.mimetype,
        uploadedByUserId: userId,
      },
      include: {
        uploadedBy: USER_JOIN_SELECT,
        archivedBy: USER_JOIN_SELECT,
        ...LINKED_SCOPE_INCLUDE,
      },
    });

    await this.auditLog.create({
      actor: userId,
      action: 'CREATED',
      entityType: 'Document',
      entityId: document.id,
      dealId: dto.dealId,
      metadata: {
        fileName: file.originalname,
        docType: dto.docType,
        fileSize: uploaded.fileSize,
        mimeType: file.mimetype,
        ...(dto.revenueBatchId && { revenueBatchId: dto.revenueBatchId }),
        ...(dto.settlementRunId && { settlementRunId: dto.settlementRunId }),
      },
    });

    return this.toResponse(document as DocumentWithJoins);
  }

  // ──────────────────────────────────────────────────────────────────
  // List
  // ──────────────────────────────────────────────────────────────────

  async listDocuments(
    filter: DocumentFilter,
    query: DocumentListQueryDto,
    userId?: string,
  ): Promise<DocumentListResponseDto> {
    // Owner-scope the query when userId is supplied. Prevents authenticated
    // users from listing documents on deals / batches / runs they don't own.
    // Called with userId from the 3 scoped controller routes; the unscoped
    // "getDocument" byId route continues to skip this until we add per-doc
    // ownership auditing.
    if (userId !== undefined) {
      await this.assertScopeOwnership(filter, userId);
    }

    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DocumentWhereInput = {
      ...(filter.dealId && { dealId: filter.dealId }),
      ...(filter.revenueBatchId && { revenueBatchId: filter.revenueBatchId }),
      ...(filter.settlementRunId && { settlementRunId: filter.settlementRunId }),
      ...(query.docType && { docType: query.docType }),
      ...(query.uploadedByUserId && { uploadedByUserId: query.uploadedByUserId }),
      ...buildArchivedFilter(query.archived),
    };

    const [rows, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          uploadedBy: USER_JOIN_SELECT,
          archivedBy: USER_JOIN_SELECT,
          ...LINKED_SCOPE_INCLUDE,
        },
      }),
      this.prisma.document.count({ where }),
    ]);

    const data = await Promise.all(
      rows.map((row) => this.toResponse(row as DocumentWithJoins)),
    );

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ──────────────────────────────────────────────────────────────────
  // Get one
  // ──────────────────────────────────────────────────────────────────

  async getDocument(id: string): Promise<DocumentResponseDto> {
    const row = await this.prisma.document.findUnique({
      where: { id },
      include: {
        uploadedBy: USER_JOIN_SELECT,
        archivedBy: USER_JOIN_SELECT,
        ...LINKED_SCOPE_INCLUDE,
      },
    });
    if (!row) throw new NotFoundException(`Document with ID ${id} not found`);
    return this.toResponse(row as DocumentWithJoins);
  }

  // ──────────────────────────────────────────────────────────────────
  // Archive / Restore (FB-003 Run 4 Comment 21)
  // ──────────────────────────────────────────────────────────────────

  async archiveDocument(
    userId: string,
    id: string,
    dto: ArchiveDocumentDto,
  ): Promise<DocumentResponseDto> {
    const existing = await this.prisma.document.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Document with ID ${id} not found`);
    if (existing.archivedAt) {
      throw new ConflictException(`Document ${id} is already archived`);
    }

    // MS-3 Wave 4 gap #8 — documents attached to a FINALIZED settlement
    // run are part of the run's evidentiary record and must stay
    // available for audit. The design spec (Screen 3.4) tells the FE to
    // hide the delete icon in this case; the BE guard is defense-in-depth
    // so a hand-crafted DELETE request still gets refused.
    if (existing.settlementRunId) {
      const run = await this.prisma.settlementRun.findUnique({
        where: { id: existing.settlementRunId },
        select: { status: true },
      });
      if (run?.status === 'FINALIZED') {
        throw new ConflictException(
          `Document ${id} is linked to a finalized settlement run and cannot be archived.`,
        );
      }
    }

    const updated = await this.prisma.document.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        archivedByUserId: userId,
        archivedReason: dto.reason ?? null,
      },
      include: {
        uploadedBy: USER_JOIN_SELECT,
        archivedBy: USER_JOIN_SELECT,
        ...LINKED_SCOPE_INCLUDE,
      },
    });

    await this.auditLog.create({
      actor: userId,
      action: 'ARCHIVED',
      entityType: 'Document',
      entityId: id,
      dealId: existing.dealId ?? undefined,
      metadata: {
        fileName: existing.fileName,
        ...(dto.reason && { reason: dto.reason }),
      },
    });

    return this.toResponse(updated as DocumentWithJoins);
  }

  async restoreDocument(userId: string, id: string): Promise<DocumentResponseDto> {
    const existing = await this.prisma.document.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Document with ID ${id} not found`);
    if (!existing.archivedAt) {
      throw new ConflictException(`Document ${id} is not archived`);
    }

    const updated = await this.prisma.document.update({
      where: { id },
      data: {
        archivedAt: null,
        archivedByUserId: null,
        archivedReason: null,
      },
      include: {
        uploadedBy: USER_JOIN_SELECT,
        archivedBy: USER_JOIN_SELECT,
        ...LINKED_SCOPE_INCLUDE,
      },
    });

    await this.auditLog.create({
      actor: userId,
      action: 'RESTORED',
      entityType: 'Document',
      entityId: id,
      dealId: existing.dealId ?? undefined,
      metadata: { fileName: existing.fileName },
    });

    return this.toResponse(updated as DocumentWithJoins);
  }

  /**
   * DELETE /documents/:id — kept for REST friendliness but routes to
   * `archiveDocument` (per Round 4 Comment 21 — no hard delete in v1).
   */
  async deleteDocument(
    userId: string,
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.archiveDocument(userId, id, {});
    return {
      success: true,
      message: `Document ${id} archived. Use POST /documents/${id}/restore to undo.`,
    };
  }

  // ──────────────────────────────────────────────────────────────────
  // Raw streaming (for Document Preview drawer)
  // ──────────────────────────────────────────────────────────────────

  /**
   * Resolve a document id to its underlying file stream + display
   * metadata for the streaming controller. The controller verifies the
   * preview JWT separately before calling this.
   */
  async getRawStream(
    id: string,
  ): Promise<{ stream: Readable; mimeType: string; fileName: string }> {
    const row = await this.prisma.document.findUnique({
      where: { id },
      select: { storageUrl: true, mimeType: true, fileName: true, archivedAt: true },
    });
    if (!row) throw new NotFoundException(`Document with ID ${id} not found`);

    try {
      const stream = await this.storage.getStream(row.storageUrl);
      return {
        stream,
        mimeType: row.mimeType ?? 'application/octet-stream',
        fileName: row.fileName,
      };
    } catch (err) {
      if (err instanceof StorageNotFoundError) {
        throw new NotFoundException(
          `Document ${id} metadata exists but the file is missing from storage`,
        );
      }
      throw err;
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // Internals
  // ──────────────────────────────────────────────────────────────────

  /**
   * Verify that any FK targets supplied on upload actually exist. Skips
   * undefined targets. Avoids creating a document linked to a deleted
   * Deal/Batch/Run (which would fail at insert with a hard FK error
   * anyway; the explicit check just returns a friendlier 404).
   */
  /**
   * Verify the caller owns the scope (deal / revenue batch / settlement
   * run) they're listing documents against. Prevents cross-user data
   * leaks between authenticated users. Returns a friendly 404 (not 403)
   * so scope existence isn't leaked to non-owners.
   *
   * Delegates to `assertLinkedEntitiesValid`-style checks + a userId
   * intersection at the Deal layer, which is where every entity chains
   * back to.
   */
  private async assertScopeOwnership(
    filter: DocumentFilter,
    userId: string,
  ): Promise<void> {
    if (filter.dealId) {
      const deal = await this.prisma.deal.findUnique({
        where: { id: filter.dealId },
        select: { id: true, userId: true },
      });
      if (deal?.userId !== userId) {
        throw new NotFoundException(`Deal with ID ${filter.dealId} not found`);
      }
      return;
    }
    if (filter.revenueBatchId) {
      const batch = await this.prisma.revenueBatch.findUnique({
        where: { id: filter.revenueBatchId },
        select: { id: true, deal: { select: { userId: true } } },
      });
      if (batch?.deal.userId !== userId) {
        throw new NotFoundException(
          `Revenue batch with ID ${filter.revenueBatchId} not found`,
        );
      }
      return;
    }
    if (filter.settlementRunId) {
      const run = await this.prisma.settlementRun.findUnique({
        where: { id: filter.settlementRunId },
        select: { id: true, deal: { select: { userId: true } } },
      });
      if (run?.deal.userId !== userId) {
        throw new NotFoundException(
          `Settlement run with ID ${filter.settlementRunId} not found`,
        );
      }
    }
  }

  private async assertLinkedEntitiesValid(dto: UploadDocumentDto): Promise<void> {
    // Screen 3.5 "Link To" dropdown is single-select: a document points at
    // EITHER a revenue batch OR a settlement run, never both. Reject the
    // ambiguous combination up front so callers get a friendly 400 instead
    // of a confusing double-linked row downstream.
    if (dto.revenueBatchId && dto.settlementRunId) {
      throw new BadRequestException(
        'revenueBatchId and settlementRunId are mutually exclusive on a single document upload.',
      );
    }
    if (dto.dealId) {
      const deal = await this.prisma.deal.findUnique({ where: { id: dto.dealId }, select: { id: true } });
      if (!deal) throw new NotFoundException(`Deal with ID ${dto.dealId} not found`);
    }
    if (dto.revenueBatchId) {
      const batch = await this.prisma.revenueBatch.findUnique({
        where: { id: dto.revenueBatchId },
        select: { id: true },
      });
      if (!batch) throw new NotFoundException(`Revenue batch with ID ${dto.revenueBatchId} not found`);
    }
    if (dto.settlementRunId) {
      const run = await this.prisma.settlementRun.findUnique({
        where: { id: dto.settlementRunId },
        select: { id: true },
      });
      if (!run) throw new NotFoundException(`Settlement run with ID ${dto.settlementRunId} not found`);
    }
  }

  private async toResponse(row: DocumentWithJoins): Promise<DocumentResponseDto> {
    const previewUrl = await this.storage.getPreviewUrl(
      row.storageUrl,
      this.previewTtlSeconds,
    );
    return DocumentMapper.toResponse(row, previewUrl);
  }
}

// User join shape — kept identical across every query so the mapper sees
// a consistent shape. avatarUrl is included for the FE's hover-card.
const USER_JOIN_SELECT = {
  select: { id: true, name: true, avatarUrl: true },
} as const;

// MS-3 Wave 4 gap #7 — every document fetch also loads batchNumber /
// runNumber so `DocumentMapper.buildLinkedTo` can render Screen 3.4's
// "Linked To" column without an N+1 client fetch.
const LINKED_SCOPE_INCLUDE = {
  revenueBatch: { select: { batchNumber: true } },
  settlementRun: { select: { runNumber: true } },
} as const;

/**
 * Translate `?archived=` query to a Prisma `where` fragment.
 *
 *   - `undefined | 'false'` → active only (`archivedAt: null`)
 *   - `'true'`              → archived only (`archivedAt: not null`)
 *   - `'all'`               → no filter
 */
function buildArchivedFilter(
  archived: 'false' | 'true' | 'all' | undefined,
): Pick<Prisma.DocumentWhereInput, 'archivedAt'> {
  if (archived === 'true') return { archivedAt: { not: null } };
  if (archived === 'all') return {};
  return { archivedAt: null };
}

// Suppress unused import in callers that don't use Document type directly
export type { Document };

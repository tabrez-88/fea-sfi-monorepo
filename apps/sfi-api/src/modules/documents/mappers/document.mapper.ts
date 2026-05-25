/**
 * Document Mapper (FB-003 Run 4)
 *
 * Maps a Prisma `Document` row (with `uploadedBy` / `archivedBy` joins
 * available) into the response DTO shape. Generates the preview URL
 * fresh on each fetch via the injected `IFileStorage` adapter so URLs
 * are always within their TTL window.
 *
 * The mapper is a class with a static method (matching the existing
 * mapper convention in the codebase) but takes the storage adapter +
 * TTL as parameters since it's not a NestJS provider.
 */

import { Document } from '@prisma/client';

import { DocumentResponseDto, DocumentTypeEnum } from '../dto';

export interface DocumentMapperUserJoin {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface DocumentWithJoins extends Document {
  uploadedBy?: DocumentMapperUserJoin | null;
  archivedBy?: DocumentMapperUserJoin | null;
}

export class DocumentMapper {
  /**
   * Build a response DTO from a fetched Prisma row.
   *
   * @param row          The fetched document with optional user joins
   * @param previewUrl   Pre-generated preview URL (caller fetches via
   *                     `IFileStorage.getPreviewUrl()`). Passed in so
   *                     the mapper stays free of NestJS deps.
   */
  static toResponse(row: DocumentWithJoins, previewUrl: string): DocumentResponseDto {
    return {
      id: row.id,
      dealId: row.dealId,
      revenueBatchId: row.revenueBatchId,
      settlementRunId: row.settlementRunId,
      docType: row.docType as DocumentTypeEnum,
      fileName: row.fileName,
      storageUrl: previewUrl,
      checksum: row.checksum,
      fileSize: row.fileSize ?? 0,
      mimeType: row.mimeType ?? 'application/octet-stream',
      uploadedAt: row.uploadedAt.toISOString(),
      uploadedBy: row.uploadedBy
        ? {
            id: row.uploadedBy.id,
            name: row.uploadedBy.name,
            avatarUrl: row.uploadedBy.avatarUrl,
          }
        : null,
      archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
      archivedBy: row.archivedBy
        ? {
            id: row.archivedBy.id,
            name: row.archivedBy.name,
            avatarUrl: row.archivedBy.avatarUrl,
          }
        : null,
      archivedReason: row.archivedReason,
      metadata: row.metadata as Record<string, unknown> | null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

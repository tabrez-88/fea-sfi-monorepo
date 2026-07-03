import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { PaginationQueryDto } from '../../deals/dto';

// ============================================
// Enums
// ============================================

export enum DocumentTypeEnum {
  CONTRACT = 'CONTRACT',
  AMENDMENT = 'AMENDMENT',
  REVENUE_REPORT = 'REVENUE_REPORT',
  SETTLEMENT_REPORT = 'SETTLEMENT_REPORT',
  AUDIT_REPORT = 'AUDIT_REPORT',
  PROOF_RECORD = 'PROOF_RECORD',
  // MS-3 Wave 3 (Liang MS3-R3) — Carta-style intake taxonomy.
  OFFERING_DOCUMENT = 'OFFERING_DOCUMENT',
  INVESTOR_AGREEMENT = 'INVESTOR_AGREEMENT',
  DISCLOSURE = 'DISCLOSURE',
  REVENUE_SHARE_TERMS = 'REVENUE_SHARE_TERMS',
  OTHER = 'OTHER',
}

// ============================================
// Upload Document DTO
// ============================================

export class UploadDocumentDto {
  @ApiProperty({
    description: 'Type of document being uploaded',
    enum: DocumentTypeEnum,
    example: DocumentTypeEnum.REVENUE_REPORT,
  })
  @IsEnum(DocumentTypeEnum)
  docType!: DocumentTypeEnum;

  @ApiPropertyOptional({
    description: 'Deal ID to associate this document with',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  dealId?: string;

  @ApiPropertyOptional({
    description: 'Revenue batch ID to associate this document with',
    example: '550e8400-e29b-41d4-a716-446655440050',
  })
  @IsOptional()
  @IsUUID()
  revenueBatchId?: string;

  @ApiPropertyOptional({
    description: 'Settlement run ID to associate this document with',
    example: '550e8400-e29b-41d4-a716-446655440100',
  })
  @IsOptional()
  @IsUUID()
  settlementRunId?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the document',
    example: { source: 'Netflix Portal', uploadedBy: 'user@example.com' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

// Note: File is handled by FileInterceptor, not through DTO validation
// This class is kept for documentation purposes
export class UploadDocumentWithFileDto extends UploadDocumentDto {
  // File property is handled separately via @UploadedFile() decorator
}

// ============================================
// Contextual Upload DTO (for /deals/:id/documents)
// ============================================

export class ContextualUploadDocumentDto {
  @ApiProperty({
    description: 'Type of document being uploaded',
    enum: DocumentTypeEnum,
    example: DocumentTypeEnum.CONTRACT,
  })
  @IsEnum(DocumentTypeEnum)
  docType!: DocumentTypeEnum;

  @ApiPropertyOptional({
    description: 'Revenue batch ID to also associate this document with',
    example: '550e8400-e29b-41d4-a716-446655440050',
  })
  @IsOptional()
  @IsUUID()
  revenueBatchId?: string;

  @ApiPropertyOptional({
    description: 'Settlement run ID to also associate this document with',
    example: '550e8400-e29b-41d4-a716-446655440100',
  })
  @IsOptional()
  @IsUUID()
  settlementRunId?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the document',
    example: { version: '1.0', notes: 'Initial contract' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

// ============================================
// Document Response DTO
// ============================================

/**
 * Scope the document is attached to. `DEAL` means the document was
 * uploaded at the deal level (no batch/run link). `BATCH` / `RUN` mean
 * the document is scoped to a specific revenue batch or settlement run.
 */
export enum DocumentLinkedToTypeEnum {
  DEAL = 'DEAL',
  BATCH = 'BATCH',
  RUN = 'RUN',
}

/**
 * Human-readable "Linked To" label surfaced on Screen 3.4 (Documents
 * List). Batches show their `batchNumber` ("RB-2026-004"), runs show
 * "Run #N". Deal-level docs get the constant label "Deal".
 */
export class DocumentLinkedToDto {
  @ApiProperty({
    enum: DocumentLinkedToTypeEnum,
    description: 'Which scope the document is attached to.',
  })
  type!: DocumentLinkedToTypeEnum;

  @ApiProperty({
    description: 'Display label for Screen 3.4 "Linked To" column.',
    example: 'RB-2026-004',
  })
  label!: string;

  @ApiPropertyOptional({
    description:
      "ID of the linked batch or run. `null` when `type: 'DEAL'`. Enables the FE to render the label as a link to the target's detail page.",
    example: '550e8400-e29b-41d4-a716-446655440050',
  })
  id?: string | null;
}

export class DocumentResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the document',
    example: '550e8400-e29b-41d4-a716-446655440500',
  })
  id!: string;

  @ApiPropertyOptional({
    description: 'Deal this document is associated with',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  dealId?: string | null;

  @ApiPropertyOptional({
    description: 'Revenue batch this document is associated with',
    example: null,
  })
  revenueBatchId?: string | null;

  @ApiPropertyOptional({
    description: 'Settlement run this document is associated with',
    example: null,
  })
  settlementRunId?: string | null;

  @ApiProperty({
    description:
      'Human-readable scope descriptor for Screen 3.4 "Linked To" column. ' +
      'Encapsulates the `type / label / id` triplet so the FE renders one field ' +
      'instead of resolving batch#/run# via extra API calls.',
    type: () => DocumentLinkedToDto,
  })
  linkedTo!: DocumentLinkedToDto;

  @ApiProperty({
    description: 'Type of document',
    enum: DocumentTypeEnum,
    example: DocumentTypeEnum.CONTRACT,
  })
  docType!: DocumentTypeEnum;

  @ApiProperty({
    description: 'Original file name',
    example: 'contract_v1.pdf',
  })
  fileName!: string;

  @ApiProperty({
    description: 'Storage URL for retrieving the file',
    example: 'https://storage.example.com/documents/abc123.pdf',
  })
  storageUrl!: string;

  @ApiProperty({
    description: 'SHA-256 checksum of the file for integrity verification',
    example: 'sha256:a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678',
  })
  checksum!: string;

  @ApiProperty({
    description: 'File size in bytes (computed server-side from the upload stream).',
    example: 1024000,
  })
  fileSize!: number;

  @ApiProperty({
    description: 'MIME type of the file (detected from the upload request).',
    example: 'application/pdf',
  })
  mimeType!: string;

  @ApiProperty({
    description: 'When the document was uploaded',
    example: '2024-01-15T10:30:00.000Z',
  })
  uploadedAt!: string;

  // FB-003 Run 4 Comment 20 — track who uploaded the document. Joined
  // from the User table at fetch time; null for system uploads / older
  // rows from before this column shipped.
  @ApiPropertyOptional({
    description: 'User who uploaded the document (joined from User table)',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440090',
      name: 'Tabrez Akhlaque',
      avatarUrl: null,
    },
  })
  uploadedBy?: { id: string; name: string; avatarUrl?: string | null } | null;

  // FB-003 Run 4 Comment 21 — soft-delete via archive. Three fields ride
  // together: timestamp + actor + optional reason. All null for active
  // documents; all populated once archived.
  @ApiPropertyOptional({
    description: 'When the document was archived (null = active)',
    example: null,
  })
  archivedAt?: string | null;

  @ApiPropertyOptional({
    description: 'User who archived the document',
    example: null,
  })
  archivedBy?: { id: string; name: string; avatarUrl?: string | null } | null;

  @ApiPropertyOptional({
    description: 'Optional reason for archive (free text, ≤500 chars)',
    example: null,
  })
  archivedReason?: string | null;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { source: 'Netflix Portal' },
  })
  metadata?: Record<string, unknown> | null;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt!: string;
}

// ============================================
// Document List Response DTO
// ============================================

export class DocumentListResponseDto {
  @ApiProperty({ type: [DocumentResponseDto] })
  data!: DocumentResponseDto[];

  @ApiProperty({
    example: { page: 1, limit: 20, total: 5, totalPages: 1 },
  })
  meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Archive / Restore DTOs (FB-003 Run 4 Comment 21)
// ============================================

/**
 * Body for `POST /documents/:id/archive`. Optional free-text reason
 * surfaces on `DocumentResponseDto.archivedReason` and audit log.
 */
export class ArchiveDocumentDto {
  @ApiPropertyOptional({
    description: 'Optional reason for archiving (≤500 chars)',
    example: 'Superseded by v2 of the contract',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

// ============================================
// List Query DTO — extends pagination with optional filters
// ============================================

/**
 * Query params for the document list endpoints. Extends
 * `PaginationQueryDto` (the canonical pattern in this codebase — see
 * `DealListQueryDto` / `RevenueBatchListQueryDto`). Adds:
 *
 *   - `docType` — filter by DocumentType enum
 *   - `archived` — view mode: `false` (default = active only),
 *                  `true` (archived only), `all` (both)
 *   - `uploadedByUserId` — "documents I uploaded"
 */
export class DocumentListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: DocumentTypeEnum,
    description: 'Filter by document type',
  })
  @IsOptional()
  @IsEnum(DocumentTypeEnum)
  docType?: DocumentTypeEnum;

  @ApiPropertyOptional({
    description:
      'Archived filter (FB-003 Run 4 Comment 21): `false` (default) = active only, ' +
      '`true` = archived only, `all` = both. Anything else is rejected.',
    enum: ['false', 'true', 'all'],
    default: 'false',
  })
  @IsOptional()
  @IsString()
  @IsIn(['false', 'true', 'all'])
  archived?: 'false' | 'true' | 'all';

  @ApiPropertyOptional({
    description: 'Filter to documents uploaded by this user',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  uploadedByUserId?: string;

  @ApiPropertyOptional({
    description:
      'Case-insensitive search on `fileName`. Powers Screen 3.4 search bar. Whitespace-only strings are ignored.',
    example: 'contract',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({
    description:
      'Return only documents uploaded on or after this ISO date. Powers Screen 3.4 date-range filter.',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  uploadedFrom?: string;

  @ApiPropertyOptional({
    description: 'Return only documents uploaded on or before this ISO date.',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  uploadedTo?: string;
}

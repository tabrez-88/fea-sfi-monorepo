import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsUUID,
} from 'class-validator';

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
    description: 'File size in bytes',
    example: 1024000,
  })
  fileSize!: number;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'application/pdf',
  })
  mimeType!: string;

  @ApiProperty({
    description: 'When the document was uploaded',
    example: '2024-01-15T10:30:00.000Z',
  })
  uploadedAt!: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { uploadedBy: 'user@example.com' },
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

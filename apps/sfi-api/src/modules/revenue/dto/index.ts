import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { PaginationQueryDto } from '../../deals/dto';

// ============================================
// Enums
// ============================================

export enum CurrencyEnum {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  CHF = 'CHF',
  CAD = 'CAD',
  AUD = 'AUD',
}

export enum RevenueBatchStatusEnum {
  PENDING = 'PENDING',
  VALIDATED = 'VALIDATED',
  PROCESSED = 'PROCESSED',
  REJECTED = 'REJECTED',
}

// ============================================
// Create Revenue Batch DTO
// ============================================

export class CreateRevenueBatchDto {
  @ApiProperty({
    description: 'Start date of the revenue period',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  periodStart!: string;

  @ApiProperty({
    description: 'End date of the revenue period',
    example: '2024-03-31T23:59:59.999Z',
  })
  @IsDateString()
  periodEnd!: string;

  @ApiProperty({
    description: 'Total revenue amount for this batch',
    example: 150000.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  totalAmount!: number;

  @ApiProperty({
    description: 'Currency of the revenue amount',
    enum: CurrencyEnum,
    example: CurrencyEnum.USD,
  })
  @IsEnum(CurrencyEnum)
  currency!: CurrencyEnum;

  @ApiPropertyOptional({
    description:
      'Free-form label for the upstream source of this revenue (e.g. operator, channel, or statement reference).',
    example: 'Q1 2026 Operator Statement',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  source?: string;

  @ApiPropertyOptional({
    description:
      'Geographic / market territory the revenue was generated in. Free-form combobox in the UI ' +
      '(common presets: Global, US, EU, APAC, Indonesia). Persisted in `metadata.territory` and ' +
      'surfaced as a top-level response field.',
    example: 'US',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  territory?: string;

  @ApiPropertyOptional({
    description:
      'Type of revenue stream. Free-form combobox in the UI (common presets: Streaming, Box Office, ' +
      'Licensing, Live, Merch). Persisted in `metadata.revenueType` and surfaced as a top-level response field.',
    example: 'Streaming',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  revenueType?: string;

  @ApiPropertyOptional({
    description:
      'Name of the upstream reporting entity / payor (e.g. the operator that issued the statement). ' +
      'Persisted in `metadata.reportingEntity` and surfaced as a top-level response field.',
    example: 'Spotify',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reportingEntity?: string;

  @ApiPropertyOptional({
    description:
      'Free-form JSON metadata. Shape is not enforced — callers typically attach line items, ' +
      'platform breakdowns, or source-system references. The dedicated `territory`, `revenueType`, ' +
      'and `reportingEntity` fields above are persisted INTO this same JSON blob, so do not ' +
      'duplicate them here — the server will overwrite any duplicate keys.',
    example: {
      channel: 'hotel-operations',
      lineItems: [
        { label: 'Room Revenue', amount: 100000 },
        { label: 'F&B Revenue', amount: 50000 },
      ],
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

// ============================================
// Revenue Batch Response DTOs
// ============================================

export class RevenueBatchResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the revenue batch',
    example: '550e8400-e29b-41d4-a716-446655440050',
  })
  id!: string;

  @ApiProperty({
    description: 'Deal this batch belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  dealId!: string;

  @ApiProperty({
    description: 'Auto-generated unique batch number',
    example: 'RB-2024-001',
  })
  batchNumber!: string;

  @ApiProperty({
    description: 'Start date of the revenue period',
    example: '2024-01-01T00:00:00.000Z',
  })
  periodStart!: string;

  @ApiProperty({
    description: 'End date of the revenue period',
    example: '2024-03-31T23:59:59.999Z',
  })
  periodEnd!: string;

  @ApiProperty({
    description: 'Total revenue amount',
    example: 150000.0,
  })
  totalAmount!: number;

  @ApiProperty({
    description: 'Currency of the revenue amount',
    enum: CurrencyEnum,
    example: CurrencyEnum.USD,
  })
  currency!: CurrencyEnum;

  @ApiProperty({
    description: 'Current status of the batch',
    enum: RevenueBatchStatusEnum,
    example: RevenueBatchStatusEnum.PENDING,
  })
  status!: RevenueBatchStatusEnum;

  @ApiPropertyOptional({
    description: 'Source of the revenue data (free-form label from the upstream operator/channel).',
    example: 'Q1 2026 Operator Statement',
  })
  source?: string | null;

  @ApiPropertyOptional({
    description: 'Geographic / market territory (read from metadata.territory).',
    example: 'US',
  })
  territory?: string | null;

  @ApiPropertyOptional({
    description: 'Type of revenue stream (read from metadata.revenueType).',
    example: 'Streaming',
  })
  revenueType?: string | null;

  @ApiPropertyOptional({
    description: 'Upstream reporting entity / payor (read from metadata.reportingEntity).',
    example: 'Spotify',
  })
  reportingEntity?: string | null;

  @ApiPropertyOptional({
    description:
      'Additional metadata. The `territory`, `revenueType`, and `reportingEntity` keys are ' +
      'stripped from this object since they are surfaced as top-level response fields above.',
  })
  metadata?: Record<string, unknown> | null;

  @ApiProperty({
    description: 'Whether this batch has been included in any settlement run',
    example: false,
  })
  isSettled!: boolean;

  @ApiPropertyOptional({
    description: 'Number of settlement runs that include this batch',
    example: 0,
  })
  settlementRunCount?: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt!: string;
}

export class RevenueBatchListResponseDto {
  @ApiProperty({ type: [RevenueBatchResponseDto] })
  data!: RevenueBatchResponseDto[];

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
// List Query — extends pagination with optional categorization filters
// ============================================

/**
 * Query params for the list-batches endpoint. Extends `PaginationQueryDto`
 * so the controller can take a single `@Query()` (the codebase convention —
 * see `DealListQueryDto`). Categorization filters (`territory`,
 * `revenueType`, `reportingEntity`) match the stored values inside
 * `RevenueBatch.metadata` JSON via Prisma's `path` query. Free-form — no
 * closed enum, since the underlying fields are user-defined comboboxes.
 */
export class RevenueBatchListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter to batches whose `territory` exactly matches this value.',
    example: 'US',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  territory?: string;

  @ApiPropertyOptional({
    description: 'Filter to batches whose `revenueType` exactly matches this value.',
    example: 'Streaming',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  revenueType?: string;

  @ApiPropertyOptional({
    description: 'Filter to batches whose `reportingEntity` exactly matches this value.',
    example: 'Spotify',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reportingEntity?: string;
}

// ============================================
// Update/Validate Revenue Batch DTOs
// ============================================

export class ValidateRevenueBatchDto {
  @ApiPropertyOptional({
    description: 'Optional notes from the validator',
    example: 'Verified against source documents',
  })
  @IsOptional()
  @IsString()
  validationNotes?: string;
}

export class RejectRevenueBatchDto {
  @ApiProperty({
    description: 'Reason for rejecting the batch',
    example: 'Amounts do not match source documents',
  })
  @IsString()
  rejectionReason!: string;
}

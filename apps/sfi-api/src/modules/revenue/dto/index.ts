import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
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

  @ApiPropertyOptional({
    description:
      'MS-3 Wave 3 (Liang MS3-R1) — first-class line items with per-row categorization. ' +
      'When supplied, they are persisted into the `revenue_line_items` table in the same ' +
      'transaction as the batch (atomic create-with-lines). Prefer this over `metadata.lineItems` ' +
      'for new batches; the JSON form stays for backward compat.',
    type: () => [CreateRevenueLineItemDto],
    maxItems: 500,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateRevenueLineItemDto)
  lineItems?: CreateRevenueLineItemDto[];
}

/**
 * Payload for a single line item on a Create Revenue Batch call, or for
 * the `POST /revenue-batches/:id/line-items` bulk-add endpoint. Currency
 * defaults to the parent batch's currency when omitted.
 */
export class CreateRevenueLineItemDto {
  @ApiProperty({
    description: 'Platform / source label (e.g. "Netflix", "Disney+", "Spotify")',
    example: 'Netflix',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  platformSource!: string;

  @ApiProperty({
    description: 'Amount for this line item (positive number, ≤ 18 digits, 2dp).',
    example: 30000000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({
    description:
      'Line-item currency. When omitted the line inherits the parent batch currency; ' +
      'when supplied it must match the parent batch currency (mixed currencies inside ' +
      'a single batch are rejected in v1).',
    enum: CurrencyEnum,
    example: CurrencyEnum.USD,
  })
  @IsOptional()
  @IsEnum(CurrencyEnum)
  currency?: CurrencyEnum;

  @ApiPropertyOptional({
    description: 'Geographic / market territory (US, EU, APAC, etc.)',
    example: 'US',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  territory?: string;

  @ApiPropertyOptional({
    description: 'Revenue stream type (Streaming, Licensing, Sync, etc.)',
    example: 'Streaming',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  revenueType?: string;

  @ApiPropertyOptional({
    description: 'Upstream reporting entity / payor for this line',
    example: 'Netflix',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reportingEntity?: string;

  @ApiPropertyOptional({
    description: 'Optional free-text note (≤ 500 chars)',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

/** Payload for `PATCH /revenue-batches/:id/line-items/:lineItemId` (all fields optional). */
export class UpdateRevenueLineItemDto {
  @ApiPropertyOptional({ example: 'Netflix', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  platformSource?: string;

  @ApiPropertyOptional({ example: 30000000, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ enum: CurrencyEnum })
  @IsOptional()
  @IsEnum(CurrencyEnum)
  currency?: CurrencyEnum;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  territory?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  revenueType?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reportingEntity?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

/** Payload for `POST /revenue-batches/:id/line-items` — bulk create. */
export class BulkCreateRevenueLineItemsDto {
  @ApiProperty({
    description: 'Line items to attach to the batch (transactional insert).',
    type: () => [CreateRevenueLineItemDto],
    maxItems: 500,
  })
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateRevenueLineItemDto)
  lineItems!: CreateRevenueLineItemDto[];
}

/** Response shape for a single line item. */
export class RevenueLineItemResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'batch-uuid' })
  batchId!: string;

  @ApiProperty({ example: 'Netflix' })
  platformSource!: string;

  @ApiProperty({ example: 30000000 })
  amount!: number;

  @ApiProperty({ enum: CurrencyEnum, example: CurrencyEnum.USD })
  currency!: CurrencyEnum;

  @ApiPropertyOptional({ example: 'US' })
  territory?: string | null;

  @ApiPropertyOptional({ example: 'Streaming' })
  revenueType?: string | null;

  @ApiPropertyOptional({ example: 'Netflix' })
  reportingEntity?: string | null;

  @ApiPropertyOptional({ example: null })
  notes?: string | null;

  @ApiProperty({ example: '2026-06-24T10:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-06-24T10:30:00.000Z' })
  updatedAt!: string;
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

  @ApiPropertyOptional({
    description:
      'First-class line items on the batch (MS-3 Wave 3 / Liang MS3-R1). Empty array ' +
      'when no rows have been added via the `revenue_line_items` table. Pre-Wave-3 batches ' +
      'that stored line items only in `metadata.lineItems` will show an empty array here — ' +
      'read the JSON form for those.',
    type: () => [RevenueLineItemResponseDto],
  })
  lineItems?: RevenueLineItemResponseDto[];

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
 *
 * `status` matches the top-level enum column and drives the filter tabs
 * on Screen 3.1 (Revenue Batches List).
 */
export class RevenueBatchListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: RevenueBatchStatusEnum,
    description:
      'Filter to batches with this status. Powers the Screen 3.1 filter tabs (All / Pending / Validated / Processed / Rejected).',
  })
  @IsOptional()
  @IsEnum(RevenueBatchStatusEnum)
  status?: RevenueBatchStatusEnum;

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
// Summary DTO — powers Screen 3.1 filter tab counts + summary bar
// ============================================

/**
 * Per-status slice on the summary response. `count` powers filter tab
 * badges (`[Pending (1)]`), `amount` powers the summary strip
 * (`Pending: $50M`).
 */
export class RevenueBatchStatusSummaryDto {
  @ApiProperty({ description: 'Number of batches in this status', example: 2 })
  count!: number;

  @ApiProperty({
    description: 'Sum of totalAmount for batches in this status',
    example: 100000000,
  })
  amount!: number;
}

/**
 * Aggregate summary for a deal's revenue batches. Single response covers
 * both the filter tab counts (Screen 3.1 tabs) and the summary bar
 * (Total Revenue + per-status amount strip).
 *
 * `currency` is the shared currency across all batches; `null` when
 * batches span multiple currencies (the FE can show "Mixed" and either
 * hide the total or request the /revenue-batches list for a per-currency
 * breakdown).
 */
export class RevenueBatchSummaryDto {
  @ApiProperty({
    description: 'Total number of batches on the deal (all statuses)',
    example: 4,
  })
  totalCount!: number;

  @ApiProperty({
    description: 'Sum of totalAmount across every batch on the deal',
    example: 200000000,
  })
  totalAmount!: number;

  @ApiPropertyOptional({
    description:
      'Shared currency across all batches. `null` when batches span multiple currencies.',
    enum: CurrencyEnum,
    example: CurrencyEnum.USD,
  })
  currency!: CurrencyEnum | null;

  @ApiProperty({
    description: 'Per-status count + amount slices. All 4 statuses are always present, zero-filled.',
    type: () => Object,
    example: {
      PENDING: { count: 1, amount: 50000000 },
      VALIDATED: { count: 1, amount: 75000000 },
      PROCESSED: { count: 2, amount: 100000000 },
      REJECTED: { count: 0, amount: 0 },
    },
  })
  byStatus!: Record<RevenueBatchStatusEnum, RevenueBatchStatusSummaryDto>;
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

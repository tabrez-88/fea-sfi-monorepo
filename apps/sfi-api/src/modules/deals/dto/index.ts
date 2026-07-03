import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
  MinLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

import { IsAfterDate } from '../../../common/validators/is-after-date.validator';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum DealStatusDto {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
  TERMINATED = 'TERMINATED',
  ARCHIVED = 'ARCHIVED',
}

export enum DealCategoryDto {
  MUSIC = 'MUSIC',
  FILM_AND_TV = 'FILM_AND_TV',
  LIVE_EVENTS_AND_SPORTS = 'LIVE_EVENTS_AND_SPORTS',
  GAMES_AND_INTERACTIVE_MEDIA = 'GAMES_AND_INTERACTIVE_MEDIA',
  CREATOR_AND_CONSUMER_IP = 'CREATOR_AND_CONSUMER_IP',
  AI_AND_FUTURE_MEDIA = 'AI_AND_FUTURE_MEDIA',
}

export enum DealCurrencyDto {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  CHF = 'CHF',
  CAD = 'CAD',
  AUD = 'AUD',
}

// ─── Create ───────────────────────────────────────────────────────────────────

export class CreateDealDto {
  @ApiProperty({ description: 'Name of the deal', maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Description of the deal', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: DealStatusDto, default: DealStatusDto.DRAFT })
  @IsOptional()
  @IsEnum(DealStatusDto)
  status?: DealStatusDto;

  @ApiPropertyOptional({
    enum: DealCategoryDto,
    description:
      'Project category. Optional on create so admins can leave it blank and fill in later from Edit Deal.',
  })
  @IsOptional()
  @IsEnum(DealCategoryDto)
  category?: DealCategoryDto;

  @ApiPropertyOptional({
    description:
      'Free-form deal owner — typically a company or person name (Creator / SPV / Label / Studio / Production Company).',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  dealOwner?: string;

  @ApiPropertyOptional({
    enum: DealCurrencyDto,
    default: DealCurrencyDto.USD,
    description: 'Currency for the deal (defaults to USD if not specified)',
  })
  @IsOptional()
  @IsEnum(DealCurrencyDto)
  currency?: DealCurrencyDto;

  @ApiProperty({ description: 'Effective date of the deal (ISO 8601)' })
  @IsDateString()
  effectiveDate!: string;

  @ApiPropertyOptional({
    description:
      'Termination date of the deal (ISO 8601). Must be strictly after effectiveDate if provided.',
  })
  @IsOptional()
  @IsDateString()
  @IsAfterDate('effectiveDate', {
    message: 'terminationDate must be after effectiveDate',
  })
  terminationDate?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}

// ─── Update ───────────────────────────────────────────────────────────────────

export class UpdateDealDto {
  @ApiPropertyOptional({ description: 'Name of the deal', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the deal', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: DealStatusDto })
  @IsOptional()
  @IsEnum(DealStatusDto)
  status?: DealStatusDto;

  @ApiPropertyOptional({ enum: DealCategoryDto })
  @IsOptional()
  @IsEnum(DealCategoryDto)
  category?: DealCategoryDto;

  @ApiPropertyOptional({
    description:
      'Free-form deal owner — typically a company or person name. Pass an empty string to clear.',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  dealOwner?: string;

  @ApiPropertyOptional({ enum: DealCurrencyDto })
  @IsOptional()
  @IsEnum(DealCurrencyDto)
  currency?: DealCurrencyDto;

  @ApiPropertyOptional({ description: 'Effective date of the deal (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({
    description:
      'Termination date of the deal (ISO 8601). Must be after effectiveDate if both provided.',
  })
  @IsOptional()
  @IsDateString()
  @IsAfterDate('effectiveDate', {
    message: 'terminationDate must be after effectiveDate',
  })
  terminationDate?: string;

  @ApiPropertyOptional({
    description:
      'Free-form notes on the deal. Currently only collected by the FE in the Suspend Deal confirmation modal — service auto-clears this when status moves out of SUSPENDED.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}

// ─── Response ─────────────────────────────────────────────────────────────────

export class DealResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty({ enum: DealStatusDto })
  status!: DealStatusDto;

  @ApiPropertyOptional({ enum: DealCategoryDto })
  category?: DealCategoryDto | null;

  @ApiPropertyOptional({
    description: 'Free-form deal owner name (Creator / SPV / Label / Studio / etc.).',
  })
  dealOwner?: string | null;

  @ApiProperty({ enum: DealCurrencyDto })
  currency!: DealCurrencyDto;

  @ApiProperty()
  effectiveDate!: Date;

  @ApiPropertyOptional()
  terminationDate?: Date | null;

  @ApiPropertyOptional({
    description:
      'Free-form notes on the deal. In the current FE flow this is only set from the Suspend Deal modal and is cleared automatically when status moves out of SUSPENDED.',
  })
  notes?: string | null;

  @ApiPropertyOptional()
  metadata?: Record<string, unknown> | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  // ─── Aggregated counts ──────────────────────────────────────────────────────
  //   participantsCount:  included on BOTH list (GET /deals) and detail (GET /deals/:id)
  //   all other counts + totalRevenue: detail only (GET /deals/:id)

  @ApiPropertyOptional({
    description:
      'Number of participants attached to this deal. Populated on both list and detail responses.',
    example: 5,
  })
  participantsCount?: number;

  @ApiPropertyOptional({
    description: 'Number of rule snapshot versions for this deal. Detail endpoint only.',
    example: 3,
  })
  ruleSnapshotsCount?: number;

  @ApiPropertyOptional({
    description: 'Number of revenue batches associated with this deal. Detail endpoint only.',
    example: 12,
  })
  revenueBatchesCount?: number;

  @ApiPropertyOptional({
    description: 'Number of settlement runs created for this deal. Detail endpoint only.',
    example: 2,
  })
  settlementRunsCount?: number;

  @ApiPropertyOptional({
    description:
      'Sum of RevenueBatch.totalAmount across all batches for this deal. Detail endpoint only.',
    example: 200000000,
  })
  totalRevenue?: number;
}

// ─── List Query ───────────────────────────────────────────────────────────────

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class DealListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: DealStatusDto,
    description: 'Filter deals by status',
  })
  @IsOptional()
  @IsEnum(DealStatusDto)
  status?: DealStatusDto;

  @ApiPropertyOptional({
    description: 'Case-insensitive search on deal name and description',
    example: 'horizon',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}

// ─── Counts ───────────────────────────────────────────────────────────────────

export class DealCountsResponseDto {
  @ApiProperty({ description: 'Total number of deals across all statuses', example: 18 })
  all!: number;

  @ApiProperty({ description: 'Deals in DRAFT status', example: 6 })
  draft!: number;

  @ApiProperty({ description: 'Deals in ACTIVE status', example: 6 })
  active!: number;

  @ApiProperty({
    description: 'Deals in SUSPENDED status (displayed as "Paused" in the FE)',
    example: 0,
  })
  suspended!: number;

  @ApiProperty({
    description: 'Deals in CLOSED status (displayed as "Completed" in the FE)',
    example: 6,
  })
  closed!: number;

  @ApiProperty({ description: 'Deals in TERMINATED status (failed/cancelled)', example: 0 })
  terminated!: number;

  @ApiProperty({ description: 'Deals in ARCHIVED status', example: 0 })
  archived!: number;
}

// ─── Deal CSV Import (MS-3 Wave 6 / Liang MS3-R2) ─────────────────────────

/**
 * Options body for `POST /deals/import`. Query string in real use, but
 * shaped as a DTO for Swagger. Both flags default to `false`.
 */
export class ImportDealsOptionsDto {
  @ApiPropertyOptional({
    description:
      'When true, rows that fail validation are skipped and reported in the response ' +
      'instead of aborting the entire import.',
    example: false,
  })
  @IsOptional()
  skipErrors?: boolean;

  @ApiPropertyOptional({
    description:
      'When true, parses + validates but does NOT persist. Powers the FE Preview Import ' +
      'modal (Round 4 pattern, mirrors the participants importer).',
    example: false,
  })
  @IsOptional()
  dryRun?: boolean;
}

export enum DealImportOutcomeDto {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  SKIPPED = 'SKIPPED',
}

export class ImportDealRowResultDto {
  @ApiProperty({ description: '1-indexed row number (excluding header)', example: 1 })
  row!: number;

  @ApiProperty({ description: 'Whether the row was processed successfully', example: true })
  success!: boolean;

  @ApiProperty({ enum: DealImportOutcomeDto, example: DealImportOutcomeDto.CREATED })
  outcome!: DealImportOutcomeDto;

  @ApiPropertyOptional({ description: 'Parse or persistence error message when success=false.' })
  error?: string;

  @ApiPropertyOptional({
    description:
      "Soft warnings that didn't block the row (e.g. an unrecognized status was normalized). " +
      'Empty / omitted on clean rows.',
    type: [String],
  })
  warnings?: string[];

  @ApiPropertyOptional({ description: 'ID of the created / updated deal (null on failure or dryRun).' })
  dealId?: string | null;

  @ApiPropertyOptional({
    description: 'Convenience preview of the row so the FE can render it in the results table.',
    example: {
      name: 'The Last Horizon',
      category: 'FILM_AND_TV',
      externalDealId: 'FEA-DEAL-4231',
    },
  })
  deal?: Record<string, unknown> | null;
}

export class ImportDealsResultDto {
  @ApiProperty({ description: 'Rows persisted (0 when dryRun=true).', example: 4 })
  imported!: number;

  @ApiProperty({ description: 'Rows that failed validation.', example: 0 })
  failed!: number;

  @ApiProperty({ type: [ImportDealRowResultDto] })
  rows!: ImportDealRowResultDto[];
}

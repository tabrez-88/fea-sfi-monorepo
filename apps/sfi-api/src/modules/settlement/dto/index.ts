import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

// ============================================
// Enums
// ============================================

export enum RunTypeEnum {
  NORMAL = 'NORMAL',
  CORRECTION = 'CORRECTION',
}

export enum SettlementStatusEnum {
  DRAFT = 'DRAFT',
  PREVIEWED = 'PREVIEWED',
  FINALIZED = 'FINALIZED',
  VOIDED = 'VOIDED',
}

export enum SettlementPhaseEnum {
  GROSS_RECEIPTS = 'GROSS_RECEIPTS',
  DISTRIBUTION_FEES = 'DISTRIBUTION_FEES',
  RECOUPMENT = 'RECOUPMENT',
  NET_PROFITS = 'NET_PROFITS',
}

export enum CurrencyEnum {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  CHF = 'CHF',
  CAD = 'CAD',
  AUD = 'AUD',
}

// ============================================
// Create Settlement Run DTO
// ============================================

export class CreateSettlementRunDto {
  @ApiProperty({
    description: 'Rule snapshot ID to use for this settlement calculation',
    example: '550e8400-e29b-41d4-a716-446655440099',
  })
  @IsUUID()
  ruleSnapshotId!: string;

  @ApiProperty({
    description:
      'List of revenue batch IDs to include in this settlement. All batches must be VALIDATED status.',
    example: [
      '550e8400-e29b-41d4-a716-446655440050',
      '550e8400-e29b-41d4-a716-446655440051',
    ],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  revenueBatchIds!: string[];

  @ApiPropertyOptional({
    description: 'Optional notes for this settlement run',
    example: 'Q1 2024 quarterly settlement',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ============================================
// Settlement Allocation DTOs
// ============================================

export class SettlementAllocationDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440200' })
  id!: string;

  @ApiProperty({
    description: 'Participant receiving this allocation',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  participantId!: string;

  @ApiProperty({
    description: 'Participant name for display',
    example: 'Acme Productions LLC',
  })
  participantName!: string;

  @ApiProperty({
    description: 'Allocated amount',
    example: 75000.0,
  })
  amount!: number;

  @ApiProperty({
    description: 'Currency of the allocation',
    enum: CurrencyEnum,
    example: CurrencyEnum.USD,
  })
  currency!: CurrencyEnum;

  @ApiProperty({
    description: 'Settlement phase this allocation belongs to',
    enum: SettlementPhaseEnum,
    example: SettlementPhaseEnum.NET_PROFITS,
  })
  phase!: SettlementPhaseEnum;

  @ApiPropertyOptional({
    description: 'Additional metadata (calculation details, notes, etc.)',
    example: {
      calculationBasis: 'percentage',
      percentage: 60,
      grossAmount: 125000,
    },
  })
  metadata?: Record<string, unknown>;
}

// ============================================
// Proof Summary DTO
// ============================================

export class ProofSummaryDto {
  @ApiProperty({
    description: 'Unique hash of the settlement calculation for audit proof',
    example: 'sha256:a1b2c3d4e5f6...',
  })
  proofHash!: string;

  @ApiProperty({
    description: 'Algorithm used for hash generation',
    example: 'SHA-256',
  })
  algorithm!: string;

  @ApiProperty({
    description: 'Timestamp when proof was generated',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp!: string;

  @ApiPropertyOptional({
    description: 'Summary of inputs that were hashed',
    example: {
      ruleSnapshotVersion: 1,
      revenueBatchCount: 2,
      totalRevenue: 275000,
      participantCount: 3,
    },
  })
  inputSummary?: Record<string, unknown>;
}

// ============================================
// Ledger Reference DTO
// ============================================

export class LedgerRefDto {
  @ApiProperty({
    description: 'Ledger journal IDs created for this settlement',
    example: ['550e8400-e29b-41d4-a716-446655440300'],
    type: [String],
  })
  journalIds!: string[];

  @ApiProperty({
    description: 'Total number of postings created',
    example: 6,
  })
  postingCount!: number;
}

// ============================================
// Revenue Batch Summary DTO
// ============================================

export class RevenueBatchSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440050' })
  id!: string;

  @ApiProperty({ example: 'RB-2024-001' })
  batchNumber!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  periodStart!: string;

  @ApiProperty({ example: '2024-03-31T23:59:59.999Z' })
  periodEnd!: string;

  @ApiProperty({ example: 125000.0 })
  totalAmount!: number;

  @ApiProperty({ enum: CurrencyEnum, example: CurrencyEnum.USD })
  currency!: CurrencyEnum;
}

// ============================================
// Settlement Run Response DTOs
// ============================================

export class SettlementRunResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440100' })
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  dealId!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440099' })
  ruleSnapshotId!: string;

  @ApiProperty({
    description: 'Type of settlement run',
    enum: RunTypeEnum,
    example: RunTypeEnum.NORMAL,
  })
  runType!: RunTypeEnum;

  @ApiProperty({
    description: 'Current status of the settlement run',
    enum: SettlementStatusEnum,
    example: SettlementStatusEnum.DRAFT,
  })
  status!: SettlementStatusEnum;

  @ApiPropertyOptional({
    description: 'For correction runs, the original run being corrected',
    example: null,
  })
  originalSettlementRunId?: string | null;

  @ApiProperty({
    description: 'Total amount allocated across all participants',
    example: 125000.0,
  })
  totalAllocated!: number;

  @ApiProperty({ enum: CurrencyEnum, example: CurrencyEnum.USD })
  currency!: CurrencyEnum;

  @ApiPropertyOptional({ example: 'Q1 2024 quarterly settlement' })
  notes?: string | null;

  @ApiPropertyOptional({
    description: 'When the settlement was executed/finalized',
    example: null,
  })
  executedAt?: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt!: string;
}

export class SettlementRunDetailResponseDto extends SettlementRunResponseDto {
  @ApiProperty({
    description: 'Revenue batches included in this settlement',
    type: [RevenueBatchSummaryDto],
  })
  revenueBatches!: RevenueBatchSummaryDto[];

  @ApiPropertyOptional({
    description: 'Allocations (only present after preview or finalize)',
    type: [SettlementAllocationDto],
  })
  allocations?: SettlementAllocationDto[];

  @ApiPropertyOptional({
    description: 'Proof record (only present after preview or finalize)',
    type: ProofSummaryDto,
  })
  proof?: ProofSummaryDto;

  @ApiPropertyOptional({
    description: 'Ledger references (only present after finalize)',
    type: LedgerRefDto,
  })
  ledger?: LedgerRefDto;
}

// ============================================
// Preview Settlement Response DTO
// ============================================

export class PreviewSettlementResponseDto {
  @ApiProperty({
    description: 'The settlement run ID',
    example: '550e8400-e29b-41d4-a716-446655440100',
  })
  settlementRunId!: string;

  @ApiProperty({
    description: 'Status after preview (should be PREVIEWED)',
    enum: SettlementStatusEnum,
    example: SettlementStatusEnum.PREVIEWED,
  })
  status!: SettlementStatusEnum;

  @ApiProperty({
    description: 'Total revenue being settled',
    example: 275000.0,
  })
  totalRevenue!: number;

  @ApiProperty({
    description: 'Total allocated to participants',
    example: 275000.0,
  })
  totalAllocated!: number;

  @ApiProperty({ enum: CurrencyEnum, example: CurrencyEnum.USD })
  currency!: CurrencyEnum;

  @ApiProperty({
    description:
      'Calculated allocations for each participant. These are deterministic based on rules and revenue.',
    type: [SettlementAllocationDto],
  })
  allocations!: SettlementAllocationDto[];

  @ApiProperty({
    description:
      'Proof hash for this calculation. Same inputs will always produce same hash.',
    type: ProofSummaryDto,
  })
  proof!: ProofSummaryDto;

  @ApiProperty({
    description: 'Preview can be re-run; call finalize to lock and persist.',
    example: 'Preview complete. Call POST /settlement-runs/{id}/finalize to lock results.',
  })
  message!: string;
}

// ============================================
// Finalize Settlement Response DTO
// ============================================

export class FinalizeSettlementResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440100' })
  settlementRunId!: string;

  @ApiProperty({
    description: 'Status after finalize (should be FINALIZED)',
    enum: SettlementStatusEnum,
    example: SettlementStatusEnum.FINALIZED,
  })
  status!: SettlementStatusEnum;

  @ApiProperty({ example: 275000.0 })
  totalRevenue!: number;

  @ApiProperty({ example: 275000.0 })
  totalAllocated!: number;

  @ApiProperty({ enum: CurrencyEnum, example: CurrencyEnum.USD })
  currency!: CurrencyEnum;

  @ApiProperty({
    description: 'Final allocations (now persisted and immutable)',
    type: [SettlementAllocationDto],
  })
  allocations!: SettlementAllocationDto[];

  @ApiProperty({
    description: 'Final proof record (now persisted)',
    type: ProofSummaryDto,
  })
  proof!: ProofSummaryDto;

  @ApiProperty({
    description: 'Ledger entries created for this settlement',
    type: LedgerRefDto,
  })
  ledger!: LedgerRefDto;

  @ApiProperty({
    description: 'Timestamp when finalized',
    example: '2024-01-15T10:35:00.000Z',
  })
  finalizedAt!: string;

  @ApiProperty({
    description: 'Finalization is idempotent; re-calling returns same result.',
    example: 'Settlement finalized successfully. Results are now locked.',
  })
  message!: string;
}

// ============================================
// Correction Run DTOs
// ============================================

export class CreateCorrectionRunDto {
  @ApiPropertyOptional({
    description: 'Explanation for why this correction is needed',
    example: 'Revenue batch RB-2024-001 had incorrect amount; correcting with revised figures.',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description:
      'Additional revenue batch IDs to include in the correction (e.g., adjustment batches)',
    example: ['550e8400-e29b-41d4-a716-446655440055'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  adjustmentRevenueBatchIds?: string[];

  @ApiPropertyOptional({
    description: 'Additional parameters for the correction calculation',
    example: { adjustmentType: 'full_reversal', reason: 'data_error' },
  })
  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;
}

export class SettlementRunListResponseDto {
  @ApiProperty({ type: [SettlementRunResponseDto] })
  data!: SettlementRunResponseDto[];

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

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  IsObject,
  IsNumber,
  IsDateString,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// Enums
// ============================================

export enum ParticipantRoleEnum {
  PRODUCER = 'PRODUCER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  INVESTOR = 'INVESTOR',
  TALENT = 'TALENT',
  STUDIO = 'STUDIO',
  LICENSOR = 'LICENSOR',
  LICENSEE = 'LICENSEE',
  COLLECTION_AGENT = 'COLLECTION_AGENT',
}

// ============================================
// Rule Snapshot Participant DTOs
// ============================================

export class RuleSnapshotParticipantInputDto {
  @ApiProperty({
    description: 'UUID of the participant to include in the snapshot',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  participantId!: string;

  @ApiPropertyOptional({
    description: 'Participant-specific rule data (allocation percentages, tiers, etc.)',
    example: { allocationPercentage: 25, tier: 1, cap: 100000 },
  })
  @IsOptional()
  @IsObject()
  participantData?: Record<string, unknown>;
}

export class RuleSnapshotParticipantResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440010' })
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  participantId!: string;

  @ApiProperty({ example: 'Participant Name' })
  participantName!: string;

  @ApiProperty({ enum: ParticipantRoleEnum, example: ParticipantRoleEnum.PRODUCER })
  participantRole!: ParticipantRoleEnum;

  @ApiPropertyOptional({
    description: 'Snapshot of participant-specific rules at time of snapshot',
    example: { allocationPercentage: 25, tier: 1, cap: 100000 },
  })
  participantData?: Record<string, unknown>;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt!: string;
}

// ============================================
// Rule Configuration DTOs
// ============================================

export class AllocationRuleDto {
  @ApiProperty({
    description: 'Settlement phase this rule applies to',
    example: 'NET_PROFITS',
    enum: ['GROSS_RECEIPTS', 'DISTRIBUTION_FEES', 'RECOUPMENT', 'NET_PROFITS'],
  })
  @IsString()
  phase!: string;

  @ApiProperty({
    description: 'Allocation method: percentage, fixed, tiered, waterfall',
    example: 'percentage',
  })
  @IsString()
  method!: string;

  @ApiPropertyOptional({
    description: 'Parameters for the allocation method',
    example: { basePercentage: 50, minimumAmount: 1000 },
  })
  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;
}

export class RuleConfigurationDto {
  @ApiPropertyOptional({
    description: 'Currency for all calculations in this rule set',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Allocation rules by phase',
    type: [AllocationRuleDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllocationRuleDto)
  allocationRules?: AllocationRuleDto[];

  @ApiPropertyOptional({
    description: 'Additional rule parameters and configuration',
    example: { recoupmentOrder: 'sequential', feeCalculationMethod: 'gross' },
  })
  @IsOptional()
  @IsObject()
  additionalParams?: Record<string, unknown>;
}

// ============================================
// Create Rule Snapshot DTOs
// ============================================

export class CreateRuleSnapshotDto {
  @ApiPropertyOptional({
    description:
      'Effective start date for this rule snapshot. If not provided, defaults to now.',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiProperty({
    description:
      'The rule configuration to snapshot. This captures all allocation rules, formulas, and parameters that govern how revenue is distributed among participants.',
    type: RuleConfigurationDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => RuleConfigurationDto)
  rules!: RuleConfigurationDto;

  @ApiProperty({
    description:
      'List of participants to include in this snapshot with their participant-specific rule data. This freezes the participant roster and their individual terms at the time of snapshot.',
    type: [RuleSnapshotParticipantInputDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleSnapshotParticipantInputDto)
  participants!: RuleSnapshotParticipantInputDto[];

  @ApiPropertyOptional({
    description: 'Optional notes or description for this snapshot',
    example: 'Q1 2024 rule update - increased producer share',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ============================================
// Rule Snapshot Response DTOs
// ============================================

export class RuleSnapshotResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the rule snapshot',
    example: '550e8400-e29b-41d4-a716-446655440099',
  })
  id!: string;

  @ApiProperty({
    description: 'Deal this snapshot belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  dealId!: string;

  @ApiProperty({
    description: 'Version number of this snapshot (auto-incremented per deal)',
    example: 3,
  })
  version!: number;

  @ApiProperty({
    description: 'When this rule snapshot becomes effective',
    example: '2024-01-01T00:00:00.000Z',
  })
  effectiveFrom!: string;

  @ApiPropertyOptional({
    description:
      'When this rule snapshot was superseded (null if current). Set automatically when a new snapshot is created.',
    example: null,
  })
  effectiveTo?: string | null;

  @ApiProperty({
    description: 'The frozen rule configuration',
    type: RuleConfigurationDto,
  })
  rules!: RuleConfigurationDto;

  @ApiPropertyOptional({
    description: 'Notes or description for this snapshot',
    example: 'Q1 2024 rule update',
  })
  notes?: string;

  @ApiProperty({
    description: 'Number of participants included in this snapshot',
    example: 5,
  })
  participantCount!: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt!: string;
}

export class RuleSnapshotDetailResponseDto extends RuleSnapshotResponseDto {
  @ApiProperty({
    description: 'Participants included in this snapshot with their frozen rule data',
    type: [RuleSnapshotParticipantResponseDto],
  })
  participants!: RuleSnapshotParticipantResponseDto[];
}

export class RuleSnapshotListResponseDto {
  @ApiProperty({ type: [RuleSnapshotResponseDto] })
  data!: RuleSnapshotResponseDto[];

  @ApiProperty({
    example: { page: 1, limit: 20, total: 3, totalPages: 1 },
  })
  meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

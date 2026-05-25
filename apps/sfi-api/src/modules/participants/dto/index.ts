import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

// ============================================
// Enums
// ============================================

export enum ParticipantBehaviorDto {
  FEE_DEDUCTION = 'FEE_DEDUCTION',
  RECOUPMENT = 'RECOUPMENT',
  NET_PROFIT_SHARE = 'NET_PROFIT_SHARE',
  FLAT_FEE = 'FLAT_FEE',
  PASS_THROUGH = 'PASS_THROUGH',
}

/**
 * Per-row outcome for the bulk import response. Reflects what the upsert did:
 *  - `created` — no matching row existed; this row was inserted
 *  - `updated` — a matching row existed (matched by `(dealId, email)` or `(dealId, externalId)`); this row replaced its fields
 *  - `skipped` — row failed validation; nothing happened
 */
export enum ImportRowOutcomeDto {
  CREATED = 'created',
  UPDATED = 'updated',
  SKIPPED = 'skipped',
}

// ============================================
// Create / Update DTOs
// ============================================

export class CreateParticipantDto {
  @ApiProperty({ description: 'Display name of the participant', maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    description:
      'Custom role label, free-form (e.g. "Hotel Investor", "Operator", "Brand Partner", "Anchor Tenant"). ' +
      'No fixed taxonomy — behavior is driven by `behaviorType`, not this label.',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  roleName!: string;

  @ApiProperty({
    enum: ParticipantBehaviorDto,
    description: 'Behavior type that drives settlement logic',
  })
  @IsEnum(ParticipantBehaviorDto)
  behaviorType!: ParticipantBehaviorDto;

  @ApiPropertyOptional({ description: 'External ID reference', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalId?: string;

  @ApiPropertyOptional({ description: 'Email address of the participant' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description:
      'Investment amount in deal currency. Recommended for investor-type participants — used by the pool resolver as a fallback weighting when units are not provided.',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  investmentAmount?: number;

  @ApiPropertyOptional({
    description:
      'Units / shares held by this participant. Primary weighting input for the pool resolver when present.',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  units?: number;

  @ApiPropertyOptional({
    description:
      'Price per unit at acquisition. If omitted and both `investmentAmount` and `units` are present, the engine derives it as `investmentAmount / units`.',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerUnit?: number;

  @ApiPropertyOptional({
    description:
      'Pool membership flag. Only meaningful for `RECOUPMENT`-behavior participants — marks the row as part of the recoupment investor pool.',
  })
  @IsOptional()
  @IsBoolean()
  poolMember?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateParticipantDto {
  @ApiPropertyOptional({ description: 'Display name of the participant', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Custom role label', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  roleName?: string;

  @ApiPropertyOptional({
    enum: ParticipantBehaviorDto,
    description: 'Behavior type that drives settlement logic',
  })
  @IsOptional()
  @IsEnum(ParticipantBehaviorDto)
  behaviorType?: ParticipantBehaviorDto;

  @ApiPropertyOptional({ description: 'External ID reference', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalId?: string;

  @ApiPropertyOptional({ description: 'Email address of the participant' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Investment amount in deal currency',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  investmentAmount?: number;

  @ApiPropertyOptional({ description: 'Units / shares held by this participant', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  units?: number;

  @ApiPropertyOptional({ description: 'Price per unit at acquisition', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerUnit?: number;

  @ApiPropertyOptional({ description: 'Pool membership flag (Recoupment investors only)' })
  @IsOptional()
  @IsBoolean()
  poolMember?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, unknown>;
}

// ============================================
// Response DTO
// ============================================

export class ParticipantResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  dealId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ description: 'Custom role label provided at creation time' })
  roleName!: string;

  @ApiProperty({ enum: ParticipantBehaviorDto })
  behaviorType!: ParticipantBehaviorDto;

  @ApiPropertyOptional()
  externalId?: string | null;

  @ApiPropertyOptional()
  email?: string | null;

  @ApiPropertyOptional({ description: 'Investment amount in deal currency' })
  investmentAmount?: number | null;

  @ApiPropertyOptional({ description: 'Units / shares held by this participant' })
  units?: number | null;

  @ApiPropertyOptional({ description: 'Price per unit at acquisition' })
  pricePerUnit?: number | null;

  @ApiPropertyOptional({ description: 'Pool membership flag (Recoupment investors only)' })
  poolMember?: boolean | null;

  @ApiPropertyOptional()
  metadata?: Record<string, unknown> | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

// ============================================
// CSV Import / Export DTOs
// ============================================

export class ImportParticipantRowResultDto {
  @ApiProperty({ description: 'Row number in the CSV (1-indexed, header row excluded)' })
  row!: number;

  @ApiProperty({ description: 'Whether this row was imported successfully' })
  success!: boolean;

  @ApiProperty({
    enum: ImportRowOutcomeDto,
    description:
      'What the upsert did for this row: `created` (no match — inserted), `updated` (matched on `(dealId,email)` or `(dealId,externalId)` — replaced fields), or `skipped` (validation failed).',
  })
  outcome!: ImportRowOutcomeDto;

  @ApiPropertyOptional({
    description:
      'Non-fatal warning messages emitted while parsing this row (e.g. `units` provided without `pricePerUnit`). Present even when `success` is true.',
    type: [String],
  })
  warnings?: string[];

  @ApiPropertyOptional({ description: 'Error message if the row failed validation or insert' })
  error?: string;

  @ApiPropertyOptional({ type: () => ParticipantResponseDto })
  participant?: ParticipantResponseDto;
}

export class BulkImportResultDto {
  @ApiProperty({ description: 'Number of rows successfully imported' })
  imported!: number;

  @ApiProperty({ description: 'Number of rows that failed' })
  failed!: number;

  @ApiProperty({ description: 'Per-row results', type: [ImportParticipantRowResultDto] })
  rows!: ImportParticipantRowResultDto[];
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  MaxLength,
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

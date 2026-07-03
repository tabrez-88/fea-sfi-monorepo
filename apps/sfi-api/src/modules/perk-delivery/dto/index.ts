import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { PaginationQueryDto } from '../../deals/dto';

/**
 * PerkDelivery DTOs (MS-3 Wave 6 / Liang MS3-R4).
 *
 * The perk / delivery record answers "when did this participant get
 * their reward, and how do they prove it?" Fields intentionally
 * optional across the board — creators typically only fill in tracking
 * info after they've shipped, so a PENDING row can exist with just a
 * participant reference until later.
 */

export enum PerkDeliveryStatusEnum {
  PENDING = 'PENDING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

export class CreatePerkDeliveryDto {
  @ApiProperty({
    description: 'Participant receiving the perk. Must belong to the parent deal.',
    format: 'uuid',
  })
  @IsUUID()
  participantId!: string;

  @ApiPropertyOptional({
    description:
      'Settlement run this delivery is tied to. Optional — some perks are one-shot campaign rewards not linked to a specific settlement.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  settlementRunId?: string;

  @ApiPropertyOptional({ description: 'Carrier tracking number', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  trackingNumber?: string;

  @ApiPropertyOptional({ description: 'Shipping carrier (UPS, FedEx, DHL, etc.)', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  carrier?: string;

  @ApiPropertyOptional({ description: 'When the perk was shipped', example: '2026-05-01T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  shippedAt?: string;

  @ApiPropertyOptional({ description: 'When delivery was confirmed', example: '2026-05-05T14:30:00Z' })
  @IsOptional()
  @IsDateString()
  deliveredAt?: string;

  @ApiPropertyOptional({ enum: PerkDeliveryStatusEnum, default: PerkDeliveryStatusEnum.PENDING })
  @IsOptional()
  @IsEnum(PerkDeliveryStatusEnum)
  status?: PerkDeliveryStatusEnum;

  @ApiPropertyOptional({ description: 'Free-text notes (≤ 500 chars)', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdatePerkDeliveryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  settlementRunId?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  trackingNumber?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  carrier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  shippedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deliveredAt?: string;

  @ApiPropertyOptional({ enum: PerkDeliveryStatusEnum })
  @IsOptional()
  @IsEnum(PerkDeliveryStatusEnum)
  status?: PerkDeliveryStatusEnum;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class PerkDeliveryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  dealId!: string;

  @ApiProperty({ format: 'uuid' })
  participantId!: string;

  @ApiPropertyOptional({
    description: 'Denormalized participant summary so the FE list view can render without joins.',
    example: { name: 'Alice Investor', email: 'alice@example.com' },
  })
  participant?: { id: string; name: string; email: string | null } | null;

  @ApiPropertyOptional({ format: 'uuid' })
  settlementRunId?: string | null;

  @ApiPropertyOptional({ example: '1Z999AA10123456784' })
  trackingNumber?: string | null;

  @ApiPropertyOptional({ example: 'UPS' })
  carrier?: string | null;

  @ApiPropertyOptional({ example: '2026-05-01T10:00:00.000Z' })
  shippedAt?: string | null;

  @ApiPropertyOptional({ example: '2026-05-05T14:30:00.000Z' })
  deliveredAt?: string | null;

  @ApiProperty({ enum: PerkDeliveryStatusEnum })
  status!: PerkDeliveryStatusEnum;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty({ example: '2026-05-01T09:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-05-05T14:35:00.000Z' })
  updatedAt!: string;
}

export class PerkDeliveryListResponseDto {
  @ApiProperty({ type: [PerkDeliveryResponseDto] })
  data!: PerkDeliveryResponseDto[];

  @ApiProperty({ example: { page: 1, limit: 20, total: 5, totalPages: 1 } })
  meta!: { page: number; limit: number; total: number; totalPages: number };
}

export class PerkDeliveryListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PerkDeliveryStatusEnum })
  @IsOptional()
  @IsEnum(PerkDeliveryStatusEnum)
  status?: PerkDeliveryStatusEnum;

  @ApiPropertyOptional({ description: 'Filter by participant', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  participantId?: string;

  @ApiPropertyOptional({ description: 'Filter by settlement run', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  settlementRunId?: string;
}

// ─── CSV Import ──────────────────────────────────────────────────────────

export enum PerkDeliveryImportOutcomeDto {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  SKIPPED = 'SKIPPED',
}

export class ImportPerkDeliveryRowResultDto {
  @ApiProperty({ example: 1 })
  row!: number;

  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ enum: PerkDeliveryImportOutcomeDto })
  outcome!: PerkDeliveryImportOutcomeDto;

  @ApiPropertyOptional()
  error?: string;

  @ApiPropertyOptional({ type: [String] })
  warnings?: string[];

  @ApiPropertyOptional({ format: 'uuid' })
  perkDeliveryId?: string | null;

  @ApiPropertyOptional()
  participantLookupKey?: string | null;
}

export class ImportPerkDeliveriesResultDto {
  @ApiProperty({ example: 4 })
  imported!: number;

  @ApiProperty({ example: 0 })
  failed!: number;

  @ApiProperty({ type: [ImportPerkDeliveryRowResultDto] })
  rows!: ImportPerkDeliveryRowResultDto[];
}

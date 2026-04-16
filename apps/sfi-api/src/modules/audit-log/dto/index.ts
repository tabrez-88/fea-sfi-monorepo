import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

// ============================================
// Audit Log Entry DTO
// ============================================

export class AuditLogEntryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440500' })
  id!: string;

  @ApiProperty({
    description: 'Who performed the action (user ID or system)',
    example: 'user-123',
  })
  actor!: string;

  @ApiProperty({
    description: 'Action performed',
    example: 'FINALIZED',
  })
  action!: string;

  @ApiProperty({
    description: 'Type of entity affected',
    example: 'SettlementRun',
  })
  entityType!: string;

  @ApiProperty({
    description: 'ID of the entity affected',
    example: '550e8400-e29b-41d4-a716-446655440100',
  })
  entityId!: string;

  @ApiPropertyOptional({
    description: 'Associated deal ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  dealId?: string | null;

  @ApiPropertyOptional({
    description: 'Additional context (before/after values, reason, etc.)',
    example: { previousStatus: 'PREVIEWED', newStatus: 'FINALIZED' },
  })
  metadata?: Record<string, unknown> | null;

  @ApiProperty({ example: '2026-03-12T14:00:00.000Z' })
  timestamp!: string;
}

// ============================================
// Audit Log List Response DTO
// ============================================

export class AuditLogListResponseDto {
  @ApiProperty({ type: [AuditLogEntryDto] })
  data!: AuditLogEntryDto[];

  @ApiProperty({
    example: { page: 1, limit: 20, total: 50, totalPages: 3 },
  })
  meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Audit Log Query DTO
// ============================================

export class AuditLogQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by actor',
    example: 'user-123',
  })
  @IsOptional()
  @IsString()
  actor?: string;

  @ApiPropertyOptional({
    description: 'Filter by action type',
    example: 'FINALIZED',
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({
    description: 'Filter by entity type',
    example: 'SettlementRun',
  })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({
    description: 'Filter by deal ID',
  })
  @IsOptional()
  @IsString()
  dealId?: string;
}

// ============================================
// Create Audit Log DTO (internal use)
// ============================================

export class CreateAuditLogDto {
  actor!: string;
  action!: string;
  entityType!: string;
  entityId!: string;
  dealId?: string;
  metadata?: Record<string, unknown>;
}

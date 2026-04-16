import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Summary ──────────────────────────────────────────────────────────────────

export class DashboardSummaryResponseDto {
  @ApiProperty({
    description: 'Total number of deals across all statuses',
    example: 18,
  })
  totalDeals!: number;

  @ApiProperty({
    description: 'Number of deals currently in ACTIVE status',
    example: 9,
  })
  activeDeals!: number;

  @ApiProperty({
    description:
      'Number of items needing review (PENDING revenue batches + PREVIEWED settlement runs)',
    example: 9,
  })
  pendingReview!: number;

  @ApiProperty({
    description:
      'Sum of SettlementRun.totalAllocated across all FINALIZED runs (in the system default currency)',
    example: 450000000,
  })
  totalSettled!: number;
}

// ─── Pending Reviews ──────────────────────────────────────────────────────────

export class PendingRevenueBatchDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440050' })
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  dealId!: string;

  @ApiProperty({ example: 'The Last Horizon' })
  dealName!: string;

  @ApiProperty({ example: 'RB-2026-004' })
  batchNumber!: string;

  @ApiProperty({ example: 50000000 })
  totalAmount!: number;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty({ example: 'PENDING' })
  status!: string;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  createdAt!: string;
}

export class PendingSettlementRunDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440100' })
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  dealId!: string;

  @ApiProperty({ example: 'The Last Horizon' })
  dealName!: string;

  @ApiProperty({
    description:
      'Display label for the run. For now this is "Run #N" where N is the index of the run within the deal (1-based, oldest first).',
    example: 'Run #3',
  })
  runLabel!: string;

  @ApiProperty({ example: 5000000 })
  totalAllocated!: number;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty({ example: 'PREVIEWED' })
  status!: string;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  createdAt!: string;
}

export class DashboardPendingReviewsResponseDto {
  @ApiProperty({
    description:
      'Revenue batches in PENDING status — awaiting validation. Joined with deal name.',
    type: [PendingRevenueBatchDto],
  })
  revenueBatches!: PendingRevenueBatchDto[];

  @ApiProperty({
    description:
      'Settlement runs in PREVIEWED status — awaiting finalization. Joined with deal name.',
    type: [PendingSettlementRunDto],
  })
  settlementRuns!: PendingSettlementRunDto[];

  @ApiPropertyOptional({
    description: 'Total count of pending items (revenueBatches + settlementRuns)',
    example: 9,
  })
  totalCount?: number;
}

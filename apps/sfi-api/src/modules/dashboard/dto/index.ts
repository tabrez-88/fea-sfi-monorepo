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
      "Count of items needing human review across the authenticated user's deals: " +
      'PENDING revenue batches + PREVIEWED settlement runs.',
    example: 9,
  })
  pendingReview!: number;

  @ApiProperty({
    description:
      "Sum of SettlementRun.totalAllocated across all FINALIZED runs for the authenticated user's deals. " +
      'Raw numeric aggregate — summed across whatever currencies the runs used without conversion. ' +
      'The FE renders this against the user\'s default display currency (USD in the current build).',
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
      'Display label for the run. "Run #N" where N is the count of runs on the same deal created ' +
      'up to and including this run, ordered by createdAt. Derived on-the-fly (not sourced from ' +
      'SettlementRun.runNumber here — that persistent column is used by the settlement endpoints).',
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

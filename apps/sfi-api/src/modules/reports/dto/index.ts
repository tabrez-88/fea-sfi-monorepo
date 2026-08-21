import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================
// Enums
// ============================================

export enum RecoupmentStatusEnum {
  /** No recoupment paid yet. */
  NOT_STARTED = 'NOT_STARTED',
  /** Some capital recovered, cap not reached. */
  IN_PROGRESS = 'IN_PROGRESS',
  /** Cap reached; this investor no longer recoups. */
  RECOUPED = 'RECOUPED',
  /** No cap is configured, so there is nothing to recoup against. */
  NO_CAP = 'NO_CAP',
}

// ============================================
// Screen 5.3: Recoupment Report
// ============================================

export class RecoupmentHistoryEntryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440100' })
  settlementRunId!: string;

  @ApiProperty({ example: 'Run #2' })
  runLabel!: string;

  @ApiProperty({
    description: 'Amount recouped by this investor in this settlement run.',
    example: 25000,
  })
  amount!: number;

  @ApiProperty({
    description:
      'Cumulative recouped total after this run. Mirrors ParticipantBalance at that point in the chain.',
    example: 75000,
  })
  cumulative!: number;

  @ApiProperty({
    description:
      'Capital still outstanding after this run (cap minus cumulative). Zero once fully recouped.',
    example: 50000,
  })
  carryForward!: number;

  @ApiProperty({ example: '2026-03-05T10:30:00.000Z' })
  finalizedAt!: string;
}

export class InvestorRecoupmentDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  participantId!: string;

  @ApiProperty({ example: 'Horizon Ventures Fund' })
  participantName!: string;

  @ApiProperty({ example: 'Investor' })
  roleName!: string;

  @ApiProperty({
    description: 'Capital this investor contributed, from the participant record.',
    example: 100000,
  })
  investmentAmount!: number;

  @ApiPropertyOptional({
    description:
      'Cap multiplier in force (e.g. 1.25 = recoup 125% of capital). Null when the active snapshot sets no cap.',
    example: 1.25,
  })
  capMultiplier?: number | null;

  @ApiPropertyOptional({
    description: 'Absolute recoup ceiling: investmentAmount x capMultiplier.',
    example: 125000,
  })
  capAmount?: number | null;

  @ApiProperty({
    description: 'Total recouped to date across every finalized run.',
    example: 75000,
  })
  totalRecouped!: number;

  @ApiProperty({
    description: 'capAmount minus totalRecouped, floored at zero. Zero when no cap applies.',
    example: 50000,
  })
  remaining!: number;

  @ApiProperty({
    description: 'Percentage of the cap recovered, 0-100. Zero when no cap applies.',
    example: 60,
  })
  progressPercentage!: number;

  @ApiProperty({ enum: RecoupmentStatusEnum, example: RecoupmentStatusEnum.IN_PROGRESS })
  status!: RecoupmentStatusEnum;

  @ApiProperty({
    description: 'Per-settlement recoupment history, oldest first.',
    type: [RecoupmentHistoryEntryDto],
  })
  history!: RecoupmentHistoryEntryDto[];
}

export class RecoupmentReportResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  dealId!: string;

  @ApiProperty({ example: 'The Last Horizon' })
  dealName!: string;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiPropertyOptional({
    description:
      'Version of the rule snapshot the caps were read from (the deal\'s active snapshot). Null when the deal has no snapshot yet.',
    example: 3,
  })
  ruleSnapshotVersion?: number | null;

  @ApiProperty({
    description: 'One entry per investor, sorted by remaining balance descending.',
    type: [InvestorRecoupmentDto],
  })
  investors!: InvestorRecoupmentDto[];

  @ApiProperty({
    description: 'Aggregate across every investor in the report.',
    example: {
      totalInvested: 300000,
      totalRecouped: 180000,
      totalRemaining: 195000,
      fullyRecoupedCount: 1,
    },
  })
  summary!: {
    totalInvested: number;
    totalRecouped: number;
    totalRemaining: number;
    fullyRecoupedCount: number;
  };
}

// ============================================
// Screen 5.4: Participant Statement
// ============================================

export class StatementSettlementEntryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440100' })
  settlementRunId!: string;

  @ApiProperty({ example: 'Run #2' })
  runLabel!: string;

  @ApiProperty({ enum: ['NORMAL', 'CORRECTION'], example: 'NORMAL' })
  runType!: string;

  @ApiProperty({
    description: 'Amount received in this run, summed across every phase.',
    example: 60900000,
  })
  total!: number;

  @ApiProperty({
    description: 'Same amount broken out by settlement phase.',
    example: {
      GROSS_RECEIPTS: 0,
      DISTRIBUTION_FEES: 0,
      RECOUPMENT: 45000000,
      NET_PROFITS: 15900000,
    },
  })
  byPhase!: Record<string, number>;

  @ApiProperty({ example: '2026-03-05T10:30:00.000Z' })
  finalizedAt!: string;

  @ApiPropertyOptional({
    description: 'Proof hash of the run this payout came from, when one exists.',
    example: 'sha256:a3f8b2c1d4e5...',
  })
  proofHash?: string | null;
}

export class ParticipantStatementResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  participantId!: string;

  @ApiProperty({ example: 'Horizon Ventures Fund' })
  participantName!: string;

  @ApiProperty({ example: 'Investor' })
  roleName!: string;

  @ApiProperty({ example: 'RECOUPMENT' })
  behaviorType!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  dealId!: string;

  @ApiProperty({ example: 'The Last Horizon' })
  dealName!: string;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty({
    description: 'When this statement was generated (server time).',
    example: '2026-08-20T09:15:00.000Z',
  })
  generatedAt!: string;

  @ApiProperty({
    description:
      'Lifetime totals for this participant, split by phase so recoupment and profit read separately.',
    example: {
      totalReceived: 60900000,
      totalRecoupment: 45000000,
      totalNetProfit: 15900000,
      totalFees: 0,
      settlementCount: 2,
    },
  })
  summary!: {
    totalReceived: number;
    totalRecoupment: number;
    totalNetProfit: number;
    totalFees: number;
    settlementCount: number;
  };

  @ApiProperty({
    description: 'One entry per finalized settlement that paid this participant, newest first.',
    type: [StatementSettlementEntryDto],
  })
  settlements!: StatementSettlementEntryDto[];
}

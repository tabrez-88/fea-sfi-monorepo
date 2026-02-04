import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================
// Enums
// ============================================

export enum LedgerAccountTypeEnum {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
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
// Ledger Posting DTO
// ============================================

export class LedgerPostingDto {
  @ApiProperty({
    description: 'Unique identifier for the posting',
    example: '550e8400-e29b-41d4-a716-446655440400',
  })
  id!: string;

  @ApiProperty({
    description: 'Journal this posting belongs to',
    example: '550e8400-e29b-41d4-a716-446655440300',
  })
  journalId!: string;

  @ApiPropertyOptional({
    description: 'Participant associated with this posting (null for system accounts)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  participantId?: string | null;

  @ApiPropertyOptional({
    description: 'Participant name for display',
    example: 'Acme Productions LLC',
  })
  participantName?: string | null;

  @ApiProperty({
    description: 'Account type for double-entry accounting',
    enum: LedgerAccountTypeEnum,
    example: LedgerAccountTypeEnum.LIABILITY,
  })
  accountType!: LedgerAccountTypeEnum;

  @ApiProperty({
    description: 'Account code for the posting',
    example: '2100-PAYABLE',
  })
  accountCode!: string;

  @ApiProperty({
    description: 'Debit amount (0 if credit)',
    example: 0,
  })
  debitAmount!: number;

  @ApiProperty({
    description: 'Credit amount (0 if debit)',
    example: 75000,
  })
  creditAmount!: number;

  @ApiProperty({
    description: 'Currency of the posting',
    enum: CurrencyEnum,
    example: CurrencyEnum.USD,
  })
  currency!: CurrencyEnum;

  @ApiPropertyOptional({
    description: 'Description or memo for this posting',
    example: 'Settlement allocation - NET_PROFITS phase',
  })
  description?: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt!: string;
}

// ============================================
// Ledger Journal DTO
// ============================================

export class LedgerJournalDto {
  @ApiProperty({
    description: 'Unique identifier for the journal',
    example: '550e8400-e29b-41d4-a716-446655440300',
  })
  id!: string;

  @ApiProperty({
    description: 'Deal this journal belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  dealId!: string;

  @ApiProperty({
    description: 'Settlement run that created this journal',
    example: '550e8400-e29b-41d4-a716-446655440100',
  })
  settlementRunId!: string;

  @ApiProperty({
    description: 'Auto-generated unique journal number',
    example: 'JRN-2024-00001',
  })
  journalNumber!: string;

  @ApiPropertyOptional({
    description: 'Description of the journal entry',
    example: 'Settlement run SR-2024-001 - Q1 2024 quarterly settlement',
  })
  description?: string | null;

  @ApiProperty({
    description: 'When the journal was posted',
    example: '2024-01-15T10:30:00.000Z',
  })
  postedAt!: string;

  @ApiProperty({
    description: 'Total debit amount (should equal total credit)',
    example: 125000,
  })
  totalDebit!: number;

  @ApiProperty({
    description: 'Total credit amount (should equal total debit)',
    example: 125000,
  })
  totalCredit!: number;

  @ApiProperty({
    description: 'Number of postings in this journal',
    example: 4,
  })
  postingCount!: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt!: string;
}

// ============================================
// Ledger Journal Detail DTO (with postings)
// ============================================

export class LedgerJournalDetailDto extends LedgerJournalDto {
  @ApiProperty({
    description: 'All postings in this journal',
    type: [LedgerPostingDto],
  })
  postings!: LedgerPostingDto[];
}

// ============================================
// Deal Ledger Response DTO
// ============================================

export class DealLedgerResponseDto {
  @ApiProperty({
    description: 'Deal ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  dealId!: string;

  @ApiProperty({
    description: 'All journals for this deal',
    type: [LedgerJournalDto],
  })
  journals!: LedgerJournalDto[];

  @ApiProperty({
    description: 'Summary of ledger activity',
  })
  summary!: {
    totalJournals: number;
    totalPostings: number;
    totalDebits: number;
    totalCredits: number;
    currency: CurrencyEnum;
  };

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

// ============================================
// Participant Ledger DTO
// ============================================

export class ParticipantLedgerEntryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440400' })
  postingId!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440300' })
  journalId!: string;

  @ApiProperty({ example: 'JRN-2024-00001' })
  journalNumber!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440100' })
  settlementRunId!: string;

  @ApiProperty({
    enum: LedgerAccountTypeEnum,
    example: LedgerAccountTypeEnum.LIABILITY,
  })
  accountType!: LedgerAccountTypeEnum;

  @ApiProperty({ example: '2100-PAYABLE' })
  accountCode!: string;

  @ApiProperty({ example: 0 })
  debitAmount!: number;

  @ApiProperty({ example: 75000 })
  creditAmount!: number;

  @ApiProperty({ enum: CurrencyEnum, example: CurrencyEnum.USD })
  currency!: CurrencyEnum;

  @ApiPropertyOptional({ example: 'Settlement allocation' })
  description?: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  postedAt!: string;
}

export class ParticipantLedgerResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  participantId!: string;

  @ApiProperty({ example: 'Acme Productions LLC' })
  participantName!: string;

  @ApiProperty({
    description: 'All ledger entries for this participant',
    type: [ParticipantLedgerEntryDto],
  })
  entries!: ParticipantLedgerEntryDto[];

  @ApiProperty({
    description: 'Running balance summary',
  })
  balance!: {
    totalDebits: number;
    totalCredits: number;
    netBalance: number;
    currency: CurrencyEnum;
  };

  @ApiProperty({
    example: { page: 1, limit: 20, total: 10, totalPages: 1 },
  })
  meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

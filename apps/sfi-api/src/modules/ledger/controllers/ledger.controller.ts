import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { PaginationQueryDto } from '../../deals/dto';
import {
  DealLedgerResponseDto,
  LedgerJournalDetailDto,
  ParticipantLedgerResponseDto,
} from '../dto';
import { LedgerService } from '../services/ledger.service';

@ApiTags('ledger')
@Controller()
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('deals/:dealId/ledger')
  @ApiOperation({
    summary: 'Get ledger for a deal',
    description: `
Returns all ledger journals and a summary for a deal.

**Purpose:**
The ledger is the authoritative source of truth for all financial transactions
related to a deal. Each settlement finalization creates ledger entries that
form an immutable audit trail.

**Double-Entry Accounting:**
All journals are balanced (total debits = total credits). Each posting represents
one side of a double-entry transaction.

**Key Information:**
- All journals created for this deal
- Total debits and credits
- Links to settlement runs that created each journal

**Audit Trail:**
The ledger provides a complete, immutable record of:
- When settlements were finalized
- What amounts were allocated
- Which participants received allocations
    `,
  })
  @ApiParam({
    name: 'dealId',
    type: 'string',
    format: 'uuid',
    description: 'The deal to get ledger for',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Deal ledger with journals and summary',
    type: DealLedgerResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async getDealLedger(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<DealLedgerResponseDto> {
    return this.ledgerService.getDealLedger(dealId, query);
  }

  @Get('ledger-journals/:id')
  @ApiOperation({
    summary: 'Get ledger journal details',
    description: `
Returns a single ledger journal with all its postings.

**Purpose:**
View the complete details of a journal entry including all individual postings
that make up the balanced entry.

**Postings:**
Each journal contains multiple postings:
- Debit postings (increase assets/expenses, decrease liabilities/equity/revenue)
- Credit postings (decrease assets/expenses, increase liabilities/equity/revenue)

**Balance Verification:**
Total debits must equal total credits. This is enforced at creation time
and can be verified here.
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'The ledger journal ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Journal details with all postings',
    type: LedgerJournalDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Journal not found',
  })
  async getJournal(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LedgerJournalDetailDto> {
    return this.ledgerService.getJournal(id);
  }

  @Get('settlement-runs/:settlementRunId/ledger')
  @ApiOperation({
    summary: 'Get ledger for a settlement run',
    description: `
Returns the ledger journal created by a specific settlement run.

**Purpose:**
View the exact ledger entries that were created when a settlement was finalized.

**One-to-One Relationship:**
Each finalized settlement run creates exactly one ledger journal. This endpoint
provides a direct link from settlement to its ledger representation.

**Correction Runs:**
Correction runs also create their own journals, which may contain reversing
entries and new allocations.
    `,
  })
  @ApiParam({
    name: 'settlementRunId',
    type: 'string',
    format: 'uuid',
    description: 'The settlement run ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Ledger journal for the settlement run',
    type: LedgerJournalDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Settlement run not found or not yet finalized',
  })
  async getSettlementLedger(
    @Param('settlementRunId', ParseUUIDPipe) settlementRunId: string,
  ): Promise<LedgerJournalDetailDto> {
    return this.ledgerService.getSettlementLedger(settlementRunId);
  }

  @Get('participants/:participantId/ledger')
  @ApiOperation({
    summary: 'Get ledger entries for a participant',
    description: `
Returns all ledger postings for a specific participant across all deals.

**Purpose:**
View a participant's complete financial history within the system:
- All allocations received
- Running balance
- Links to source settlements

**Balance Calculation:**
The net balance represents the cumulative effect of all postings:
- Credits typically represent amounts owed to the participant
- Debits typically represent payments made or adjustments

**Cross-Deal View:**
This endpoint shows activity across all deals where the participant
is involved, providing a unified view of their position.
    `,
  })
  @ApiParam({
    name: 'participantId',
    type: 'string',
    format: 'uuid',
    description: 'The participant ID',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'dealId',
    required: false,
    type: String,
    description: 'Filter to a specific deal',
  })
  @ApiResponse({
    status: 200,
    description: 'Participant ledger with entries and balance',
    type: ParticipantLedgerResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Participant not found',
  })
  async getParticipantLedger(
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<ParticipantLedgerResponseDto> {
    return this.ledgerService.getParticipantLedger(participantId, query);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
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
  CreateSettlementRunDto,
  SettlementRunResponseDto,
  SettlementRunDetailResponseDto,
  SettlementRunListResponseDto,
  PreviewSettlementResponseDto,
  FinalizeSettlementResponseDto,
  CreateCorrectionRunDto,
} from '../dto';
import { SettlementService } from '../services/settlement.service';

@ApiTags('settlement-runs')
@Controller()
export class SettlementRunsController {
  constructor(private readonly settlementService: SettlementService) {}

  @Post('deals/:dealId/settlement-runs')
  @ApiOperation({
    summary: 'Create a new settlement run',
    description: `
Creates a new settlement run for a deal, selecting a rule snapshot and revenue batches to settle.

**Purpose:**
A settlement run is a calculation of how revenue should be allocated among participants
according to the rules defined in the selected snapshot.

**Requirements:**
- Rule snapshot must exist and belong to this deal
- All revenue batches must be in VALIDATED status
- Revenue batches must belong to this deal

**Initial State:**
- Status: DRAFT
- No allocations calculated yet
- Call /preview to calculate allocations
- Call /finalize to lock and persist results

**Workflow:**
1. Create settlement run (DRAFT)
2. Preview allocations (PREVIEWED) - can preview multiple times
3. Finalize (FINALIZED) - locks results, creates ledger entries

**Determinism:**
Settlement calculations are deterministic. Given the same rule snapshot and revenue batches,
the allocations will always be identical. This ensures auditability and reproducibility.
    `,
  })
  @ApiParam({
    name: 'dealId',
    type: 'string',
    format: 'uuid',
    description: 'The deal to create a settlement run for',
  })
  @ApiResponse({
    status: 201,
    description: 'Settlement run created successfully',
    type: SettlementRunResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input - validation failed or invalid references',
  })
  @ApiResponse({
    status: 404,
    description: 'Deal, rule snapshot, or revenue batch not found',
  })
  async createRun(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Body() createDto: CreateSettlementRunDto,
  ): Promise<SettlementRunResponseDto> {
    return this.settlementService.createRun(dealId, createDto);
  }

  @Get('deals/:dealId/settlement-runs')
  @ApiOperation({
    summary: 'List all settlement runs for a deal',
    description: `
Returns all settlement runs for a deal, with pagination and filtering options.

**Use Cases:**
- View settlement history for a deal
- Find runs by status (DRAFT, PREVIEWED, FINALIZED)
- Audit trail of all settlements

**Includes:**
- Normal runs and correction runs
- All statuses
    `,
  })
  @ApiParam({
    name: 'dealId',
    type: 'string',
    format: 'uuid',
    description: 'The deal to list settlement runs for',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['DRAFT', 'PREVIEWED', 'FINALIZED', 'VOIDED'],
    description: 'Filter by run status',
  })
  @ApiQuery({
    name: 'runType',
    required: false,
    enum: ['NORMAL', 'CORRECTION'],
    description: 'Filter by run type',
  })
  @ApiResponse({
    status: 200,
    description: 'List of settlement runs',
    type: SettlementRunListResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async listRuns(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<SettlementRunListResponseDto> {
    return this.settlementService.listRuns(dealId, query);
  }

  @Get('settlement-runs/:id')
  @ApiOperation({
    summary: 'Get settlement run details',
    description: `
Returns complete details for a settlement run including:
- Run metadata (status, type, dates)
- Revenue batches included
- Allocations (if previewed or finalized)
- Proof record (if previewed or finalized)
- Ledger references (if finalized)

**Use Cases:**
- View settlement results
- Audit calculation details
- Verify proof hash
- Access ledger entries
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'The settlement run ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Settlement run details',
    type: SettlementRunDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Settlement run not found',
  })
  async getRun(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SettlementRunDetailResponseDto> {
    return this.settlementService.getRun(id);
  }

  @Post('settlement-runs/:id/preview')
  @ApiOperation({
    summary: 'Preview settlement allocations',
    description: `
Calculates allocations for the settlement run without persisting them.

**Purpose:**
Preview allows you to see what the settlement results would be before committing.
This is useful for:
- Reviewing allocations before finalization
- Validating that rules produce expected results
- Sharing projected results with stakeholders

**Key Behaviors:**
- Calculation is deterministic (same inputs = same outputs)
- Proof hash is generated for verification
- Results are NOT persisted (can preview multiple times)
- Status changes to PREVIEWED

**Determinism & Auditability:**
The settlement engine produces deterministic results. Given identical:
- Rule snapshot (frozen rules and participant data)
- Revenue batches (frozen amounts)

The allocations will always be identical. The proof hash captures this determinism
for audit purposes.

**After Preview:**
- Review allocations in the response
- If satisfied, call /finalize to lock results
- If not satisfied, adjust inputs and re-create the run
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'The settlement run ID to preview',
  })
  @ApiResponse({
    status: 200,
    description: 'Preview calculated successfully',
    type: PreviewSettlementResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot preview (invalid status or missing data)',
  })
  @ApiResponse({
    status: 404,
    description: 'Settlement run not found',
  })
  async previewRun(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PreviewSettlementResponseDto> {
    return this.settlementService.previewRun(id);
  }

  @Post('settlement-runs/:id/finalize')
  @ApiOperation({
    summary: 'Finalize and lock settlement results',
    description: `
Finalizes the settlement run, persisting allocations and creating ledger entries.

**Purpose:**
Finalization locks the settlement results, making them the official record for:
- Participant payouts
- Accounting/ledger entries
- Audit trail

**Key Behaviors:**
- Status changes to FINALIZED
- Allocations are persisted and immutable
- Proof record is persisted
- Ledger journal and postings are created
- Revenue batches are marked as PROCESSED

**Idempotency:**
Finalize is idempotent. If called on an already-finalized run, it returns
the existing results without modification. This ensures safe retries.

**Immutability:**
Once finalized:
- Allocations cannot be changed
- Ledger entries cannot be modified
- To correct errors, create a CORRECTION run

**After Finalization:**
- Allocations are official
- Ledger reflects the settlement
- Participants can be paid based on allocations
- Any corrections require a new correction run
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'The settlement run ID to finalize',
  })
  @ApiResponse({
    status: 200,
    description: 'Settlement finalized successfully (or already finalized - idempotent)',
    type: FinalizeSettlementResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot finalize (must preview first, or invalid status)',
  })
  @ApiResponse({
    status: 404,
    description: 'Settlement run not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - settlement already voided or in invalid state',
  })
  async finalizeRun(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FinalizeSettlementResponseDto> {
    return this.settlementService.finalizeRun(id);
  }

  @Post('settlement-runs/:id/corrections')
  @ApiOperation({
    summary: 'Create a correction run for an existing settlement',
    description: `
Creates a correction settlement run to adjust a previously finalized settlement.

**Purpose:**
Corrections are needed when:
- Revenue data was incorrect
- Rules were applied incorrectly
- Participant terms need adjustment

**Key Behaviors:**
- Creates a new run with run_type=CORRECTION
- Links to original via original_settlement_run_id
- Can include adjustment revenue batches
- Follows same preview/finalize workflow

**Correction Approaches:**
1. **Full Reversal + Re-run**: Create reversing entries, then new settlement
2. **Delta Adjustment**: Calculate difference and create adjustment entries
3. **Supplemental**: Add additional allocations

**Original Run:**
The original settlement run remains unchanged (immutable). The correction run
captures the adjustment and creates new ledger entries.

**Audit Trail:**
The correction chain (original -> correction) provides full audit history:
- What was originally settled
- What corrections were made
- When and why corrections occurred
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'The original settlement run ID to correct',
  })
  @ApiResponse({
    status: 201,
    description: 'Correction run created successfully',
    type: SettlementRunResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot create correction (original not finalized)',
  })
  @ApiResponse({
    status: 404,
    description: 'Original settlement run not found',
  })
  async createCorrectionRun(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createDto: CreateCorrectionRunDto,
  ): Promise<SettlementRunResponseDto> {
    return this.settlementService.createCorrectionRun(id, createDto);
  }
}

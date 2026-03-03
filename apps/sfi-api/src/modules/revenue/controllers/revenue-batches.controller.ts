import {
  Controller,
  Get,
  Post,
  Patch,
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
  CreateRevenueBatchDto,
  RevenueBatchResponseDto,
  RevenueBatchListResponseDto,
  ValidateRevenueBatchDto,
  RejectRevenueBatchDto,
} from '../dto';
import { RevenueService } from '../services/revenue.service';

@ApiTags('revenue-batches')
@Controller()
export class RevenueBatchesController {
  constructor(private readonly revenueService: RevenueService) {}

  @Post('deals/:dealId/revenue-batches')
  @ApiOperation({
    summary: 'Create a revenue batch for a deal',
    description: `
Creates a new revenue batch representing income received for a specific period.

**Purpose:**
Revenue batches are the input data for settlement calculations. Each batch represents
revenue collected during a specific time period from a specific source.

**Key Behaviors:**
- Auto-generates a unique batch number (e.g., RB-2024-001)
- Initial status is PENDING
- Batch must be validated before it can be used in settlements
- Multiple batches can cover overlapping or non-overlapping periods

**Workflow:**
1. Create batch (status: PENDING)
2. Validate batch (status: VALIDATED) - can now be used in settlements
3. Include in settlement run (status: PROCESSED after settlement finalized)

**Data Quality:**
- totalAmount should match the sum of any line items in metadata
- periodStart must be before periodEnd
- Currency must match deal's configured currency (when enforced)
    `,
  })
  @ApiParam({
    name: 'dealId',
    type: 'string',
    format: 'uuid',
    description: 'The deal to create a revenue batch for',
  })
  @ApiResponse({
    status: 201,
    description: 'Revenue batch created successfully',
    type: RevenueBatchResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: `Invalid input. Possible errors:
- periodStart must be before periodEnd
- totalAmount must be >= 0
- Invalid currency code
- Invalid date format`,
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async createBatch(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Body() createDto: CreateRevenueBatchDto,
  ): Promise<RevenueBatchResponseDto> {
    return this.revenueService.createBatch(dealId, createDto);
  }

  @Get('deals/:dealId/revenue-batches')
  @ApiOperation({
    summary: 'List all revenue batches for a deal',
    description: `
Returns all revenue batches for a deal, with pagination and filtering options.

**Use Cases:**
- View revenue history for a deal
- Find unprocessed batches ready for settlement
- Audit trail of all revenue intake

**Filtering:**
- By status (PENDING, VALIDATED, PROCESSED, REJECTED)
- By date range
- By settlement status (settled vs unsettled)
    `,
  })
  @ApiParam({
    name: 'dealId',
    type: 'string',
    format: 'uuid',
    description: 'The deal to list revenue batches for',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'VALIDATED', 'PROCESSED', 'REJECTED'],
    description: 'Filter by batch status',
  })
  @ApiQuery({
    name: 'unsettledOnly',
    required: false,
    type: Boolean,
    description: 'Only return batches not yet included in any settlement',
  })
  @ApiResponse({
    status: 200,
    description: 'List of revenue batches',
    type: RevenueBatchListResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async listBatches(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<RevenueBatchListResponseDto> {
    return this.revenueService.listBatches(dealId, query);
  }

  @Get('revenue-batches/:id')
  @ApiOperation({
    summary: 'Get revenue batch details',
    description: `
Returns detailed information about a specific revenue batch.

**Response includes:**
- Full batch data including metadata
- Settlement run references (if processed)
- Associated documents (if any)
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'The revenue batch ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue batch details',
    type: RevenueBatchResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Revenue batch not found',
  })
  async getBatch(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RevenueBatchResponseDto> {
    return this.revenueService.getBatch(id);
  }

  @Patch('revenue-batches/:id/validate')
  @ApiOperation({
    summary: 'Validate a revenue batch',
    description: `
Marks a revenue batch as validated, making it eligible for inclusion in settlement runs.

**Requirements:**
- Batch must be in PENDING status
- Cannot validate a batch that has already been validated, processed, or rejected

**After Validation:**
- Status changes to VALIDATED
- Batch can now be selected for settlement runs
- Validation is reversible (batch can be rejected if issues found)

**Best Practices:**
- Validate batches only after verifying against source documents
- Include validation notes for audit trail
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'The revenue batch ID to validate',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue batch validated successfully',
    type: RevenueBatchResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Batch cannot be validated (wrong status)',
  })
  @ApiResponse({
    status: 404,
    description: 'Revenue batch not found',
  })
  async validateBatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() validateDto: ValidateRevenueBatchDto,
  ): Promise<RevenueBatchResponseDto> {
    return this.revenueService.validateBatch(id, validateDto);
  }

  @Patch('revenue-batches/:id/reject')
  @ApiOperation({
    summary: 'Reject a revenue batch',
    description: `
Marks a revenue batch as rejected, preventing it from being used in settlements.

**Requirements:**
- Batch must be in PENDING or VALIDATED status
- Cannot reject a batch that has already been processed in a settlement

**Use Cases:**
- Data quality issues found after creation
- Duplicate batch detected
- Source data was incorrect

**After Rejection:**
- Status changes to REJECTED
- Batch cannot be used in future settlements
- Create a new batch with corrected data if needed
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'The revenue batch ID to reject',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue batch rejected',
    type: RevenueBatchResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Batch cannot be rejected (already processed)',
  })
  @ApiResponse({
    status: 404,
    description: 'Revenue batch not found',
  })
  async rejectBatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() rejectDto: RejectRevenueBatchDto,
  ): Promise<RevenueBatchResponseDto> {
    return this.revenueService.rejectBatch(id, rejectDto);
  }
}

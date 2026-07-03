import {
  Controller,
  Delete,
  Get,
  Post,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/jwt-payload';
import {
  BulkCreateRevenueLineItemsDto,
  CreateRevenueBatchDto,
  RevenueBatchResponseDto,
  RevenueBatchListResponseDto,
  RevenueBatchListQueryDto,
  RevenueBatchStatusEnum,
  RevenueBatchSummaryDto,
  RevenueLineItemResponseDto,
  UpdateRevenueLineItemDto,
  ValidateRevenueBatchDto,
  RejectRevenueBatchDto,
} from '../dto';
import { RevenueService } from '../services/revenue.service';

@ApiTags('revenue-batches')
@ApiBearerAuth('bearer')
@Controller()
export class RevenueBatchesController {
  constructor(private readonly revenueService: RevenueService) {}

  @Post('deals/:dealId/revenue-batches')
  @ApiOperation({
    summary: 'Create a revenue batch for a deal',
    description:
      'Accepts optional categorization fields (`territory`, `revenueType`, `reportingEntity`) — ' +
      'free-form strings, no closed enum on either, but the UI surfaces common presets ' +
      '(Territory: Global / US / EU / APAC / Indonesia; Revenue Type: Streaming / Box Office / ' +
      'Licensing / Live / Merch). Stored inside `metadata` JSON; no schema migration.',
  })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Revenue batch created successfully', type: RevenueBatchResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async createBatch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Body() createDto: CreateRevenueBatchDto,
  ): Promise<RevenueBatchResponseDto> {
    return this.revenueService.createBatch(user.id, dealId, createDto);
  }

  @Get('deals/:dealId/revenue-batches')
  @ApiOperation({
    summary: 'List all revenue batches for a deal',
    description:
      'Supports optional categorization filters via `?territory=`, `?revenueType=`, and ' +
      '`?reportingEntity=` — each one narrows the list to exact matches on the corresponding ' +
      '`metadata` field. Filters AND-combine.',
  })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Defaults to createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Defaults to desc' })
  @ApiQuery({ name: 'status', required: false, enum: RevenueBatchStatusEnum, description: 'Filter by batch status (drives Screen 3.1 filter tabs)' })
  @ApiQuery({ name: 'territory', required: false, type: String, description: 'Exact-match filter on metadata.territory (e.g. US, EU, APAC)' })
  @ApiQuery({ name: 'revenueType', required: false, type: String, description: 'Exact-match filter on metadata.revenueType (e.g. Streaming, Box Office)' })
  @ApiQuery({ name: 'reportingEntity', required: false, type: String, description: 'Exact-match filter on metadata.reportingEntity (e.g. Spotify, Netflix)' })
  @ApiResponse({ status: 200, description: 'List of revenue batches', type: RevenueBatchListResponseDto })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async listBatches(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Query() query: RevenueBatchListQueryDto,
  ): Promise<RevenueBatchListResponseDto> {
    return this.revenueService.listBatches(user.id, dealId, query);
  }

  @Get('deals/:dealId/revenue-batches/summary')
  @ApiOperation({
    summary: 'Aggregate summary for a deal (counts + amounts per status)',
    description:
      'Powers Screen 3.1 filter tab counts ([Pending (1)] [Validated (1)] …) AND the ' +
      'summary bar (Total Revenue $X · Pending: $Y · Validated: $Z · Processed: $W). ' +
      'Single query returns both to save a round-trip. `currency` is `null` when the ' +
      "deal's batches span multiple currencies.",
  })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Revenue batches summary', type: RevenueBatchSummaryDto })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async getSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealId', ParseUUIDPipe) dealId: string,
  ): Promise<RevenueBatchSummaryDto> {
    return this.revenueService.getSummary(user.id, dealId);
  }

  @Get('revenue-batches/:id')
  @ApiOperation({ summary: 'Get revenue batch details' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Revenue batch details', type: RevenueBatchResponseDto })
  @ApiResponse({ status: 404, description: 'Revenue batch not found' })
  async getBatch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RevenueBatchResponseDto> {
    return this.revenueService.getBatch(user.id, id);
  }

  @Patch('revenue-batches/:id/validate')
  @ApiOperation({ summary: 'Validate a revenue batch' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Revenue batch validated successfully', type: RevenueBatchResponseDto })
  @ApiResponse({ status: 400, description: 'Batch cannot be validated (wrong status)' })
  @ApiResponse({ status: 404, description: 'Revenue batch not found' })
  async validateBatch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() validateDto: ValidateRevenueBatchDto,
  ): Promise<RevenueBatchResponseDto> {
    return this.revenueService.validateBatch(user.id, id, validateDto);
  }

  @Patch('revenue-batches/:id/reject')
  @ApiOperation({ summary: 'Reject a revenue batch' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Revenue batch rejected', type: RevenueBatchResponseDto })
  @ApiResponse({ status: 400, description: 'Batch cannot be rejected (already processed)' })
  @ApiResponse({ status: 404, description: 'Revenue batch not found' })
  async rejectBatch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() rejectDto: RejectRevenueBatchDto,
  ): Promise<RevenueBatchResponseDto> {
    return this.revenueService.rejectBatch(user.id, id, rejectDto);
  }

  // ─── MS-3 Wave 3 (Liang MS3-R1) — Revenue Line Items ───────────────────

  @Post('revenue-batches/:id/line-items')
  @ApiOperation({
    summary: 'Bulk-add line items to a revenue batch',
    description:
      'Runs inside a single transaction. Every row inherits the parent batch currency ' +
      'unless it supplies one, in which case it must match. Batch must be PENDING.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Line items created', type: [RevenueLineItemResponseDto] })
  @ApiResponse({ status: 400, description: 'Invalid input or batch is not PENDING' })
  @ApiResponse({ status: 404, description: 'Revenue batch not found' })
  async addLineItems(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BulkCreateRevenueLineItemsDto,
  ): Promise<RevenueLineItemResponseDto[]> {
    return this.revenueService.addLineItems(user.id, id, dto);
  }

  @Patch('revenue-batches/:id/line-items/:lineItemId')
  @ApiOperation({
    summary: 'Update a line item on a revenue batch',
    description: 'Batch must be PENDING. All fields optional; currency (if supplied) must match batch currency.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'lineItemId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Line item updated', type: RevenueLineItemResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input or batch is not PENDING' })
  @ApiResponse({ status: 404, description: 'Batch or line item not found' })
  async updateLineItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('lineItemId', ParseUUIDPipe) lineItemId: string,
    @Body() dto: UpdateRevenueLineItemDto,
  ): Promise<RevenueLineItemResponseDto> {
    return this.revenueService.updateLineItem(user.id, id, lineItemId, dto);
  }

  @Delete('revenue-batches/:id/line-items/:lineItemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a line item from a revenue batch',
    description: 'Batch must be PENDING.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'lineItemId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Line item deleted' })
  @ApiResponse({ status: 400, description: 'Batch is not PENDING' })
  @ApiResponse({ status: 404, description: 'Batch or line item not found' })
  async deleteLineItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('lineItemId', ParseUUIDPipe) lineItemId: string,
  ): Promise<{ success: true }> {
    return this.revenueService.deleteLineItem(user.id, id, lineItemId);
  }
}

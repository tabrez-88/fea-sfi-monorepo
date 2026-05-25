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
  CreateRevenueBatchDto,
  RevenueBatchResponseDto,
  RevenueBatchListResponseDto,
  RevenueBatchListQueryDto,
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
}

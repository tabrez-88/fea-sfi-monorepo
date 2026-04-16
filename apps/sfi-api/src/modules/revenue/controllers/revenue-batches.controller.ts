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

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/jwt-payload';
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
  @ApiOperation({ summary: 'Create a revenue batch for a deal' })
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
  @ApiOperation({ summary: 'List all revenue batches for a deal' })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of revenue batches', type: RevenueBatchListResponseDto })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async listBatches(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Query() query: PaginationQueryDto,
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

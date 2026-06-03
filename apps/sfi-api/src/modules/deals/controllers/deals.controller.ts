import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
  CreateDealDto,
  DealCountsResponseDto,
  DealListQueryDto,
  DealResponseDto,
  DealStatusDto,
  UpdateDealDto,
} from '../dto';
import { DealsService } from '../services/deals.service';

@ApiTags('deals')
@ApiBearerAuth('bearer')
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new deal' })
  @ApiResponse({
    status: 201,
    description: 'Deal created successfully',
    type: DealResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createDealDto: CreateDealDto,
  ): Promise<DealResponseDto> {
    return this.dealsService.create(user.id, createDealDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List deals (paginated, filterable, searchable)',
    description:
      'Returns deals owned by the authenticated user with `_count.participants` joined for the ' +
      'FE Recent Deals and Deals List tables. Response shape: `{ data: DealResponseDto[], meta: { page, limit, total, totalPages } }`.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Defaults to 1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Defaults to 20, max 100' })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Any Deal column (createdAt, updatedAt, name, effectiveDate, terminationDate). Defaults to createdAt.',
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Defaults to desc' })
  @ApiQuery({ name: 'status', required: false, enum: DealStatusDto })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Case-insensitive substring match on name OR description',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of deals — each item has `participantsCount` joined',
  })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: DealListQueryDto,
  ) {
    return this.dealsService.findAll(user.id, query);
  }

  @Get('counts')
  @ApiOperation({
    summary: 'Get deal counts grouped by status',
    description:
      'Powers the Deals List status tabs (All / Active / Draft / Closed). Scoped to the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Counts per status bucket',
    type: DealCountsResponseDto,
  })
  async getCounts(@CurrentUser() user: AuthenticatedUser): Promise<DealCountsResponseDto> {
    return this.dealsService.getCounts(user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a deal by ID',
    description:
      'Returns the deal with aggregate counts (participants, ruleSnapshots, revenueBatches, settlementRuns) and totalRevenue. Returns 404 if deal does not belong to the authenticated user.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Deal found', type: DealResponseDto })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DealResponseDto> {
    return this.dealsService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a deal',
    description:
      'Partial update. Status changes to/from SUSPENDED can include `notes`. Returns 404 if deal does not belong to the authenticated user.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Deal updated',
    type: DealResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input or date validation failed' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDealDto: UpdateDealDto,
  ): Promise<DealResponseDto> {
    return this.dealsService.update(user.id, id, updateDealDto);
  }

  @Post(':id/duplicate')
  @ApiOperation({
    summary: 'Duplicate a deal as a new DRAFT',
    description:
      'Clones an existing deal\'s static fields (name + " (Copy)", description, category, dealOwner, currency, effective/termination dates) into a new DRAFT deal. Does NOT carry over participants, rule snapshots, revenue batches, or settlement runs — those belong to the original. Returns the newly-created deal. Per Liang Round 4: this is the escape hatch so a closed/completed deal can spawn a follow-up without retyping everything (closed deals stay immutable).',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'New deal created', type: DealResponseDto })
  @ApiResponse({ status: 404, description: 'Source deal not found' })
  async duplicate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DealResponseDto> {
    return this.dealsService.duplicate(user.id, id);
  }
}

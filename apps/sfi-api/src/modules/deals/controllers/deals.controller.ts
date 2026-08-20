import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
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
  ImportDealsResultDto,
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

  // MS-3 Wave 6 (Liang MS3-R2) — Deal Registration CSV import.
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Bulk-import deals from a CSV export (Deal Registration v1)',
    description:
      'Accepts a CSV with header row. Required columns: `name`, `effectiveDate`. Optional: ' +
      '`externalDealId`, `category`, `dealOwner`, `currency`, `terminationDate`, `status`, ' +
      '`description`, `notes`. Match strategy: when `externalDealId` is supplied, upsert on ' +
      '`(userId, externalDealId)`; otherwise every row creates a new deal. Use `?dryRun=true` ' +
      "for the FE Preview Import step. Use `?skipErrors=true` to keep going past failed rows.",
  })
  @ApiQuery({ name: 'dryRun', required: false, type: Boolean, description: 'Parse + validate only, do not persist. Defaults to false.' })
  @ApiQuery({ name: 'skipErrors', required: false, type: Boolean, description: 'Report failed rows instead of aborting. Defaults to false.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'CSV file (UTF-8, header row required)' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Import result', type: ImportDealsResultDto })
  @ApiResponse({ status: 400, description: 'Invalid CSV or row-level errors' })
  async importCsv(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Query('dryRun') dryRun?: string,
    @Query('skipErrors') skipErrors?: string,
  ): Promise<ImportDealsResultDto> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Missing CSV file upload');
    }
    return this.dealsService.importFromCsv(
      user.id,
      file.buffer,
      skipErrors === 'true',
      dryRun === 'true',
    );
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

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a deal',
    description:
      'Permanently deletes the deal and everything scoped under it (participants, rule snapshots, revenue batches, settlement runs) via cascade. Rejected with 409 when the deal has any FINALIZED settlement run, since those carry ledger entries and proof records: archive the deal instead. Returns 404 if the deal does not belong to the authenticated user.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Deal deleted' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  @ApiResponse({
    status: 409,
    description: 'Deal has finalized settlement runs and cannot be deleted',
  })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.dealsService.remove(user.id, id);
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

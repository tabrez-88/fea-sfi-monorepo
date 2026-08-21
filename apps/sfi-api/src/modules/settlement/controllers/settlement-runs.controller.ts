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
  CreateSettlementRunDto,
  SettlementRunResponseDto,
  SettlementRunDetailResponseDto,
  SettlementRunListResponseDto,
  SettlementRunListQueryDto,
  PreviewSettlementResponseDto,
  FinalizeSettlementResponseDto,
  CreateCorrectionRunDto,
  ProofVerificationResponseDto,
} from '../dto';
import { SettlementService } from '../services/settlement.service';

@ApiTags('settlement-runs')
@ApiBearerAuth('bearer')
@Controller()
export class SettlementRunsController {
  constructor(private readonly settlementService: SettlementService) {}

  @Post('deals/:dealId/settlement-runs')
  @ApiOperation({ summary: 'Create a new settlement run' })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Settlement run created successfully', type: SettlementRunResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input or validation failed' })
  @ApiResponse({ status: 404, description: 'Deal, rule snapshot, or revenue batch not found' })
  async createRun(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Body() createDto: CreateSettlementRunDto,
  ): Promise<SettlementRunResponseDto> {
    return this.settlementService.createRun(user.id, dealId, createDto);
  }

  @Get('deals/:dealId/settlement-runs')
  @ApiOperation({
    summary: 'List all settlement runs for a deal',
    description:
      'Response items include the Latest Settlement card enrichments — runNumber, runLabel, ' +
      'ruleSnapshotVersion, revenueBatchCount, totalRevenue, proofHash, finalizedAt — so the FE ' +
      'can render the Deal Overview card from a single request (typically with limit=1, sortBy=createdAt, sortOrder=desc).',
  })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Defaults to createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Defaults to desc' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['DRAFT', 'PREVIEWED', 'FINALIZED', 'CANCELLED', 'VOIDED'],
    description: 'Filter by run status, e.g. FINALIZED for the Proof Overview.',
  })
  @ApiQuery({
    name: 'runType',
    required: false,
    enum: ['NORMAL', 'CORRECTION'],
    description: 'Filter by run type.',
  })
  @ApiResponse({ status: 200, description: 'List of settlement runs', type: SettlementRunListResponseDto })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async listRuns(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Query() query: SettlementRunListQueryDto,
  ): Promise<SettlementRunListResponseDto> {
    return this.settlementService.listRuns(user.id, dealId, query);
  }

  @Get('settlement-runs/:id')
  @ApiOperation({ summary: 'Get settlement run details' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Settlement run details', type: SettlementRunDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Settlement run not found' })
  async getRun(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SettlementRunDetailResponseDto> {
    return this.settlementService.getRun(user.id, id);
  }

  @Post('settlement-runs/:id/preview')
  @ApiOperation({ summary: 'Preview settlement allocations' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Preview calculated successfully', type: PreviewSettlementResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot preview (invalid status or missing data)' })
  @ApiResponse({ status: 404, description: 'Settlement run not found' })
  async previewRun(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PreviewSettlementResponseDto> {
    return this.settlementService.previewRun(user.id, id);
  }

  @Post('settlement-runs/:id/finalize')
  @ApiOperation({ summary: 'Finalize and lock settlement results' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Settlement finalized successfully', type: FinalizeSettlementResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot finalize (must preview first, or invalid status)' })
  @ApiResponse({ status: 404, description: 'Settlement run not found' })
  @ApiResponse({ status: 409, description: 'Conflict - settlement already voided' })
  async finalizeRun(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FinalizeSettlementResponseDto> {
    return this.settlementService.finalizeRun(user.id, id);
  }

  @Post('settlement-runs/:id/corrections')
  @ApiOperation({ summary: 'Create a correction run for an existing settlement' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'The original settlement run ID' })
  @ApiResponse({ status: 201, description: 'Correction run created successfully', type: SettlementRunResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot create correction (original not finalized)' })
  @ApiResponse({ status: 404, description: 'Original settlement run not found' })
  async createCorrectionRun(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createDto: CreateCorrectionRunDto,
  ): Promise<SettlementRunResponseDto> {
    return this.settlementService.createCorrectionRun(user.id, id, createDto);
  }

  @Post('settlement-runs/:id/verify')
  @ApiOperation({ summary: 'Verify settlement integrity' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Verification result', type: ProofVerificationResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot verify (invalid status)' })
  @ApiResponse({ status: 404, description: 'Settlement run or proof record not found' })
  async verifyRun(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProofVerificationResponseDto> {
    return this.settlementService.verifyRun(user.id, id);
  }
}

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
import { PaginationQueryDto } from '../../deals/dto';
import {
  CreateRuleSnapshotDto,
  RuleSnapshotResponseDto,
  RuleSnapshotDetailResponseDto,
  RuleSnapshotListResponseDto,
} from '../dto';
import { RulesService } from '../services/rules.service';

@ApiTags('rule-snapshots')
@ApiBearerAuth('bearer')
@Controller()
export class RuleSnapshotsController {
  constructor(private readonly rulesService: RulesService) {}

  @Post('deals/:dealId/rule-snapshots')
  @ApiOperation({ summary: 'Create a rule snapshot for a deal' })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Rule snapshot created successfully', type: RuleSnapshotResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input or validation failed' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async createSnapshot(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Body() createDto: CreateRuleSnapshotDto,
  ): Promise<RuleSnapshotResponseDto> {
    return this.rulesService.createSnapshot(user.id, dealId, createDto);
  }

  @Get('deals/:dealId/rule-snapshots')
  @ApiOperation({ summary: 'List all rule snapshots for a deal' })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Defaults to createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Defaults to desc' })
  @ApiResponse({ status: 200, description: 'List of rule snapshots', type: RuleSnapshotListResponseDto })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async listSnapshots(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<RuleSnapshotListResponseDto> {
    return this.rulesService.listSnapshots(user.id, dealId, query);
  }

  @Get('rule-snapshots/:id')
  @ApiOperation({ summary: 'Get rule snapshot details' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Rule snapshot details', type: RuleSnapshotDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Rule snapshot not found' })
  async getSnapshot(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RuleSnapshotDetailResponseDto> {
    return this.rulesService.getSnapshot(user.id, id);
  }
}

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
  CreateRuleSnapshotDto,
  RuleSnapshotResponseDto,
  RuleSnapshotDetailResponseDto,
  RuleSnapshotListResponseDto,
} from '../dto';
import { RulesService } from '../services/rules.service';

@ApiTags('rule-snapshots')
@Controller()
export class RuleSnapshotsController {
  constructor(private readonly rulesService: RulesService) {}

  @Post('deals/:dealId/rule-snapshots')
  @ApiOperation({
    summary: 'Create a rule snapshot for a deal',
    description: `
Creates an immutable snapshot of the deal's rules and participant roster at a point in time.

**Purpose:**
Rule snapshots capture the exact allocation rules, formulas, and participant terms that will govern
settlement calculations. Once created, a snapshot cannot be modified - this ensures auditability
and reproducibility of settlement results.

**Key Behaviors:**
- Automatically increments the version number for this deal
- Sets effectiveTo on the previous snapshot (if any) to this snapshot's effectiveFrom
- Validates that all referenced participants exist and belong to this deal
- The rules configuration is deeply frozen and stored as-is

**When to Create Snapshots:**
- Before the first settlement run
- When deal terms are amended
- When participants are added/removed/modified
- At contractually significant dates (e.g., quarterly reviews)

**Immutability:**
Once created, rule snapshots cannot be edited or deleted. If rules need to change,
create a new snapshot with updated terms.
    `,
  })
  @ApiParam({
    name: 'dealId',
    type: 'string',
    format: 'uuid',
    description: 'The deal to create a rule snapshot for',
  })
  @ApiResponse({
    status: 201,
    description: 'Rule snapshot created successfully',
    type: RuleSnapshotResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: `Invalid input. Possible errors:
- Participant ID not found in this deal
- feePercentage must be 0-100
- recoupCap must be positive
- netProfitPercentage must be 0-100
- Net profit percentages sum exceeds 100%`,
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async createSnapshot(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Body() createDto: CreateRuleSnapshotDto,
  ): Promise<RuleSnapshotResponseDto> {
    return this.rulesService.createSnapshot(dealId, createDto);
  }

  @Get('deals/:dealId/rule-snapshots')
  @ApiOperation({
    summary: 'List all rule snapshots for a deal',
    description: `
Returns all rule snapshots for a deal, ordered by version (newest first).

**Use Cases:**
- View the history of rule changes for a deal
- Find the appropriate snapshot for a specific date
- Audit trail of all rule modifications

**Response:**
Each snapshot includes summary information. Use GET /rule-snapshots/{id} for full details
including participant data.
    `,
  })
  @ApiParam({
    name: 'dealId',
    type: 'string',
    format: 'uuid',
    description: 'The deal to list rule snapshots for',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({
    status: 200,
    description: 'List of rule snapshots',
    type: RuleSnapshotListResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async listSnapshots(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<RuleSnapshotListResponseDto> {
    return this.rulesService.listSnapshots(dealId, query);
  }

  @Get('rule-snapshots/:id')
  @ApiOperation({
    summary: 'Get rule snapshot details',
    description: `
Returns the complete rule snapshot including all participant data.

**Response includes:**
- Full rule configuration
- All participants with their frozen terms
- Effective date range
- Version information
- **ruleSummary**: auto-generated breakdown of distribution fees, recoupment caps, net profit splits, and warnings

**Use Cases:**
- Inspect the exact rules used for a settlement run
- Audit participant terms at a specific point in time
- Debug settlement calculation discrepancies
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'The rule snapshot ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Rule snapshot details',
    type: RuleSnapshotDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Rule snapshot not found',
  })
  async getSnapshot(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RuleSnapshotDetailResponseDto> {
    return this.rulesService.getSnapshot(id);
  }
}

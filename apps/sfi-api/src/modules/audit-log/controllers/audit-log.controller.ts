import {
  Controller,
  Get,
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

import {
  AuditLogEntryDto,
  AuditLogListResponseDto,
  AuditLogQueryDto,
} from '../dto';
import { AuditLogService } from '../services/audit-log.service';

@ApiTags('audit-log')
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({
    summary: 'List audit log entries',
    description: `
Returns a paginated list of all audit log entries, ordered by most recent first.

**Filters:**
- actor: Filter by who performed the action
- action: Filter by action type (CREATED, VALIDATED, FINALIZED, VOIDED, etc.)
- entityType: Filter by entity type (Deal, RevenueBatch, SettlementRun, etc.)
- dealId: Filter by associated deal

**Use Cases:**
- Review all activity for a specific deal
- Track who finalized settlements
- Audit trail for compliance
    `,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'actor', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'entityType', required: false, type: String })
  @ApiQuery({ name: 'dealId', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of audit log entries',
    type: AuditLogListResponseDto,
  })
  async list(
    @Query() query: AuditLogQueryDto,
  ): Promise<AuditLogListResponseDto> {
    return this.auditLogService.list(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get audit log entry detail',
    description: 'Returns full details of a single audit log entry including metadata.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'The audit log entry ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit log entry detail',
    type: AuditLogEntryDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Audit log entry not found',
  })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AuditLogEntryDto> {
    return this.auditLogService.getById(id);
  }
}

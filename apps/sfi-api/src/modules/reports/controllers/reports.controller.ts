import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/jwt-payload';
import {
  ParticipantStatementResponseDto,
  RecoupmentReportResponseDto,
} from '../dto';
import { ReportsService } from '../services/reports.service';

@ApiTags('reports')
@ApiBearerAuth('bearer')
@Controller()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('deals/:dealId/reports/recoupment')
  @ApiOperation({
    summary: 'Recoupment progress per investor',
    description:
      'For each pool investor: invested capital, the cap in force (investmentAmount x the active snapshot multiplier), how much has been recouped across finalized runs, what remains, and a per-settlement history with carry-forward. Caps mirror the settlement engine exactly, and progress counts only FINALIZED runs.',
  })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Recoupment report', type: RecoupmentReportResponseDto })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async getRecoupmentReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealId', ParseUUIDPipe) dealId: string,
  ): Promise<RecoupmentReportResponseDto> {
    return this.reportsService.getRecoupmentReport(user.id, dealId);
  }

  @Get('deals/:dealId/reports/statements/:participantId')
  @ApiOperation({
    summary: 'Payout statement for one participant',
    description:
      'Every finalized settlement that paid this participant, grouped by run and broken out by phase (recoupment / net profit / fees), each with the run proof hash. Feeds the printable Participant Statement screen.',
  })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'participantId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Participant statement', type: ParticipantStatementResponseDto })
  @ApiResponse({ status: 404, description: 'Deal or participant not found' })
  async getParticipantStatement(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ): Promise<ParticipantStatementResponseDto> {
    return this.reportsService.getParticipantStatement(
      user.id,
      dealId,
      participantId,
    );
  }
}

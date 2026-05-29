import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/jwt-payload';
import { ParticipantResponseDto, UpdateParticipantDto } from '../dto';
import { ParticipantsService } from '../services/participants.service';

/**
 * Routes keyed by participant id (not nested under a deal). Companion to
 * `ParticipantsController` which owns the deal-scoped list / create /
 * import / export surface. Splitting these into a second controller keeps
 * the route trees clean: collection routes stay under `/deals/:dealId/...`
 * and per-id routes live at `/participants/:id`.
 */
@ApiTags('participants')
@ApiBearerAuth('bearer')
@Controller('participants')
export class ParticipantDetailController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a single participant by id' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: ParticipantResponseDto })
  @ApiResponse({ status: 403, description: 'Caller does not own the parent deal' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ParticipantResponseDto> {
    return this.participantsService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a participant',
    description:
      'Partial update: every field on the body is optional, only the keys present get written. ' +
      'Investment keys (investmentAmount / units / pricePerUnit / poolMember) merge into the ' +
      'existing `metadata` JSON rather than replace it, so custom keys added outside the typed ' +
      'surface survive an edit.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: ParticipantResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Caller does not own the parent deal' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateParticipantDto,
  ): Promise<ParticipantResponseDto> {
    return this.participantsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a participant',
    description:
      'Hard delete. The row is removed from the database. A `DELETED` audit log entry is ' +
      'written first so the action stays reconstructable. If undo / restore semantics are ' +
      'needed later, swap this to a soft-delete `archivedAt` column.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Participant deleted' })
  @ApiResponse({ status: 403, description: 'Caller does not own the parent deal' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.participantsService.remove(user.id, id);
  }
}

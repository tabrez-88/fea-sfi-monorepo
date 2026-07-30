import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  ParseBoolPipe,
  DefaultValuePipe,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ParticipantBehavior } from '@prisma/client';
import { Response } from 'express';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/jwt-payload';
import { PaginationQueryDto } from '../../deals/dto';
import {
  BulkActionResultDto,
  BulkImportResultDto,
  BulkParticipantIdsDto,
  BulkUpdateBehaviorDto,
  CreateParticipantDto,
  ParticipantResponseDto,
} from '../dto';
import { ParticipantsService } from '../services/participants.service';

@ApiTags('participants')
@ApiBearerAuth('bearer')
@Controller('deals/:dealId/participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Post()
  @ApiOperation({
    summary: 'Add or update a participant on a deal (upsert)',
    description:
      'Upserts on `(dealId, email)` first, then `(dealId, externalId)`. ' +
      'Submitting the same email twice updates the existing row in place instead of creating a duplicate.',
  })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 201,
    description: 'Participant created or updated successfully',
    type: ParticipantResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Body() createParticipantDto: CreateParticipantDto,
  ): Promise<ParticipantResponseDto> {
    return this.participantsService.create(user.id, dealId, createParticipantDto);
  }

  @Get('roles')
  @ApiOperation({
    summary: 'List distinct role names on a deal',
    description:
      'Returns up to 20 alphabetically-sorted, case-insensitive distinct ' +
      '`roleName` values present on the deal. Used by the Add Participant ' +
      "form to power Role Name autocomplete. Pass `q` to narrow by " +
      'substring match (case-insensitive). Empty `q` returns the first 20.',
  })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Case-insensitive substring filter on roleName' })
  @ApiResponse({ status: 200, description: 'Array of distinct role names', schema: { type: 'array', items: { type: 'string' } } })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async findRoles(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Query('q') q?: string,
  ): Promise<string[]> {
    return this.participantsService.findDistinctRoles(user.id, dealId, q);
  }

  @Get()
  @ApiOperation({ summary: 'Get all participants for a deal' })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Defaults to createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Defaults to desc' })
  @ApiResponse({ status: 200, description: 'Paginated list of participants', type: ParticipantResponseDto, isArray: true })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.participantsService.findAllByDeal(user.id, dealId, query);
  }

  @Post('import')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Bulk import participants from a CSV file',
    description:
      'Accepts three header variants (case-insensitive on column names, fixed column order): ' +
      '`name,roleName,behaviorType,email,externalId` (legacy 5-col), ' +
      '`name,roleName,behaviorType,email,externalId,investmentAmount,units,pricePerUnit,poolMember` (v2 9-col), or ' +
      '`name,roleName,behaviorType,email,investmentAmount,units,pricePerUnit,poolMember` (v2 8-col without externalId, shipped by the in-app Download CSV Template button). ' +
      'behaviorType must be one of: FEE_DEDUCTION, RECOUPMENT, NET_PROFIT_SHARE, FLAT_FEE, PASS_THROUGH. ' +
      'Rows are upserted on `(dealId, email)` (or `(dealId, externalId)` when email is blank), so re-importing the same CSV is idempotent. Each row reports an `outcome` of `created`, `updated`, or `skipped`. ' +
      'Pass `dryRun=true` to validate + preview the CSV without writing to the database; the response shape is identical, valid rows come back with `outcome=skipped` (nothing persisted), and hard-failed rows keep their parse error.',
  })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'CSV file to import' },
        skipErrors: { type: 'boolean', description: 'Continue on row errors (default: false)' },
      },
      required: ['file'],
    },
  })
  @ApiQuery({ name: 'skipErrors', required: false, type: Boolean })
  @ApiQuery({ name: 'dryRun', required: false, type: Boolean, description: 'Validate without writing (default: false). Powers the Preview Import modal.' })
  @ApiResponse({ status: 200, description: 'Import result', type: BulkImportResultDto })
  @ApiResponse({ status: 400, description: 'Invalid CSV or validation error' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async importCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('skipErrors', new DefaultValuePipe(false), ParseBoolPipe) skipErrors: boolean,
    @Query('dryRun', new DefaultValuePipe(false), ParseBoolPipe) dryRun: boolean,
  ): Promise<BulkImportResultDto> {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.participantsService.importFromCsv(user.id, dealId, file.buffer, skipErrors, dryRun);
  }

  @Post('bulk-delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete many participants in one call',
    description:
      'Takes a list of participant IDs scoped to the path `dealId`. IDs that do not ' +
      'belong to this deal come back in `skipped` instead of failing the batch, so a ' +
      'stale UI selection degrades gracefully. Emits one audit-log row per deletion. ' +
      'POST (not DELETE) because request bodies on DELETE are poorly supported by proxies.',
  })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Bulk delete result', type: BulkActionResultDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async bulkDelete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Body() dto: BulkParticipantIdsDto,
  ): Promise<BulkActionResultDto> {
    return this.participantsService.removeMany(user.id, dealId, dto.participantIds);
  }

  @Patch('bulk-behavior')
  @ApiOperation({
    summary: 'Set one behavior on many participants',
    description:
      'Applies `behaviorType` to every listed participant. Used after a pool CSV import ' +
      'when all members need a different default than the one they came in with. Same ' +
      '`skipped` semantics as bulk-delete; emits one audit-log row per change recording ' +
      'the before / after behavior.',
  })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Bulk update result', type: BulkActionResultDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async bulkBehavior(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Body() dto: BulkUpdateBehaviorDto,
  ): Promise<BulkActionResultDto> {
    return this.participantsService.updateBehaviorMany(
      user.id,
      dealId,
      dto.participantIds,
      dto.behaviorType as unknown as ParticipantBehavior,
    );
  }

  @Get('export')
  @ApiOperation({
    summary: 'Export all participants for a deal as CSV',
    description:
      'Returns a downloadable CSV with the 9-column header: ' +
      'name,roleName,behaviorType,email,externalId,investmentAmount,units,pricePerUnit,poolMember.',
  })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiProduces('text/csv')
  @ApiResponse({ status: 200, description: 'CSV file download' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async exportCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.participantsService.exportToCsv(user.id, dealId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="participants-${dealId}.csv"`);
    res.send(csv);
  }
}

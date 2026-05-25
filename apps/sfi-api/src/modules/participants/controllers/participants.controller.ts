import {
  Controller,
  Get,
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
import { Response } from 'express';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/jwt-payload';
import { PaginationQueryDto } from '../../deals/dto';
import {
  BulkImportResultDto,
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
      'Accepts either the legacy 5-column header `name,roleName,behaviorType,email,externalId` ' +
      'or the current 9-column header that appends `investmentAmount,units,pricePerUnit,poolMember`. ' +
      'behaviorType must be one of: FEE_DEDUCTION, RECOUPMENT, NET_PROFIT_SHARE, FLAT_FEE, PASS_THROUGH. ' +
      'Rows are upserted on `(dealId, email)` (or `(dealId, externalId)` when email is blank), so re-importing the same CSV is idempotent — each row reports an `outcome` of `created`, `updated`, or `skipped`.',
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
  @ApiResponse({ status: 200, description: 'Import result', type: BulkImportResultDto })
  @ApiResponse({ status: 400, description: 'Invalid CSV or validation error' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async importCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('skipErrors', new DefaultValuePipe(false), ParseBoolPipe) skipErrors: boolean,
  ): Promise<BulkImportResultDto> {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.participantsService.importFromCsv(user.id, dealId, file.buffer, skipErrors);
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

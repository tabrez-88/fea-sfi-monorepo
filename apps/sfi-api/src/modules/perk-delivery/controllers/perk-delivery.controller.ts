import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  CreatePerkDeliveryDto,
  ImportPerkDeliveriesResultDto,
  PerkDeliveryListQueryDto,
  PerkDeliveryListResponseDto,
  PerkDeliveryResponseDto,
  UpdatePerkDeliveryDto,
} from '../dto';
import { PerkDeliveryService } from '../services/perk-delivery.service';

@ApiTags('perk-deliveries')
@ApiBearerAuth('bearer')
@Controller()
export class PerkDeliveryController {
  constructor(private readonly service: PerkDeliveryService) {}

  @Post('deals/:dealId/perk-deliveries')
  @ApiOperation({ summary: 'Record a single perk delivery for a participant' })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Perk delivery created', type: PerkDeliveryResponseDto })
  @ApiResponse({ status: 400, description: 'Participant does not belong to this deal' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Body() dto: CreatePerkDeliveryDto,
  ): Promise<PerkDeliveryResponseDto> {
    return this.service.create(user.id, dealId, dto);
  }

  @Get('deals/:dealId/perk-deliveries')
  @ApiOperation({ summary: 'List perk deliveries for a deal (owner-scoped)' })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of perk deliveries', type: PerkDeliveryListResponseDto })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Query() query: PerkDeliveryListQueryDto,
  ): Promise<PerkDeliveryListResponseDto> {
    return this.service.list(user.id, dealId, query);
  }

  @Post('deals/:dealId/perk-deliveries/import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Bulk-import perk deliveries from a CSV',
    description:
      'CSV columns: `participantId` OR `email` (required), `settlementRunId`, `trackingNumber`, ' +
      '`carrier`, `shippedAt`, `deliveredAt`, `status`, `notes`. Participants are resolved against ' +
      'the target deal — a row referring to a participant on a different deal is rejected. Upsert ' +
      'on `(dealId, participantId)` so re-imports refresh tracking info.',
  })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'dryRun', required: false, type: Boolean })
  @ApiQuery({ name: 'skipErrors', required: false, type: Boolean })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Import result', type: ImportPerkDeliveriesResultDto })
  async importCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('dryRun') dryRun?: string,
    @Query('skipErrors') skipErrors?: string,
  ): Promise<ImportPerkDeliveriesResultDto> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Missing CSV file upload');
    }
    return this.service.importFromCsv(
      user.id,
      dealId,
      file.buffer,
      skipErrors === 'true',
      dryRun === 'true',
    );
  }

  @Get('perk-deliveries/:id')
  @ApiOperation({ summary: 'Get a perk delivery by id (owner-scoped)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: PerkDeliveryResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PerkDeliveryResponseDto> {
    return this.service.findOne(user.id, id);
  }

  @Patch('perk-deliveries/:id')
  @ApiOperation({ summary: 'Update a perk delivery (owner-scoped)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: PerkDeliveryResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePerkDeliveryDto,
  ): Promise<PerkDeliveryResponseDto> {
    return this.service.update(user.id, id, dto);
  }

  @Delete('perk-deliveries/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a perk delivery (owner-scoped)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: true }> {
    return this.service.remove(user.id, id);
  }
}

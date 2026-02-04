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
import { CreateParticipantDto, ParticipantResponseDto } from '../dto';
import { ParticipantsService } from '../services/participants.service';

@ApiTags('participants')
@Controller('deals/:dealId/participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a participant to a deal' })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 201,
    description: 'Participant created successfully',
    type: ParticipantResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async create(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Body() createParticipantDto: CreateParticipantDto,
  ): Promise<ParticipantResponseDto> {
    return this.participantsService.create(dealId, createParticipantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all participants for a deal' })
  @ApiParam({ name: 'dealId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of participants',
  })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async findAll(
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.participantsService.findAllByDeal(dealId, query);
  }
}

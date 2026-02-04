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

import { CreateDealDto, DealResponseDto, PaginationQueryDto } from '../dto';
import { DealsService } from '../services/deals.service';

@ApiTags('deals')
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new deal' })
  @ApiResponse({
    status: 201,
    description: 'Deal created successfully',
    type: DealResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createDealDto: CreateDealDto): Promise<DealResponseDto> {
    const deal = await this.dealsService.create(createDealDto);
    return deal;
  }

  @Get()
  @ApiOperation({ summary: 'Get all deals' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of deals',
  })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.dealsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a deal by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Deal found',
    type: DealResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DealResponseDto> {
    return this.dealsService.findOne(id);
  }
}

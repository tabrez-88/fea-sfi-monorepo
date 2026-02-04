import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DealStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDealDto, DealResponseDto, PaginationQueryDto } from '../dto';
import { DealMapper } from '../mappers/deal.mapper';

@Injectable()
export class DealsService {
  private readonly logger = new Logger(DealsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createDealDto: CreateDealDto): Promise<DealResponseDto> {
    this.logger.log(`Creating deal: ${createDealDto.name}`);

    // TODO: Implement actual database creation
    // For now, return a placeholder response
    const deal = await this.prisma.deal.create({
      data: {
        name: createDealDto.name,
        description: createDealDto.description,
        status: (createDealDto.status as DealStatus) || DealStatus.DRAFT,
        effectiveDate: new Date(createDealDto.effectiveDate),
        terminationDate: createDealDto.terminationDate
          ? new Date(createDealDto.terminationDate)
          : null,
        metadata: (createDealDto.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });

    this.logger.log(`Deal created with ID: ${deal.id}`);
    return DealMapper.toResponse(deal);
  }

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    this.logger.log(`Fetching deals - page: ${page}, limit: ${limit}`);

    // TODO: Implement proper pagination with Prisma
    const [deals, total] = await Promise.all([
      this.prisma.deal.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.deal.count(),
    ]);

    return {
      data: deals.map(DealMapper.toResponse),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<DealResponseDto> {
    this.logger.log(`Fetching deal: ${id}`);

    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        participants: true,
      },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    return DealMapper.toResponse(deal);
  }

  async exists(id: string): Promise<boolean> {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!deal;
  }
}

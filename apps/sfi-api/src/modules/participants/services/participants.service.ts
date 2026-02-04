import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ParticipantRole, Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../deals/dto';
import { DealsService } from '../../deals/services/deals.service';
import { CreateParticipantDto, ParticipantResponseDto } from '../dto';
import { ParticipantMapper } from '../mappers/participant.mapper';

@Injectable()
export class ParticipantsService {
  private readonly logger = new Logger(ParticipantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dealsService: DealsService,
  ) {}

  async create(
    dealId: string,
    createParticipantDto: CreateParticipantDto,
  ): Promise<ParticipantResponseDto> {
    this.logger.log(`Creating participant for deal: ${dealId}`);

    // Verify deal exists
    const dealExists = await this.dealsService.exists(dealId);
    if (!dealExists) {
      throw new NotFoundException(`Deal with ID ${dealId} not found`);
    }

    const participant = await this.prisma.participant.create({
      data: {
        dealId,
        name: createParticipantDto.name,
        role: createParticipantDto.role as ParticipantRole,
        externalId: createParticipantDto.externalId,
        email: createParticipantDto.email,
        metadata: (createParticipantDto.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });

    this.logger.log(`Participant created with ID: ${participant.id}`);
    return ParticipantMapper.toResponse(participant);
  }

  async findAllByDeal(dealId: string, query: PaginationQueryDto) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    this.logger.log(`Fetching participants for deal: ${dealId}`);

    // Verify deal exists
    const dealExists = await this.dealsService.exists(dealId);
    if (!dealExists) {
      throw new NotFoundException(`Deal with ID ${dealId} not found`);
    }

    const [participants, total] = await Promise.all([
      this.prisma.participant.findMany({
        where: { dealId },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.participant.count({ where: { dealId } }),
    ]);

    return {
      data: participants.map(ParticipantMapper.toResponse),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<ParticipantResponseDto> {
    const participant = await this.prisma.participant.findUnique({
      where: { id },
    });

    if (!participant) {
      throw new NotFoundException(`Participant with ID ${id} not found`);
    }

    return ParticipantMapper.toResponse(participant);
  }
}

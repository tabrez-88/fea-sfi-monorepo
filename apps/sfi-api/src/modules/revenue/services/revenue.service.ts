import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RevenueBatchStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../deals/dto';
import {
  CreateRevenueBatchDto,
  RevenueBatchResponseDto,
  RevenueBatchListResponseDto,
  ValidateRevenueBatchDto,
  RejectRevenueBatchDto,
} from '../dto';
import { RevenueBatchMapper } from '../mappers/revenue-batch.mapper';

@Injectable()
export class RevenueService {
  private readonly logger = new Logger(RevenueService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createBatch(
    dealId: string,
    createDto: CreateRevenueBatchDto,
  ): Promise<RevenueBatchResponseDto> {
    this.logger.log(`Creating revenue batch for deal: ${dealId}`);

    // Validate deal exists
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true },
    });
    if (!deal) {
      throw new NotFoundException(`Deal with ID ${dealId} not found`);
    }

    // Generate unique batch number
    const batchCount = await this.prisma.revenueBatch.count({
      where: { dealId },
    });
    const year = new Date().getFullYear();
    const batchNumber = `RB-${year}-${String(batchCount + 1).padStart(3, '0')}`;

    const batch = await this.prisma.revenueBatch.create({
      data: {
        dealId,
        batchNumber,
        periodStart: new Date(createDto.periodStart),
        periodEnd: new Date(createDto.periodEnd),
        totalAmount: new Prisma.Decimal(createDto.totalAmount),
        currency: createDto.currency,
        source: createDto.source,
        metadata: createDto.metadata
          ? (createDto.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
      include: {
        _count: { select: { settlementRevenueLinks: true } },
      },
    });

    this.logger.log(`Revenue batch created: ${batch.id} (${batchNumber})`);
    return RevenueBatchMapper.toResponse(batch);
  }

  async listBatches(
    dealId: string,
    query: PaginationQueryDto,
  ): Promise<RevenueBatchListResponseDto> {
    this.logger.log(`Listing revenue batches for deal: ${dealId}`);
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const [batches, total] = await Promise.all([
      this.prisma.revenueBatch.findMany({
        where: { dealId },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: { select: { settlementRevenueLinks: true } },
        },
      }),
      this.prisma.revenueBatch.count({ where: { dealId } }),
    ]);

    return {
      data: batches.map(RevenueBatchMapper.toResponse),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBatch(id: string): Promise<RevenueBatchResponseDto> {
    this.logger.log(`Getting revenue batch: ${id}`);

    const batch = await this.prisma.revenueBatch.findUnique({
      where: { id },
      include: {
        _count: { select: { settlementRevenueLinks: true } },
      },
    });

    if (!batch) {
      throw new NotFoundException(`Revenue batch with ID ${id} not found`);
    }

    return RevenueBatchMapper.toResponse(batch);
  }

  async validateBatch(
    id: string,
    validateDto: ValidateRevenueBatchDto,
  ): Promise<RevenueBatchResponseDto> {
    this.logger.log(`Validating revenue batch: ${id}`);

    const batch = await this.prisma.revenueBatch.findUnique({
      where: { id },
    });

    if (!batch) {
      throw new NotFoundException(`Revenue batch with ID ${id} not found`);
    }

    if (batch.status !== RevenueBatchStatus.PENDING) {
      throw new BadRequestException(
        `Cannot validate batch in ${batch.status} status. Must be PENDING.`,
      );
    }

    const updated = await this.prisma.revenueBatch.update({
      where: { id },
      data: {
        status: RevenueBatchStatus.VALIDATED,
        metadata: validateDto.validationNotes
          ? {
              ...(batch.metadata as Record<string, unknown> | null),
              validationNotes: validateDto.validationNotes,
              validatedAt: new Date().toISOString(),
            }
          : (batch.metadata as Prisma.InputJsonValue) ?? undefined,
      },
      include: {
        _count: { select: { settlementRevenueLinks: true } },
      },
    });

    this.logger.log(`Revenue batch validated: ${id}`);
    return RevenueBatchMapper.toResponse(updated);
  }

  async rejectBatch(
    id: string,
    rejectDto: RejectRevenueBatchDto,
  ): Promise<RevenueBatchResponseDto> {
    this.logger.log(`Rejecting revenue batch: ${id}`);

    const batch = await this.prisma.revenueBatch.findUnique({
      where: { id },
    });

    if (!batch) {
      throw new NotFoundException(`Revenue batch with ID ${id} not found`);
    }

    if (batch.status === RevenueBatchStatus.PROCESSED) {
      throw new BadRequestException(
        'Cannot reject a batch that has already been processed.',
      );
    }

    const updated = await this.prisma.revenueBatch.update({
      where: { id },
      data: {
        status: RevenueBatchStatus.REJECTED,
        metadata: {
          ...(batch.metadata as Record<string, unknown> | null),
          rejectionReason: rejectDto.rejectionReason,
          rejectedAt: new Date().toISOString(),
        },
      },
      include: {
        _count: { select: { settlementRevenueLinks: true } },
      },
    });

    this.logger.log(`Revenue batch rejected: ${id}`);
    return RevenueBatchMapper.toResponse(updated);
  }

  async getValidatedBatches(dealId: string): Promise<RevenueBatchResponseDto[]> {
    this.logger.log(`Getting validated batches for deal: ${dealId}`);

    const batches = await this.prisma.revenueBatch.findMany({
      where: {
        dealId,
        status: RevenueBatchStatus.VALIDATED,
      },
      include: {
        _count: { select: { settlementRevenueLinks: true } },
      },
    });

    return batches.map(RevenueBatchMapper.toResponse);
  }
}

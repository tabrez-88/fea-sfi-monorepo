import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RevenueBatchStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  private async assertDealOwner(dealId: string, userId: string): Promise<void> {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true, userId: true },
    });
    if (!deal || deal.userId !== userId) {
      throw new NotFoundException(`Deal with ID ${dealId} not found`);
    }
  }

  private async assertBatchOwner(batchId: string, userId: string): Promise<void> {
    const batch = await this.prisma.revenueBatch.findUnique({
      where: { id: batchId },
      select: { id: true, deal: { select: { userId: true } } },
    });
    if (!batch || batch.deal.userId !== userId) {
      throw new NotFoundException(`Revenue batch with ID ${batchId} not found`);
    }
  }

  async createBatch(
    userId: string,
    dealId: string,
    createDto: CreateRevenueBatchDto,
  ): Promise<RevenueBatchResponseDto> {
    this.logger.log(`Creating revenue batch for deal: ${dealId}`);

    await this.assertDealOwner(dealId, userId);

    const periodStart = new Date(createDto.periodStart);
    const periodEnd = new Date(createDto.periodEnd);
    if (periodStart >= periodEnd) {
      throw new BadRequestException('periodStart must be before periodEnd');
    }

    const batchCount = await this.prisma.revenueBatch.count();
    const year = new Date().getFullYear();
    const batchNumber = `RB-${year}-${String(batchCount + 1).padStart(3, '0')}`;

    const batch = await this.prisma.revenueBatch.create({
      data: {
        dealId,
        batchNumber,
        periodStart,
        periodEnd,
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

    await this.auditLog.create({
      actor: userId,
      action: 'CREATED',
      entityType: 'RevenueBatch',
      entityId: batch.id,
      dealId,
      metadata: {
        batchNumber,
        totalAmount: createDto.totalAmount,
        currency: createDto.currency,
        status: batch.status,
      },
    });

    return RevenueBatchMapper.toResponse(batch);
  }

  async listBatches(
    userId: string,
    dealId: string,
    query: PaginationQueryDto,
  ): Promise<RevenueBatchListResponseDto> {
    this.logger.log(`Listing revenue batches for deal: ${dealId}`);

    await this.assertDealOwner(dealId, userId);

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
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getBatch(userId: string, id: string): Promise<RevenueBatchResponseDto> {
    this.logger.log(`Getting revenue batch: ${id}`);

    await this.assertBatchOwner(id, userId);

    const batch = await this.prisma.revenueBatch.findUnique({
      where: { id },
      include: { _count: { select: { settlementRevenueLinks: true } } },
    });

    if (!batch) {
      throw new NotFoundException(`Revenue batch with ID ${id} not found`);
    }

    return RevenueBatchMapper.toResponse(batch);
  }

  async validateBatch(
    userId: string,
    id: string,
    validateDto: ValidateRevenueBatchDto,
  ): Promise<RevenueBatchResponseDto> {
    this.logger.log(`Validating revenue batch: ${id}`);

    await this.assertBatchOwner(id, userId);

    const batch = await this.prisma.revenueBatch.findUnique({ where: { id } });
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
      include: { _count: { select: { settlementRevenueLinks: true } } },
    });

    this.logger.log(`Revenue batch validated: ${id}`);

    await this.auditLog.create({
      actor: userId,
      action: 'VALIDATED',
      entityType: 'RevenueBatch',
      entityId: id,
      dealId: batch.dealId,
      metadata: {
        batchNumber: batch.batchNumber,
        totalAmount: Number(batch.totalAmount),
        previousStatus: 'PENDING',
        newStatus: 'VALIDATED',
      },
    });

    return RevenueBatchMapper.toResponse(updated);
  }

  async rejectBatch(
    userId: string,
    id: string,
    rejectDto: RejectRevenueBatchDto,
  ): Promise<RevenueBatchResponseDto> {
    this.logger.log(`Rejecting revenue batch: ${id}`);

    await this.assertBatchOwner(id, userId);

    const batch = await this.prisma.revenueBatch.findUnique({ where: { id } });
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
      include: { _count: { select: { settlementRevenueLinks: true } } },
    });

    this.logger.log(`Revenue batch rejected: ${id}`);

    await this.auditLog.create({
      actor: userId,
      action: 'REJECTED',
      entityType: 'RevenueBatch',
      entityId: id,
      dealId: batch.dealId,
      metadata: {
        batchNumber: batch.batchNumber,
        totalAmount: Number(batch.totalAmount),
        previousStatus: batch.status,
        newStatus: 'REJECTED',
        reason: rejectDto.rejectionReason,
      },
    });

    return RevenueBatchMapper.toResponse(updated);
  }

  async getValidatedBatches(userId: string, dealId: string): Promise<RevenueBatchResponseDto[]> {
    this.logger.log(`Getting validated batches for deal: ${dealId}`);

    await this.assertDealOwner(dealId, userId);

    const batches = await this.prisma.revenueBatch.findMany({
      where: { dealId, status: RevenueBatchStatus.VALIDATED },
      include: { _count: { select: { settlementRevenueLinks: true } } },
    });

    return batches.map(RevenueBatchMapper.toResponse);
  }
}

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RevenueBatchStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import {
  CreateRevenueBatchDto,
  RevenueBatchResponseDto,
  RevenueBatchListResponseDto,
  RevenueBatchListQueryDto,
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
        // Run 5 / Round 4 Comment 24: top-level `territory` / `revenueType` /
        // `reportingEntity` fields are merged INTO `metadata` JSON via the
        // mapper helper. No Prisma migration — the categorization fields
        // ride along inside the existing `metadata` column.
        metadata: RevenueBatchMapper.buildMetadata(createDto.metadata, {
          territory: createDto.territory,
          revenueType: createDto.revenueType,
          reportingEntity: createDto.reportingEntity,
        }),
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
        // Surface categorization (when supplied) for ops queries — same
        // pattern as Run 2's `schemaVersion` on rule-snapshot create.
        ...(createDto.territory !== undefined && { territory: createDto.territory }),
        ...(createDto.revenueType !== undefined && { revenueType: createDto.revenueType }),
        ...(createDto.reportingEntity !== undefined && {
          reportingEntity: createDto.reportingEntity,
        }),
      },
    });

    return RevenueBatchMapper.toResponse(batch);
  }

  async listBatches(
    userId: string,
    dealId: string,
    query: RevenueBatchListQueryDto,
  ): Promise<RevenueBatchListResponseDto> {
    this.logger.log(`Listing revenue batches for deal: ${dealId}`);

    await this.assertDealOwner(dealId, userId);

    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    // Categorization filters (Run 5 / Round 4 Comment 24) — the values live
    // inside `RevenueBatch.metadata` JSON, so we use Prisma's `path`
    // equality. AND-combined with `dealId`. Empty filter = no narrowing.
    const where: Prisma.RevenueBatchWhereInput = {
      dealId,
      ...buildMetadataPathFilters(query),
    };

    const [batches, total] = await Promise.all([
      this.prisma.revenueBatch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: { select: { settlementRevenueLinks: true } },
        },
      }),
      this.prisma.revenueBatch.count({ where }),
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

/**
 * Build the `metadata` clause of a Prisma `RevenueBatchWhereInput` from a
 * categorization filter. Each provided field becomes a `metadata path
 * equals` clause; multiple fields AND-combine.
 *
 * Returns an empty object when no filter fields are set, so the caller can
 * spread the result unconditionally without changing the existing query.
 *
 * Note: Prisma's `metadata` JSON filter uses an `AND` array when multiple
 * `path` clauses appear in the same `where` (the last one wins if merged
 * naively). We build the AND array explicitly so all three filters
 * compose correctly.
 */
function buildMetadataPathFilters(
  filter: Pick<RevenueBatchListQueryDto, 'territory' | 'revenueType' | 'reportingEntity'>,
): Pick<Prisma.RevenueBatchWhereInput, 'AND'> | Record<string, never> {
  const clauses: Prisma.RevenueBatchWhereInput[] = [];

  if (filter.territory !== undefined) {
    clauses.push({ metadata: { path: ['territory'], equals: filter.territory } });
  }
  if (filter.revenueType !== undefined) {
    clauses.push({ metadata: { path: ['revenueType'], equals: filter.revenueType } });
  }
  if (filter.reportingEntity !== undefined) {
    clauses.push({
      metadata: { path: ['reportingEntity'], equals: filter.reportingEntity },
    });
  }

  return clauses.length > 0 ? { AND: clauses } : {};
}

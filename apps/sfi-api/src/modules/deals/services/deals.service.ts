import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Currency, DealCategory, DealStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import {
  CreateDealDto,
  DealCountsResponseDto,
  DealListQueryDto,
  DealResponseDto,
  DealStatusDto,
  UpdateDealDto,
} from '../dto';
import { DealMapper } from '../mappers/deal.mapper';

@Injectable()
export class DealsService {
  private readonly logger = new Logger(DealsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(userId: string, createDealDto: CreateDealDto): Promise<DealResponseDto> {
    this.logger.log(`Creating deal: ${createDealDto.name}`);

    if (createDealDto.terminationDate) {
      const eff = new Date(createDealDto.effectiveDate).getTime();
      const term = new Date(createDealDto.terminationDate).getTime();
      if (term <= eff) {
        throw new BadRequestException(
          'terminationDate must be after effectiveDate',
        );
      }
    }

    const deal = await this.prisma.deal.create({
      data: {
        name: createDealDto.name,
        description: createDealDto.description,
        status: (createDealDto.status as DealStatus) || DealStatus.DRAFT,
        category: createDealDto.category
          ? (createDealDto.category as DealCategory)
          : null,
        dealOwner: createDealDto.dealOwner?.trim() || null,
        currency: (createDealDto.currency as Currency) || Currency.USD,
        effectiveDate: new Date(createDealDto.effectiveDate),
        terminationDate: createDealDto.terminationDate
          ? new Date(createDealDto.terminationDate)
          : null,
        metadata: (createDealDto.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        userId,
      },
    });

    this.logger.log(`Deal created with ID: ${deal.id}`);

    await this.auditLog.create({
      actor: userId,
      action: 'CREATED',
      entityType: 'Deal',
      entityId: deal.id,
      dealId: deal.id,
      metadata: { name: deal.name, status: deal.status, currency: deal.currency },
    });

    return DealMapper.toResponse(deal);
  }

  async findAll(userId: string, query: DealListQueryDto) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      search,
    } = query;
    const skip = (page - 1) * limit;

    this.logger.log(
      `Fetching deals for user ${userId} - page: ${page}, limit: ${limit}, status: ${status ?? '*'}, search: ${search ?? '*'}`,
    );

    const where: Prisma.DealWhereInput = { userId };
    if (status) {
      where.status = status as DealStatus;
    }
    if (search && search.trim().length > 0) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [deals, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { participants: true },
          },
        },
      }),
      this.prisma.deal.count({ where }),
    ]);

    return {
      data: deals.map((deal) =>
        DealMapper.toResponse(deal, {
          participantsCount: deal._count.participants,
        }),
      ),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string): Promise<DealResponseDto> {
    this.logger.log(`Fetching deal: ${id}`);

    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            participants: true,
            ruleSnapshots: true,
            revenueBatches: true,
            settlementRuns: true,
          },
        },
      },
    });

    if (!deal || deal.userId !== userId) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    const revenueAggregate = await this.prisma.revenueBatch.aggregate({
      where: { dealId: id },
      _sum: { totalAmount: true },
    });

    return DealMapper.toResponse(deal, {
      participantsCount: deal._count.participants,
      ruleSnapshotsCount: deal._count.ruleSnapshots,
      revenueBatchesCount: deal._count.revenueBatches,
      settlementRunsCount: deal._count.settlementRuns,
      totalRevenue: Number(revenueAggregate._sum.totalAmount ?? 0),
    });
  }

  async update(
    userId: string,
    id: string,
    updateDealDto: UpdateDealDto,
  ): Promise<DealResponseDto> {
    this.logger.log(`Updating deal: ${id}`);

    const existing = await this.prisma.deal.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        effectiveDate: true,
        terminationDate: true,
      },
    });
    if (!existing || existing.userId !== userId) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    const effectiveDate = updateDealDto.effectiveDate
      ? new Date(updateDealDto.effectiveDate)
      : existing.effectiveDate;
    const terminationDate =
      updateDealDto.terminationDate !== undefined
        ? updateDealDto.terminationDate
          ? new Date(updateDealDto.terminationDate)
          : null
        : existing.terminationDate;

    if (terminationDate && terminationDate.getTime() <= effectiveDate.getTime()) {
      throw new BadRequestException(
        'terminationDate must be after effectiveDate',
      );
    }

    const data: Prisma.DealUpdateInput = {};
    if (updateDealDto.name !== undefined) data.name = updateDealDto.name;
    if (updateDealDto.description !== undefined)
      data.description = updateDealDto.description;
    if (updateDealDto.status !== undefined)
      data.status = updateDealDto.status as DealStatus;
    if (updateDealDto.category !== undefined)
      data.category = (updateDealDto.category as DealCategory) || null;
    if (updateDealDto.dealOwner !== undefined)
      // Empty string = explicit clear; trim so whitespace-only doesn't
      // sneak through as a "set" value.
      data.dealOwner = updateDealDto.dealOwner.trim() || null;
    if (updateDealDto.currency !== undefined)
      data.currency = updateDealDto.currency as Currency;
    if (updateDealDto.effectiveDate !== undefined)
      data.effectiveDate = new Date(updateDealDto.effectiveDate);
    if (updateDealDto.terminationDate !== undefined)
      data.terminationDate = updateDealDto.terminationDate
        ? new Date(updateDealDto.terminationDate)
        : null;
    if (updateDealDto.notes !== undefined) data.notes = updateDealDto.notes;
    if (updateDealDto.metadata !== undefined)
      data.metadata = (updateDealDto.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull;

    if (
      updateDealDto.status &&
      updateDealDto.status !== DealStatusDto.SUSPENDED &&
      updateDealDto.notes === undefined
    ) {
      data.notes = null;
    }

    const updated = await this.prisma.deal.update({
      where: { id },
      data,
    });

    this.logger.log(`Deal updated: ${id}`);

    const statusChanged =
      updateDealDto.status !== undefined && updateDealDto.status !== existing.status;
    const action = statusChanged ? 'STATUS_CHANGED' : 'UPDATED';

    await this.auditLog.create({
      actor: userId,
      action,
      entityType: 'Deal',
      entityId: id,
      dealId: id,
      metadata: {
        ...(statusChanged && {
          previousStatus: existing.status,
          newStatus: updateDealDto.status,
        }),
        changedFields: Object.keys(data),
        ...(updateDealDto.notes && {
          notes: updateDealDto.notes,
        }),
      },
    });

    return DealMapper.toResponse(updated);
  }

  async getCounts(userId: string): Promise<DealCountsResponseDto> {
    this.logger.log(`Computing deal status counts for user ${userId}`);

    const grouped = await this.prisma.deal.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
    });

    const counts: DealCountsResponseDto = {
      all: 0,
      draft: 0,
      active: 0,
      suspended: 0,
      closed: 0,
      terminated: 0,
      archived: 0,
    };

    for (const group of grouped) {
      const count = group._count?._all ?? 0;
      counts.all += count;
      switch (group.status) {
        case DealStatus.DRAFT:
          counts.draft = count;
          break;
        case DealStatus.ACTIVE:
          counts.active = count;
          break;
        case DealStatus.SUSPENDED:
          counts.suspended = count;
          break;
        case DealStatus.CLOSED:
          counts.closed = count;
          break;
        case DealStatus.TERMINATED:
          counts.terminated = count;
          break;
        case DealStatus.ARCHIVED:
          counts.archived = count;
          break;
      }
    }

    return counts;
  }

  /**
   * Clones an existing deal into a new DRAFT. Copies the deal's static
   * fields (name + " (Copy)", description, category, dealOwner, currency,
   * effective/termination dates) but does NOT carry over participants,
   * rule snapshots, revenue batches, or settlement runs — those belong
   * to the original. Per Liang Round 4 + the "closed deals are
   * immutable" decision: this is the escape hatch so a closed deal can
   * spawn a follow-up without retyping everything.
   */
  async duplicate(userId: string, sourceId: string): Promise<DealResponseDto> {
    this.logger.log(`Duplicating deal: ${sourceId}`);

    const source = await this.prisma.deal.findUnique({
      where: { id: sourceId },
      select: {
        id: true,
        userId: true,
        name: true,
        description: true,
        category: true,
        dealOwner: true,
        currency: true,
        effectiveDate: true,
        terminationDate: true,
        metadata: true,
      },
    });
    if (!source || source.userId !== userId) {
      throw new NotFoundException(`Deal with ID ${sourceId} not found`);
    }

    const copy = await this.prisma.deal.create({
      data: {
        name: `${source.name} (Copy)`,
        description: source.description,
        status: DealStatus.DRAFT,
        category: source.category,
        dealOwner: source.dealOwner,
        currency: source.currency,
        effectiveDate: source.effectiveDate,
        terminationDate: source.terminationDate,
        metadata:
          (source.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        userId,
      },
    });

    await this.auditLog.create({
      actor: userId,
      action: 'CREATED',
      entityType: 'Deal',
      entityId: copy.id,
      dealId: copy.id,
      metadata: {
        name: copy.name,
        status: copy.status,
        currency: copy.currency,
        duplicatedFrom: sourceId,
      },
    });

    return DealMapper.toResponse(copy);
  }

  async exists(id: string): Promise<boolean> {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!deal;
  }

  /**
   * Asserts that the deal exists AND belongs to the given user.
   * Throws NotFoundException on either failure — callers cannot distinguish
   * "does not exist" from "belongs to another user" by design.
   */
  async assertDealOwner(dealId: string, userId: string): Promise<void> {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true, userId: true },
    });
    if (!deal || deal.userId !== userId) {
      throw new NotFoundException(`Deal with ID ${dealId} not found`);
    }
  }
}

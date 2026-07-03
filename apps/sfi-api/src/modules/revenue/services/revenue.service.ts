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
  BulkCreateRevenueLineItemsDto,
  CreateRevenueBatchDto,
  CreateRevenueLineItemDto,
  CurrencyEnum,
  RevenueBatchResponseDto,
  RevenueBatchListResponseDto,
  RevenueBatchListQueryDto,
  RevenueBatchStatusEnum,
  RevenueBatchSummaryDto,
  RevenueLineItemResponseDto,
  UpdateRevenueLineItemDto,
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

    // MS-3 Wave 3 (Liang MS3-R1) — first-class line items. When supplied,
    // every row must inherit or match the batch currency (mixed currencies
    // inside one batch are rejected in v1 — the design spec's summary bar
    // + downstream reporting assume a single currency per batch).
    const lineItems = createDto.lineItems ?? [];
    for (const [i, row] of lineItems.entries()) {
      if (row.currency && row.currency !== createDto.currency) {
        throw new BadRequestException(
          `lineItems[${i}].currency (${row.currency}) does not match batch currency (${createDto.currency}).`,
        );
      }
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
        ...(lineItems.length > 0 && {
          lineItems: {
            create: lineItems.map((row) => ({
              platformSource: row.platformSource,
              amount: new Prisma.Decimal(row.amount),
              currency: row.currency ?? createDto.currency,
              territory: row.territory,
              revenueType: row.revenueType,
              reportingEntity: row.reportingEntity,
              notes: row.notes,
            })),
          },
        }),
      },
      include: {
        _count: { select: { settlementRevenueLinks: true } },
        lineItems: true,
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

    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', status } = query;
    const skip = (page - 1) * limit;

    // Categorization filters (Run 5 / Round 4 Comment 24) — the values live
    // inside `RevenueBatch.metadata` JSON, so we use Prisma's `path`
    // equality. AND-combined with `dealId`. Empty filter = no narrowing.
    // `status` matches the top-level column and drives Screen 3.1 filter tabs.
    //
    // Wave 5 — search + date range (Screen 3.1 toolbar). Search hits
    // batchNumber OR source (case-insensitive contains). Period bounds
    // are half-open so a batch whose window overlaps the filter window
    // is included.
    const search = query.search?.trim();
    const searchFilter: Prisma.RevenueBatchWhereInput | undefined = search
      ? {
          OR: [
            { batchNumber: { contains: search, mode: 'insensitive' } },
            { source: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined;

    const periodFilter: Prisma.RevenueBatchWhereInput = {};
    if (query.periodFrom) {
      periodFilter.periodStart = { gte: new Date(query.periodFrom) };
    }
    if (query.periodTo) {
      periodFilter.periodEnd = { lte: new Date(query.periodTo) };
    }

    const where: Prisma.RevenueBatchWhereInput = {
      dealId,
      ...(status ? { status } : {}),
      ...(searchFilter ?? {}),
      ...periodFilter,
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
          lineItems: true,
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
      include: {
        _count: { select: { settlementRevenueLinks: true } },
        // MS-3 Wave 3: Screen 3.2 (Detail) renders the line items panel
        // from this array. List responses stay lean without them.
        lineItems: { orderBy: { createdAt: 'asc' } },
      },
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
      include: {
        _count: { select: { settlementRevenueLinks: true } },
        lineItems: { orderBy: { createdAt: 'asc' } },
      },
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
      include: {
        _count: { select: { settlementRevenueLinks: true } },
        lineItems: { orderBy: { createdAt: 'asc' } },
      },
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

  /**
   * Aggregate summary for Screen 3.1 (Revenue Batches List).
   *
   * Returns both filter-tab counts and summary-bar amounts in one
   * round-trip so the FE doesn't need two calls. Uses a single
   * `groupBy status` query — cheap even at high batch counts because
   * Prisma pushes both `_count` and `_sum` down into a single SQL
   * aggregate.
   *
   * `currency` is populated when every batch on the deal shares the same
   * currency (the common case). When batches span multiple currencies,
   * `currency: null` — the FE can hide the aggregate total or fall back
   * to the raw list for a per-currency breakdown.
   */
  async getSummary(userId: string, dealId: string): Promise<RevenueBatchSummaryDto> {
    this.logger.log(`Building revenue-batches summary for deal: ${dealId}`);

    await this.assertDealOwner(dealId, userId);

    const [groupedByStatus, groupedByCurrency] = await Promise.all([
      this.prisma.revenueBatch.groupBy({
        by: ['status'],
        where: { dealId },
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.revenueBatch.groupBy({
        by: ['currency'],
        where: { dealId },
        _count: { _all: true },
      }),
    ]);

    // Seed all 4 statuses with zeros so the FE always gets a complete
    // shape (no null-check needed on the "Rejected" tab / summary strip).
    const byStatus: Record<
      RevenueBatchStatusEnum,
      { count: number; amount: number }
    > = {
      [RevenueBatchStatusEnum.PENDING]: { count: 0, amount: 0 },
      [RevenueBatchStatusEnum.VALIDATED]: { count: 0, amount: 0 },
      [RevenueBatchStatusEnum.PROCESSED]: { count: 0, amount: 0 },
      [RevenueBatchStatusEnum.REJECTED]: { count: 0, amount: 0 },
    };

    let totalCount = 0;
    let totalAmount = 0;
    for (const row of groupedByStatus) {
      const status = row.status as RevenueBatchStatusEnum;
      const count = row._count._all;
      const amount = row._sum.totalAmount ? Number(row._sum.totalAmount) : 0;
      byStatus[status] = { count, amount };
      totalCount += count;
      totalAmount += amount;
    }

    // Single-currency detection. When all batches share a currency, surface
    // it; when mixed, return null so the FE can show "Mixed" or per-currency.
    const currency =
      groupedByCurrency.length === 1
        ? (groupedByCurrency[0]!.currency as CurrencyEnum)
        : null;

    return { totalCount, totalAmount, currency, byStatus };
  }

  // ────────────────────────────────────────────────────────────────
  // MS-3 Wave 3 (Liang MS3-R1) — RevenueLineItem CRUD
  // ────────────────────────────────────────────────────────────────

  /**
   * Bulk-add line items to an existing batch. Owner-scoped, refuses to
   * touch PROCESSED batches (their totals feed a finalized settlement
   * and must stay locked), validates every row's currency matches the
   * batch currency, runs the inserts inside the same transaction as an
   * updated batch `updatedAt` so cache invalidation reads consistent.
   */
  async addLineItems(
    userId: string,
    batchId: string,
    dto: BulkCreateRevenueLineItemsDto,
  ): Promise<RevenueLineItemResponseDto[]> {
    await this.assertBatchOwner(batchId, userId);

    const batch = await this.prisma.revenueBatch.findUnique({
      where: { id: batchId },
      select: { id: true, currency: true, status: true, dealId: true },
    });
    if (!batch) throw new NotFoundException(`Revenue batch with ID ${batchId} not found`);

    this.assertBatchMutable(batch.status, 'add line items to');
    this.assertLineItemCurrencies(dto.lineItems, batch.currency as CurrencyEnum);

    const created = await this.prisma.$transaction(async (tx) => {
      const rows = await Promise.all(
        dto.lineItems.map((row) =>
          tx.revenueLineItem.create({
            data: {
              batchId,
              platformSource: row.platformSource,
              amount: new Prisma.Decimal(row.amount),
              currency: (row.currency ?? batch.currency) as CurrencyEnum,
              territory: row.territory,
              revenueType: row.revenueType,
              reportingEntity: row.reportingEntity,
              notes: row.notes,
            },
          }),
        ),
      );
      // Bump the batch's updatedAt so downstream caches (list view,
      // detail view) invalidate together.
      await tx.revenueBatch.update({
        where: { id: batchId },
        data: { updatedAt: new Date() },
      });
      return rows;
    });

    await this.auditLog.create({
      actor: userId,
      action: 'LINE_ITEMS_ADDED',
      entityType: 'RevenueBatch',
      entityId: batchId,
      dealId: batch.dealId,
      metadata: { count: created.length },
    });

    return created.map(RevenueBatchMapper.lineItemToResponse);
  }

  async updateLineItem(
    userId: string,
    batchId: string,
    lineItemId: string,
    dto: UpdateRevenueLineItemDto,
  ): Promise<RevenueLineItemResponseDto> {
    await this.assertBatchOwner(batchId, userId);

    const batch = await this.prisma.revenueBatch.findUnique({
      where: { id: batchId },
      select: { id: true, currency: true, status: true, dealId: true },
    });
    if (!batch) throw new NotFoundException(`Revenue batch with ID ${batchId} not found`);

    this.assertBatchMutable(batch.status, 'update line items on');

    const existing = await this.prisma.revenueLineItem.findUnique({
      where: { id: lineItemId },
      select: { id: true, batchId: true },
    });
    if (existing?.batchId !== batchId) {
      throw new NotFoundException(`Line item ${lineItemId} not found on batch ${batchId}`);
    }

    if (dto.currency && dto.currency !== batch.currency) {
      throw new BadRequestException(
        `lineItem.currency (${dto.currency}) does not match batch currency (${batch.currency}).`,
      );
    }

    const updated = await this.prisma.revenueLineItem.update({
      where: { id: lineItemId },
      data: {
        ...(dto.platformSource !== undefined && { platformSource: dto.platformSource }),
        ...(dto.amount !== undefined && { amount: new Prisma.Decimal(dto.amount) }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.territory !== undefined && { territory: dto.territory }),
        ...(dto.revenueType !== undefined && { revenueType: dto.revenueType }),
        ...(dto.reportingEntity !== undefined && { reportingEntity: dto.reportingEntity }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    return RevenueBatchMapper.lineItemToResponse(updated);
  }

  async deleteLineItem(
    userId: string,
    batchId: string,
    lineItemId: string,
  ): Promise<{ success: true }> {
    await this.assertBatchOwner(batchId, userId);

    const batch = await this.prisma.revenueBatch.findUnique({
      where: { id: batchId },
      select: { id: true, status: true },
    });
    if (!batch) throw new NotFoundException(`Revenue batch with ID ${batchId} not found`);

    this.assertBatchMutable(batch.status, 'delete line items from');

    const existing = await this.prisma.revenueLineItem.findUnique({
      where: { id: lineItemId },
      select: { id: true, batchId: true },
    });
    if (existing?.batchId !== batchId) {
      throw new NotFoundException(`Line item ${lineItemId} not found on batch ${batchId}`);
    }

    await this.prisma.revenueLineItem.delete({ where: { id: lineItemId } });
    return { success: true };
  }

  /**
   * Common guard: line items can only be mutated on PENDING batches.
   * VALIDATED / PROCESSED / REJECTED batches are locked because their
   * totals may already be consumed by a settlement run or an admin
   * decision.
   */
  private assertBatchMutable(status: RevenueBatchStatus, action: string): void {
    if (status !== RevenueBatchStatus.PENDING) {
      throw new BadRequestException(
        `Cannot ${action} a ${status} batch. Line items are only editable while the batch is PENDING.`,
      );
    }
  }

  /**
   * Reject any line item whose explicit currency disagrees with the
   * parent batch. When the row omits currency it inherits the batch's,
   * which is always safe.
   */
  private assertLineItemCurrencies(
    rows: ReadonlyArray<CreateRevenueLineItemDto>,
    batchCurrency: CurrencyEnum,
  ): void {
    for (const [i, row] of rows.entries()) {
      if (row.currency && row.currency !== batchCurrency) {
        throw new BadRequestException(
          `lineItems[${i}].currency (${row.currency}) does not match batch currency (${batchCurrency}).`,
        );
      }
    }
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

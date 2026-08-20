import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Currency,
  DealCategory,
  DealStatus,
  Prisma,
  SettlementRunStatus,
} from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import {
  CreateDealDto,
  DealCategoryDto,
  DealCountsResponseDto,
  DealCurrencyDto,
  DealImportOutcomeDto,
  DealListQueryDto,
  DealResponseDto,
  DealStatusDto,
  ImportDealRowResultDto,
  ImportDealsResultDto,
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

  /**
   * Permanently delete a deal and everything scoped under it (participants,
   * rule snapshots, revenue batches, settlement runs) via the schema's
   * cascade.
   *
   * Guarded: a deal with a FINALIZED settlement run is a financial record
   * with ledger postings and a proof hash behind it, so it can never be
   * deleted. Those are archived instead. Everything else, including the
   * "(Copy) (Copy)" pile Liang accumulated with no way to clean it up
   * (08/18), is fair game.
   */
  async remove(userId: string, id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Deleting deal: ${id}`);

    await this.assertDealOwner(id, userId);

    const deal = await this.prisma.deal.findUnique({
      where: { id },
      select: {
        name: true,
        _count: {
          select: {
            settlementRuns: { where: { status: SettlementRunStatus.FINALIZED } },
          },
        },
      },
    });
    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    if (deal._count.settlementRuns > 0) {
      throw new ConflictException(
        `Cannot delete this deal: it has ${deal._count.settlementRuns} finalized settlement ${
          deal._count.settlementRuns === 1 ? 'run' : 'runs'
        } with ledger entries and proof records behind them. Set the deal to Archived instead to hide it from active workflows while keeping the audit trail.`,
      );
    }

    await this.prisma.deal.delete({ where: { id } });

    await this.auditLog.create({
      actor: userId,
      action: 'DELETED',
      entityType: 'Deal',
      entityId: id,
      dealId: id,
      metadata: { name: deal.name },
    });

    this.logger.log(`Deal deleted: ${id}`);
    return { success: true, message: `Deal "${deal.name}" deleted.` };
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

  // ────────────────────────────────────────────────────────────────
  // MS-3 Wave 6 (Liang MS3-R2) — Deal Registration CSV import
  //
  // Bulk-create Deals from a CSV export (typically produced by FEA).
  // Matches on (userId, externalDealId) so re-running an import with
  // updated rows upserts instead of duplicating.
  //
  // Expected header (case-insensitive): name, externalDealId, category,
  // dealOwner, currency, effectiveDate, terminationDate, status,
  // description, notes. Only `name` and `effectiveDate` are hard-required
  // per row; every other column is optional.
  // ────────────────────────────────────────────────────────────────

  async importFromCsv(
    userId: string,
    buffer: Buffer,
    skipErrors = false,
    dryRun = false,
  ): Promise<ImportDealsResultDto> {
    this.logger.log(`Importing deals from CSV for user: ${userId} (dryRun=${dryRun})`);

    const lines = buffer
      .toString('utf8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      throw new BadRequestException('CSV must contain a header row and at least one data row');
    }

    const header = splitCsvRow(lines[0]!).map((h) => h.trim().toLowerCase());
    const idx = buildDealHeaderIndex(header);
    if (idx.name === -1 || idx.effectiveDate === -1) {
      throw new BadRequestException(
        'CSV header must include at least `name` and `effectiveDate` columns.',
      );
    }

    const dataLines = lines.slice(1);
    const rowResults: ImportDealRowResultDto[] = [];
    const parsedRows: Array<{ rowNum: number; parsed: ParsedDealRow }> = [];

    for (let i = 0; i < dataLines.length; i++) {
      const rowNum = i + 1;
      const cols = splitCsvRow(dataLines[i]!);
      try {
        const parsed = parseDealRow(cols, idx, rowNum);
        parsedRows.push({ rowNum, parsed });
        rowResults.push({
          row: rowNum,
          success: true,
          outcome: DealImportOutcomeDto.CREATED,
          warnings: parsed.warnings.length > 0 ? parsed.warnings : undefined,
          deal: {
            name: parsed.name,
            externalDealId: parsed.externalDealId ?? null,
            category: parsed.category ?? null,
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (!skipErrors) throw new BadRequestException(`Row ${rowNum}: ${message}`);
        rowResults.push({
          row: rowNum,
          success: false,
          outcome: DealImportOutcomeDto.SKIPPED,
          error: message,
        });
      }
    }

    if (parsedRows.length === 0) {
      throw new BadRequestException('No valid rows found in CSV');
    }

    if (dryRun) {
      this.logger.log(
        `CSV dry-run: ${parsedRows.length} rows valid, ${rowResults.filter((r) => !r.success).length} would be skipped`,
      );
      return {
        imported: 0,
        failed: rowResults.filter((r) => !r.success).length,
        rows: rowResults.map((r) =>
          r.success ? { ...r, outcome: DealImportOutcomeDto.SKIPPED } : r,
        ),
      };
    }

    // Persist inside a transaction. Upsert on (userId, externalDealId)
    // when externalDealId is supplied so re-imports refresh existing
    // rows instead of creating duplicates. Without externalDealId every
    // row creates a new deal.
    const resultsByRow = new Map<number, { dealId: string; outcome: DealImportOutcomeDto }>();
    await this.prisma.$transaction(async (tx) => {
      for (const { rowNum, parsed } of parsedRows) {
        const existing = parsed.externalDealId
          ? await tx.deal.findFirst({
              where: { userId, externalDealId: parsed.externalDealId },
              select: { id: true },
            })
          : null;

        if (existing) {
          const updated = await tx.deal.update({
            where: { id: existing.id },
            data: buildDealPersistData(parsed, false),
          });
          resultsByRow.set(rowNum, {
            dealId: updated.id,
            outcome: DealImportOutcomeDto.UPDATED,
          });
        } else {
          const created = await tx.deal.create({
            data: {
              ...(buildDealPersistData(parsed, true) as Prisma.DealUncheckedCreateInput),
              userId,
            },
          });
          resultsByRow.set(rowNum, {
            dealId: created.id,
            outcome: DealImportOutcomeDto.CREATED,
          });
        }
      }
    });

    // Attach the persistence results to the row list.
    const finalRows = rowResults.map((r) => {
      if (!r.success) return r;
      const persisted = resultsByRow.get(r.row);
      if (!persisted) return r;
      return { ...r, outcome: persisted.outcome, dealId: persisted.dealId };
    });

    const imported = finalRows.filter((r) => r.success).length;
    this.logger.log(`Imported ${imported} deals (failed: ${finalRows.length - imported})`);

    // Emit one audit row per created / updated deal so the audit stream
    // reads consistently with single-create audit entries. Bulk import
    // shouldn't hide individual deal changes from the timeline.
    for (const r of finalRows) {
      if (!r.success || !r.dealId) continue;
      await this.auditLog.create({
        actor: userId,
        action: r.outcome === DealImportOutcomeDto.UPDATED ? 'UPDATED' : 'CREATED',
        entityType: 'Deal',
        entityId: r.dealId,
        dealId: r.dealId,
        metadata: {
          source: 'CSV_IMPORT',
          row: r.row,
        },
      });
    }

    return { imported, failed: finalRows.length - imported, rows: finalRows };
  }
}

// ────────────────────────────────────────────────────────────────
// Deal CSV — parser helpers (module-scoped so they stay pure)
// ────────────────────────────────────────────────────────────────

interface DealHeaderIndex {
  name: number;
  externalDealId: number;
  category: number;
  dealOwner: number;
  currency: number;
  effectiveDate: number;
  terminationDate: number;
  status: number;
  description: number;
  notes: number;
}

interface ParsedDealRow {
  name: string;
  externalDealId?: string;
  category?: DealCategoryDto;
  dealOwner?: string;
  currency?: DealCurrencyDto;
  effectiveDate: Date;
  terminationDate?: Date;
  status?: DealStatusDto;
  description?: string;
  notes?: string;
  warnings: string[];
}

/**
 * Map a CSV header row to its column indexes. Accepts common variants
 * (case-insensitive, snake_case, or spaces) so a CRM export doesn't
 * need renaming before it can be imported.
 */
function buildDealHeaderIndex(header: string[]): DealHeaderIndex {
  const find = (...variants: string[]): number => {
    for (const v of variants) {
      const idx = header.indexOf(v);
      if (idx !== -1) return idx;
    }
    return -1;
  };
  return {
    name: find('name', 'deal name', 'asset name'),
    externalDealId: find('externaldealid', 'external_deal_id', 'external id', 'asset id', 'deal id'),
    category: find('category', 'asset category', 'deal category'),
    dealOwner: find('dealowner', 'deal_owner', 'deal owner', 'owner'),
    currency: find('currency'),
    effectiveDate: find('effectivedate', 'effective_date', 'effective date', 'issue date'),
    terminationDate: find('terminationdate', 'termination_date', 'termination date', 'end date'),
    status: find('status', 'deal status'),
    description: find('description'),
    notes: find('notes'),
  };
}

function parseDealRow(cols: string[], idx: DealHeaderIndex, rowNum: number): ParsedDealRow {
  const warnings: string[] = [];
  const get = (i: number): string => (i >= 0 ? (cols[i] ?? '').trim() : '');

  const name = get(idx.name);
  if (!name) {
    throw new Error(`Row ${rowNum}: 'name' is required`);
  }

  const effectiveDateRaw = get(idx.effectiveDate);
  if (!effectiveDateRaw) {
    throw new Error(`Row ${rowNum}: 'effectiveDate' is required`);
  }
  const effectiveDate = new Date(effectiveDateRaw);
  if (Number.isNaN(effectiveDate.getTime())) {
    throw new Error(`Row ${rowNum}: 'effectiveDate' is not a valid date (${effectiveDateRaw})`);
  }

  const terminationRaw = get(idx.terminationDate);
  let terminationDate: Date | undefined;
  if (terminationRaw) {
    const t = new Date(terminationRaw);
    if (Number.isNaN(t.getTime())) {
      warnings.push(`terminationDate '${terminationRaw}' is not a valid date; ignored`);
    } else if (t.getTime() <= effectiveDate.getTime()) {
      warnings.push('terminationDate is not after effectiveDate; ignored');
    } else {
      terminationDate = t;
    }
  }

  const parsed: ParsedDealRow = {
    name,
    effectiveDate,
    warnings,
  };
  if (terminationDate) parsed.terminationDate = terminationDate;

  const externalDealId = get(idx.externalDealId);
  if (externalDealId) parsed.externalDealId = externalDealId;

  const categoryRaw = get(idx.category);
  if (categoryRaw) {
    const cat = normalizeEnum(categoryRaw, DealCategoryDto);
    if (cat) parsed.category = cat;
    else warnings.push(`Unknown category '${categoryRaw}'; ignored`);
  }

  const dealOwner = get(idx.dealOwner);
  if (dealOwner) parsed.dealOwner = dealOwner;

  const currencyRaw = get(idx.currency).toUpperCase();
  if (currencyRaw) {
    const cur = normalizeEnum(currencyRaw, DealCurrencyDto);
    if (cur) parsed.currency = cur;
    else warnings.push(`Unknown currency '${currencyRaw}'; ignored`);
  }

  const statusRaw = get(idx.status);
  if (statusRaw) {
    const s = normalizeEnum(statusRaw, DealStatusDto);
    if (s) parsed.status = s;
    else warnings.push(`Unknown status '${statusRaw}'; ignored`);
  }

  const description = get(idx.description);
  if (description) parsed.description = description;

  const notes = get(idx.notes);
  if (notes) parsed.notes = notes;

  return parsed;
}

function normalizeEnum<T extends Record<string, string>>(raw: string, e: T): T[keyof T] | null {
  const upper = raw.replace(/[\s-]/g, '_').toUpperCase();
  return (Object.values(e) as string[]).includes(upper) ? (upper as T[keyof T]) : null;
}

/**
 * Common column map for both create and update paths. Caller adds
 * `userId` on the create path (the update path doesn't need it).
 * Typed as `DealUncheckedUpdateInput` — Prisma's Create input widens
 * from Update as long as the required fields are supplied, so the
 * caller's spread of `{ userId }` satisfies the Create branch.
 */
function buildDealPersistData(
  parsed: ParsedDealRow,
  isCreate: boolean,
): Prisma.DealUncheckedUpdateInput {
  const data: Prisma.DealUncheckedUpdateInput = {
    name: parsed.name,
    effectiveDate: parsed.effectiveDate,
    status: (parsed.status as DealStatus) ?? (isCreate ? DealStatus.DRAFT : undefined),
    currency: (parsed.currency as Currency) ?? (isCreate ? Currency.USD : undefined),
  };
  if (parsed.category !== undefined) data.category = parsed.category as DealCategory;
  if (parsed.dealOwner !== undefined) data.dealOwner = parsed.dealOwner;
  if (parsed.terminationDate !== undefined) data.terminationDate = parsed.terminationDate;
  if (parsed.description !== undefined) data.description = parsed.description;
  if (parsed.notes !== undefined) data.notes = parsed.notes;
  if (parsed.externalDealId !== undefined) data.externalDealId = parsed.externalDealId;
  return data;
}

/**
 * RFC 4180-lite CSV row splitter — handles double-quoted fields with
 * embedded commas and `""` escapes. Same shape as the participants
 * importer so admins can reuse Excel exports without normalizing.
 */
function splitCsvRow(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === ',') {
      cells.push(cur);
      cur = '';
    } else if (ch === '"' && cur.length === 0) {
      inQuotes = true;
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells;
}

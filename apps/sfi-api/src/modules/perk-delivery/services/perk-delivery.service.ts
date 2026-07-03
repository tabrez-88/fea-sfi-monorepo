import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PerkDeliveryStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import {
  CreatePerkDeliveryDto,
  ImportPerkDeliveriesResultDto,
  ImportPerkDeliveryRowResultDto,
  PerkDeliveryImportOutcomeDto,
  PerkDeliveryListQueryDto,
  PerkDeliveryListResponseDto,
  PerkDeliveryResponseDto,
  PerkDeliveryStatusEnum,
  UpdatePerkDeliveryDto,
} from '../dto';
import { PerkDeliveryMapper } from '../mappers/perk-delivery.mapper';

/**
 * PerkDelivery Service (MS-3 Wave 6 / Liang MS3-R4).
 *
 * Covers per-participant physical / digital delivery tracking.
 *   - Single create + bulk CSV import
 *   - Owner-scoped list + detail
 *   - Update / delete
 *
 * Match strategy for the CSV importer: rows lookup participants by
 * either `participantId` (UUID) or `email` (case-insensitive), scoped
 * to the target deal. Upsert on `(dealId, participantId)` so re-imports
 * update tracking info instead of creating duplicate rows.
 */
@Injectable()
export class PerkDeliveryService {
  private readonly logger = new Logger(PerkDeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(
    userId: string,
    dealId: string,
    dto: CreatePerkDeliveryDto,
  ): Promise<PerkDeliveryResponseDto> {
    await this.assertDealOwner(dealId, userId);
    await this.assertParticipantOnDeal(dealId, dto.participantId);

    const row = await this.prisma.perkDelivery.create({
      data: {
        dealId,
        participantId: dto.participantId,
        settlementRunId: dto.settlementRunId,
        trackingNumber: dto.trackingNumber,
        carrier: dto.carrier,
        shippedAt: dto.shippedAt ? new Date(dto.shippedAt) : undefined,
        deliveredAt: dto.deliveredAt ? new Date(dto.deliveredAt) : undefined,
        status: (dto.status as PerkDeliveryStatus) ?? PerkDeliveryStatus.PENDING,
        notes: dto.notes,
      },
      include: { participant: { select: { id: true, name: true, email: true } } },
    });

    await this.auditLog.create({
      actor: userId,
      action: 'CREATED',
      entityType: 'PerkDelivery',
      entityId: row.id,
      dealId,
      metadata: { participantId: dto.participantId, status: row.status },
    });

    return PerkDeliveryMapper.toResponse(row);
  }

  async list(
    userId: string,
    dealId: string,
    query: PerkDeliveryListQueryDto,
  ): Promise<PerkDeliveryListResponseDto> {
    await this.assertDealOwner(dealId, userId);

    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PerkDeliveryWhereInput = {
      dealId,
      ...(query.status && { status: query.status }),
      ...(query.participantId && { participantId: query.participantId }),
      ...(query.settlementRunId && { settlementRunId: query.settlementRunId }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.perkDelivery.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { participant: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.perkDelivery.count({ where }),
    ]);

    return {
      data: rows.map(PerkDeliveryMapper.toResponse),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(userId: string, id: string): Promise<PerkDeliveryResponseDto> {
    const row = await this.prisma.perkDelivery.findUnique({
      where: { id },
      include: {
        participant: { select: { id: true, name: true, email: true } },
        deal: { select: { userId: true } },
      },
    });
    if (row?.deal.userId !== userId) {
      throw new NotFoundException(`Perk delivery ${id} not found`);
    }
    return PerkDeliveryMapper.toResponse(row);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdatePerkDeliveryDto,
  ): Promise<PerkDeliveryResponseDto> {
    await this.assertPerkDeliveryOwner(id, userId);

    const updated = await this.prisma.perkDelivery.update({
      where: { id },
      data: {
        ...(dto.settlementRunId !== undefined && { settlementRunId: dto.settlementRunId }),
        ...(dto.trackingNumber !== undefined && { trackingNumber: dto.trackingNumber }),
        ...(dto.carrier !== undefined && { carrier: dto.carrier }),
        ...(dto.shippedAt !== undefined && { shippedAt: new Date(dto.shippedAt) }),
        ...(dto.deliveredAt !== undefined && { deliveredAt: new Date(dto.deliveredAt) }),
        ...(dto.status !== undefined && { status: dto.status as PerkDeliveryStatus }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: { participant: { select: { id: true, name: true, email: true } } },
    });

    await this.auditLog.create({
      actor: userId,
      action: 'UPDATED',
      entityType: 'PerkDelivery',
      entityId: id,
      dealId: updated.dealId,
      metadata: { status: updated.status },
    });

    return PerkDeliveryMapper.toResponse(updated);
  }

  async remove(userId: string, id: string): Promise<{ success: true }> {
    await this.assertPerkDeliveryOwner(id, userId);

    const row = await this.prisma.perkDelivery.delete({ where: { id } });

    await this.auditLog.create({
      actor: userId,
      action: 'DELETED',
      entityType: 'PerkDelivery',
      entityId: id,
      dealId: row.dealId,
    });

    return { success: true };
  }

  // ────────────────────────────────────────────────────────────────
  // CSV Import
  // ────────────────────────────────────────────────────────────────

  async importFromCsv(
    userId: string,
    dealId: string,
    buffer: Buffer,
    skipErrors = false,
    dryRun = false,
  ): Promise<ImportPerkDeliveriesResultDto> {
    await this.assertDealOwner(dealId, userId);

    const lines = buffer
      .toString('utf8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      throw new BadRequestException('CSV must contain a header row and at least one data row');
    }

    const header = splitCsvRow(lines[0]!).map((h) => h.trim().toLowerCase());
    const idx = buildPerkHeaderIndex(header);
    if (idx.participant === -1) {
      throw new BadRequestException(
        'CSV header must include a participant column (`participantId`, `participant`, or `email`).',
      );
    }

    // Preload participants for the deal so the importer can resolve
    // email → id in memory (avoids one query per row).
    const participants = await this.prisma.participant.findMany({
      where: { dealId },
      select: { id: true, email: true },
    });
    const byId = new Map(participants.map((p) => [p.id, p.id]));
    const byEmail = new Map(
      participants
        .filter((p) => p.email)
        .map((p) => [p.email!.toLowerCase(), p.id] as const),
    );

    const dataLines = lines.slice(1);
    const rowResults: ImportPerkDeliveryRowResultDto[] = [];
    const parsedRows: Array<{ rowNum: number; parsed: ParsedPerkRow }> = [];

    for (let i = 0; i < dataLines.length; i++) {
      const rowNum = i + 1;
      const cols = splitCsvRow(dataLines[i]!);
      try {
        const parsed = parsePerkRow(cols, idx, rowNum);
        const resolvedId = resolveParticipant(parsed.participantKey, byId, byEmail);
        if (!resolvedId) {
          throw new Error(
            `Participant '${parsed.participantKey}' not found on this deal (tried both id and email lookup)`,
          );
        }
        parsed.resolvedParticipantId = resolvedId;
        parsedRows.push({ rowNum, parsed });
        rowResults.push({
          row: rowNum,
          success: true,
          outcome: PerkDeliveryImportOutcomeDto.CREATED,
          warnings: parsed.warnings.length > 0 ? parsed.warnings : undefined,
          participantLookupKey: parsed.participantKey,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (!skipErrors) throw new BadRequestException(`Row ${rowNum}: ${message}`);
        rowResults.push({
          row: rowNum,
          success: false,
          outcome: PerkDeliveryImportOutcomeDto.SKIPPED,
          error: message,
        });
      }
    }

    if (parsedRows.length === 0) {
      throw new BadRequestException('No valid rows found in CSV');
    }

    if (dryRun) {
      return {
        imported: 0,
        failed: rowResults.filter((r) => !r.success).length,
        rows: rowResults.map((r) =>
          r.success ? { ...r, outcome: PerkDeliveryImportOutcomeDto.SKIPPED } : r,
        ),
      };
    }

    // Upsert on (dealId, participantId). Prisma has no compound key
    // here, so lookup + branch manually.
    const resultsByRow = new Map<number, { id: string; outcome: PerkDeliveryImportOutcomeDto }>();
    await this.prisma.$transaction(async (tx) => {
      for (const { rowNum, parsed } of parsedRows) {
        const existing = await tx.perkDelivery.findFirst({
          where: { dealId, participantId: parsed.resolvedParticipantId },
          select: { id: true },
        });
        if (existing) {
          await tx.perkDelivery.update({
            where: { id: existing.id },
            data: buildPerkPersistData(parsed),
          });
          resultsByRow.set(rowNum, {
            id: existing.id,
            outcome: PerkDeliveryImportOutcomeDto.UPDATED,
          });
        } else {
          const created = await tx.perkDelivery.create({
            data: {
              // Spread field-only patch first (it doesn't carry FK ids),
              // then set the FK columns explicitly. Cast to Unchecked so
              // Prisma accepts the raw participantId/dealId shape.
              ...(buildPerkPersistData(parsed) as Prisma.PerkDeliveryUncheckedCreateInput),
              dealId,
              participantId: parsed.resolvedParticipantId,
            },
          });
          resultsByRow.set(rowNum, {
            id: created.id,
            outcome: PerkDeliveryImportOutcomeDto.CREATED,
          });
        }
      }
    });

    const finalRows = rowResults.map((r) => {
      if (!r.success) return r;
      const persisted = resultsByRow.get(r.row);
      if (!persisted) return r;
      return { ...r, outcome: persisted.outcome, perkDeliveryId: persisted.id };
    });

    const imported = finalRows.filter((r) => r.success).length;
    this.logger.log(`Imported ${imported} perk deliveries (failed: ${finalRows.length - imported})`);

    // Emit one audit row per persisted delivery so the timeline stays consistent.
    for (const r of finalRows) {
      if (!r.success || !r.perkDeliveryId) continue;
      await this.auditLog.create({
        actor: userId,
        action: r.outcome === PerkDeliveryImportOutcomeDto.UPDATED ? 'UPDATED' : 'CREATED',
        entityType: 'PerkDelivery',
        entityId: r.perkDeliveryId,
        dealId,
        metadata: { source: 'CSV_IMPORT', row: r.row },
      });
    }

    return { imported, failed: finalRows.length - imported, rows: finalRows };
  }

  // ────────────────────────────────────────────────────────────────
  // Guards
  // ────────────────────────────────────────────────────────────────

  private async assertDealOwner(dealId: string, userId: string): Promise<void> {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true, userId: true },
    });
    if (deal?.userId !== userId) {
      throw new NotFoundException(`Deal with ID ${dealId} not found`);
    }
  }

  private async assertParticipantOnDeal(dealId: string, participantId: string): Promise<void> {
    const p = await this.prisma.participant.findUnique({
      where: { id: participantId },
      select: { dealId: true },
    });
    if (p?.dealId !== dealId) {
      throw new BadRequestException(
        `Participant ${participantId} does not belong to deal ${dealId}`,
      );
    }
  }

  private async assertPerkDeliveryOwner(id: string, userId: string): Promise<void> {
    const row = await this.prisma.perkDelivery.findUnique({
      where: { id },
      select: { id: true, deal: { select: { userId: true } } },
    });
    if (row?.deal.userId !== userId) {
      throw new NotFoundException(`Perk delivery ${id} not found`);
    }
  }
}

// ────────────────────────────────────────────────────────────────
// CSV helpers (pure module-scope, easy to unit-test)
// ────────────────────────────────────────────────────────────────

interface PerkHeaderIndex {
  participant: number;
  settlementRunId: number;
  trackingNumber: number;
  carrier: number;
  shippedAt: number;
  deliveredAt: number;
  status: number;
  notes: number;
}

interface ParsedPerkRow {
  participantKey: string;
  resolvedParticipantId: string;
  settlementRunId?: string;
  trackingNumber?: string;
  carrier?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  status?: PerkDeliveryStatusEnum;
  notes?: string;
  warnings: string[];
}

function buildPerkHeaderIndex(header: string[]): PerkHeaderIndex {
  const find = (...variants: string[]): number => {
    for (const v of variants) {
      const i = header.indexOf(v);
      if (i !== -1) return i;
    }
    return -1;
  };
  return {
    participant: find('participantid', 'participant', 'participant_id', 'email', 'holderid', 'holder id'),
    settlementRunId: find('settlementrunid', 'settlement_run_id', 'settlement run id', 'run id'),
    trackingNumber: find('trackingnumber', 'tracking_number', 'tracking number', 'tracking'),
    carrier: find('carrier'),
    shippedAt: find('shippedat', 'shipped_at', 'shipped at', 'ship date'),
    deliveredAt: find('deliveredat', 'delivered_at', 'delivered at', 'delivery date'),
    status: find('status'),
    notes: find('notes', 'note'),
  };
}

function parsePerkRow(cols: string[], idx: PerkHeaderIndex, rowNum: number): ParsedPerkRow {
  const warnings: string[] = [];
  const get = (i: number): string => (i >= 0 ? (cols[i] ?? '').trim() : '');

  const participantKey = get(idx.participant);
  if (!participantKey) {
    throw new Error(`Row ${rowNum}: participant identifier is required`);
  }

  const parsed: ParsedPerkRow = {
    participantKey,
    resolvedParticipantId: '', // filled in later after DB lookup
    warnings,
  };

  const settlementRunId = get(idx.settlementRunId);
  if (settlementRunId) parsed.settlementRunId = settlementRunId;

  const trackingNumber = get(idx.trackingNumber);
  if (trackingNumber) parsed.trackingNumber = trackingNumber;

  const carrier = get(idx.carrier);
  if (carrier) parsed.carrier = carrier;

  const shippedRaw = get(idx.shippedAt);
  if (shippedRaw) {
    const d = new Date(shippedRaw);
    if (Number.isNaN(d.getTime())) {
      warnings.push(`shippedAt '${shippedRaw}' is not a valid date; ignored`);
    } else {
      parsed.shippedAt = d;
    }
  }

  const deliveredRaw = get(idx.deliveredAt);
  if (deliveredRaw) {
    const d = new Date(deliveredRaw);
    if (Number.isNaN(d.getTime())) {
      warnings.push(`deliveredAt '${deliveredRaw}' is not a valid date; ignored`);
    } else {
      parsed.deliveredAt = d;
    }
  }

  const statusRaw = get(idx.status).toUpperCase();
  if (statusRaw) {
    if ((Object.values(PerkDeliveryStatusEnum) as string[]).includes(statusRaw)) {
      parsed.status = statusRaw as PerkDeliveryStatusEnum;
    } else {
      warnings.push(`Unknown status '${statusRaw}'; ignored`);
    }
  }

  const notes = get(idx.notes);
  if (notes) parsed.notes = notes;

  // Auto-status inference: a row with a tracking number but no explicit
  // status is safe to treat as SHIPPED — that's the whole reason the
  // creator uploaded the row.
  if (!parsed.status && parsed.trackingNumber) {
    parsed.status = PerkDeliveryStatusEnum.SHIPPED;
  }

  return parsed;
}

/**
 * Resolve the CSV `participantKey` to a participant id inside the deal.
 * Tries id first (fast path when FEA CSV export uses UUIDs), falls
 * back to case-insensitive email lookup.
 */
function resolveParticipant(
  key: string,
  byId: Map<string, string>,
  byEmail: Map<string, string>,
): string | null {
  if (byId.has(key)) return byId.get(key)!;
  const emailHit = byEmail.get(key.toLowerCase());
  return emailHit ?? null;
}

function buildPerkPersistData(parsed: ParsedPerkRow): Prisma.PerkDeliveryUpdateInput {
  const data: Prisma.PerkDeliveryUpdateInput = {};
  if (parsed.settlementRunId !== undefined) {
    data.settlementRun = { connect: { id: parsed.settlementRunId } };
  }
  if (parsed.trackingNumber !== undefined) data.trackingNumber = parsed.trackingNumber;
  if (parsed.carrier !== undefined) data.carrier = parsed.carrier;
  if (parsed.shippedAt !== undefined) data.shippedAt = parsed.shippedAt;
  if (parsed.deliveredAt !== undefined) data.deliveredAt = parsed.deliveredAt;
  if (parsed.status !== undefined) data.status = parsed.status as PerkDeliveryStatus;
  if (parsed.notes !== undefined) data.notes = parsed.notes;
  return data;
}

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

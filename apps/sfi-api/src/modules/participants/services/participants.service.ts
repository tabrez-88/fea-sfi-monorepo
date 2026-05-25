import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Participant, ParticipantBehavior, Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import { PaginationQueryDto } from '../../deals/dto';
import { DealsService } from '../../deals/services/deals.service';
import {
  BulkImportResultDto,
  CreateParticipantDto,
  ImportParticipantRowResultDto,
  ImportRowOutcomeDto,
  ParticipantResponseDto,
} from '../dto';
import { InvestmentFields, ParticipantMapper } from '../mappers/participant.mapper';

// Legacy CSV header (5 cols) — preserved for back-compat.
const CSV_HEADERS_LEGACY = ['name', 'roleName', 'behaviorType', 'email', 'externalId'] as const;
// Current CSV header (9 cols) — adds investment / pool fields.
const CSV_HEADERS_V2 = [
  ...CSV_HEADERS_LEGACY,
  'investmentAmount',
  'units',
  'pricePerUnit',
  'poolMember',
] as const;
const VALID_BEHAVIORS = new Set(Object.values(ParticipantBehavior));

interface ParsedRow {
  name: string;
  roleName: string;
  behaviorType: ParticipantBehavior;
  email?: string;
  externalId?: string;
  investment: InvestmentFields;
  warnings: string[];
}

@Injectable()
export class ParticipantsService {
  private readonly logger = new Logger(ParticipantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dealsService: DealsService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Add (or update) a participant on a deal. Same upsert match strategy as
   * the CSV import — `(dealId, email)` first, `(dealId, externalId)` next —
   * so submitting the same email twice doesn't create a duplicate row. The
   * audit-log action records whether the row was newly created or updated.
   * Round 2 Comment 4.
   */
  async create(
    userId: string,
    dealId: string,
    dto: CreateParticipantDto,
  ): Promise<ParticipantResponseDto> {
    this.logger.log(`Creating/updating participant for deal: ${dealId}`);

    await this.dealsService.assertDealOwner(dealId, userId);

    const investment: InvestmentFields = {
      investmentAmount: dto.investmentAmount,
      units: dto.units,
      pricePerUnit: dto.pricePerUnit,
      poolMember: dto.poolMember,
    };

    const existing = await this.findExistingForUpsert(this.prisma, dealId, dto.email, dto.externalId);

    let participant: Participant;
    let action: 'CREATED' | 'UPDATED';

    if (existing) {
      const existingMetadata = (existing.metadata ?? null) as Record<string, unknown> | null;
      // Caller-provided `dto.metadata` (if any) takes priority over the
      // existing row's stored metadata, mirroring "replace the fields you
      // sent" semantics. Investment fields then layer on top of that.
      const baseMetadata = dto.metadata ?? existingMetadata;
      participant = await this.prisma.participant.update({
        where: { id: existing.id },
        data: {
          name: dto.name,
          roleName: dto.roleName,
          behaviorType: dto.behaviorType as ParticipantBehavior,
          externalId: dto.externalId,
          email: dto.email,
          metadata: ParticipantMapper.buildMetadata(baseMetadata, investment),
        },
      });
      action = 'UPDATED';
    } else {
      participant = await this.prisma.participant.create({
        data: {
          dealId,
          name: dto.name,
          roleName: dto.roleName,
          behaviorType: dto.behaviorType as ParticipantBehavior,
          externalId: dto.externalId,
          email: dto.email,
          metadata: ParticipantMapper.buildMetadata(dto.metadata, investment),
        },
      });
      action = 'CREATED';
    }

    this.logger.log(`Participant ${action.toLowerCase()} with ID: ${participant.id}`);

    await this.auditLog.create({
      actor: userId,
      action,
      entityType: 'Participant',
      entityId: participant.id,
      dealId,
      metadata: { name: participant.name, roleName: participant.roleName, behaviorType: participant.behaviorType },
    });

    return ParticipantMapper.toResponse(participant);
  }

  async findAllByDeal(userId: string, dealId: string, query: PaginationQueryDto) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    this.logger.log(`Fetching participants for deal: ${dealId}`);

    await this.dealsService.assertDealOwner(dealId, userId);

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

  /**
   * Bulk import participants from a CSV buffer.
   *
   * Supported CSV formats (header row required):
   *   - Legacy (5 cols): `name,roleName,behaviorType,email,externalId`
   *   - Current (9 cols): legacy + `investmentAmount,units,pricePerUnit,poolMember`
   *
   * Header order is fixed for both variants. The header is detected by the
   * column count + names; rows are upserted into `(dealId, email)` (or
   * `(dealId, externalId)` if email is blank), so re-importing the same CSV
   * is idempotent.
   *
   * Validation behavior:
   *   - Required fields (`name`, `roleName`, valid `behaviorType`) fail the
   *     row hard.
   *   - Optional numeric/boolean fields with bad shapes are dropped and
   *     reported as `warnings[]` — the row still imports (FB-003 Round 2.1
   *     f3/f4 softening).
   *
   * `skipErrors=true` reports failed rows alongside successful ones;
   * `skipErrors=false` aborts on the first hard failure.
   */
  async importFromCsv(
    userId: string,
    dealId: string,
    buffer: Buffer,
    skipErrors = false,
  ): Promise<BulkImportResultDto> {
    this.logger.log(`Importing participants from CSV for deal: ${dealId}`);

    await this.dealsService.assertDealOwner(dealId, userId);

    const lines = buffer
      .toString('utf8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      throw new BadRequestException('CSV must contain a header row and at least one data row');
    }

    const headerCols = lines[0].split(',').map((h) => h.trim());
    const headerVariant = this.detectHeaderVariant(headerCols);

    const dataLines = lines.slice(1);
    const rowResults: ImportParticipantRowResultDto[] = [];
    const parsedRows: Array<{ rowNum: number; parsed: ParsedRow }> = [];

    for (let i = 0; i < dataLines.length; i++) {
      const rowNum = i + 1;
      const cols = this.splitCsvRow(dataLines[i]);

      try {
        const parsed = this.parseRow(cols, headerVariant);
        parsedRows.push({ rowNum, parsed });
        rowResults.push({
          row: rowNum,
          success: true,
          outcome: ImportRowOutcomeDto.CREATED, // overwritten after upsert
          warnings: parsed.warnings.length > 0 ? parsed.warnings : undefined,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (!skipErrors) throw new BadRequestException(`Row ${rowNum}: ${message}`);
        rowResults.push({
          row: rowNum,
          success: false,
          outcome: ImportRowOutcomeDto.SKIPPED,
          error: message,
        });
      }
    }

    if (parsedRows.length === 0) {
      throw new BadRequestException('No valid rows found in CSV');
    }

    // Upsert each parsed row in a single transaction. Match strategy:
    //   1. If email is provided, match on (dealId, email)
    //   2. Else if externalId is provided, match on (dealId, externalId)
    //   3. Else always create a new row
    const upsertResults = await this.prisma.$transaction(async (tx) => {
      const results: Array<{ rowNum: number; participant: Participant; outcome: ImportRowOutcomeDto }> = [];

      for (const { rowNum, parsed } of parsedRows) {
        const existing = await this.findExistingForUpsert(tx, dealId, parsed.email, parsed.externalId);

        if (existing) {
          // Merge new investment fields into existing metadata so custom
          // fields added via the API (anything outside the 4 investment keys)
          // are preserved on re-import. Round 2 Comment 4 — "replace its
          // fields", interpreted as the columns the CSV provided.
          const existingMetadata = (existing.metadata ?? null) as Record<string, unknown> | null;
          const updated = await tx.participant.update({
            where: { id: existing.id },
            data: {
              name: parsed.name,
              roleName: parsed.roleName,
              behaviorType: parsed.behaviorType,
              externalId: parsed.externalId,
              email: parsed.email,
              metadata: ParticipantMapper.buildMetadata(existingMetadata, parsed.investment),
            },
          });
          results.push({ rowNum, participant: updated, outcome: ImportRowOutcomeDto.UPDATED });
        } else {
          const created = await tx.participant.create({
            data: {
              dealId,
              name: parsed.name,
              roleName: parsed.roleName,
              behaviorType: parsed.behaviorType,
              externalId: parsed.externalId,
              email: parsed.email,
              metadata: ParticipantMapper.buildMetadata(null, parsed.investment),
            },
          });
          results.push({ rowNum, participant: created, outcome: ImportRowOutcomeDto.CREATED });
        }
      }

      return results;
    });

    // Splice upsert outputs back into rowResults by row number.
    const byRow = new Map(upsertResults.map((r) => [r.rowNum, r]));
    for (const result of rowResults) {
      if (!result.success) continue;
      const upserted = byRow.get(result.row);
      if (!upserted) continue;
      result.outcome = upserted.outcome;
      result.participant = ParticipantMapper.toResponse(upserted.participant);
    }

    const importedCount = upsertResults.length;
    const createdCount = upsertResults.filter((r) => r.outcome === ImportRowOutcomeDto.CREATED).length;
    const updatedCount = upsertResults.filter((r) => r.outcome === ImportRowOutcomeDto.UPDATED).length;
    const failedCount = rowResults.filter((r) => !r.success).length;

    await this.auditLog.create({
      actor: userId,
      action: 'BULK_IMPORTED',
      entityType: 'Participant',
      entityId: dealId,
      dealId,
      metadata: {
        imported: importedCount,
        created: createdCount,
        updated: updatedCount,
        failed: failedCount,
        headerVariant,
      },
    });

    this.logger.log(
      `CSV import complete for deal ${dealId} — ${createdCount} created, ${updatedCount} updated, ${failedCount} skipped`,
    );

    return {
      imported: importedCount,
      failed: failedCount,
      rows: rowResults,
    };
  }

  /**
   * Export all participants for a deal as CSV.
   * Emits the 9-column header by default (back-compat readers that only
   * understand the first 5 columns are unaffected — extra columns are
   * appended at the end).
   */
  async exportToCsv(userId: string, dealId: string): Promise<string> {
    this.logger.log(`Exporting participants to CSV for deal: ${dealId}`);

    await this.dealsService.assertDealOwner(dealId, userId);

    const participants = await this.prisma.participant.findMany({
      where: { dealId },
      orderBy: { createdAt: 'asc' },
    });

    const header = CSV_HEADERS_V2.join(',');
    const rows = participants.map((p) => {
      const meta = (p.metadata ?? {}) as Record<string, unknown>;
      const investmentAmount = typeof meta.investmentAmount === 'number' ? String(meta.investmentAmount) : '';
      const units = typeof meta.units === 'number' ? String(meta.units) : '';
      const pricePerUnit = typeof meta.pricePerUnit === 'number' ? String(meta.pricePerUnit) : '';
      const poolMember = typeof meta.poolMember === 'boolean' ? String(meta.poolMember) : '';

      return [
        this.escapeCsvField(p.name),
        this.escapeCsvField(p.roleName),
        p.behaviorType,
        this.escapeCsvField(p.email ?? ''),
        this.escapeCsvField(p.externalId ?? ''),
        investmentAmount,
        units,
        pricePerUnit,
        poolMember,
      ].join(',');
    });

    return [header, ...rows].join('\r\n');
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  /**
   * Detect whether the CSV uses the legacy 5-col header or the current
   * 9-col header. Header comparison is case-insensitive on names but the
   * column order is fixed.
   */
  private detectHeaderVariant(headerCols: string[]): 'legacy' | 'v2' {
    const normalized = headerCols.map((h) => h.toLowerCase());

    const matches = (expected: readonly string[]) =>
      normalized.length === expected.length &&
      expected.every((col, idx) => normalized[idx] === col.toLowerCase());

    if (matches(CSV_HEADERS_V2)) return 'v2';
    if (matches(CSV_HEADERS_LEGACY)) return 'legacy';

    throw new BadRequestException(
      `Invalid CSV header. Expected one of: "${CSV_HEADERS_LEGACY.join(',')}" or "${CSV_HEADERS_V2.join(',')}"`,
    );
  }

  /**
   * Parse a single CSV row by header variant. Throws `Error` with a
   * human-readable message for hard failures; appends to `warnings[]` for
   * soft failures.
   */
  private parseRow(cols: string[], headerVariant: 'legacy' | 'v2'): ParsedRow {
    const [name, roleName, behaviorTypeRaw, email, externalId, investmentRaw, unitsRaw, priceRaw, poolRaw] = cols;

    if (!name) throw new Error('name is required');
    if (!roleName) throw new Error('roleName is required');
    if (!behaviorTypeRaw || !VALID_BEHAVIORS.has(behaviorTypeRaw as ParticipantBehavior)) {
      throw new Error(`behaviorType must be one of: ${[...VALID_BEHAVIORS].join(', ')}`);
    }

    const warnings: string[] = [];
    const investment: InvestmentFields = {};
    let poolMemberExplicitlyProvided = false;

    if (headerVariant === 'v2') {
      const investmentAmount = this.parseOptionalNumber(investmentRaw, 'investmentAmount', warnings);
      if (investmentAmount !== undefined) investment.investmentAmount = investmentAmount;

      const units = this.parseOptionalInt(unitsRaw, 'units', warnings);
      if (units !== undefined) investment.units = units;

      const pricePerUnit = this.parseOptionalNumber(priceRaw, 'pricePerUnit', warnings);
      if (pricePerUnit !== undefined) investment.pricePerUnit = pricePerUnit;

      const poolMember = this.parseOptionalBoolean(poolRaw, 'poolMember', warnings);
      if (poolMember !== undefined) {
        investment.poolMember = poolMember;
        poolMemberExplicitlyProvided = true;
      }
    }

    // Auto-infer poolMember when the column is blank but units > 0 (Run plan
    // explicit). Only fires when poolMember wasn't explicitly provided, so an
    // operator who wrote `poolMember=false` is never silently overridden.
    if (!poolMemberExplicitlyProvided && (investment.units ?? 0) > 0) {
      investment.poolMember = true;
    }

    // Round 2.1 soft-validation: RECOUPMENT-behavior participants without an
    // `investmentAmount` cannot be weighted in the pool resolver (and lose
    // their fallback weighting if units is also absent). Warn but don't fail.
    if (
      behaviorTypeRaw === 'RECOUPMENT' &&
      investment.investmentAmount === undefined &&
      investment.units === undefined
    ) {
      warnings.push(
        'RECOUPMENT participant has neither investmentAmount nor units — pool resolver will fall back to equal-split for this participant',
      );
    } else if (behaviorTypeRaw === 'RECOUPMENT' && investment.investmentAmount === undefined) {
      warnings.push(
        'RECOUPMENT participant missing investmentAmount — pool resolver will fall back to unit-weighted distribution only',
      );
    }

    return {
      name,
      roleName,
      behaviorType: behaviorTypeRaw as ParticipantBehavior,
      email: email || undefined,
      externalId: externalId || undefined,
      investment,
      warnings,
    };
  }

  private parseOptionalNumber(raw: string | undefined, field: string, warnings: string[]): number | undefined {
    if (raw === undefined || raw === '') return undefined;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      warnings.push(`${field} could not be parsed as a non-negative number ("${raw}") — field skipped`);
      return undefined;
    }
    return parsed;
  }

  private parseOptionalInt(raw: string | undefined, field: string, warnings: string[]): number | undefined {
    if (raw === undefined || raw === '') return undefined;
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 0) {
      warnings.push(`${field} could not be parsed as a non-negative integer ("${raw}") — field skipped`);
      return undefined;
    }
    return parsed;
  }

  private parseOptionalBoolean(raw: string | undefined, field: string, warnings: string[]): boolean | undefined {
    if (raw === undefined || raw === '') return undefined;
    const normalized = raw.toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
    warnings.push(`${field} could not be parsed as a boolean ("${raw}") — field skipped`);
    return undefined;
  }

  /**
   * Minimal CSV row splitter that respects double-quoted fields (so commas
   * and escaped quotes inside `"..."` survive round-tripping through
   * `exportToCsv`). Not a full RFC 4180 parser — embedded newlines are not
   * supported, which matches the line-based reader above.
   */
  private splitCsvRow(line: string): string[] {
    const out: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        out.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }

    out.push(current.trim());
    return out;
  }

  /**
   * Look up an existing participant for upsert matching. Tries
   * `(dealId, email)` first, then falls back to `(dealId, externalId)`.
   * Returns `null` when neither key is provided or no row matches.
   *
   * Accepts either the base `PrismaService` (for single-row callers) or a
   * `Prisma.TransactionClient` (for the bulk-import transaction).
   */
  private async findExistingForUpsert(
    client: Pick<PrismaService, 'participant'> | Prisma.TransactionClient,
    dealId: string,
    email: string | undefined,
    externalId: string | undefined,
  ): Promise<Participant | null> {
    if (email) {
      const byEmail = await client.participant.findFirst({ where: { dealId, email } });
      if (byEmail) return byEmail;
    }
    if (externalId) {
      const byExt = await client.participant.findFirst({ where: { dealId, externalId } });
      if (byExt) return byExt;
    }
    return null;
  }

  private escapeCsvField(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}

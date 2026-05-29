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
  ParticipantBehaviorDto,
  ParticipantResponseDto,
  UpdateParticipantDto,
} from '../dto';
import { InvestmentFields, ParticipantMapper } from '../mappers/participant.mapper';

// Legacy CSV header (5 cols), preserved for back-compat.
const CSV_HEADERS_LEGACY = ['name', 'roleName', 'behaviorType', 'email', 'externalId'] as const;
// 9-col header, adds investment / pool fields onto legacy 5-col.
const CSV_HEADERS_V2 = [
  ...CSV_HEADERS_LEGACY,
  'investmentAmount',
  'units',
  'pricePerUnit',
  'poolMember',
] as const;
// 8-col header (no `externalId`), shipped with the in-app Download CSV
// Template button. Phase 1 hides the externalId field from the form +
// template since it is too technical for most users; the column is still
// accepted via legacy + v2 variants for back-compat with existing exports.
const CSV_HEADERS_V2_NO_EXT_ID = [
  'name',
  'roleName',
  'behaviorType',
  'email',
  'investmentAmount',
  'units',
  'pricePerUnit',
  'poolMember',
] as const;
const VALID_BEHAVIORS = new Set(Object.values(ParticipantBehavior));

type HeaderVariant = 'legacy' | 'v2' | 'v2NoExternalId';

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

  /**
   * Return distinct role names used on a deal, optionally narrowed by a
   * case-insensitive substring match on the role name. Powers the Add
   * Participant form's Role Name autocomplete combobox. Results are sorted
   * alphabetically and capped at 20 entries.
   */
  async findDistinctRoles(
    userId: string,
    dealId: string,
    q?: string,
  ): Promise<string[]> {
    await this.dealsService.assertDealOwner(dealId, userId);

    const trimmed = q?.trim();
    const where: Prisma.ParticipantWhereInput = { dealId };
    if (trimmed) {
      where.roleName = { contains: trimmed, mode: 'insensitive' };
    }

    const rows = await this.prisma.participant.findMany({
      where,
      distinct: ['roleName'],
      select: { roleName: true },
      orderBy: { roleName: 'asc' },
      take: 20,
    });

    return rows.map((r) => r.roleName);
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

  async findOne(userId: string, id: string): Promise<ParticipantResponseDto> {
    const participant = await this.loadOwnedParticipant(userId, id);
    return ParticipantMapper.toResponse(participant);
  }

  /**
   * Partial update of a single participant. Any field on `UpdateParticipantDto`
   * is optional; only the keys actually present in `dto` get written. Investment
   * keys (`investmentAmount`, `units`, `pricePerUnit`, `poolMember`) merge into
   * the existing `metadata` JSON rather than replace it, so custom keys added
   * outside the typed surface survive an edit.
   */
  async update(
    userId: string,
    id: string,
    dto: UpdateParticipantDto,
  ): Promise<ParticipantResponseDto> {
    const existing = await this.loadOwnedParticipant(userId, id);
    this.logger.log(`Updating participant ${id}`);

    const investment: InvestmentFields = {};
    if (dto.investmentAmount !== undefined) investment.investmentAmount = dto.investmentAmount;
    if (dto.units !== undefined) investment.units = dto.units;
    if (dto.pricePerUnit !== undefined) investment.pricePerUnit = dto.pricePerUnit;
    if (dto.poolMember !== undefined) investment.poolMember = dto.poolMember;

    const existingMetadata = (existing.metadata ?? null) as Record<string, unknown> | null;
    const baseMetadata = dto.metadata ?? existingMetadata;

    const data: Prisma.ParticipantUpdateInput = {
      metadata: ParticipantMapper.buildMetadata(baseMetadata, investment),
    };
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.roleName !== undefined) data.roleName = dto.roleName;
    if (dto.behaviorType !== undefined) data.behaviorType = dto.behaviorType as ParticipantBehavior;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.externalId !== undefined) data.externalId = dto.externalId;

    const updated = await this.prisma.participant.update({ where: { id }, data });

    await this.auditLog.create({
      actor: userId,
      action: 'UPDATED',
      entityType: 'Participant',
      entityId: id,
      dealId: existing.dealId,
      metadata: {
        name: updated.name,
        roleName: updated.roleName,
        behaviorType: updated.behaviorType,
      },
    });

    return ParticipantMapper.toResponse(updated);
  }

  /**
   * Hard-delete a single participant. Removes the row from the DB and emits
   * a `DELETED` audit log entry carrying the participant's identifying
   * fields so the action is reconstructable later.
   *
   * Note: this is a hard delete. If we later need undo / restore, swap to a
   * soft-delete `archivedAt` column (same pattern as the Documents module).
   */
  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.loadOwnedParticipant(userId, id);
    this.logger.log(`Deleting participant ${id}`);

    await this.prisma.participant.delete({ where: { id } });

    await this.auditLog.create({
      actor: userId,
      action: 'DELETED',
      entityType: 'Participant',
      entityId: id,
      dealId: existing.dealId,
      metadata: {
        name: existing.name,
        roleName: existing.roleName,
        behaviorType: existing.behaviorType,
        email: existing.email,
      },
    });
  }

  /**
   * Fetch a participant by id and verify the caller owns the surrounding
   * deal. Centralizes the 404 / ownership-403 chain used by every per-id
   * operation (findOne / update / remove).
   */
  private async loadOwnedParticipant(userId: string, id: string): Promise<Participant> {
    const participant = await this.prisma.participant.findUnique({ where: { id } });
    if (!participant) {
      throw new NotFoundException(`Participant with ID ${id} not found`);
    }
    await this.dealsService.assertDealOwner(participant.dealId, userId);
    return participant;
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
    dryRun = false,
  ): Promise<BulkImportResultDto> {
    this.logger.log(
      `Importing participants from CSV for deal: ${dealId} (dryRun=${dryRun})`,
    );

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
        // Attach whatever shape we can extract from the raw cols so the
        // Preview / Import Complete table still shows the row's available
        // fields (name, email, role, etc.) even though parsing hard-failed.
        // Helps admins identify which CSV row is broken without having to
        // open the source file.
        rowResults.push({
          row: rowNum,
          success: false,
          outcome: ImportRowOutcomeDto.SKIPPED,
          error: message,
          participant: this.buildRawPreviewParticipant(dealId, cols, headerVariant),
        });
      }
    }

    if (parsedRows.length === 0) {
      throw new BadRequestException('No valid rows found in CSV');
    }

    // Dry-run path: skip the DB transaction entirely. Used by the Preview
    // Import modal to show the admin what WOULD be imported (with the same
    // validation + warning surface) before they commit. Rows that parse OK
    // come back as `outcome=skipped` (nothing written) with a synthetic
    // `participant` shape carrying the parsed fields so the FE preview
    // table can render row content. Hard-failed rows keep their original
    // `skipped` outcome with the parse error message.
    if (dryRun) {
      const parsedByRow = new Map(parsedRows.map((p) => [p.rowNum, p.parsed]));
      this.logger.log(
        `CSV dry-run for deal ${dealId}: ${parsedRows.length} rows valid, ${rowResults.filter((r) => !r.success).length} would be skipped`,
      );
      return {
        imported: 0,
        failed: rowResults.filter((r) => !r.success).length,
        rows: rowResults.map((r) => {
          if (!r.success) return r;
          const parsed = parsedByRow.get(r.row);
          const next: ImportParticipantRowResultDto = {
            ...r,
            outcome: ImportRowOutcomeDto.SKIPPED,
          };
          if (parsed) {
            next.participant = this.buildPreviewParticipant(dealId, parsed);
          }
          return next;
        }),
      };
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
   * Detect which CSV header variant the file uses. Header comparison is
   * case-insensitive on names but column order is fixed per variant.
   *
   * Accepted variants:
   *   - `legacy`         5-col: name, roleName, behaviorType, email, externalId
   *   - `v2`             9-col: legacy + investmentAmount, units, pricePerUnit, poolMember
   *   - `v2NoExternalId` 8-col: v2 minus externalId (shipped by the in-app
   *                      Download CSV Template button, since the UI hides
   *                      externalId from Phase 1)
   */
  private detectHeaderVariant(headerCols: string[]): HeaderVariant {
    const normalized = headerCols.map((h) => h.toLowerCase());

    const matches = (expected: readonly string[]) =>
      normalized.length === expected.length &&
      expected.every((col, idx) => normalized[idx] === col.toLowerCase());

    if (matches(CSV_HEADERS_V2)) return 'v2';
    if (matches(CSV_HEADERS_V2_NO_EXT_ID)) return 'v2NoExternalId';
    if (matches(CSV_HEADERS_LEGACY)) return 'legacy';

    throw new BadRequestException(
      `Invalid CSV header. Expected one of: "${CSV_HEADERS_LEGACY.join(',')}", "${CSV_HEADERS_V2.join(',')}", or "${CSV_HEADERS_V2_NO_EXT_ID.join(',')}"`,
    );
  }

  /**
   * Parse a single CSV row by header variant. Throws `Error` with a
   * human-readable message for hard failures; appends to `warnings[]` for
   * soft failures.
   *
   * Strategy: for the `v2NoExternalId` variant, splice an empty placeholder
   * at the externalId position so the rest of the parser can treat it as
   * the 9-col v2 layout and the destructure indexes stay stable.
   */
  private parseRow(cols: string[], headerVariant: HeaderVariant): ParsedRow {
    const effectiveCols =
      headerVariant === 'v2NoExternalId'
        ? [...cols.slice(0, 4), '', ...cols.slice(4)]
        : cols;
    const [name, roleName, behaviorTypeRaw, email, externalId, investmentRaw, unitsRaw, priceRaw, poolRaw] = effectiveCols;

    if (!name) throw new Error('name is required');
    if (!roleName) throw new Error('roleName is required');
    if (!behaviorTypeRaw || !VALID_BEHAVIORS.has(behaviorTypeRaw as ParticipantBehavior)) {
      throw new Error(`behaviorType must be one of: ${[...VALID_BEHAVIORS].join(', ')}`);
    }

    const warnings: string[] = [];
    const investment: InvestmentFields = {};
    let poolMemberExplicitlyProvided = false;
    const hasInvestmentCols = headerVariant === 'v2' || headerVariant === 'v2NoExternalId';

    if (hasInvestmentCols) {
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
   * Build a partial `ParticipantResponseDto` directly from raw CSV columns
   * for rows that hard-failed `parseRow`. Mirrors the structure of
   * `buildPreviewParticipant` but skips validation, so whatever fields the
   * admin DID fill in show up in the Preview / Import Complete tables.
   * Invalid `behaviorType` strings come back as `null` so the FE renders
   * "N/A" instead of crashing the badge lookup.
   */
  private buildRawPreviewParticipant(
    dealId: string,
    cols: string[],
    headerVariant: HeaderVariant,
  ): ParticipantResponseDto {
    const effectiveCols =
      headerVariant === 'v2NoExternalId'
        ? [...cols.slice(0, 4), '', ...cols.slice(4)]
        : cols;
    const [name, roleName, behaviorTypeRaw, email, externalId, investmentRaw, unitsRaw, priceRaw, poolRaw] = effectiveCols;

    const validBehavior =
      behaviorTypeRaw && VALID_BEHAVIORS.has(behaviorTypeRaw as ParticipantBehavior)
        ? (behaviorTypeRaw as ParticipantBehaviorDto)
        : null;

    const safeNumber = (raw: string | undefined): number | null => {
      if (raw === undefined || raw === '') return null;
      const n = Number(raw);
      return Number.isFinite(n) && n >= 0 ? n : null;
    };

    const safeBoolean = (raw: string | undefined): boolean | null => {
      if (raw === undefined || raw === '') return null;
      const normalized = raw.toLowerCase();
      if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
      if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
      return null;
    };

    const now = new Date();
    return {
      id: '',
      dealId,
      name: name ?? '',
      roleName: roleName ?? '',
      // FE checks `p.behaviorType ?` and shows "N/A" when missing, so passing
      // a null past the type cast is safe at runtime.
      behaviorType: validBehavior as unknown as ParticipantBehaviorDto,
      externalId: externalId || null,
      email: email || null,
      investmentAmount: safeNumber(investmentRaw),
      units: safeNumber(unitsRaw),
      pricePerUnit: safeNumber(priceRaw),
      poolMember: safeBoolean(poolRaw),
      metadata: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Build a synthetic `ParticipantResponseDto` from a parsed CSV row, used
   * only inside the dryRun preview response. Required-but-unknown fields
   * (`id`, dates) are placeholder defaults since nothing is persisted yet;
   * the FE Preview table reads only the user-visible fields (name, role,
   * behavior, email, investment columns) and never surfaces the placeholders.
   */
  private buildPreviewParticipant(
    dealId: string,
    parsed: ParsedRow,
  ): ParticipantResponseDto {
    const now = new Date();
    return {
      id: '',
      dealId,
      name: parsed.name,
      roleName: parsed.roleName,
      behaviorType: parsed.behaviorType as unknown as ParticipantBehaviorDto,
      externalId: parsed.externalId ?? null,
      email: parsed.email ?? null,
      investmentAmount: parsed.investment.investmentAmount ?? null,
      units: parsed.investment.units ?? null,
      pricePerUnit: parsed.investment.pricePerUnit ?? null,
      poolMember: parsed.investment.poolMember ?? null,
      metadata: null,
      createdAt: now,
      updatedAt: now,
    };
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

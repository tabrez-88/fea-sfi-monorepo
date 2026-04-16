import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ParticipantBehavior, Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import { PaginationQueryDto } from '../../deals/dto';
import { DealsService } from '../../deals/services/deals.service';
import {
  BulkImportResultDto,
  CreateParticipantDto,
  ImportParticipantRowResultDto,
  ParticipantResponseDto,
} from '../dto';
import { ParticipantMapper } from '../mappers/participant.mapper';

// CSV column order: name,roleName,behaviorType,email,externalId
const CSV_HEADERS = ['name', 'roleName', 'behaviorType', 'email', 'externalId'] as const;
const VALID_BEHAVIORS = new Set(Object.values(ParticipantBehavior));

@Injectable()
export class ParticipantsService {
  private readonly logger = new Logger(ParticipantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dealsService: DealsService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(
    userId: string,
    dealId: string,
    dto: CreateParticipantDto,
  ): Promise<ParticipantResponseDto> {
    this.logger.log(`Creating participant for deal: ${dealId}`);

    await this.dealsService.assertDealOwner(dealId, userId);

    const participant = await this.prisma.participant.create({
      data: {
        dealId,
        name: dto.name,
        roleName: dto.roleName,
        behaviorType: dto.behaviorType as ParticipantBehavior,
        externalId: dto.externalId,
        email: dto.email,
        metadata: (dto.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });

    this.logger.log(`Participant created with ID: ${participant.id}`);

    await this.auditLog.create({
      actor: userId,
      action: 'CREATED',
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
   * Expected CSV format (header row required):
   *   name,roleName,behaviorType,email,externalId
   *
   * - name and roleName are required; behaviorType must be a valid ParticipantBehavior value.
   * - email and externalId are optional.
   * - With skipErrors=true, valid rows are inserted and failed rows are reported.
   * - With skipErrors=false (default), any validation error aborts the entire import.
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

    const headerLine = lines[0].toLowerCase();
    const headerCols = headerLine.split(',').map((h) => h.trim());
    const expectedHeader = CSV_HEADERS.join(',');

    if (headerCols.join(',') !== expectedHeader) {
      throw new BadRequestException(
        `Invalid CSV header. Expected: ${expectedHeader}`,
      );
    }

    const dataLines = lines.slice(1);
    const rowResults: ImportParticipantRowResultDto[] = [];
    const validRows: Array<{ name: string; roleName: string; behaviorType: ParticipantBehavior; email?: string; externalId?: string }> = [];

    for (let i = 0; i < dataLines.length; i++) {
      const rowNum = i + 1;
      const cols = dataLines[i].split(',').map((c) => c.trim());

      const [name, roleName, behaviorTypeRaw, email, externalId] = cols;

      if (!name) {
        const err = 'name is required';
        if (!skipErrors) throw new BadRequestException(`Row ${rowNum}: ${err}`);
        rowResults.push({ row: rowNum, success: false, error: err });
        continue;
      }

      if (!roleName) {
        const err = 'roleName is required';
        if (!skipErrors) throw new BadRequestException(`Row ${rowNum}: ${err}`);
        rowResults.push({ row: rowNum, success: false, error: err });
        continue;
      }

      if (!behaviorTypeRaw || !VALID_BEHAVIORS.has(behaviorTypeRaw as ParticipantBehavior)) {
        const err = `behaviorType must be one of: ${[...VALID_BEHAVIORS].join(', ')}`;
        if (!skipErrors) throw new BadRequestException(`Row ${rowNum}: ${err}`);
        rowResults.push({ row: rowNum, success: false, error: err });
        continue;
      }

      validRows.push({
        name,
        roleName,
        behaviorType: behaviorTypeRaw as ParticipantBehavior,
        email: email || undefined,
        externalId: externalId || undefined,
      });

      rowResults.push({ row: rowNum, success: true });
    }

    if (validRows.length === 0) {
      throw new BadRequestException('No valid rows found in CSV');
    }

    // Bulk insert in a single transaction
    const created = await this.prisma.$transaction(
      validRows.map((row) =>
        this.prisma.participant.create({
          data: {
            dealId,
            name: row.name,
            roleName: row.roleName,
            behaviorType: row.behaviorType,
            externalId: row.externalId,
            email: row.email,
            metadata: Prisma.JsonNull,
          },
        }),
      ),
    );

    // Attach created participant to the successful row results
    let createdIdx = 0;
    for (const result of rowResults) {
      if (result.success) {
        result.participant = ParticipantMapper.toResponse(created[createdIdx++]);
      }
    }

    await this.auditLog.create({
      actor: userId,
      action: 'BULK_IMPORTED',
      entityType: 'Participant',
      entityId: dealId,
      dealId,
      metadata: { imported: created.length, failed: rowResults.filter((r) => !r.success).length },
    });

    this.logger.log(`CSV import complete — ${created.length} imported for deal ${dealId}`);

    return {
      imported: created.length,
      failed: rowResults.filter((r) => !r.success).length,
      rows: rowResults,
    };
  }

  /**
   * Export all participants for a deal as CSV.
   * Returns a CSV string ready to be sent as a file download.
   */
  async exportToCsv(userId: string, dealId: string): Promise<string> {
    this.logger.log(`Exporting participants to CSV for deal: ${dealId}`);

    await this.dealsService.assertDealOwner(dealId, userId);

    const participants = await this.prisma.participant.findMany({
      where: { dealId },
      orderBy: { createdAt: 'asc' },
    });

    const header = CSV_HEADERS.join(',');
    const rows = participants.map((p) =>
      [
        this.escapeCsvField(p.name),
        this.escapeCsvField(p.roleName),
        p.behaviorType,
        this.escapeCsvField(p.email ?? ''),
        this.escapeCsvField(p.externalId ?? ''),
      ].join(','),
    );

    return [header, ...rows].join('\r\n');
  }

  private escapeCsvField(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}

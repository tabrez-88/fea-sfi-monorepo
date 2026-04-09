import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import {
  AuditLogEntryDto,
  AuditLogListResponseDto,
  AuditLogQueryDto,
  CreateAuditLogDto,
} from '../dto';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(query: AuditLogQueryDto): Promise<AuditLogListResponseDto> {
    const { page = 1, limit = 20, actor, action, entityType, dealId } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (actor) where.actor = actor;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (dealId) where.dealId = dealId;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs.map((log) => this.mapToDto(log)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string): Promise<AuditLogEntryDto> {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
    });

    if (!log) {
      throw new NotFoundException(`Audit log entry with ID ${id} not found`);
    }

    return this.mapToDto(log);
  }

  async create(dto: CreateAuditLogDto): Promise<AuditLogEntryDto> {
    this.logger.log(
      `Audit: ${dto.actor} ${dto.action} ${dto.entityType} ${dto.entityId}`,
    );

    const log = await this.prisma.auditLog.create({
      data: {
        actor: dto.actor,
        action: dto.action,
        entityType: dto.entityType,
        entityId: dto.entityId,
        dealId: dto.dealId,
        metadata: dto.metadata as Prisma.InputJsonValue | undefined,
      },
    });

    return this.mapToDto(log);
  }

  private mapToDto(log: {
    id: string;
    actor: string;
    action: string;
    entityType: string;
    entityId: string;
    dealId: string | null;
    metadata: unknown;
    timestamp: Date;
  }): AuditLogEntryDto {
    return {
      id: log.id,
      actor: log.actor,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      dealId: log.dealId,
      metadata: log.metadata as Record<string, unknown> | null,
      timestamp: log.timestamp.toISOString(),
    };
  }
}

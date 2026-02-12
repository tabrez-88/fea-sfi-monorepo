import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../deals/dto';
import {
  CreateRuleSnapshotDto,
  RuleSnapshotResponseDto,
  RuleSnapshotDetailResponseDto,
  RuleSnapshotListResponseDto,
} from '../dto';
import { RuleSnapshotMapper } from '../mappers/rule-snapshot.mapper';

@Injectable()
export class RulesService {
  private readonly logger = new Logger(RulesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createSnapshot(
    dealId: string,
    createDto: CreateRuleSnapshotDto,
  ): Promise<RuleSnapshotResponseDto> {
    this.logger.log(`Creating rule snapshot for deal: ${dealId}`);

    // Validate deal exists
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true },
    });
    if (!deal) {
      throw new NotFoundException(`Deal with ID ${dealId} not found`);
    }

    // Get next version number
    const lastSnapshot = await this.prisma.ruleSnapshot.findFirst({
      where: { dealId },
      orderBy: { version: 'desc' },
      select: { id: true, version: true },
    });
    const nextVersion = (lastSnapshot?.version ?? 0) + 1;

    const effectiveFrom = createDto.effectiveFrom
      ? new Date(createDto.effectiveFrom)
      : new Date();

    // Update previous snapshot's effectiveTo
    if (lastSnapshot) {
      await this.prisma.ruleSnapshot.update({
        where: { id: lastSnapshot.id },
        data: { effectiveTo: effectiveFrom },
      });
    }

    // Create snapshot with participants
    const snapshot = await this.prisma.ruleSnapshot.create({
      data: {
        dealId,
        version: nextVersion,
        effectiveFrom,
        rules: createDto.rules as unknown as Prisma.InputJsonValue,
        ruleSnapshotParticipants: {
          create: createDto.participants.map((p) => ({
            participantId: p.participantId,
            participantData: p.participantData
              ? (p.participantData as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          })),
        },
      },
      include: {
        _count: { select: { ruleSnapshotParticipants: true } },
      },
    });

    this.logger.log(
      `Rule snapshot created: ${snapshot.id} (version ${nextVersion})`,
    );
    return RuleSnapshotMapper.toResponse(snapshot);
  }

  async listSnapshots(
    dealId: string,
    query: PaginationQueryDto,
  ): Promise<RuleSnapshotListResponseDto> {
    this.logger.log(`Listing rule snapshots for deal: ${dealId}`);
    const { page = 1, limit = 20, sortBy = 'version', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const [snapshots, total] = await Promise.all([
      this.prisma.ruleSnapshot.findMany({
        where: { dealId },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: { select: { ruleSnapshotParticipants: true } },
        },
      }),
      this.prisma.ruleSnapshot.count({ where: { dealId } }),
    ]);

    return {
      data: snapshots.map(RuleSnapshotMapper.toResponse),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSnapshot(id: string): Promise<RuleSnapshotDetailResponseDto> {
    this.logger.log(`Getting rule snapshot: ${id}`);

    const snapshot = await this.prisma.ruleSnapshot.findUnique({
      where: { id },
      include: {
        ruleSnapshotParticipants: {
          include: { participant: true },
        },
      },
    });

    if (!snapshot) {
      throw new NotFoundException(`Rule snapshot with ID ${id} not found`);
    }

    return RuleSnapshotMapper.toDetailResponse(snapshot);
  }

  async getCurrentSnapshot(
    dealId: string,
  ): Promise<RuleSnapshotResponseDto | null> {
    this.logger.log(`Getting current snapshot for deal: ${dealId}`);

    const snapshot = await this.prisma.ruleSnapshot.findFirst({
      where: {
        dealId,
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: new Date() } }],
      },
      orderBy: { version: 'desc' },
      include: {
        _count: { select: { ruleSnapshotParticipants: true } },
      },
    });

    if (!snapshot) return null;
    return RuleSnapshotMapper.toResponse(snapshot);
  }
}

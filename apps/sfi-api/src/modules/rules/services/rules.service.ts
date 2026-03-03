import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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

    // Validate participants exist and belong to this deal
    const participantIds = createDto.participants.map((p) => p.participantId);
    const existingParticipants = await this.prisma.participant.findMany({
      where: { id: { in: participantIds }, dealId },
      select: { id: true },
    });
    const existingIds = new Set(existingParticipants.map((p) => p.id));
    const missingIds = participantIds.filter((id) => !existingIds.has(id));
    if (missingIds.length > 0) {
      throw new BadRequestException(
        `Participants not found in this deal: ${missingIds.join(', ')}`,
      );
    }

    // Validate participantData rules
    const errors: string[] = [];
    let totalNetProfit = 0;
    let hasNetProfit = false;

    for (const p of createDto.participants) {
      const data = p.participantData;
      if (!data) continue;

      const feePercent = data.feePercentage as number | undefined;
      if (feePercent !== undefined && (feePercent < 0 || feePercent > 100)) {
        errors.push(
          `Participant ${p.participantId}: feePercentage must be 0-100 (got ${feePercent})`,
        );
      }

      const recoupCap = (data.recoupCap ?? data.recoupAmount) as
        | number
        | undefined;
      if (recoupCap !== undefined && recoupCap < 0) {
        errors.push(
          `Participant ${p.participantId}: recoupCap must be positive (got ${recoupCap})`,
        );
      }

      const profitPercent = (data.netProfitPercentage ??
        data.allocationPercentage) as number | undefined;
      if (profitPercent !== undefined) {
        if (profitPercent < 0 || profitPercent > 100) {
          errors.push(
            `Participant ${p.participantId}: netProfitPercentage must be 0-100 (got ${profitPercent})`,
          );
        }
        totalNetProfit += profitPercent;
        hasNetProfit = true;
      }
    }

    if (hasNetProfit && totalNetProfit > 100) {
      errors.push(
        `Net profit percentages sum to ${totalNetProfit}% (cannot exceed 100%)`,
      );
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Rule validation failed',
        errors,
      });
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

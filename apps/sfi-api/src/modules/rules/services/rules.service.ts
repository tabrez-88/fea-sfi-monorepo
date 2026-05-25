import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import { PaginationQueryDto } from '../../deals/dto';
import { getRulesSchemaVersion } from '../../settlement/engine/types';
import { validateRuleSnapshotV2 } from '../../settlement/engine/validator';
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Is the FB-003 Rule Snapshot v2 path enabled in this environment?
   * Defaults to `false` — Run 2 substrate ships dark; staging QA flips it
   * on once Run 3 wires the new phases. Reads `SETTLEMENT_RULES_V2_ENABLED`
   * from env via NestJS ConfigService.
   */
  private isV2Enabled(): boolean {
    const raw = this.config.get<string>('SETTLEMENT_RULES_V2_ENABLED');
    return raw === 'true' || raw === '1';
  }

  /**
   * Legacy (v1) `participantData` validation. Walks the supplied
   * participants and accumulates errors for out-of-range percentages /
   * negative caps / net-profit sums > 100. Throws `BadRequestException`
   * with the full error list when any rule fails.
   */
  private validateV1ParticipantData(
    participants: CreateRuleSnapshotDto['participants'],
  ): void {
    const errors: string[] = [];
    let totalNetProfit = 0;
    let hasNetProfit = false;

    for (const p of participants) {
      const profitPercent = this.collectV1ParticipantErrors(p, errors);
      if (profitPercent !== null) {
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
      throw new BadRequestException({ message: 'Rule validation failed', errors });
    }
  }

  /**
   * Validate one participant's `participantData` for the v1 path. Pushes
   * any rule violations into `errors` and returns the participant's
   * net-profit percentage (or `null` when none was provided) so the caller
   * can aggregate it across the whole snapshot.
   */
  private collectV1ParticipantErrors(
    p: CreateRuleSnapshotDto['participants'][number],
    errors: string[],
  ): number | null {
    const data = p.participantData;
    if (!data) return null;

    const feePercent = data.feePercentage as number | undefined;
    if (feePercent !== undefined && (feePercent < 0 || feePercent > 100)) {
      errors.push(
        `Participant ${p.participantId}: feePercentage must be 0-100 (got ${feePercent})`,
      );
    }

    const recoupCap = (data.recoupCap ?? data.recoupAmount) as number | undefined;
    if (recoupCap !== undefined && recoupCap < 0) {
      errors.push(
        `Participant ${p.participantId}: recoupCap must be positive (got ${recoupCap})`,
      );
    }

    const profitPercent = (data.netProfitPercentage ?? data.allocationPercentage) as
      | number
      | undefined;
    if (profitPercent === undefined) return null;

    if (profitPercent < 0 || profitPercent > 100) {
      errors.push(
        `Participant ${p.participantId}: netProfitPercentage must be 0-100 (got ${profitPercent})`,
      );
    }
    return profitPercent;
  }

  private async assertDealOwner(dealId: string, userId: string): Promise<void> {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true, userId: true },
    });
    if (!deal || deal.userId !== userId) {
      throw new NotFoundException(`Deal with ID ${dealId} not found`);
    }
  }

  private async assertSnapshotOwner(snapshotId: string, userId: string): Promise<void> {
    const snapshot = await this.prisma.ruleSnapshot.findUnique({
      where: { id: snapshotId },
      select: { id: true, deal: { select: { userId: true } } },
    });
    if (!snapshot || snapshot.deal.userId !== userId) {
      throw new NotFoundException(`Rule snapshot with ID ${snapshotId} not found`);
    }
  }

  async createSnapshot(
    userId: string,
    dealId: string,
    createDto: CreateRuleSnapshotDto,
  ): Promise<RuleSnapshotResponseDto> {
    this.logger.log(`Creating rule snapshot for deal: ${dealId}`);

    await this.assertDealOwner(dealId, userId);

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

    // FB-003 Run 2 — schema-version branching at the create path.
    // `RuleConfigurationDto` is a permissive container, so callers can
    // submit either the legacy flat shape or the new v2 shape (the JSON
    // ends up in `RuleSnapshot.rules`). When the payload carries
    // `schemaVersion: 2`, we gate it on the feature flag and run the v2
    // structural validator BEFORE persisting.
    const rulesAsRecord = createDto.rules as unknown as Record<string, unknown>;
    const rulesVersion = getRulesSchemaVersion(rulesAsRecord);
    if (rulesVersion === 2) {
      if (!this.isV2Enabled()) {
        throw new BadRequestException(
          'Rule snapshot v2 (schemaVersion: 2) is not enabled in this environment. Set SETTLEMENT_RULES_V2_ENABLED=true to opt in.',
        );
      }
      const v2Result = validateRuleSnapshotV2(rulesAsRecord);
      if (!v2Result.ok) {
        throw new BadRequestException({
          message: 'Rule snapshot v2 validation failed',
          errors: v2Result.errors,
        });
      }
    }

    // Validate participantData rules (v1 path) — extracted to keep the
    // create flow scannable. Throws BadRequest on failure.
    this.validateV1ParticipantData(createDto.participants);

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

    if (lastSnapshot) {
      await this.prisma.ruleSnapshot.update({
        where: { id: lastSnapshot.id },
        data: { effectiveTo: effectiveFrom },
      });
    }

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

    this.logger.log(`Rule snapshot created: ${snapshot.id} (version ${nextVersion})`);

    await this.auditLog.create({
      actor: userId,
      action: 'CREATED',
      entityType: 'RuleSnapshot',
      entityId: snapshot.id,
      dealId,
      metadata: {
        version: nextVersion,
        // Record schemaVersion so the audit trail captures whether this
        // was a legacy v1 or new v2 snapshot. Future ops queries can
        // count v2 adoption without re-reading every rules.json blob.
        schemaVersion: rulesVersion,
        effectiveFrom: effectiveFrom.toISOString(),
        participantCount: createDto.participants.length,
      },
    });

    return RuleSnapshotMapper.toResponse(snapshot);
  }

  async listSnapshots(
    userId: string,
    dealId: string,
    query: PaginationQueryDto,
  ): Promise<RuleSnapshotListResponseDto> {
    this.logger.log(`Listing rule snapshots for deal: ${dealId}`);

    await this.assertDealOwner(dealId, userId);

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
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getSnapshot(userId: string, id: string): Promise<RuleSnapshotDetailResponseDto> {
    this.logger.log(`Getting rule snapshot: ${id}`);

    await this.assertSnapshotOwner(id, userId);

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
    userId: string,
    dealId: string,
  ): Promise<RuleSnapshotResponseDto | null> {
    this.logger.log(`Getting current snapshot for deal: ${dealId}`);

    await this.assertDealOwner(dealId, userId);

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

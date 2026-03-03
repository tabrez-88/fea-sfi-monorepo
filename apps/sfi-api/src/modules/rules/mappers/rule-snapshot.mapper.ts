import {
  RuleSnapshot,
  RuleSnapshotParticipant,
  Participant,
} from '@prisma/client';

import {
  RuleSnapshotResponseDto,
  RuleSnapshotDetailResponseDto,
  RuleSnapshotParticipantResponseDto,
  RuleConfigurationDto,
  RuleSummaryDto,
  ParticipantRoleEnum,
} from '../dto';

type RuleSnapshotWithCount = RuleSnapshot & {
  _count?: { ruleSnapshotParticipants: number };
};

type RuleSnapshotWithParticipants = RuleSnapshot & {
  ruleSnapshotParticipants: (RuleSnapshotParticipant & {
    participant: Participant;
  })[];
};

export class RuleSnapshotMapper {
  static toResponse(snapshot: RuleSnapshotWithCount): RuleSnapshotResponseDto {
    return {
      id: snapshot.id,
      dealId: snapshot.dealId,
      version: snapshot.version,
      effectiveFrom: snapshot.effectiveFrom.toISOString(),
      effectiveTo: snapshot.effectiveTo?.toISOString() ?? null,
      rules: snapshot.rules as RuleConfigurationDto,
      participantCount:
        snapshot._count?.ruleSnapshotParticipants ?? 0,
      createdAt: snapshot.createdAt.toISOString(),
      updatedAt: snapshot.updatedAt.toISOString(),
    };
  }

  static toDetailResponse(
    snapshot: RuleSnapshotWithParticipants,
  ): RuleSnapshotDetailResponseDto {
    const participants = snapshot.ruleSnapshotParticipants.map(
      (rsp): RuleSnapshotParticipantResponseDto => ({
        id: rsp.id,
        participantId: rsp.participantId,
        participantName: rsp.participant.name,
        participantRole: rsp.participant.role as ParticipantRoleEnum,
        participantData: rsp.participantData as Record<string, unknown> | undefined,
        createdAt: rsp.createdAt.toISOString(),
      }),
    );

    return {
      id: snapshot.id,
      dealId: snapshot.dealId,
      version: snapshot.version,
      effectiveFrom: snapshot.effectiveFrom.toISOString(),
      effectiveTo: snapshot.effectiveTo?.toISOString() ?? null,
      rules: snapshot.rules as RuleConfigurationDto,
      participantCount: snapshot.ruleSnapshotParticipants.length,
      createdAt: snapshot.createdAt.toISOString(),
      updatedAt: snapshot.updatedAt.toISOString(),
      participants,
      ruleSummary: RuleSnapshotMapper.buildRuleSummary(participants),
    };
  }

  private static buildRuleSummary(
    participants: RuleSnapshotParticipantResponseDto[],
  ): RuleSummaryDto {
    const warnings: string[] = [];

    const roleBreakdown: Record<string, number> = {};
    for (const p of participants) {
      roleBreakdown[p.participantRole] =
        (roleBreakdown[p.participantRole] ?? 0) + 1;
    }

    let totalDistributionFeePercent = 0;
    let hasDistributionFees = false;
    let totalRecoupmentCap = 0;
    let hasRecoupment = false;
    const netProfitSplit: Record<string, number> = {};
    let hasNetProfit = false;

    for (const p of participants) {
      const data = p.participantData;
      if (!data) continue;

      const feePercent = data.feePercentage as number | undefined;
      if (feePercent !== undefined) {
        totalDistributionFeePercent += feePercent;
        hasDistributionFees = true;
      }

      const recoupCap = (data.recoupCap ?? data.recoupAmount) as number | undefined;
      if (recoupCap !== undefined) {
        totalRecoupmentCap += recoupCap;
        hasRecoupment = true;
      }

      const profitPercent = (data.netProfitPercentage ??
        data.allocationPercentage) as number | undefined;
      if (profitPercent !== undefined) {
        netProfitSplit[p.participantName] = profitPercent;
        hasNetProfit = true;
      }
    }

    if (hasNetProfit) {
      const totalProfit = Object.values(netProfitSplit).reduce(
        (sum, v) => sum + v,
        0,
      );
      if (totalProfit !== 100) {
        warnings.push(
          `Net profit percentages sum to ${totalProfit}% (expected 100%)`,
        );
      }
    }

    if (hasDistributionFees && totalDistributionFeePercent > 100) {
      warnings.push(
        `Total distribution fee percentage is ${totalDistributionFeePercent}% (exceeds 100%)`,
      );
    }

    return {
      totalParticipants: participants.length,
      roleBreakdown,
      ...(hasDistributionFees && { totalDistributionFeePercent }),
      ...(hasRecoupment && { totalRecoupmentCap }),
      ...(hasNetProfit && { netProfitSplit }),
      ...(warnings.length > 0 && { warnings }),
    };
  }
}

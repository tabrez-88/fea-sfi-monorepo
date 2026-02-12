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
      participants: snapshot.ruleSnapshotParticipants.map(
        (rsp): RuleSnapshotParticipantResponseDto => ({
          id: rsp.id,
          participantId: rsp.participantId,
          participantName: rsp.participant.name,
          participantRole: rsp.participant.role as ParticipantRoleEnum,
          participantData: rsp.participantData as Record<string, unknown> | undefined,
          createdAt: rsp.createdAt.toISOString(),
        }),
      ),
    };
  }
}

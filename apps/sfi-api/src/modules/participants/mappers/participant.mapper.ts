import { Participant } from '@prisma/client';

import { ParticipantBehaviorDto, ParticipantResponseDto } from '../dto';

export class ParticipantMapper {
  static toResponse(participant: Participant): ParticipantResponseDto {
    return {
      id: participant.id,
      dealId: participant.dealId,
      name: participant.name,
      roleName: participant.roleName,
      behaviorType: participant.behaviorType as ParticipantBehaviorDto,
      externalId: participant.externalId,
      email: participant.email,
      metadata: participant.metadata as Record<string, unknown> | null,
      createdAt: participant.createdAt,
      updatedAt: participant.updatedAt,
    };
  }
}

import { Participant } from '@prisma/client';

import { ParticipantResponseDto, ParticipantRoleDto } from '../dto';

export class ParticipantMapper {
  static toResponse(participant: Participant): ParticipantResponseDto {
    return {
      id: participant.id,
      dealId: participant.dealId,
      name: participant.name,
      role: participant.role as ParticipantRoleDto,
      externalId: participant.externalId,
      email: participant.email,
      metadata: participant.metadata as Record<string, unknown> | null,
      createdAt: participant.createdAt,
      updatedAt: participant.updatedAt,
    };
  }
}

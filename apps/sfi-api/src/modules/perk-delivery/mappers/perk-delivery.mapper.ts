import { PerkDelivery } from '@prisma/client';

import { PerkDeliveryResponseDto, PerkDeliveryStatusEnum } from '../dto';

export interface PerkDeliveryWithParticipant extends PerkDelivery {
  participant?: { id: string; name: string; email: string | null } | null;
}

export class PerkDeliveryMapper {
  static toResponse(row: PerkDeliveryWithParticipant): PerkDeliveryResponseDto {
    return {
      id: row.id,
      dealId: row.dealId,
      participantId: row.participantId,
      participant: row.participant ?? null,
      settlementRunId: row.settlementRunId,
      trackingNumber: row.trackingNumber,
      carrier: row.carrier,
      shippedAt: row.shippedAt ? row.shippedAt.toISOString() : null,
      deliveredAt: row.deliveredAt ? row.deliveredAt.toISOString() : null,
      status: row.status as PerkDeliveryStatusEnum,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

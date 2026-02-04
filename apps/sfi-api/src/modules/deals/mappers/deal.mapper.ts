import { Deal } from '@prisma/client';

import { DealResponseDto, DealStatusDto } from '../dto';

export class DealMapper {
  static toResponse(deal: Deal): DealResponseDto {
    return {
      id: deal.id,
      name: deal.name,
      description: deal.description,
      status: deal.status as DealStatusDto,
      effectiveDate: deal.effectiveDate,
      terminationDate: deal.terminationDate,
      metadata: deal.metadata as Record<string, unknown> | null,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
    };
  }
}

import { Deal } from '@prisma/client';

import {
  DealCategoryDto,
  DealCurrencyDto,
  DealResponseDto,
  DealStatusDto,
} from '../dto';

/**
 * Optional aggregates that can be attached to a deal at query time
 * via Prisma `_count` and `_sum` operations. Each field is optional —
 * the mapper passes them through when present, omits them when absent.
 */
export interface DealAggregates {
  participantsCount?: number;
  ruleSnapshotsCount?: number;
  revenueBatchesCount?: number;
  settlementRunsCount?: number;
  totalRevenue?: number;
}

export class DealMapper {
  static toResponse(deal: Deal, aggregates?: DealAggregates): DealResponseDto {
    return {
      id: deal.id,
      name: deal.name,
      description: deal.description,
      status: deal.status as DealStatusDto,
      category: deal.category as DealCategoryDto | null,
      dealOwner: deal.dealOwner,
      currency: deal.currency as DealCurrencyDto,
      effectiveDate: deal.effectiveDate,
      terminationDate: deal.terminationDate,
      notes: deal.notes,
      metadata: deal.metadata as Record<string, unknown> | null,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
      ...(aggregates?.participantsCount !== undefined && {
        participantsCount: aggregates.participantsCount,
      }),
      ...(aggregates?.ruleSnapshotsCount !== undefined && {
        ruleSnapshotsCount: aggregates.ruleSnapshotsCount,
      }),
      ...(aggregates?.revenueBatchesCount !== undefined && {
        revenueBatchesCount: aggregates.revenueBatchesCount,
      }),
      ...(aggregates?.settlementRunsCount !== undefined && {
        settlementRunsCount: aggregates.settlementRunsCount,
      }),
      ...(aggregates?.totalRevenue !== undefined && {
        totalRevenue: aggregates.totalRevenue,
      }),
    };
  }
}

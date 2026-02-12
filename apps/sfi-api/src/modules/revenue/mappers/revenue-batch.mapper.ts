import { RevenueBatch } from '@prisma/client';

import { RevenueBatchResponseDto, CurrencyEnum, RevenueBatchStatusEnum } from '../dto';

type RevenueBatchWithSettlements = RevenueBatch & {
  _count?: { settlementRevenueLinks: number };
};

export class RevenueBatchMapper {
  static toResponse(batch: RevenueBatchWithSettlements): RevenueBatchResponseDto {
    const settlementCount = batch._count?.settlementRevenueLinks ?? 0;

    return {
      id: batch.id,
      dealId: batch.dealId,
      batchNumber: batch.batchNumber,
      periodStart: batch.periodStart.toISOString(),
      periodEnd: batch.periodEnd.toISOString(),
      totalAmount: Number(batch.totalAmount),
      currency: batch.currency as CurrencyEnum,
      status: batch.status as RevenueBatchStatusEnum,
      source: batch.source,
      metadata: batch.metadata as Record<string, unknown> | null,
      isSettled: settlementCount > 0,
      settlementRunCount: settlementCount,
      createdAt: batch.createdAt.toISOString(),
      updatedAt: batch.updatedAt.toISOString(),
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import {
  DealStatus,
  RevenueBatchStatus,
  SettlementRunStatus,
} from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import {
  DashboardPendingReviewsResponseDto,
  DashboardSummaryResponseDto,
  PendingRevenueBatchDto,
  PendingSettlementRunDto,
} from '../dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the four headline stat cards for the Dashboard, scoped to the
   * authenticated user's deals only.
   *
   * Empty state contract: when there is no data, every field returns 0.
   * Never throws NotFoundException — the dashboard must degrade gracefully.
   */
  async getSummary(userId: string): Promise<DashboardSummaryResponseDto> {
    this.logger.log(`Computing dashboard summary for user ${userId}`);

    const [totalDeals, activeDeals, pendingRevenueBatches, previewedSettlementRuns, settledAggregate] =
      await Promise.all([
        this.prisma.deal.count({ where: { userId } }),
        this.prisma.deal.count({ where: { userId, status: DealStatus.ACTIVE } }),
        this.prisma.revenueBatch.count({
          where: { status: RevenueBatchStatus.PENDING, deal: { userId } },
        }),
        this.prisma.settlementRun.count({
          where: { status: SettlementRunStatus.PREVIEWED, deal: { userId } },
        }),
        this.prisma.settlementRun.aggregate({
          where: { status: SettlementRunStatus.FINALIZED, deal: { userId } },
          _sum: { totalAllocated: true },
        }),
      ]);

    return {
      totalDeals,
      activeDeals,
      pendingReview: pendingRevenueBatches + previewedSettlementRuns,
      totalSettled: Number(settledAggregate._sum?.totalAllocated ?? 0),
    };
  }

  /**
   * Returns pending review items scoped to the authenticated user's deals:
   *  - Revenue Batches in PENDING status (awaiting validation)
   *  - Settlement Runs in PREVIEWED status (awaiting finalization)
   *
   * Returns empty arrays (not 404) when there's nothing pending.
   */
  async getPendingReviews(userId: string): Promise<DashboardPendingReviewsResponseDto> {
    this.logger.log(`Fetching pending reviews for user ${userId}`);

    const [pendingBatches, previewedRuns] = await Promise.all([
      this.prisma.revenueBatch.findMany({
        where: { status: RevenueBatchStatus.PENDING, deal: { userId } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          deal: { select: { name: true } },
        },
      }),
      this.prisma.settlementRun.findMany({
        where: { status: SettlementRunStatus.PREVIEWED, deal: { userId } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          deal: { select: { name: true } },
        },
      }),
    ]);

    const runLabels = await Promise.all(
      previewedRuns.map(async (run) => {
        const position = await this.prisma.settlementRun.count({
          where: {
            dealId: run.dealId,
            createdAt: { lte: run.createdAt },
          },
        });
        return `Run #${position}`;
      }),
    );

    const revenueBatches: PendingRevenueBatchDto[] = pendingBatches.map(
      (batch) => ({
        id: batch.id,
        dealId: batch.dealId,
        dealName: batch.deal.name,
        batchNumber: batch.batchNumber,
        totalAmount: Number(batch.totalAmount),
        currency: batch.currency,
        status: batch.status,
        createdAt: batch.createdAt.toISOString(),
      }),
    );

    const settlementRuns: PendingSettlementRunDto[] = previewedRuns.map(
      (run, i) => ({
        id: run.id,
        dealId: run.dealId,
        dealName: run.deal.name,
        runLabel: runLabels[i] ?? 'Settlement Run',
        totalAllocated: Number(run.totalAllocated),
        currency: run.currency,
        status: run.status,
        createdAt: run.createdAt.toISOString(),
      }),
    );

    return {
      revenueBatches,
      settlementRuns,
      totalCount: revenueBatches.length + settlementRuns.length,
    };
  }
}

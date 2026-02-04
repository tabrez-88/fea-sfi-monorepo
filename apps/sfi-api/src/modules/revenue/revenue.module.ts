import { Module } from '@nestjs/common';

import { RevenueBatchesController } from './controllers/revenue-batches.controller';
import { RevenueService } from './services/revenue.service';

/**
 * Revenue Module
 *
 * Handles revenue batch intake and processing.
 *
 * Features:
 * - Revenue batch creation with period and amount tracking
 * - Batch validation workflow (PENDING -> VALIDATED -> PROCESSED)
 * - Integration with settlement runs
 */
@Module({
  controllers: [RevenueBatchesController],
  providers: [RevenueService],
  exports: [RevenueService],
})
export class RevenueModule {}

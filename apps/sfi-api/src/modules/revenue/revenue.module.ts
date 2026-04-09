import { Module } from '@nestjs/common';

import { AuditLogModule } from '../audit-log/audit-log.module';

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
  imports: [AuditLogModule],
  controllers: [RevenueBatchesController],
  providers: [RevenueService],
  exports: [RevenueService],
})
export class RevenueModule {}

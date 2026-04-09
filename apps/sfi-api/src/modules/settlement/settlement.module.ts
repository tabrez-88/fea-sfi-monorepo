import { Module } from '@nestjs/common';

import { AuditLogModule } from '../audit-log/audit-log.module';

import { SettlementRunsController } from './controllers/settlement-runs.controller';
import { SettlementService } from './services/settlement.service';

/**
 * Settlement Module
 *
 * Core settlement execution engine.
 *
 * Features:
 * - Settlement run creation with rule snapshot and revenue batch selection
 * - Preview workflow for reviewing allocations before finalization
 * - Finalize workflow with ledger entry creation
 * - Correction runs for adjusting finalized settlements
 * - Deterministic calculations with proof records for auditability
 */
@Module({
  imports: [AuditLogModule],
  controllers: [SettlementRunsController],
  providers: [SettlementService],
  exports: [SettlementService],
})
export class SettlementModule {}

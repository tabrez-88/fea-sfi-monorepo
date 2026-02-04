import { Module } from '@nestjs/common';

import { LedgerController } from './controllers/ledger.controller';
import { LedgerService } from './services/ledger.service';

/**
 * Ledger Module
 *
 * Handles double-entry accounting and ledger management.
 *
 * Features:
 * - Journal creation for settlements
 * - Double-entry posting creation (balanced debits and credits)
 * - Account balance calculation
 * - Audit trail for all financial transactions
 */
@Module({
  controllers: [LedgerController],
  providers: [LedgerService],
  exports: [LedgerService],
})
export class LedgerModule {}

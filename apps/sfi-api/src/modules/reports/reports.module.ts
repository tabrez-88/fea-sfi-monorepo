import { Module } from '@nestjs/common';

import { ReportsController } from './controllers/reports.controller';
import { ReportsService } from './services/reports.service';

/**
 * Reports Module (MS-5)
 *
 * Read-only aggregations over data the settlement engine already wrote:
 *   - Recoupment progress per investor (Screen 5.3)
 *   - Participant payout statements (Screen 5.4)
 *
 * Nothing here recomputes settlement math. Caps and phases are read back
 * from the persisted snapshot and allocations so a report can never
 * disagree with the settlement it describes.
 */
@Module({
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}

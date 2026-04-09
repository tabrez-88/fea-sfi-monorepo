import { Module } from '@nestjs/common';

import { AuditLogModule } from '../audit-log/audit-log.module';

import { DealsController } from './controllers/deals.controller';
import { DealsService } from './services/deals.service';

@Module({
  imports: [AuditLogModule],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}

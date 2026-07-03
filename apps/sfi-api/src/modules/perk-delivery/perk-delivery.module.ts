import { Module } from '@nestjs/common';

import { AuditLogModule } from '../audit-log/audit-log.module';

import { PerkDeliveryController } from './controllers/perk-delivery.controller';
import { PerkDeliveryService } from './services/perk-delivery.service';

/**
 * PerkDelivery Module (MS-3 Wave 6 / Liang MS3-R4).
 *
 * Physical / digital perk delivery tracking per participant. Powers
 * the future MS5 role-gated investor view where investors see their
 * own tracking info. Admins get full CRUD + bulk CSV import.
 */
@Module({
  imports: [AuditLogModule],
  controllers: [PerkDeliveryController],
  providers: [PerkDeliveryService],
  exports: [PerkDeliveryService],
})
export class PerkDeliveryModule {}

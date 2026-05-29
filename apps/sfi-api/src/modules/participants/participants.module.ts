import { Module } from '@nestjs/common';

import { AuditLogModule } from '../audit-log/audit-log.module';
import { DealsModule } from '../deals/deals.module';

import { ParticipantDetailController } from './controllers/participant-detail.controller';
import { ParticipantsController } from './controllers/participants.controller';
import { ParticipantsService } from './services/participants.service';

@Module({
  imports: [DealsModule, AuditLogModule],
  controllers: [ParticipantsController, ParticipantDetailController],
  providers: [ParticipantsService],
  exports: [ParticipantsService],
})
export class ParticipantsModule {}

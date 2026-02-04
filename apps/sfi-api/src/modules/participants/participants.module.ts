import { Module } from '@nestjs/common';

import { DealsModule } from '../deals/deals.module';

import { ParticipantsController } from './controllers/participants.controller';
import { ParticipantsService } from './services/participants.service';

@Module({
  imports: [DealsModule],
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
  exports: [ParticipantsService],
})
export class ParticipantsModule {}

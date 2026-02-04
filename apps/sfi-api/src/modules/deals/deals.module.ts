import { Module } from '@nestjs/common';

import { DealsController } from './controllers/deals.controller';
import { DealsService } from './services/deals.service';

@Module({
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}

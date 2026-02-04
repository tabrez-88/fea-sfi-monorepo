import { Module } from '@nestjs/common';

import { HealthController } from './controllers/health.controller';

@Module({
  controllers: [HealthController],
  providers: [],
  exports: [],
})
export class CommonModule {}

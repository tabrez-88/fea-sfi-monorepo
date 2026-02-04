import { Module } from '@nestjs/common';

import { CommonModule } from './common/common.module';
import { ConfigModule } from './config';
import { DealsModule } from './modules/deals/deals.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { ParticipantsModule } from './modules/participants/participants.module';
import { RevenueModule } from './modules/revenue/revenue.module';
import { RulesModule } from './modules/rules/rules.module';
import { SettlementModule } from './modules/settlement/settlement.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Configuration (includes GCP Secret Manager for staging/production)
    ConfigModule,

    // Infrastructure
    PrismaModule,
    CommonModule,

    // Domain Modules
    DealsModule,
    ParticipantsModule,

    // Feature Modules
    RulesModule,
    RevenueModule,
    SettlementModule,
    LedgerModule,
    DocumentsModule,
  ],
})
export class AppModule {}

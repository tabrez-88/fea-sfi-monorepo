import { Module } from '@nestjs/common';

import { CommonModule } from './common/common.module';
import { ConfigModule } from './config';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DealsModule } from './modules/deals/deals.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { ParticipantsModule } from './modules/participants/participants.module';
import { RevenueModule } from './modules/revenue/revenue.module';
import { RulesModule } from './modules/rules/rules.module';
import { SettlementModule } from './modules/settlement/settlement.module';
import { StorageModule } from './modules/storage/storage.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Configuration (includes GCP Secret Manager for staging/production)
    ConfigModule,

    // Infrastructure
    PrismaModule,
    CommonModule,

    // Auth (registers the global JwtAuthGuard via APP_GUARD; @Public() opts out)
    AuthModule,

    // Domain Modules
    DealsModule,
    ParticipantsModule,

    // Feature Modules
    RulesModule,
    RevenueModule,
    SettlementModule,
    LedgerModule,
    StorageModule, // FB-003 Run 4 — file-storage abstraction (consumed by DocumentsModule)
    DocumentsModule,
    AuditLogModule,
    DashboardModule,
  ],
})
export class AppModule {}

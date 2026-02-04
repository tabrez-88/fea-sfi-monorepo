import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    });
  }

  async onModuleInit() {
    this.logger.log('Connecting to database...');
    await this.$connect();
    this.logger.log('Database connection established');
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }

  /**
   * Clean the database (for testing purposes only)
   * Deletes all records in reverse order of dependencies
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    // Delete in reverse order of dependencies
    await this.$transaction([
      this.document.deleteMany(),
      this.proofRecord.deleteMany(),
      this.ledgerPosting.deleteMany(),
      this.ledgerJournal.deleteMany(),
      this.settlementAllocation.deleteMany(),
      this.settlementRevenueLink.deleteMany(),
      this.settlementRun.deleteMany(),
      this.revenueBatch.deleteMany(),
      this.ruleSnapshotParticipant.deleteMany(),
      this.ruleSnapshot.deleteMany(),
      this.participant.deleteMany(),
      this.deal.deleteMany(),
    ]);
  }
}

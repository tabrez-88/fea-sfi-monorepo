import { Module } from '@nestjs/common';

import { RuleSnapshotsController } from './controllers/rule-snapshots.controller';
import { RulesService } from './services/rules.service';

/**
 * Rules Module
 *
 * Handles rule definitions and snapshotting for deals.
 * Rules define how revenue is allocated among participants.
 *
 * Features:
 * - Rule snapshot creation (immutable point-in-time captures)
 * - Rule versioning and history tracking
 * - Participant roster freezing within snapshots
 */
@Module({
  controllers: [RuleSnapshotsController],
  providers: [RulesService],
  exports: [RulesService],
})
export class RulesModule {}

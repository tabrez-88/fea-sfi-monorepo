import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  SettlementRunStatus,
  RevenueBatchStatus,
  RunType,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import {
  CreateSettlementRunDto,
  SettlementRunResponseDto,
  SettlementRunDetailResponseDto,
  SettlementRunListResponseDto,
  SettlementRunListQueryDto,
  PreviewSettlementResponseDto,
  FinalizeSettlementResponseDto,
  CreateCorrectionRunDto,
  ProofVerificationResponseDto,
  RunTypeEnum,
  SettlementStatusEnum,
  SettlementPhaseEnum,
  CurrencyEnum,
} from '../dto';
import { extractV2SettlementRules } from '../engine/extractors/v2';
import { SettlementEngine } from '../engine/settlement-engine';
import {
  SettlementInput,
  SettlementOutput,
  ParticipantBehavior as EngineParticipantBehavior,
  RuleSnapshotRulesV2,
  getRulesSchemaVersion,
} from '../engine/types';

@Injectable()
export class SettlementService {
  private readonly logger = new Logger(SettlementService.name);
  private readonly engine = new SettlementEngine();

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  private async assertDealOwner(dealId: string, userId: string): Promise<void> {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true, userId: true },
    });
    if (!deal || deal.userId !== userId) {
      throw new NotFoundException(`Deal with ID ${dealId} not found`);
    }
  }

  private async assertRunOwner(runId: string, userId: string): Promise<void> {
    const run = await this.prisma.settlementRun.findUnique({
      where: { id: runId },
      select: { id: true, deal: { select: { userId: true } } },
    });
    if (!run || run.deal.userId !== userId) {
      throw new NotFoundException(`Settlement run with ID ${runId} not found`);
    }
  }

  async createRun(
    userId: string,
    dealId: string,
    createDto: CreateSettlementRunDto,
  ): Promise<SettlementRunResponseDto> {
    this.logger.log(`Creating settlement run for deal: ${dealId}`);

    await this.assertDealOwner(dealId, userId);

    // Validate rule snapshot exists and belongs to deal
    const snapshot = await this.prisma.ruleSnapshot.findUnique({
      where: { id: createDto.ruleSnapshotId },
      select: { id: true, dealId: true },
    });
    if (!snapshot) {
      throw new NotFoundException(
        `Rule snapshot with ID ${createDto.ruleSnapshotId} not found`,
      );
    }
    if (snapshot.dealId !== dealId) {
      throw new BadRequestException('Rule snapshot does not belong to this deal');
    }

    // Validate all revenue batches exist, belong to deal, and are VALIDATED
    const batches = await this.prisma.revenueBatch.findMany({
      where: { id: { in: createDto.revenueBatchIds } },
      select: { id: true, dealId: true, status: true },
    });

    if (batches.length !== createDto.revenueBatchIds.length) {
      throw new NotFoundException('One or more revenue batches not found');
    }

    for (const batch of batches) {
      if (batch.dealId !== dealId) {
        throw new BadRequestException(
          `Revenue batch ${batch.id} does not belong to this deal`,
        );
      }
      if (batch.status !== RevenueBatchStatus.VALIDATED) {
        throw new BadRequestException(
          `Revenue batch ${batch.id} must be in VALIDATED status (current: ${batch.status})`,
        );
      }
    }

    const run = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM deals WHERE id = ${dealId}::uuid FOR UPDATE`;

      const lastRun = await tx.settlementRun.findFirst({
        where: { dealId },
        orderBy: { runNumber: 'desc' },
        select: { runNumber: true },
      });
      const nextRunNumber = (lastRun?.runNumber ?? 0) + 1;

      return tx.settlementRun.create({
        data: {
          dealId,
          ruleSnapshotId: createDto.ruleSnapshotId,
          runNumber: nextRunNumber,
          status: SettlementRunStatus.DRAFT,
          currency: 'USD',
          notes: createDto.notes,
          totalAllocated: 0,
          settlementRevenueLinks: {
            create: createDto.revenueBatchIds.map((batchId) => ({
              revenueBatchId: batchId,
            })),
          },
        },
      });
    });

    this.logger.log(`Settlement run created: ${run.id} (Run #${run.runNumber})`);

    await this.auditLog.create({
      actor: userId,
      action: 'CREATED',
      entityType: 'SettlementRun',
      entityId: run.id,
      dealId,
      metadata: {
        runLabel: `Run #${run.runNumber}`,
        runNumber: run.runNumber,
        status: 'DRAFT',
        ruleSnapshotId: createDto.ruleSnapshotId,
        revenueBatchCount: createDto.revenueBatchIds.length,
      },
    });

    return this.mapRunToResponse(run);
  }

  async listRuns(
    userId: string,
    dealId: string,
    query: SettlementRunListQueryDto,
  ): Promise<SettlementRunListResponseDto> {
    this.logger.log(`Listing settlement runs for deal: ${dealId}`);

    await this.assertDealOwner(dealId, userId);

    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SettlementRunWhereInput = {
      dealId,
      ...(query.status ? { status: query.status as SettlementRunStatus } : {}),
      ...(query.runType ? { runType: query.runType as RunType } : {}),
    };

    const [runs, total] = await Promise.all([
      this.prisma.settlementRun.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          ruleSnapshot: { select: { version: true } },
          _count: { select: { settlementRevenueLinks: true } },
          proofRecords: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { proofHash: true },
          },
          settlementRevenueLinks: {
            select: {
              revenueBatch: { select: { totalAmount: true } },
            },
          },
        },
      }),
      this.prisma.settlementRun.count({ where }),
    ]);

    return {
      data: runs.map((run) => {
        const totalRevenue = run.settlementRevenueLinks.reduce(
          (sum, link) => sum + Number(link.revenueBatch.totalAmount),
          0,
        );
        return this.mapRunToResponse(run, {
          ruleSnapshotVersion: run.ruleSnapshot.version,
          revenueBatchCount: run._count.settlementRevenueLinks,
          totalRevenue,
          proofHash: run.proofRecords[0]?.proofHash ?? null,
        });
      }),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getRun(userId: string, id: string): Promise<SettlementRunDetailResponseDto> {
    this.logger.log(`Getting settlement run: ${id}`);

    await this.assertRunOwner(id, userId);

    const run = await this.prisma.settlementRun.findUnique({
      where: { id },
      include: {
        ruleSnapshot: { select: { version: true } },
        settlementRevenueLinks: { include: { revenueBatch: true } },
        settlementAllocations: { include: { participant: true } },
        proofRecords: { take: 1, orderBy: { createdAt: 'desc' } },
        ledgerJournals: {
          include: { _count: { select: { ledgerPostings: true } } },
        },
      },
    });

    if (!run) {
      throw new NotFoundException(`Settlement run with ID ${id} not found`);
    }

    const proof = run.proofRecords[0];
    const totalPostings = run.ledgerJournals.reduce(
      (sum, j) => sum + j._count.ledgerPostings,
      0,
    );
    const totalRevenue = run.settlementRevenueLinks.reduce(
      (sum, link) => sum + Number(link.revenueBatch.totalAmount),
      0,
    );

    return {
      ...this.mapRunToResponse(run, {
        ruleSnapshotVersion: run.ruleSnapshot.version,
        revenueBatchCount: run.settlementRevenueLinks.length,
        totalRevenue,
        proofHash: proof?.proofHash ?? null,
      }),
      revenueBatches: run.settlementRevenueLinks.map((link) => ({
        id: link.revenueBatch.id,
        batchNumber: link.revenueBatch.batchNumber,
        periodStart: link.revenueBatch.periodStart.toISOString(),
        periodEnd: link.revenueBatch.periodEnd.toISOString(),
        totalAmount: Number(link.revenueBatch.totalAmount),
        currency: link.revenueBatch.currency as CurrencyEnum,
      })),
      allocations: run.settlementAllocations.map((alloc) => ({
        id: alloc.id,
        participantId: alloc.participantId,
        participantName: alloc.participant.name,
        amount: Number(alloc.amount),
        currency: alloc.currency as CurrencyEnum,
        phase: alloc.phase as SettlementPhaseEnum,
        metadata: alloc.metadata as Record<string, unknown> | undefined,
      })),
      proof: proof
        ? {
            proofHash: proof.proofHash,
            algorithm: proof.algorithm,
            timestamp: proof.timestamp.toISOString(),
            inputSummary: proof.data as Record<string, unknown>,
          }
        : undefined,
      ledger:
        run.ledgerJournals.length > 0
          ? {
              journalIds: run.ledgerJournals.map((j) => j.id),
              postingCount: totalPostings,
            }
          : undefined,
    };
  }

  async previewRun(userId: string, id: string): Promise<PreviewSettlementResponseDto> {
    this.logger.log(`Previewing settlement run: ${id}`);

    await this.assertRunOwner(id, userId);

    const run = await this.prisma.settlementRun.findUnique({
      where: { id },
      include: {
        ruleSnapshot: {
          include: {
            ruleSnapshotParticipants: { include: { participant: true } },
          },
        },
        settlementRevenueLinks: { include: { revenueBatch: true } },
      },
    });

    if (!run) {
      throw new NotFoundException(`Settlement run with ID ${id} not found`);
    }

    if (
      run.status !== SettlementRunStatus.DRAFT &&
      run.status !== SettlementRunStatus.PREVIEWED
    ) {
      throw new BadRequestException(
        `Cannot preview run in ${run.status} status. Must be DRAFT or PREVIEWED.`,
      );
    }

    const engineInput = await this.buildEngineInput(run);
    const result = this.engine.calculate(engineInput);

    await this.prisma.settlementRun.update({
      where: { id },
      data: { status: SettlementRunStatus.PREVIEWED },
    });

    await this.auditLog.create({
      actor: userId,
      action: 'PREVIEWED',
      entityType: 'SettlementRun',
      entityId: id,
      dealId: run.dealId,
      metadata: {
        runLabel: `Run #${run.runNumber}`,
        runNumber: run.runNumber,
        previousStatus: run.status,
        newStatus: 'PREVIEWED',
        totalAllocated: result.totalAllocated,
        allocationCount: result.allocations.length,
      },
    });

    return this.mapEngineOutputToPreview(id, result);
  }

  async finalizeRun(userId: string, id: string): Promise<FinalizeSettlementResponseDto> {
    this.logger.log(`Finalizing settlement run: ${id}`);

    await this.assertRunOwner(id, userId);

    const run = await this.prisma.settlementRun.findUnique({
      where: { id },
      include: {
        ruleSnapshot: {
          include: {
            ruleSnapshotParticipants: { include: { participant: true } },
          },
        },
        settlementRevenueLinks: { include: { revenueBatch: true } },
        settlementAllocations: true,
      },
    });

    if (!run) {
      throw new NotFoundException(`Settlement run with ID ${id} not found`);
    }

    if (run.status === SettlementRunStatus.FINALIZED) {
      this.logger.log(`Settlement run ${id} already finalized (idempotent)`);
      return this.buildFinalizedResponse(userId, id);
    }

    if (run.status === SettlementRunStatus.VOIDED) {
      throw new ConflictException('Cannot finalize a voided settlement run');
    }

    if (run.status !== SettlementRunStatus.PREVIEWED) {
      throw new BadRequestException(
        `Cannot finalize run in ${run.status} status. Must be PREVIEWED first.`,
      );
    }

    const engineInput = await this.buildEngineInput(run);
    const result = this.engine.calculate(engineInput);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // FB-003 Run 3 — persist per-investor cumulative balances when the
      // engine emitted them (v2 paths). v1 results have no balances.
      await this.persistParticipantBalances(
        tx,
        run.dealId,
        run.ruleSnapshotId,
        id,
        result.participantBalances,
      );

      for (const alloc of result.allocations) {
        await tx.settlementAllocation.create({
          data: {
            settlementRunId: id,
            participantId: alloc.participantId,
            amount: new Prisma.Decimal(alloc.amount),
            currency: run.currency,
            phase: alloc.phase,
            metadata: alloc.metadata as Prisma.InputJsonValue,
          },
        });
      }

      await tx.proofRecord.create({
        data: {
          settlementRunId: id,
          proofHash: result.proof.proofHash,
          algorithm: result.proof.algorithm,
          timestamp: now,
          data: result.proof.inputSummary as Prisma.InputJsonValue,
        },
      });

      const journalNumber = `JNL-${now.getFullYear()}-${Date.now()}`;
      const journal = await tx.ledgerJournal.create({
        data: {
          settlementRunId: id,
          dealId: run.dealId,
          journalNumber,
          description: `Settlement finalization for run ${id}`,
          postedAt: now,
        },
      });

      await tx.ledgerPosting.create({
        data: {
          ledgerJournalId: journal.id,
          accountType: 'REVENUE',
          accountCode: 'REV-001',
          debitAmount: 0,
          creditAmount: new Prisma.Decimal(result.totalRevenue),
          currency: run.currency,
          description: 'Total revenue settled',
        },
      });

      for (const alloc of result.allocations) {
        await tx.ledgerPosting.create({
          data: {
            ledgerJournalId: journal.id,
            participantId: alloc.participantId,
            accountType: 'LIABILITY',
            accountCode: `PAYABLE-${alloc.phase}`,
            debitAmount: new Prisma.Decimal(alloc.amount),
            creditAmount: 0,
            currency: run.currency,
            description: `${alloc.participantName} - ${alloc.phase}`,
          },
        });
      }

      const batchIds = run.settlementRevenueLinks.map((link) => link.revenueBatchId);
      await tx.revenueBatch.updateMany({
        where: { id: { in: batchIds } },
        data: { status: RevenueBatchStatus.PROCESSED },
      });

      await tx.settlementRun.update({
        where: { id },
        data: {
          status: SettlementRunStatus.FINALIZED,
          executedAt: now,
          totalAllocated: new Prisma.Decimal(result.totalAllocated),
        },
      });
    });

    this.logger.log(`Settlement run finalized: ${id}`);

    await this.auditLog.create({
      actor: userId,
      action: 'FINALIZED',
      entityType: 'SettlementRun',
      entityId: id,
      dealId: run.dealId,
      metadata: {
        runLabel: `Run #${run.runNumber}`,
        runNumber: run.runNumber,
        previousStatus: 'PREVIEWED',
        newStatus: 'FINALIZED',
        totalAllocated: result.totalAllocated,
        allocationCount: result.allocations.length,
      },
    });

    return this.buildFinalizedResponse(userId, id);
  }

  async createCorrectionRun(
    userId: string,
    originalRunId: string,
    createDto: CreateCorrectionRunDto,
  ): Promise<SettlementRunResponseDto> {
    this.logger.log(`Creating correction run for: ${originalRunId}`);

    await this.assertRunOwner(originalRunId, userId);

    const originalRun = await this.prisma.settlementRun.findUnique({
      where: { id: originalRunId },
    });

    if (!originalRun) {
      throw new NotFoundException(`Settlement run with ID ${originalRunId} not found`);
    }

    if (originalRun.status !== SettlementRunStatus.FINALIZED) {
      throw new BadRequestException(
        'Can only create correction for FINALIZED settlement runs',
      );
    }

    const correctionRun = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM deals WHERE id = ${originalRun.dealId}::uuid FOR UPDATE`;

      const lastRun = await tx.settlementRun.findFirst({
        where: { dealId: originalRun.dealId },
        orderBy: { runNumber: 'desc' },
        select: { runNumber: true },
      });
      const nextRunNumber = (lastRun?.runNumber ?? 0) + 1;

      return tx.settlementRun.create({
        data: {
          dealId: originalRun.dealId,
          ruleSnapshotId: originalRun.ruleSnapshotId,
          runNumber: nextRunNumber,
          runType: 'CORRECTION',
          status: SettlementRunStatus.DRAFT,
          originalSettlementRunId: originalRunId,
          currency: originalRun.currency,
          notes: createDto.notes,
          totalAllocated: 0,
          settlementRevenueLinks: createDto.adjustmentRevenueBatchIds
            ? {
                create: createDto.adjustmentRevenueBatchIds.map((batchId) => ({
                  revenueBatchId: batchId,
                })),
              }
            : undefined,
        },
      });
    });

    this.logger.log(
      `Correction run created: ${correctionRun.id} (Run #${correctionRun.runNumber})`,
    );

    await this.auditLog.create({
      actor: userId,
      action: 'CORRECTION_CREATED',
      entityType: 'SettlementRun',
      entityId: correctionRun.id,
      dealId: originalRun.dealId,
      metadata: {
        runLabel: `Run #${correctionRun.runNumber}`,
        runNumber: correctionRun.runNumber,
        originalRunId,
        originalRunLabel: `Run #${originalRun.runNumber}`,
        notes: createDto.notes,
      },
    });

    return this.mapRunToResponse(correctionRun);
  }

  async verifyRun(userId: string, id: string): Promise<ProofVerificationResponseDto> {
    this.logger.log(`Verifying settlement run: ${id}`);

    await this.assertRunOwner(id, userId);

    const run = await this.prisma.settlementRun.findUnique({
      where: { id },
      include: {
        ruleSnapshot: {
          include: {
            ruleSnapshotParticipants: { include: { participant: true } },
          },
        },
        settlementRevenueLinks: { include: { revenueBatch: true } },
        proofRecords: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!run) {
      throw new NotFoundException(`Settlement run with ID ${id} not found`);
    }

    if (
      run.status !== SettlementRunStatus.FINALIZED &&
      run.status !== SettlementRunStatus.PREVIEWED
    ) {
      throw new BadRequestException(
        `Cannot verify run in ${run.status} status. Must be PREVIEWED or FINALIZED.`,
      );
    }

    const storedProof = run.proofRecords[0];
    if (!storedProof) {
      throw new NotFoundException(`No proof record found for settlement run ${id}`);
    }

    const engineInput = await this.buildEngineInput(run);
    const result = this.engine.calculate(engineInput, storedProof.timestamp.toISOString());

    const verified = storedProof.proofHash === result.proof.proofHash;
    const now = new Date().toISOString();

    this.logger.log(`Verification result for run ${id}: ${verified ? 'MATCH' : 'MISMATCH'}`);

    return {
      settlementRunId: id,
      verified,
      storedHash: storedProof.proofHash,
      computedHash: result.proof.proofHash,
      algorithm: storedProof.algorithm,
      originalTimestamp: storedProof.timestamp.toISOString(),
      verifiedAt: now,
      message: verified
        ? 'Settlement is DETERMINISTIC and UNTAMPERED. Hash match confirmed.'
        : 'WARNING: Hash MISMATCH detected. The settlement data may have been altered.',
    };
  }

  // ============================================
  // Private helpers
  // ============================================

  private async buildEngineInput(run: {
    id: string;
    dealId: string;
    ruleSnapshotId: string;
    createdAt: Date;
    ruleSnapshot: {
      version: number;
      rules: unknown;
      ruleSnapshotParticipants: {
        participantId: string;
        participantData: unknown;
        participant: {
          id: string;
          name: string;
          roleName: string;
          behaviorType: string;
          createdAt: Date;
        };
      }[];
    };
    settlementRevenueLinks: {
      revenueBatch: {
        id: string;
        totalAmount: Prisma.Decimal;
        periodStart: Date;
        periodEnd: Date;
      };
    }[];
    currency: string;
  }): Promise<SettlementInput> {
    const rules = run.ruleSnapshot.rules as Record<string, unknown>;
    const settlementRules = this.extractSettlementRules(
      rules,
      run.ruleSnapshot.ruleSnapshotParticipants,
    );

    // FB-003 Run 3 — branch on schemaVersion. For v2 snapshots, also
    // pass the raw v2 rules to the engine so it can take the mode-aware
    // orchestration path (waterfall tiers, pool resolver, etc.). v1
    // snapshots leave `rulesV2` undefined so the engine runs the legacy
    // 4-phase path bit-identically.
    const schemaVersion = getRulesSchemaVersion(rules);
    const rulesV2 =
      schemaVersion === 2 ? (rules as unknown as RuleSnapshotRulesV2) : undefined;

    // FB-003 Run 3 — load per-investor cumulative balances from a prior
    // run on the same `(deal, participant, ruleSnapshot)` triple so the
    // engine's hard-cap check can clip-not-skip on cap. Only meaningful
    // for v2 waterfall mode; harmless for v1 (engine ignores).
    const priorBalances = rulesV2
      ? await this.loadPriorBalances(run.dealId, run.ruleSnapshotId)
      : undefined;

    return {
      settlementRunId: run.id,
      ruleSnapshotVersion: run.ruleSnapshot.version,
      currency: run.currency,
      revenueBatches: run.settlementRevenueLinks.map((link) => ({
        id: link.revenueBatch.id,
        amount: Number(link.revenueBatch.totalAmount),
        periodStart: link.revenueBatch.periodStart.toISOString(),
        periodEnd: link.revenueBatch.periodEnd.toISOString(),
      })),
      participants: run.ruleSnapshot.ruleSnapshotParticipants.map((rsp) => {
        const data = (rsp.participantData ?? null) as Record<string, unknown> | null;
        // FB-003 Run 3 gate decision: pool membership / weighting comes from
        // the frozen snapshot (RuleSnapshotParticipant.participantData), NOT
        // the live Participant.metadata, so finalized runs stay deterministic.
        return {
          id: rsp.participant.id,
          name: rsp.participant.name,
          roleName: rsp.participant.roleName,
          behaviorType: rsp.participant.behaviorType as EngineParticipantBehavior,
          ...(data?.poolMember !== undefined && { poolMember: Boolean(data.poolMember) }),
          ...(typeof data?.poolId === 'string' && { poolId: data.poolId }),
          ...(typeof data?.units === 'number' && { units: data.units }),
          ...(typeof data?.investmentAmount === 'number' && {
            investmentAmount: data.investmentAmount,
          }),
          ...(typeof data?.pricePerUnit === 'number' && { pricePerUnit: data.pricePerUnit }),
          // Routed through so the pool's cent-rounding remainder can land on
          // the last-to-join member (resolver in `utils/pool.ts`).
          createdAt: rsp.participant.createdAt.toISOString(),
        };
      }),
      rules: settlementRules,
      // FB-003 Run 3 — preview determinism: runDate is the run's
      // createdAt, NEVER `new Date()`. The engine consults this for
      // tier-level deadline exit conditions.
      runDate: run.createdAt.toISOString(),
      ...(priorBalances !== undefined && { priorBalances }),
      ...(rulesV2 !== undefined && { rulesV2 }),
    };
  }

  /**
   * Load prior-run cumulative payouts for a `(deal, ruleSnapshot)` pair.
   * Returns the rows shaped for `SettlementInput.priorBalances`.
   */
  private async loadPriorBalances(
    dealId: string,
    ruleSnapshotId: string,
  ): Promise<SettlementInput['priorBalances']> {
    const rows = await this.prisma.participantBalance.findMany({
      where: { dealId, ruleSnapshotId },
      select: { participantId: true, cumulativePayout: true },
    });
    return rows.map((r) => ({
      participantId: r.participantId,
      cumulativePayout: Number(r.cumulativePayout),
    }));
  }

  /**
   * Persist the engine's per-investor balance write-back into
   * `participant_balances`. Upserts on the composite unique key so a
   * second finalized run on the same snapshot keeps the running total
   * accurate. Called only when the engine emits balances (v2 paths).
   */
  private async persistParticipantBalances(
    tx: Prisma.TransactionClient,
    dealId: string,
    ruleSnapshotId: string,
    runId: string,
    balances: SettlementOutput['participantBalances'],
  ): Promise<void> {
    if (!balances || balances.length === 0) return;
    for (const bal of balances) {
      await tx.participantBalance.upsert({
        where: {
          dealId_participantId_ruleSnapshotId: {
            dealId,
            participantId: bal.participantId,
            ruleSnapshotId,
          },
        },
        update: {
          cumulativePayout: new Prisma.Decimal(bal.cumulativePayout),
          lastSettlementRunId: runId,
          exitConditions: bal.exitConditions as unknown as Prisma.InputJsonValue,
        },
        create: {
          dealId,
          participantId: bal.participantId,
          ruleSnapshotId,
          cumulativePayout: new Prisma.Decimal(bal.cumulativePayout),
          lastSettlementRunId: runId,
          exitConditions: bal.exitConditions as unknown as Prisma.InputJsonValue,
        },
      });
    }
  }

  /**
   * Extract engine-ready `SettlementRules` from the stored rule snapshot.
   *
   * Branches on `schemaVersion`:
   *   - `undefined | 1` → existing flat-shape path (untouched — v1 snapshots
   *     produce byte-identical engine output to before Run 2)
   *   - `2` → new Rev 3 path: maps the v2 rules JSON to the engine's
   *     `SettlementRules` shape so the existing 4-phase engine can still
   *     run while Run 3 lands the orchestration for pool resolver + Tier 2
   *     + cross-phase hard cap.
   *
   * Run 2 substrate-only: v2 returns the same flat 4-phase shape — the new
   * phases (`POOL_REVENUE_SOURCE`, `WATERFALL_TIER_*`) are wired in Run 3.
   */
  private extractSettlementRules(
    rules: Record<string, unknown>,
    participants: {
      participantId: string;
      participantData: unknown;
      participant: { roleName: string; behaviorType: string };
    }[],
  ): SettlementInput['rules'] {
    const version = getRulesSchemaVersion(rules);
    if (version === 2) {
      return extractV2SettlementRules(
        rules as unknown as RuleSnapshotRulesV2,
        participants,
      );
    }

    if (rules.distributionFees && rules.recoupment && rules.netProfitSplit) {
      return rules as unknown as SettlementInput['rules'];
    }

    const distributionFees: SettlementInput['rules']['distributionFees'] = [];
    const recoupment: SettlementInput['rules']['recoupment'] = [];
    const netProfitSplit: SettlementInput['rules']['netProfitSplit'] = [];

    for (const p of participants) {
      const data = (p.participantData as Record<string, unknown>) ?? {};

      if (data.feePercentage) {
        distributionFees.push({
          participantId: p.participantId,
          feePercentage: data.feePercentage as number,
        });
      }

      if (data.recoupAmount || data.recoupCap || data.recoupmentCap) {
        recoupment.push({
          participantId: p.participantId,
          recoupAmount: (data.recoupAmount ?? data.recoupmentCap ?? 0) as number,
          recoupCap: (data.recoupCap ?? data.recoupmentCap ?? 0) as number,
          priority: (data.priority ?? data.tier ?? 1) as number,
          previouslyRecouped: (data.previouslyRecouped ?? 0) as number,
        });
      }

      if (data.allocationPercentage || data.netProfitPercentage) {
        netProfitSplit.push({
          participantId: p.participantId,
          percentage: (data.allocationPercentage ?? data.netProfitPercentage) as number,
        });
      }
    }

    return { distributionFees, recoupment, netProfitSplit };
  }

  private mapRunToResponse(
    run: {
      id: string;
      dealId: string;
      ruleSnapshotId: string;
      runNumber: number;
      runType: string;
      status: string;
      originalSettlementRunId: string | null;
      totalAllocated: Prisma.Decimal;
      currency: string;
      notes: string | null;
      executedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    },
    enrichments?: {
      ruleSnapshotVersion?: number;
      revenueBatchCount?: number;
      totalRevenue?: number;
      proofHash?: string | null;
    },
  ): SettlementRunResponseDto {
    const executedAtIso = run.executedAt?.toISOString() ?? null;

    return {
      id: run.id,
      dealId: run.dealId,
      ruleSnapshotId: run.ruleSnapshotId,
      runNumber: run.runNumber,
      runLabel: `Run #${run.runNumber}`,
      runType: run.runType as RunTypeEnum,
      status: run.status as SettlementStatusEnum,
      originalSettlementRunId: run.originalSettlementRunId,
      totalAllocated: Number(run.totalAllocated),
      currency: run.currency as CurrencyEnum,
      notes: run.notes,
      executedAt: executedAtIso,
      finalizedAt: executedAtIso,
      createdAt: run.createdAt.toISOString(),
      updatedAt: run.updatedAt.toISOString(),
      ...(enrichments?.ruleSnapshotVersion !== undefined && {
        ruleSnapshotVersion: enrichments.ruleSnapshotVersion,
      }),
      ...(enrichments?.revenueBatchCount !== undefined && {
        revenueBatchCount: enrichments.revenueBatchCount,
      }),
      ...(enrichments?.totalRevenue !== undefined && {
        totalRevenue: enrichments.totalRevenue,
      }),
      ...(enrichments?.proofHash !== undefined && {
        proofHash: enrichments.proofHash,
      }),
    };
  }

  private mapEngineOutputToPreview(
    settlementRunId: string,
    result: SettlementOutput,
  ): PreviewSettlementResponseDto {
    return {
      settlementRunId,
      status: SettlementStatusEnum.PREVIEWED,
      totalRevenue: result.totalRevenue,
      totalAllocated: result.totalAllocated,
      currency: result.currency as CurrencyEnum,
      allocations: result.allocations.map((a, i) => ({
        id: `preview-${i}`,
        participantId: a.participantId,
        participantName: a.participantName,
        amount: a.amount,
        currency: result.currency as CurrencyEnum,
        phase: a.phase as unknown as SettlementPhaseEnum,
        metadata: a.metadata,
      })),
      proof: result.proof,
      message:
        'Preview complete. Call POST /settlement-runs/{id}/finalize to lock results.',
    };
  }

  private async buildFinalizedResponse(
    userId: string,
    id: string,
  ): Promise<FinalizeSettlementResponseDto> {
    const detail = await this.getRun(userId, id);

    return {
      settlementRunId: id,
      status: SettlementStatusEnum.FINALIZED,
      totalRevenue: detail.allocations
        ? detail.allocations.reduce((s, a) => s + a.amount, 0)
        : 0,
      totalAllocated: detail.totalAllocated,
      currency: detail.currency,
      allocations: detail.allocations ?? [],
      proof: detail.proof ?? {
        proofHash: '',
        algorithm: 'SHA-256',
        timestamp: new Date().toISOString(),
      },
      ledger: detail.ledger ?? { journalIds: [], postingCount: 0 },
      finalizedAt: detail.executedAt ?? new Date().toISOString(),
      message: 'Settlement finalized successfully. Results are now locked.',
    };
  }
}

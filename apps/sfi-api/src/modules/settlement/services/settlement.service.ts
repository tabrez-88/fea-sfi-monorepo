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
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../deals/dto';
import {
  CreateSettlementRunDto,
  SettlementRunResponseDto,
  SettlementRunDetailResponseDto,
  SettlementRunListResponseDto,
  PreviewSettlementResponseDto,
  FinalizeSettlementResponseDto,
  CreateCorrectionRunDto,
  RunTypeEnum,
  SettlementStatusEnum,
  SettlementPhaseEnum,
  CurrencyEnum,
} from '../dto';
import { SettlementEngine } from '../engine/settlement-engine';
import {
  SettlementInput,
  SettlementOutput,
  ParticipantRole as EngineParticipantRole,
} from '../engine/types';

@Injectable()
export class SettlementService {
  private readonly logger = new Logger(SettlementService.name);
  private readonly engine = new SettlementEngine();

  constructor(private readonly prisma: PrismaService) {}

  async createRun(
    dealId: string,
    createDto: CreateSettlementRunDto,
  ): Promise<SettlementRunResponseDto> {
    this.logger.log(`Creating settlement run for deal: ${dealId}`);

    // Validate deal exists
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true },
    });
    if (!deal) {
      throw new NotFoundException(`Deal with ID ${dealId} not found`);
    }

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
      throw new BadRequestException(
        'Rule snapshot does not belong to this deal',
      );
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

    // Create run in DRAFT status
    const run = await this.prisma.settlementRun.create({
      data: {
        dealId,
        ruleSnapshotId: createDto.ruleSnapshotId,
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

    this.logger.log(`Settlement run created: ${run.id}`);
    return this.mapRunToResponse(run);
  }

  async listRuns(
    dealId: string,
    query: PaginationQueryDto,
  ): Promise<SettlementRunListResponseDto> {
    this.logger.log(`Listing settlement runs for deal: ${dealId}`);
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const [runs, total] = await Promise.all([
      this.prisma.settlementRun.findMany({
        where: { dealId },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.settlementRun.count({ where: { dealId } }),
    ]);

    return {
      data: runs.map((run) => this.mapRunToResponse(run)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getRun(id: string): Promise<SettlementRunDetailResponseDto> {
    this.logger.log(`Getting settlement run: ${id}`);

    const run = await this.prisma.settlementRun.findUnique({
      where: { id },
      include: {
        settlementRevenueLinks: {
          include: { revenueBatch: true },
        },
        settlementAllocations: {
          include: { participant: true },
        },
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

    return {
      ...this.mapRunToResponse(run),
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

  async previewRun(id: string): Promise<PreviewSettlementResponseDto> {
    this.logger.log(`Previewing settlement run: ${id}`);

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

    // Build engine input from database data
    const engineInput = this.buildEngineInput(run);

    // Calculate allocations using pure engine
    const result = this.engine.calculate(engineInput);

    // Update status to PREVIEWED
    await this.prisma.settlementRun.update({
      where: { id },
      data: { status: SettlementRunStatus.PREVIEWED },
    });

    return this.mapEngineOutputToPreview(id, result);
  }

  async finalizeRun(id: string): Promise<FinalizeSettlementResponseDto> {
    this.logger.log(`Finalizing settlement run: ${id}`);

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

    // Idempotency: if already finalized, return existing results
    if (run.status === SettlementRunStatus.FINALIZED) {
      this.logger.log(`Settlement run ${id} already finalized (idempotent)`);
      return this.buildFinalizedResponse(id);
    }

    if (run.status === SettlementRunStatus.VOIDED) {
      throw new ConflictException(
        'Cannot finalize a voided settlement run',
      );
    }

    if (run.status !== SettlementRunStatus.PREVIEWED) {
      throw new BadRequestException(
        `Cannot finalize run in ${run.status} status. Must be PREVIEWED first.`,
      );
    }

    // Re-calculate via engine (determinism check)
    const engineInput = this.buildEngineInput(run);
    const result = this.engine.calculate(engineInput);

    const now = new Date();

    // Persist everything in a transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. Persist allocations
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

      // 2. Create proof record
      await tx.proofRecord.create({
        data: {
          settlementRunId: id,
          proofHash: result.proof.proofHash,
          algorithm: result.proof.algorithm,
          timestamp: now,
          data: result.proof.inputSummary as Prisma.InputJsonValue,
        },
      });

      // 3. Create ledger journal and postings
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

      // Credit: Revenue account
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

      // Debit: Participant allocations
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

      // 4. Update revenue batches to PROCESSED
      const batchIds = run.settlementRevenueLinks.map(
        (link) => link.revenueBatchId,
      );
      await tx.revenueBatch.updateMany({
        where: { id: { in: batchIds } },
        data: { status: RevenueBatchStatus.PROCESSED },
      });

      // 5. Update run status to FINALIZED
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
    return this.buildFinalizedResponse(id);
  }

  async createCorrectionRun(
    originalRunId: string,
    createDto: CreateCorrectionRunDto,
  ): Promise<SettlementRunResponseDto> {
    this.logger.log(`Creating correction run for: ${originalRunId}`);

    const originalRun = await this.prisma.settlementRun.findUnique({
      where: { id: originalRunId },
    });

    if (!originalRun) {
      throw new NotFoundException(
        `Settlement run with ID ${originalRunId} not found`,
      );
    }

    if (originalRun.status !== SettlementRunStatus.FINALIZED) {
      throw new BadRequestException(
        'Can only create correction for FINALIZED settlement runs',
      );
    }

    const correctionRun = await this.prisma.settlementRun.create({
      data: {
        dealId: originalRun.dealId,
        ruleSnapshotId: originalRun.ruleSnapshotId,
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

    this.logger.log(`Correction run created: ${correctionRun.id}`);
    return this.mapRunToResponse(correctionRun);
  }

  // ============================================
  // Private helpers
  // ============================================

  private buildEngineInput(run: {
    id: string;
    ruleSnapshot: {
      version: number;
      rules: unknown;
      ruleSnapshotParticipants: {
        participantId: string;
        participantData: unknown;
        participant: { id: string; name: string; role: string };
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
  }): SettlementInput {
    const rules = run.ruleSnapshot.rules as Record<string, unknown>;

    // Extract settlement rules from the flexible JSON structure
    const settlementRules = this.extractSettlementRules(
      rules,
      run.ruleSnapshot.ruleSnapshotParticipants,
    );

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
      participants: run.ruleSnapshot.ruleSnapshotParticipants.map((rsp) => ({
        id: rsp.participant.id,
        name: rsp.participant.name,
        role: rsp.participant.role as EngineParticipantRole,
      })),
      rules: settlementRules,
    };
  }

  private extractSettlementRules(
    rules: Record<string, unknown>,
    participants: {
      participantId: string;
      participantData: unknown;
      participant: { role: string };
    }[],
  ): SettlementInput['rules'] {
    // If rules already has our engine format, use directly
    if (rules.distributionFees && rules.recoupment && rules.netProfitSplit) {
      return rules as unknown as SettlementInput['rules'];
    }

    // Otherwise, build from participant data
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

  private mapRunToResponse(run: {
    id: string;
    dealId: string;
    ruleSnapshotId: string;
    runType: string;
    status: string;
    originalSettlementRunId: string | null;
    totalAllocated: Prisma.Decimal;
    currency: string;
    notes: string | null;
    executedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): SettlementRunResponseDto {
    return {
      id: run.id,
      dealId: run.dealId,
      ruleSnapshotId: run.ruleSnapshotId,
      runType: run.runType as RunTypeEnum,
      status: run.status as SettlementStatusEnum,
      originalSettlementRunId: run.originalSettlementRunId,
      totalAllocated: Number(run.totalAllocated),
      currency: run.currency as CurrencyEnum,
      notes: run.notes,
      executedAt: run.executedAt?.toISOString() ?? null,
      createdAt: run.createdAt.toISOString(),
      updatedAt: run.updatedAt.toISOString(),
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
    id: string,
  ): Promise<FinalizeSettlementResponseDto> {
    const detail = await this.getRun(id);

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

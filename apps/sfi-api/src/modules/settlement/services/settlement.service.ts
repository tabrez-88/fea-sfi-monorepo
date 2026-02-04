import { Injectable, Logger } from '@nestjs/common';

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

/**
 * Settlement Service
 *
 * Responsibilities:
 * - Create and manage settlement runs
 * - Calculate allocations based on rules (deterministic)
 * - Handle preview and finalize workflows
 * - Create correction runs
 * - Generate proof records for auditability
 */
@Injectable()
export class SettlementService {
  private readonly logger = new Logger(SettlementService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new settlement run
   * TODO: Implement actual run creation with:
   * - Deal/snapshot/batch validation
   * - Revenue batch status checks
   * - Run creation in DRAFT status
   */
  async createRun(
    dealId: string,
    createDto: CreateSettlementRunDto,
  ): Promise<SettlementRunResponseDto> {
    this.logger.log(`Creating settlement run for deal: ${dealId}`);

    // TODO: Validate deal exists
    // TODO: Validate rule snapshot exists and belongs to deal
    // TODO: Validate all revenue batches exist, belong to deal, and are VALIDATED
    // TODO: Create run with DRAFT status

    const now = new Date().toISOString();
    return {
      id: '550e8400-e29b-41d4-a716-446655440100',
      dealId,
      ruleSnapshotId: createDto.ruleSnapshotId,
      runType: RunTypeEnum.NORMAL,
      status: SettlementStatusEnum.DRAFT,
      originalSettlementRunId: null,
      totalAllocated: 0,
      currency: CurrencyEnum.USD,
      notes: createDto.notes,
      executedAt: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * List all settlement runs for a deal
   * TODO: Implement actual database query with pagination and filtering
   */
  async listRuns(
    dealId: string,
    query: PaginationQueryDto,
  ): Promise<SettlementRunListResponseDto> {
    this.logger.log(`Listing settlement runs for deal: ${dealId}`);
    const { page = 1, limit = 20 } = query;

    // TODO: Query with filters for status, runType, etc.

    const now = new Date().toISOString();
    return {
      data: [
        {
          id: '550e8400-e29b-41d4-a716-446655440100',
          dealId,
          ruleSnapshotId: '550e8400-e29b-41d4-a716-446655440099',
          runType: RunTypeEnum.NORMAL,
          status: SettlementStatusEnum.FINALIZED,
          originalSettlementRunId: null,
          totalAllocated: 125000.0,
          currency: CurrencyEnum.USD,
          notes: 'Q1 2024 settlement',
          executedAt: '2024-04-20T14:00:00.000Z',
          createdAt: '2024-04-20T10:00:00.000Z',
          updatedAt: '2024-04-20T14:00:00.000Z',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440101',
          dealId,
          ruleSnapshotId: '550e8400-e29b-41d4-a716-446655440099',
          runType: RunTypeEnum.NORMAL,
          status: SettlementStatusEnum.DRAFT,
          originalSettlementRunId: null,
          totalAllocated: 0,
          currency: CurrencyEnum.USD,
          notes: 'Q2 2024 settlement (in progress)',
          executedAt: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
      meta: {
        page,
        limit,
        total: 2,
        totalPages: 1,
      },
    };
  }

  /**
   * Get a single settlement run with full details
   * TODO: Implement actual database query with relations
   */
  async getRun(id: string): Promise<SettlementRunDetailResponseDto> {
    this.logger.log(`Getting settlement run: ${id}`);

    // TODO: Query run with revenue batches, allocations, proof, ledger refs
    // TODO: Throw NotFoundException if not found

    const now = new Date().toISOString();
    return {
      id,
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      ruleSnapshotId: '550e8400-e29b-41d4-a716-446655440099',
      runType: RunTypeEnum.NORMAL,
      status: SettlementStatusEnum.FINALIZED,
      originalSettlementRunId: null,
      totalAllocated: 125000.0,
      currency: CurrencyEnum.USD,
      notes: 'Q1 2024 settlement',
      executedAt: '2024-04-20T14:00:00.000Z',
      createdAt: '2024-04-20T10:00:00.000Z',
      updatedAt: '2024-04-20T14:00:00.000Z',
      revenueBatches: [
        {
          id: '550e8400-e29b-41d4-a716-446655440050',
          batchNumber: 'RB-2024-001',
          periodStart: '2024-01-01T00:00:00.000Z',
          periodEnd: '2024-03-31T23:59:59.999Z',
          totalAmount: 125000.0,
          currency: CurrencyEnum.USD,
        },
      ],
      allocations: [
        {
          id: '550e8400-e29b-41d4-a716-446655440200',
          participantId: '550e8400-e29b-41d4-a716-446655440001',
          participantName: 'Acme Productions LLC',
          amount: 75000.0,
          currency: CurrencyEnum.USD,
          phase: SettlementPhaseEnum.NET_PROFITS,
          metadata: { percentage: 60, calculationBasis: 'net_revenue' },
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440201',
          participantId: '550e8400-e29b-41d4-a716-446655440002',
          participantName: 'Global Distribution Inc',
          amount: 50000.0,
          currency: CurrencyEnum.USD,
          phase: SettlementPhaseEnum.NET_PROFITS,
          metadata: { percentage: 40, calculationBasis: 'net_revenue' },
        },
      ],
      proof: {
        proofHash: 'sha256:a1b2c3d4e5f6789012345678901234567890abcdef',
        algorithm: 'SHA-256',
        timestamp: '2024-04-20T14:00:00.000Z',
        inputSummary: {
          ruleSnapshotVersion: 1,
          revenueBatchCount: 1,
          totalRevenue: 125000,
          participantCount: 2,
        },
      },
      ledger: {
        journalIds: ['550e8400-e29b-41d4-a716-446655440300'],
        postingCount: 4,
      },
    };
  }

  /**
   * Preview settlement allocations
   * TODO: Implement actual calculation logic with:
   * - Rule application
   * - Allocation calculation
   * - Proof hash generation
   */
  async previewRun(id: string): Promise<PreviewSettlementResponseDto> {
    this.logger.log(`Previewing settlement run: ${id}`);

    // TODO: Validate run exists and is in DRAFT or PREVIEWED status
    // TODO: Load rule snapshot and revenue batches
    // TODO: Calculate allocations deterministically
    // TODO: Generate proof hash
    // TODO: Update status to PREVIEWED (but don't persist allocations)

    return {
      settlementRunId: id,
      status: SettlementStatusEnum.PREVIEWED,
      totalRevenue: 275000.0,
      totalAllocated: 275000.0,
      currency: CurrencyEnum.USD,
      allocations: [
        {
          id: 'preview-alloc-001',
          participantId: '550e8400-e29b-41d4-a716-446655440001',
          participantName: 'Acme Productions LLC',
          amount: 165000.0,
          currency: CurrencyEnum.USD,
          phase: SettlementPhaseEnum.NET_PROFITS,
          metadata: { percentage: 60, grossRevenue: 275000 },
        },
        {
          id: 'preview-alloc-002',
          participantId: '550e8400-e29b-41d4-a716-446655440002',
          participantName: 'Global Distribution Inc',
          amount: 110000.0,
          currency: CurrencyEnum.USD,
          phase: SettlementPhaseEnum.NET_PROFITS,
          metadata: { percentage: 40, grossRevenue: 275000 },
        },
      ],
      proof: {
        proofHash: 'sha256:preview123456789abcdef0123456789abcdef',
        algorithm: 'SHA-256',
        timestamp: new Date().toISOString(),
        inputSummary: {
          ruleSnapshotVersion: 1,
          revenueBatchCount: 2,
          totalRevenue: 275000,
          participantCount: 2,
        },
      },
      message: 'Preview complete. Call POST /settlement-runs/{id}/finalize to lock results.',
    };
  }

  /**
   * Finalize settlement run
   * TODO: Implement actual finalization with:
   * - Final allocation calculation and persistence
   * - Proof record creation
   * - Ledger journal and posting creation
   * - Revenue batch status update to PROCESSED
   * - Idempotency check
   */
  async finalizeRun(id: string): Promise<FinalizeSettlementResponseDto> {
    this.logger.log(`Finalizing settlement run: ${id}`);

    // TODO: Check if already finalized (return existing if so - idempotent)
    // TODO: Validate run exists and is in PREVIEWED status
    // TODO: Re-calculate allocations (ensure determinism)
    // TODO: Persist allocations
    // TODO: Create proof record
    // TODO: Create ledger journal and postings
    // TODO: Update revenue batches to PROCESSED
    // TODO: Update run status to FINALIZED

    const now = new Date().toISOString();
    return {
      settlementRunId: id,
      status: SettlementStatusEnum.FINALIZED,
      totalRevenue: 275000.0,
      totalAllocated: 275000.0,
      currency: CurrencyEnum.USD,
      allocations: [
        {
          id: '550e8400-e29b-41d4-a716-446655440200',
          participantId: '550e8400-e29b-41d4-a716-446655440001',
          participantName: 'Acme Productions LLC',
          amount: 165000.0,
          currency: CurrencyEnum.USD,
          phase: SettlementPhaseEnum.NET_PROFITS,
          metadata: { percentage: 60, grossRevenue: 275000 },
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440201',
          participantId: '550e8400-e29b-41d4-a716-446655440002',
          participantName: 'Global Distribution Inc',
          amount: 110000.0,
          currency: CurrencyEnum.USD,
          phase: SettlementPhaseEnum.NET_PROFITS,
          metadata: { percentage: 40, grossRevenue: 275000 },
        },
      ],
      proof: {
        proofHash: 'sha256:finalized123456789abcdef0123456789abcdef',
        algorithm: 'SHA-256',
        timestamp: now,
        inputSummary: {
          ruleSnapshotVersion: 1,
          revenueBatchCount: 2,
          totalRevenue: 275000,
          participantCount: 2,
        },
      },
      ledger: {
        journalIds: ['550e8400-e29b-41d4-a716-446655440300'],
        postingCount: 4,
      },
      finalizedAt: now,
      message: 'Settlement finalized successfully. Results are now locked.',
    };
  }

  /**
   * Create a correction run for an existing settlement
   * TODO: Implement actual correction logic with:
   * - Original run validation
   * - Correction run creation with original_settlement_run_id
   * - Support for adjustment revenue batches
   */
  async createCorrectionRun(
    originalRunId: string,
    createDto: CreateCorrectionRunDto,
  ): Promise<SettlementRunResponseDto> {
    this.logger.log(`Creating correction run for: ${originalRunId}`);

    // TODO: Validate original run exists and is FINALIZED
    // TODO: Create correction run linked to original
    // TODO: Include adjustment batches if provided

    const now = new Date().toISOString();
    return {
      id: '550e8400-e29b-41d4-a716-446655440102',
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      ruleSnapshotId: '550e8400-e29b-41d4-a716-446655440099',
      runType: RunTypeEnum.CORRECTION,
      status: SettlementStatusEnum.DRAFT,
      originalSettlementRunId: originalRunId,
      totalAllocated: 0,
      currency: CurrencyEnum.USD,
      notes: createDto.notes || 'Correction for settlement run',
      executedAt: null,
      createdAt: now,
      updatedAt: now,
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../deals/dto';
import {
  CreateRuleSnapshotDto,
  RuleSnapshotResponseDto,
  RuleSnapshotDetailResponseDto,
  RuleSnapshotListResponseDto,
  ParticipantRoleEnum,
} from '../dto';

/**
 * Rules Service
 *
 * Responsibilities:
 * - Create and manage rule configurations for deals
 * - Create rule snapshots when settlements are triggered
 * - Validate rule configurations
 * - Support rule versioning
 */
@Injectable()
export class RulesService {
  private readonly logger = new Logger(RulesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a rule snapshot for a deal
   * TODO: Implement actual snapshot creation with:
   * - Version auto-increment
   * - Previous snapshot effectiveTo update
   * - Participant validation
   * - Deep freeze of rules configuration
   */
  async createSnapshot(
    dealId: string,
    createDto: CreateRuleSnapshotDto,
  ): Promise<RuleSnapshotResponseDto> {
    this.logger.log(`Creating rule snapshot for deal: ${dealId}`);

    // TODO: Validate deal exists
    // TODO: Validate all participant IDs belong to this deal
    // TODO: Get next version number
    // TODO: Update previous snapshot's effectiveTo
    // TODO: Persist snapshot and participant data

    // Return dummy response
    const now = new Date().toISOString();
    return {
      id: '550e8400-e29b-41d4-a716-446655440099',
      dealId,
      version: 1,
      effectiveFrom: createDto.effectiveFrom || now,
      effectiveTo: null,
      rules: createDto.rules,
      notes: createDto.notes,
      participantCount: createDto.participants.length,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * List all rule snapshots for a deal
   * TODO: Implement actual database query with pagination
   */
  async listSnapshots(
    dealId: string,
    query: PaginationQueryDto,
  ): Promise<RuleSnapshotListResponseDto> {
    this.logger.log(`Listing rule snapshots for deal: ${dealId}`);
    const { page = 1, limit = 20 } = query;

    // TODO: Validate deal exists
    // TODO: Query snapshots with pagination

    // Return dummy response
    const now = new Date().toISOString();
    return {
      data: [
        {
          id: '550e8400-e29b-41d4-a716-446655440099',
          dealId,
          version: 2,
          effectiveFrom: '2024-06-01T00:00:00.000Z',
          effectiveTo: null,
          rules: {
            currency: 'USD',
            allocationRules: [
              { phase: 'NET_PROFITS', method: 'percentage', params: { basePercentage: 50 } },
            ],
          },
          notes: 'Q2 2024 update',
          participantCount: 3,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440098',
          dealId,
          version: 1,
          effectiveFrom: '2024-01-01T00:00:00.000Z',
          effectiveTo: '2024-05-31T23:59:59.999Z',
          rules: {
            currency: 'USD',
            allocationRules: [
              { phase: 'NET_PROFITS', method: 'percentage', params: { basePercentage: 45 } },
            ],
          },
          notes: 'Initial rules',
          participantCount: 2,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
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
   * Get a single rule snapshot with full details including participants
   * TODO: Implement actual database query
   */
  async getSnapshot(id: string): Promise<RuleSnapshotDetailResponseDto> {
    this.logger.log(`Getting rule snapshot: ${id}`);

    // TODO: Query snapshot with participants
    // TODO: Throw NotFoundException if not found

    // Return dummy response
    const now = new Date().toISOString();
    return {
      id,
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      version: 1,
      effectiveFrom: '2024-01-01T00:00:00.000Z',
      effectiveTo: null,
      rules: {
        currency: 'USD',
        allocationRules: [
          { phase: 'GROSS_RECEIPTS', method: 'percentage', params: { basePercentage: 100 } },
          { phase: 'DISTRIBUTION_FEES', method: 'percentage', params: { feePercentage: 30 } },
          { phase: 'NET_PROFITS', method: 'percentage', params: {} },
        ],
        additionalParams: {
          recoupmentOrder: 'sequential',
          feeCalculationMethod: 'gross',
        },
      },
      notes: 'Initial deal rules',
      participantCount: 2,
      createdAt: now,
      updatedAt: now,
      participants: [
        {
          id: '550e8400-e29b-41d4-a716-446655440010',
          participantId: '550e8400-e29b-41d4-a716-446655440001',
          participantName: 'Acme Productions LLC',
          participantRole: ParticipantRoleEnum.PRODUCER,
          participantData: {
            allocationPercentage: 60,
            tier: 1,
            recoupmentCap: 500000,
          },
          createdAt: now,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440011',
          participantId: '550e8400-e29b-41d4-a716-446655440002',
          participantName: 'Global Distribution Inc',
          participantRole: ParticipantRoleEnum.DISTRIBUTOR,
          participantData: {
            allocationPercentage: 40,
            tier: 2,
            feePercentage: 30,
          },
          createdAt: now,
        },
      ],
    };
  }

  /**
   * Get the current active rule snapshot for a deal
   * TODO: Implement actual retrieval based on effectiveFrom/effectiveTo dates
   */
  async getCurrentSnapshot(dealId: string): Promise<RuleSnapshotResponseDto | null> {
    this.logger.log(`Getting current snapshot for deal: ${dealId}`);
    // TODO: Query for snapshot where effectiveTo is null or > now
    return null;
  }
}

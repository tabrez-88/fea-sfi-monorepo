import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../deals/dto';
import {
  DealLedgerResponseDto,
  LedgerJournalDetailDto,
  ParticipantLedgerResponseDto,
  LedgerAccountTypeEnum,
  CurrencyEnum,
} from '../dto';

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDealLedger(
    dealId: string,
    query: PaginationQueryDto,
  ): Promise<DealLedgerResponseDto> {
    this.logger.log(`Getting ledger for deal: ${dealId}`);
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true },
    });
    if (!deal) {
      throw new NotFoundException(`Deal with ID ${dealId} not found`);
    }

    const [journals, total] = await Promise.all([
      this.prisma.ledgerJournal.findMany({
        where: { dealId },
        include: {
          ledgerPostings: {
            select: {
              debitAmount: true,
              creditAmount: true,
              currency: true,
            },
          },
        },
        orderBy: { postedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ledgerJournal.count({ where: { dealId } }),
    ]);

    const mappedJournals = journals.map((journal) => {
      const totalDebit = journal.ledgerPostings.reduce(
        (sum, p) => sum + Number(p.debitAmount),
        0,
      );
      const totalCredit = journal.ledgerPostings.reduce(
        (sum, p) => sum + Number(p.creditAmount),
        0,
      );
      return {
        id: journal.id,
        dealId: journal.dealId,
        settlementRunId: journal.settlementRunId,
        journalNumber: journal.journalNumber,
        description: journal.description,
        postedAt: journal.postedAt.toISOString(),
        totalDebit,
        totalCredit,
        postingCount: journal.ledgerPostings.length,
        createdAt: journal.createdAt.toISOString(),
        updatedAt: journal.updatedAt.toISOString(),
      };
    });

    const summaryTotalDebits = mappedJournals.reduce(
      (sum, j) => sum + j.totalDebit,
      0,
    );
    const summaryTotalCredits = mappedJournals.reduce(
      (sum, j) => sum + j.totalCredit,
      0,
    );
    const summaryTotalPostings = mappedJournals.reduce(
      (sum, j) => sum + j.postingCount,
      0,
    );

    // Determine currency from the first posting, default to USD
    const firstCurrency = journals[0]?.ledgerPostings[0]?.currency;

    return {
      dealId,
      journals: mappedJournals,
      summary: {
        totalJournals: total,
        totalPostings: summaryTotalPostings,
        totalDebits: summaryTotalDebits,
        totalCredits: summaryTotalCredits,
        currency: (firstCurrency as CurrencyEnum) ?? CurrencyEnum.USD,
      },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getJournal(id: string): Promise<LedgerJournalDetailDto> {
    this.logger.log(`Getting journal: ${id}`);

    const journal = await this.prisma.ledgerJournal.findUnique({
      where: { id },
      include: {
        ledgerPostings: {
          include: {
            participant: { select: { name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!journal) {
      throw new NotFoundException(`Ledger journal with ID ${id} not found`);
    }

    const totalDebit = journal.ledgerPostings.reduce(
      (sum, p) => sum + Number(p.debitAmount),
      0,
    );
    const totalCredit = journal.ledgerPostings.reduce(
      (sum, p) => sum + Number(p.creditAmount),
      0,
    );

    return {
      id: journal.id,
      dealId: journal.dealId,
      settlementRunId: journal.settlementRunId,
      journalNumber: journal.journalNumber,
      description: journal.description,
      postedAt: journal.postedAt.toISOString(),
      totalDebit,
      totalCredit,
      postingCount: journal.ledgerPostings.length,
      createdAt: journal.createdAt.toISOString(),
      updatedAt: journal.updatedAt.toISOString(),
      postings: journal.ledgerPostings.map((posting) => ({
        id: posting.id,
        journalId: posting.ledgerJournalId,
        participantId: posting.participantId,
        participantName: posting.participant?.name ?? null,
        accountType: posting.accountType as LedgerAccountTypeEnum,
        accountCode: posting.accountCode,
        debitAmount: Number(posting.debitAmount),
        creditAmount: Number(posting.creditAmount),
        currency: posting.currency as CurrencyEnum,
        description: posting.description,
        createdAt: posting.createdAt.toISOString(),
      })),
    };
  }

  async getSettlementLedger(
    settlementRunId: string,
  ): Promise<LedgerJournalDetailDto> {
    this.logger.log(`Getting ledger for settlement run: ${settlementRunId}`);

    const journal = await this.prisma.ledgerJournal.findFirst({
      where: { settlementRunId },
      include: {
        ledgerPostings: {
          include: {
            participant: { select: { name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!journal) {
      throw new NotFoundException(
        `No ledger journal found for settlement run ${settlementRunId}. The run may not be finalized yet.`,
      );
    }

    const totalDebit = journal.ledgerPostings.reduce(
      (sum, p) => sum + Number(p.debitAmount),
      0,
    );
    const totalCredit = journal.ledgerPostings.reduce(
      (sum, p) => sum + Number(p.creditAmount),
      0,
    );

    return {
      id: journal.id,
      dealId: journal.dealId,
      settlementRunId: journal.settlementRunId,
      journalNumber: journal.journalNumber,
      description: journal.description,
      postedAt: journal.postedAt.toISOString(),
      totalDebit,
      totalCredit,
      postingCount: journal.ledgerPostings.length,
      createdAt: journal.createdAt.toISOString(),
      updatedAt: journal.updatedAt.toISOString(),
      postings: journal.ledgerPostings.map((posting) => ({
        id: posting.id,
        journalId: posting.ledgerJournalId,
        participantId: posting.participantId,
        participantName: posting.participant?.name ?? null,
        accountType: posting.accountType as LedgerAccountTypeEnum,
        accountCode: posting.accountCode,
        debitAmount: Number(posting.debitAmount),
        creditAmount: Number(posting.creditAmount),
        currency: posting.currency as CurrencyEnum,
        description: posting.description,
        createdAt: posting.createdAt.toISOString(),
      })),
    };
  }

  async getParticipantLedger(
    participantId: string,
    query: PaginationQueryDto,
  ): Promise<ParticipantLedgerResponseDto> {
    this.logger.log(`Getting ledger for participant: ${participantId}`);
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
      select: { id: true, name: true },
    });
    if (!participant) {
      throw new NotFoundException(
        `Participant with ID ${participantId} not found`,
      );
    }

    const where = { participantId };

    const [postings, total] = await Promise.all([
      this.prisma.ledgerPosting.findMany({
        where,
        include: {
          ledgerJournal: {
            select: {
              id: true,
              journalNumber: true,
              settlementRunId: true,
              postedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ledgerPosting.count({ where }),
    ]);

    // Calculate total balance across ALL postings (not just this page)
    const balanceAgg = await this.prisma.ledgerPosting.aggregate({
      where: { participantId },
      _sum: {
        debitAmount: true,
        creditAmount: true,
      },
    });

    const totalDebits = Number(balanceAgg._sum.debitAmount ?? 0);
    const totalCredits = Number(balanceAgg._sum.creditAmount ?? 0);

    // Determine currency from first posting, default to USD
    const firstCurrency = postings[0]?.currency;

    return {
      participantId,
      participantName: participant.name,
      entries: postings.map((posting) => ({
        postingId: posting.id,
        journalId: posting.ledgerJournal.id,
        journalNumber: posting.ledgerJournal.journalNumber,
        settlementRunId: posting.ledgerJournal.settlementRunId,
        accountType: posting.accountType as LedgerAccountTypeEnum,
        accountCode: posting.accountCode,
        debitAmount: Number(posting.debitAmount),
        creditAmount: Number(posting.creditAmount),
        currency: posting.currency as CurrencyEnum,
        description: posting.description,
        postedAt: posting.ledgerJournal.postedAt.toISOString(),
      })),
      balance: {
        totalDebits,
        totalCredits,
        netBalance: totalCredits - totalDebits,
        currency: (firstCurrency as CurrencyEnum) ?? CurrencyEnum.USD,
      },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

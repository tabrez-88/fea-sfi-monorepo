import type { Currency } from '@/types/deal.types';

/** BE `LedgerAccountTypeEnum`. */
export const LedgerAccountType = {
  ASSET: 'ASSET',
  LIABILITY: 'LIABILITY',
  EQUITY: 'EQUITY',
  REVENUE: 'REVENUE',
  EXPENSE: 'EXPENSE',
} as const;

export type LedgerAccountType =
  (typeof LedgerAccountType)[keyof typeof LedgerAccountType];

/** BE `LedgerPostingDto`: one side of a double-entry line. */
export interface LedgerPosting {
  id: string;
  journalId: string;
  participantId?: string | null;
  participantName?: string | null;
  accountType: LedgerAccountType;
  accountCode: string;
  debitAmount: number;
  creditAmount: number;
  currency: Currency;
  description?: string | null;
  createdAt: string;
}

/** BE `LedgerJournalDto`: a balanced journal produced by one settlement. */
export interface LedgerJournal {
  id: string;
  dealId: string;
  settlementRunId: string;
  journalNumber: string;
  description?: string | null;
  postedAt: string;
  totalDebit: number;
  totalCredit: number;
  postingCount: number;
}

/** BE `LedgerJournalDetailDto`: a journal plus its postings. */
export interface LedgerJournalDetail extends LedgerJournal {
  postings: LedgerPosting[];
}

/** BE `DealLedgerResponseDto` for `GET /deals/:id/ledger`. */
export interface DealLedger {
  dealId: string;
  journals: LedgerJournal[];
  summary: {
    totalDebits: number;
    totalCredits: number;
    currency: Currency;
  };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

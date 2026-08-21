'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { BackLink } from '@/components/common/BackLink';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useLedgerJournal } from '@/hooks/ledger/useLedgerJournal';
import { cn } from '@/lib/utils';
import {
  LedgerAccountType,
  type LedgerJournalDetail,
  type LedgerPosting,
} from '@/types/ledger.types';
import { formatDate } from '@/utils/date';
import { formatCurrency, formatNumber } from '@/utils/format';

type JournalDetailViewProps = Readonly<{
  dealId: string;
  journalId: string;
}>;

/**
 * Column template, Screen 5.2:
 *   Account Code · Account Type · Participant · Debit · Credit
 */
const GRID_COLS =
  'grid grid-cols-[minmax(150px,1.1fr)_minmax(110px,0.8fr)_minmax(160px,1.3fr)_minmax(120px,1fr)_minmax(120px,1fr)]';

/** Account types get a tone so the revenue credit line reads differently. */
const ACCOUNT_TONE: Record<
  LedgerAccountType,
  'success' | 'info' | 'warning' | 'neutral'
> = {
  REVENUE: 'success',
  LIABILITY: 'info',
  ASSET: 'info',
  EQUITY: 'warning',
  EXPENSE: 'warning',
};

/**
 * MS-5 Screen 5.2: Journal Detail.
 *
 * Every posting in one journal, with a bold total row and the same balance
 * confirmation as the overview. Revenue lines are tinted so the credit that
 * opens the entry stands apart from the payables it funds.
 */
export function JournalDetailView({ dealId, journalId }: JournalDetailViewProps) {
  const { data: journal, isLoading, isError, refetch } = useLedgerJournal(journalId);

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink href={ROUTES.DEALS.REPORTS_LEDGER(dealId)} label="Ledger" />
        <div className="flex flex-col items-center gap-3 rounded-[8px] border border-border bg-white py-16 text-center">
          <p className="text-[14px] text-danger">Failed to load this journal.</p>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={ROUTES.DEALS.REPORTS_LEDGER(dealId)} label="Ledger" />

      <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
        {journal ? journal.journalNumber : 'Journal'}
      </h1>

      <section className="flex flex-col gap-6 rounded-[8px] border border-border bg-white p-4 sm:p-6">
        {isLoading || !journal ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-40 w-full rounded-[8px]" />
          </div>
        ) : (
          <JournalBody journal={journal} />
        )}
      </section>
    </div>
  );
}

function JournalBody({ journal }: Readonly<{ journal: LedgerJournalDetail }>) {
  const balanced = Math.abs(journal.totalDebit - journal.totalCredit) < 0.01;
  const currency = journal.postings[0]?.currency;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-[22px] font-bold leading-[28px] tracking-[0.044px] text-foreground">
              {journal.journalNumber}
            </h2>
            <p className="text-[13px] leading-[18px] text-neutral">
              Posted {formatDate(journal.postedAt)}
              {' | '}
              {formatNumber(journal.postingCount)}{' '}
              {journal.postingCount === 1 ? 'posting' : 'postings'}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={ROUTES.SETTLEMENT.RUN_DETAIL(journal.settlementRunId)}>
              View Settlement
            </Link>
          </Button>
        </div>
        {journal.description && (
          <p className="text-[14px] leading-[20px] text-foreground">
            {journal.description}
          </p>
        )}
      </div>

      {/* Postings */}
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className={cn(GRID_COLS, 'border-b border-grey-200 bg-grey-50')}>
            <HeaderCell>Account Code</HeaderCell>
            <HeaderCell>Account Type</HeaderCell>
            <HeaderCell>Participant</HeaderCell>
            <HeaderCell align="right">Debit</HeaderCell>
            <HeaderCell align="right">Credit</HeaderCell>
          </div>

          {journal.postings.map((p) => (
            <PostingRow key={p.id} posting={p} />
          ))}

          {/* Total row */}
          <div
            className={cn(
              GRID_COLS,
              'border-t-2 border-grey-200 bg-grey-50/60 font-bold',
            )}
          >
            <BodyCell>
              <span className="font-bold">Total</span>
            </BodyCell>
            <BodyCell>{null}</BodyCell>
            <BodyCell>{null}</BodyCell>
            <BodyCell align="right">
              <span className="font-bold">
                {formatCurrency(journal.totalDebit, currency)}
              </span>
            </BodyCell>
            <BodyCell align="right">
              <span className="font-bold">
                {formatCurrency(journal.totalCredit, currency)}
              </span>
            </BodyCell>
          </div>
        </div>
      </div>

      {/* Balance confirmation */}
      <div
        className={cn(
          'flex items-start gap-2 rounded-[8px] border px-4 py-3',
          balanced
            ? 'border-success/40 bg-success/5'
            : 'border-danger/40 bg-danger/5',
        )}
        role="status"
      >
        {balanced ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
        ) : (
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
        )}
        <p className="text-[13px] leading-[18px] text-foreground">
          {balanced
            ? 'Debits equal credits. This journal is balanced.'
            : 'Debits do not equal credits. This journal is out of balance.'}
        </p>
      </div>
    </>
  );
}

function PostingRow({ posting }: Readonly<{ posting: LedgerPosting }>) {
  const isRevenue = posting.accountType === LedgerAccountType.REVENUE;
  return (
    <div
      className={cn(
        GRID_COLS,
        'border-b border-grey-100',
        // The revenue credit is the money entering the deal; tint it so the
        // entry reads as "this came in, these went out".
        isRevenue ? 'bg-success/5' : 'bg-white',
      )}
    >
      <BodyCell>
        <span className="truncate font-mono text-[13px]">{posting.accountCode}</span>
      </BodyCell>
      <BodyCell>
        <Badge size="sm" variant={ACCOUNT_TONE[posting.accountType]}>
          {posting.accountType}
        </Badge>
      </BodyCell>
      <BodyCell>
        <span className="truncate text-neutral">
          {posting.participantName ?? '-'}
        </span>
      </BodyCell>
      <BodyCell align="right">
        {posting.debitAmount > 0
          ? formatCurrency(posting.debitAmount, posting.currency)
          : '-'}
      </BodyCell>
      <BodyCell align="right">
        {posting.creditAmount > 0
          ? formatCurrency(posting.creditAmount, posting.currency)
          : '-'}
      </BodyCell>
    </div>
  );
}

/* ─── Primitives ────────────────────────────────────────────────────────── */

function HeaderCell({
  children,
  align = 'left',
}: Readonly<{ children: ReactNode; align?: 'left' | 'right' }>) {
  return (
    <div
      className={cn(
        'flex items-center px-[10px] py-[14px]',
        align === 'right' && 'justify-end',
      )}
    >
      <span className="text-[14px] font-bold leading-[20px] tracking-[0.028px] text-foreground">
        {children}
      </span>
    </div>
  );
}

function BodyCell({
  children,
  align = 'left',
}: Readonly<{ children: ReactNode; align?: 'left' | 'right' }>) {
  return (
    <div
      className={cn(
        'flex h-[48px] items-center px-[10px] py-[12px] text-[14px] text-foreground',
        align === 'right' && 'justify-end',
      )}
    >
      {children}
    </div>
  );
}

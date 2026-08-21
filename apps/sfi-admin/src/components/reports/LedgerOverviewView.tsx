'use client';

import { AlertTriangle, BookOpenCheck, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';

import { BackLink } from '@/components/common/BackLink';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { DEFAULT_PAGE_SIZE } from '@/constants/ui';
import { useDealLedger } from '@/hooks/ledger/useDealLedger';
import { cn } from '@/lib/utils';
import type { LedgerJournal } from '@/types/ledger.types';
import { formatDate } from '@/utils/date';
import { formatCurrency, formatNumber } from '@/utils/format';

type LedgerOverviewViewProps = Readonly<{
  dealId: string;
}>;

/**
 * Column template, Screen 5.1:
 *   Journal # · Settlement · Posted · Debits · Credits · Postings
 */
const GRID_COLS =
  'grid grid-cols-[minmax(150px,1.2fr)_minmax(100px,0.8fr)_minmax(110px,0.9fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(90px,0.6fr)]';

const SKELETON_ROWS = ['s1', 's2', 's3', 's4'] as const;

/**
 * MS-5 Screen 5.1: Ledger Overview.
 *
 * Double-entry view of the deal. Journals are written by the engine at
 * finalize, so this screen is read-only by nature. The balance check is
 * the point of the page: debits must equal credits, and if they ever do
 * not, that is a loud red banner rather than a quiet number.
 */
export function LedgerOverviewView({ dealId }: LedgerOverviewViewProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useDealLedger(dealId, {
    page,
    limit: DEFAULT_PAGE_SIZE,
  });

  const journals = data?.journals ?? [];
  const summary = data?.summary;
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;

  const difference = summary
    ? Math.round((summary.totalDebits - summary.totalCredits) * 100) / 100
    : 0;
  const balanced = difference === 0;

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink href={ROUTES.DEALS.REPORTS(dealId)} label="Reports" />
        <div className="flex flex-col items-center gap-3 rounded-[8px] border border-border bg-white py-16 text-center">
          <p className="text-[14px] text-danger">Failed to load the ledger.</p>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={ROUTES.DEALS.REPORTS(dealId)} label="Reports" />

      <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
        Ledger Overview
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard
          label="Total Journals"
          value={formatNumber(total)}
          isLoading={isLoading}
        />
        <StatCard
          label="Total Debits"
          value={formatCurrency(summary?.totalDebits, summary?.currency)}
          isLoading={isLoading}
        />
        <StatCard
          label="Total Credits"
          value={formatCurrency(summary?.totalCredits, summary?.currency)}
          isLoading={isLoading}
        />
      </div>

      {/* Balance confirmation: the trust signal for the whole screen. */}
      {!isLoading && total > 0 && (
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
            <CheckCircle2
              className="mt-0.5 size-4 shrink-0 text-success"
              aria-hidden
            />
          ) : (
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-danger"
              aria-hidden
            />
          )}
          <div className="flex flex-col gap-0.5">
            <p className="text-[13px] font-semibold leading-[18px] text-foreground">
              {balanced ? 'Ledger is balanced' : 'Ledger is out of balance'}
            </p>
            <p className="text-[12px] leading-[16px] text-neutral">
              {balanced
                ? 'Every journal on this deal has debits equal to credits.'
                : `${difference > 0 ? 'Debits exceed credits' : 'Credits exceed debits'} by ${formatCurrency(Math.abs(difference), summary?.currency)}. Contact support: this should not happen.`}
            </p>
          </div>
        </div>
      )}

      <section
        aria-labelledby="ledger-journals-heading"
        className="flex flex-col gap-5 overflow-hidden rounded-[8px] border border-border bg-white p-4 sm:p-6"
      >
        <h2
          id="ledger-journals-heading"
          className="text-[24px] font-bold leading-[28px] tracking-[0.048px] text-foreground"
        >
          Journals ({formatNumber(total)})
        </h2>

        {!isLoading && total === 0 ? (
          <EmptyState
            icon={BookOpenCheck}
            title="No ledger entries yet"
            description="Ledger journals are created automatically when a settlement is finalized."
            action={{
              label: 'Go to Settlement',
              href: ROUTES.DEALS.SETTLEMENT(dealId),
            }}
            className="border-dashed"
          />
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[820px]">
              <div className={cn(GRID_COLS, 'border-b border-grey-200 bg-grey-50')}>
                <HeaderCell>Journal #</HeaderCell>
                <HeaderCell>Settlement</HeaderCell>
                <HeaderCell>Posted</HeaderCell>
                <HeaderCell align="right">Debits</HeaderCell>
                <HeaderCell align="right">Credits</HeaderCell>
                <HeaderCell align="right">Postings</HeaderCell>
              </div>

              {isLoading
                ? SKELETON_ROWS.map((k) => <RowSkeleton key={k} />)
                : journals.map((j, idx) => (
                    <JournalRow
                      key={j.id}
                      journal={j}
                      dealId={dealId}
                      isLast={idx === journals.length - 1}
                    />
                  ))}
            </div>
          </div>
        )}
      </section>

      {total > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="justify-center"
        />
      )}
    </div>
  );
}

function JournalRow({
  journal,
  dealId,
  isLast,
}: Readonly<{ journal: LedgerJournal; dealId: string; isLast: boolean }>) {
  const rowBalanced =
    Math.abs(journal.totalDebit - journal.totalCredit) < 0.01;

  return (
    <Link
      href={ROUTES.DEALS.REPORTS_JOURNAL(dealId, journal.id)}
      className={cn(
        GRID_COLS,
        'bg-white transition-colors hover:bg-grey-50/60',
        isLast ? '' : 'border-b border-grey-100',
      )}
    >
      <BodyCell>
        <span className="truncate font-medium text-foreground">
          {journal.journalNumber}
        </span>
      </BodyCell>
      <BodyCell>
        <span className="text-neutral">
          {journal.description ?? 'Settlement'}
        </span>
      </BodyCell>
      <BodyCell>
        <span className="text-neutral">{formatDate(journal.postedAt)}</span>
      </BodyCell>
      <BodyCell align="right">{formatCurrency(journal.totalDebit)}</BodyCell>
      <BodyCell align="right">
        <span className={cn(!rowBalanced && 'text-danger')}>
          {formatCurrency(journal.totalCredit)}
        </span>
      </BodyCell>
      <BodyCell align="right">{formatNumber(journal.postingCount)}</BodyCell>
    </Link>
  );
}

/* ─── Primitives ────────────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  isLoading,
}: Readonly<{ label: string; value: string; isLoading: boolean }>) {
  return (
    <div className="flex min-h-[100px] flex-col justify-between gap-2 rounded-[8px] border border-border bg-white p-4 sm:min-h-[110px]">
      <span className="text-[13px] font-medium leading-[18px] text-neutral">
        {label}
      </span>
      {isLoading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <span className="text-[28px] font-semibold leading-[32px] tracking-[-0.56px] text-foreground">
          {value}
        </span>
      )}
    </div>
  );
}

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
        'flex h-[52px] items-center px-[10px] py-[14px] text-[14px] text-foreground',
        align === 'right' && 'justify-end',
      )}
    >
      {children}
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className={cn(GRID_COLS, 'border-b border-grey-100')}>
      <BodyCell><Skeleton className="h-4 w-32" /></BodyCell>
      <BodyCell><Skeleton className="h-4 w-20" /></BodyCell>
      <BodyCell><Skeleton className="h-4 w-20" /></BodyCell>
      <BodyCell align="right"><Skeleton className="h-4 w-24" /></BodyCell>
      <BodyCell align="right"><Skeleton className="h-4 w-24" /></BodyCell>
      <BodyCell align="right"><Skeleton className="h-4 w-10" /></BodyCell>
    </div>
  );
}

'use client';

import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import {
  SETTLEMENT_RUN_TYPE_LABEL,
  SETTLEMENT_RUN_TYPE_TONE,
} from '@/constants/ui';
import { usePendingReviews } from '@/hooks/dashboard/usePendingReviews';
import { cn } from '@/lib/utils';
import type {
  PendingRevenueBatch,
  PendingSettlementRun,
} from '@/types/dashboard.types';
import { formatDate } from '@/utils/date';
import { formatCurrency, formatNumber } from '@/utils/format';

const BATCH_COLS =
  'grid grid-cols-[minmax(160px,1.4fr)_minmax(130px,1fr)_minmax(130px,1fr)_minmax(170px,1.2fr)_minmax(110px,0.8fr)]';
const RUN_COLS =
  'grid grid-cols-[minmax(160px,1.4fr)_minmax(90px,0.6fr)_minmax(110px,0.8fr)_minmax(140px,1.1fr)_minmax(120px,0.9fr)]';

const SKELETON_ROWS = ['s1', 's2', 's3'] as const;

/**
 * MS-4 Screen 4.2: Pending Reviews (Action Queue).
 *
 * One global page for everything waiting on a human: revenue batches in
 * PENDING and settlement runs in PREVIEWED, both served by
 * `GET /dashboard/pending-reviews` in a single call.
 *
 * Rows deep-link into the deal context (batch detail / run detail) since
 * validating or finalizing happens on those screens.
 */
export function PendingReviewsView() {
  const { data, isLoading, isError, refetch } = usePendingReviews();

  const batches = data?.revenueBatches ?? [];
  const runs = data?.settlementRuns ?? [];
  const allClear = !isLoading && !isError && batches.length === 0 && runs.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
        Pending Reviews
      </h1>

      {isError ? (
        <div className="flex flex-col items-center gap-3 rounded-[8px] border border-border bg-white py-16 text-center">
          <p className="text-[14px] text-danger">Failed to load pending reviews.</p>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : allClear ? (
        <div className="flex flex-col items-center gap-3 rounded-[8px] border border-dashed border-border bg-white px-6 py-16 text-center">
          <div
            aria-hidden
            className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success"
          >
            <CheckCircle2 className="size-6" strokeWidth={1.75} />
          </div>
          <h2 className="text-[18px] font-semibold leading-[24px] tracking-[-0.36px] text-foreground">
            All caught up
          </h2>
          <p className="max-w-[420px] text-[14px] leading-[20px] text-neutral">
            No revenue batches are waiting for validation and no settlements are
            waiting to be finalized.
          </p>
        </div>
      ) : (
        <>
          <Section
            title="Revenue Batches Awaiting Validation"
            count={batches.length}
            isLoading={isLoading}
            hint="Click a row to review and validate or reject."
            emptyCopy="No revenue batches pending."
            isEmpty={batches.length === 0}
          >
            <div className={cn(BATCH_COLS, 'border-b border-grey-200 bg-grey-50')}>
              <HeaderCell>Deal</HeaderCell>
              <HeaderCell>Batch #</HeaderCell>
              <HeaderCell>Amount</HeaderCell>
              <HeaderCell>Period</HeaderCell>
              <HeaderCell>Submitted</HeaderCell>
            </div>
            {isLoading
              ? SKELETON_ROWS.map((k) => <BatchSkeleton key={k} />)
              : batches.map((b, idx) => (
                  <BatchRow
                    key={b.id}
                    batch={b}
                    isLast={idx === batches.length - 1}
                  />
                ))}
          </Section>

          <Section
            title="Settlements Awaiting Finalization"
            count={runs.length}
            isLoading={isLoading}
            hint="Click a row to review and finalize."
            emptyCopy="No settlements pending."
            isEmpty={runs.length === 0}
          >
            <div className={cn(RUN_COLS, 'border-b border-grey-200 bg-grey-50')}>
              <HeaderCell>Deal</HeaderCell>
              <HeaderCell>Run #</HeaderCell>
              <HeaderCell>Type</HeaderCell>
              <HeaderCell>Total Allocated</HeaderCell>
              <HeaderCell>Previewed On</HeaderCell>
            </div>
            {isLoading
              ? SKELETON_ROWS.map((k) => <RunSkeleton key={k} />)
              : runs.map((r, idx) => (
                  <RunRow key={r.id} run={r} isLast={idx === runs.length - 1} />
                ))}
          </Section>
        </>
      )}
    </div>
  );
}

/* ─── Sections + rows ───────────────────────────────────────────────────── */

function Section({
  title,
  count,
  isLoading,
  hint,
  emptyCopy,
  isEmpty,
  children,
}: Readonly<{
  title: string;
  count: number;
  isLoading: boolean;
  hint: string;
  emptyCopy: string;
  isEmpty: boolean;
  children: ReactNode;
}>) {
  return (
    <section className="flex flex-col gap-4 overflow-hidden rounded-[8px] border border-border bg-white p-4 sm:p-6">
      <h2 className="text-[20px] font-bold leading-[26px] tracking-[0.04px] text-foreground">
        {title}
        {!isLoading && ` (${formatNumber(count)})`}
      </h2>

      {!isLoading && isEmpty ? (
        <p className="py-6 text-center text-[14px] text-neutral">{emptyCopy}</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div className="min-w-[780px]">{children}</div>
          </div>
          {!isLoading && <p className="text-[13px] text-neutral">{hint}</p>}
        </>
      )}
    </section>
  );
}

function BatchRow({
  batch,
  isLast,
}: Readonly<{ batch: PendingRevenueBatch; isLast: boolean }>) {
  return (
    <Link
      href={`${ROUTES.DEALS.REVENUE(batch.dealId)}/${batch.id}`}
      className={cn(
        BATCH_COLS,
        'bg-white transition-colors hover:bg-grey-50/60',
        isLast ? '' : 'border-b border-grey-100',
      )}
    >
      <BodyCell>
        <span className="truncate font-medium text-foreground" title={batch.dealName}>
          {batch.dealName}
        </span>
      </BodyCell>
      <BodyCell>{batch.batchNumber}</BodyCell>
      <BodyCell>{formatCurrency(batch.totalAmount, batch.currency)}</BodyCell>
      <BodyCell>
        <span className="text-neutral">
          {formatDate(batch.periodStart)} - {formatDate(batch.periodEnd)}
        </span>
      </BodyCell>
      <BodyCell>
        <span className="text-neutral">{formatDate(batch.createdAt)}</span>
      </BodyCell>
    </Link>
  );
}

function RunRow({
  run,
  isLast,
}: Readonly<{ run: PendingSettlementRun; isLast: boolean }>) {
  return (
    <Link
      href={ROUTES.SETTLEMENT.RUN_DETAIL(run.id)}
      className={cn(
        RUN_COLS,
        'bg-white transition-colors hover:bg-grey-50/60',
        isLast ? '' : 'border-b border-grey-100',
      )}
    >
      <BodyCell>
        <span className="truncate font-medium text-foreground" title={run.dealName}>
          {run.dealName}
        </span>
      </BodyCell>
      <BodyCell>{run.runLabel}</BodyCell>
      <BodyCell>
        <Badge
          size="sm"
          variant={SETTLEMENT_RUN_TYPE_TONE[run.runType]}
          className="whitespace-nowrap"
        >
          {SETTLEMENT_RUN_TYPE_LABEL[run.runType]}
        </Badge>
      </BodyCell>
      <BodyCell>{formatCurrency(run.totalAllocated, run.currency)}</BodyCell>
      <BodyCell>
        <span className="text-neutral">{formatDate(run.createdAt)}</span>
      </BodyCell>
    </Link>
  );
}

/* ─── Cells + skeletons ─────────────────────────────────────────────────── */

function HeaderCell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex items-center px-[10px] py-[14px]">
      <span className="text-[14px] font-bold leading-[20px] tracking-[0.028px] text-foreground">
        {children}
      </span>
    </div>
  );
}

function BodyCell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex h-[52px] items-center px-[10px] py-[14px] text-[14px] text-foreground">
      {children}
    </div>
  );
}

function BatchSkeleton() {
  return (
    <div className={cn(BATCH_COLS, 'border-b border-grey-100')}>
      <BodyCell><Skeleton className="h-4 w-36" /></BodyCell>
      <BodyCell><Skeleton className="h-4 w-24" /></BodyCell>
      <BodyCell><Skeleton className="h-4 w-24" /></BodyCell>
      <BodyCell><Skeleton className="h-4 w-32" /></BodyCell>
      <BodyCell><Skeleton className="h-4 w-20" /></BodyCell>
    </div>
  );
}

function RunSkeleton() {
  return (
    <div className={cn(RUN_COLS, 'border-b border-grey-100')}>
      <BodyCell><Skeleton className="h-4 w-36" /></BodyCell>
      <BodyCell><Skeleton className="h-4 w-12" /></BodyCell>
      <BodyCell><Skeleton className="h-5 w-20 rounded-[12px]" /></BodyCell>
      <BodyCell><Skeleton className="h-4 w-24" /></BodyCell>
      <BodyCell><Skeleton className="h-4 w-20" /></BodyCell>
    </div>
  );
}

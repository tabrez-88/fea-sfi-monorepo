'use client';

import { ArrowDown, ArrowUpDown, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';

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
  'grid grid-cols-[minmax(150px,1.3fr)_minmax(130px,1fr)_minmax(130px,1fr)_minmax(150px,1.1fr)_minmax(120px,0.9fr)]';
const RUN_COLS =
  'grid grid-cols-[minmax(150px,1.3fr)_minmax(80px,0.6fr)_minmax(110px,0.8fr)_minmax(150px,1.1fr)_minmax(130px,0.9fr)]';

const SKELETON_ROWS = ['s1', 's2', 's3'] as const;

type SortOrder = 'asc' | 'desc';
type BatchSortField = 'totalAmount' | 'periodStart' | 'createdAt';
type RunSortField = 'totalAllocated' | 'createdAt';

/**
 * MS-4 Screen 4.2: Pending Reviews (Action Queue).
 *
 * One global page for everything waiting on a human: revenue batches in
 * PENDING and settlement runs in PREVIEWED, both served by
 * `GET /dashboard/pending-reviews` in a single call.
 *
 * Rows deep-link into the deal context (batch detail / run detail) since
 * validating or finalizing happens on those screens. Per the Figma frames,
 * both queues live inside one page card, the click hint sits above each
 * table, and the money/date columns sort.
 */
export function PendingReviewsView() {
  const { data, isLoading, isError, refetch } = usePendingReviews();

  const [batchSort, setBatchSort] = useState<BatchSortField>('createdAt');
  const [batchOrder, setBatchOrder] = useState<SortOrder>('desc');
  const [runSort, setRunSort] = useState<RunSortField>('createdAt');
  const [runOrder, setRunOrder] = useState<SortOrder>('desc');

  const batches = useMemo(() => {
    const rows = [...(data?.revenueBatches ?? [])];
    const dir = batchOrder === 'asc' ? 1 : -1;
    return rows.sort((a, b) => {
      if (batchSort === 'totalAmount') return (a.totalAmount - b.totalAmount) * dir;
      if (batchSort === 'periodStart')
        return a.periodStart.localeCompare(b.periodStart) * dir;
      return a.createdAt.localeCompare(b.createdAt) * dir;
    });
  }, [data, batchSort, batchOrder]);

  const runs = useMemo(() => {
    const rows = [...(data?.settlementRuns ?? [])];
    const dir = runOrder === 'asc' ? 1 : -1;
    return rows.sort((a, b) => {
      if (runSort === 'totalAllocated')
        return (a.totalAllocated - b.totalAllocated) * dir;
      return a.createdAt.localeCompare(b.createdAt) * dir;
    });
  }, [data, runSort, runOrder]);

  function sortBatches(field: BatchSortField) {
    if (batchSort === field) setBatchOrder((p) => (p === 'asc' ? 'desc' : 'asc'));
    else {
      setBatchSort(field);
      setBatchOrder('desc');
    }
  }

  function sortRuns(field: RunSortField) {
    if (runSort === field) setRunOrder((p) => (p === 'asc' ? 'desc' : 'asc'));
    else {
      setRunSort(field);
      setRunOrder('desc');
    }
  }

  const allClear =
    !isLoading && !isError && batches.length === 0 && runs.length === 0;

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
      ) : (
        <div className="flex flex-col gap-4 rounded-[8px] border border-border bg-white p-4 sm:p-6">
          {allClear ? (
            <Card title="All Clear">
              <p className="flex items-center gap-2 text-[14px] leading-[20px] text-success">
                <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                All caught up! No items need your attention.
              </p>
            </Card>
          ) : (
            <>
              <Card
                title={`Revenue Batches Awaiting Validation${
                  isLoading ? '' : ` (${formatNumber(batches.length)})`
                }`}
                hint="Click a row to review and validate/reject"
              >
                {!isLoading && batches.length === 0 ? (
                  <p className="py-4 text-[14px] text-neutral">
                    No revenue batches pending.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-[720px]">
                      <div
                        className={cn(
                          BATCH_COLS,
                          'border-b border-grey-200 bg-grey-50',
                        )}
                      >
                        <HeaderCell>Deal</HeaderCell>
                        <HeaderCell>Batch #</HeaderCell>
                        <HeaderCell>
                          <SortButton
                            label="Amount"
                            active={batchSort === 'totalAmount'}
                            order={batchOrder}
                            onClick={() => sortBatches('totalAmount')}
                          />
                        </HeaderCell>
                        <HeaderCell>
                          <SortButton
                            label="Period"
                            active={batchSort === 'periodStart'}
                            order={batchOrder}
                            onClick={() => sortBatches('periodStart')}
                          />
                        </HeaderCell>
                        <HeaderCell>
                          <SortButton
                            label="Submitted"
                            active={batchSort === 'createdAt'}
                            order={batchOrder}
                            onClick={() => sortBatches('createdAt')}
                          />
                        </HeaderCell>
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
                    </div>
                  </div>
                )}
              </Card>

              <Card
                title={`Settlements Awaiting Finalization${
                  isLoading ? '' : ` (${formatNumber(runs.length)})`
                }`}
                hint="Click a row to review and finalize"
              >
                {!isLoading && runs.length === 0 ? (
                  <p className="py-4 text-[14px] text-neutral">
                    No settlements pending.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-[720px]">
                      <div
                        className={cn(
                          RUN_COLS,
                          'border-b border-grey-200 bg-grey-50',
                        )}
                      >
                        <HeaderCell>Deal</HeaderCell>
                        <HeaderCell>Run #</HeaderCell>
                        <HeaderCell>Type</HeaderCell>
                        <HeaderCell>
                          <SortButton
                            label="Total Allocated"
                            active={runSort === 'totalAllocated'}
                            order={runOrder}
                            onClick={() => sortRuns('totalAllocated')}
                          />
                        </HeaderCell>
                        <HeaderCell>
                          <SortButton
                            label="Previewed On"
                            active={runSort === 'createdAt'}
                            order={runOrder}
                            onClick={() => sortRuns('createdAt')}
                          />
                        </HeaderCell>
                      </div>
                      {isLoading
                        ? SKELETON_ROWS.map((k) => <RunSkeleton key={k} />)
                        : runs.map((r, idx) => (
                            <RunRow
                              key={r.id}
                              run={r}
                              isLast={idx === runs.length - 1}
                            />
                          ))}
                    </div>
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Sections + rows ───────────────────────────────────────────────────── */

function Card({
  title,
  hint,
  children,
}: Readonly<{ title: string; hint?: string; children: ReactNode }>) {
  return (
    <section className="flex flex-col gap-3 overflow-hidden rounded-[8px] border border-border bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-2 border-b border-border pb-3">
        <h2 className="text-[18px] font-bold leading-[24px] text-foreground">
          {title}
        </h2>
      </div>
      {/* Hint sits above the table per the Figma frame: it tells you what a
          row click does before you reach the rows. */}
      {hint && <p className="text-[13px] leading-[18px] text-neutral">{hint}</p>}
      {children}
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
        <span
          className="truncate border-b border-foreground/40 font-medium text-foreground"
          title={batch.dealName}
        >
          {batch.dealName}
        </span>
      </BodyCell>
      <BodyCell>{batch.batchNumber}</BodyCell>
      <BodyCell>{formatCurrency(batch.totalAmount, batch.currency)}</BodyCell>
      <BodyCell>
        <span className="truncate text-neutral">
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
        <span
          className="truncate border-b border-foreground/40 font-medium text-foreground"
          title={run.dealName}
        >
          {run.dealName}
        </span>
      </BodyCell>
      <BodyCell>{run.runLabel.replace('Run ', '')}</BodyCell>
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

function SortButton({
  label,
  active,
  order,
  onClick,
}: Readonly<{
  label: string;
  active: boolean;
  order: SortOrder;
  onClick: () => void;
}>) {
  const Icon = active ? ArrowDown : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-[14px] font-bold leading-[20px] tracking-[0.028px] text-foreground hover:text-foreground/80"
    >
      {label}
      <Icon
        className={cn(
          'size-3.5 shrink-0 transition-transform',
          active && order === 'asc' && 'rotate-180',
          active ? 'text-foreground' : 'text-neutral',
        )}
        aria-hidden
      />
    </button>
  );
}

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
      <BodyCell><Skeleton className="h-4 w-10" /></BodyCell>
      <BodyCell><Skeleton className="h-5 w-20 rounded-[12px]" /></BodyCell>
      <BodyCell><Skeleton className="h-4 w-24" /></BodyCell>
      <BodyCell><Skeleton className="h-4 w-20" /></BodyCell>
    </div>
  );
}

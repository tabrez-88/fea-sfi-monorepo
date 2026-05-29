'use client';

import Link from 'next/link';

import { RevenueBatchStatusChip, SettlementRunStatusChip } from '@/components/dashboard/StatusChip';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { usePendingReviews } from '@/hooks/dashboard/usePendingReviews';
import { cn } from '@/lib/utils';
import type { PendingRevenueBatch, PendingSettlementRun } from '@/types/dashboard.types';
import { formatCurrencyCompact } from '@/utils/format';

/**
 * Outer "Pending Reviews" card. Figma structure:
 *   - Title (Heading/Medium 24 Bold)
 *   - Horizontal divider
 *   - Nested "Revenue Batches Awaiting Validation" card (border-8 rounded)
 *     - Subtitle Bold 20
 *     - Divider line
 *     - Rows: 4 cells each separated by border-b `#D8D8D8`
 *   - Nested "Settlements Awaiting Finalization" card (same structure)
 *   - "View All Pending Reviews" link (Bold 16 underlined)
 */
export function PendingReviewsCard() {
  const { data, isLoading } = usePendingReviews();

  const revenueBatches = data?.revenueBatches ?? [];
  const settlementRuns = data?.settlementRuns ?? [];
  const hasData = revenueBatches.length > 0 || settlementRuns.length > 0;

  return (
    <section className="flex w-full flex-col gap-6 rounded-[8px] border border-border bg-white p-6">
      <h2 className="text-[24px] font-bold leading-[28px] tracking-[0.048px] text-foreground">
        Pending Reviews
      </h2>
      <div className="h-px w-full bg-border" />

      {!isLoading && !hasData ? (
        <span className="flex items-center justify-center gap-1 py-8 text-center text-[16px] leading-[20px] text-foreground">
          All caught up! <span className="font-bold">No items</span> need your attention.
        </span>
      ) : (
        <>
          <NestedCard title="Revenue Batches Awaiting Validation">
            <div className="overflow-x-auto">
              <RevenueBatchRows batches={revenueBatches} isLoading={isLoading} />
            </div>
          </NestedCard>

          <NestedCard title="Settlements Awaiting Finalization">
            <div className="overflow-x-auto">
              <SettlementRunRows runs={settlementRuns} isLoading={isLoading} />
            </div>
          </NestedCard>
        </>
      )}

      {!isLoading && hasData && (
        <Link
          href={ROUTES.PENDING_REVIEWS}
          className="self-start text-[16px] font-bold leading-[20px] tracking-[0.032px] text-foreground underline underline-offset-2"
        >
          View All Pending Reviews
        </Link>
      )}
    </section>
  );
}

/* ─── Sub-components ────────────────────────────────────────────────────── */

function NestedCard({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <div className="flex flex-col gap-6 rounded-[8px] border border-border bg-white p-6">
      <h3 className="text-[20px] font-bold leading-none tracking-[-0.4px] text-foreground">
        {title}
      </h3>
      <div className="h-px w-full bg-border" />
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function Cell({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <div className={cn('flex h-[48px] items-center px-[10px] py-[14px]', className)}>
      {children}
    </div>
  );
}

function dividerClass(isLast: boolean) {
  return isLast ? '' : 'border-b border-grey-100';
}

function RevenueBatchRow({
  batch,
  isLast,
}: Readonly<{ batch: PendingRevenueBatch; isLast: boolean }>) {
  return (
    <div className={cn('grid grid-cols-[250px_1fr_1fr_1fr] items-stretch', dividerClass(isLast))}>
      <Cell>
        <Link
          href={ROUTES.DEALS.DETAIL(batch.dealId)}
          className="truncate border-b border-foreground text-[18px] leading-[24px] tracking-[0.036px] text-foreground"
        >
          {batch.dealName}
        </Link>
      </Cell>
      <Cell>
        <span className="text-[18px] leading-[24px] tracking-[0.036px] text-foreground">
          {batch.batchNumber}
        </span>
      </Cell>
      <Cell>
        <span className="text-[16px] leading-[20px] tracking-[0.032px] text-foreground">
          {formatCurrencyCompact(batch.totalAmount)}
        </span>
      </Cell>
      <Cell>
        <RevenueBatchStatusChip status={batch.status} />
      </Cell>
    </div>
  );
}

function SettlementRunRow({
  run,
  isLast,
}: Readonly<{ run: PendingSettlementRun; isLast: boolean }>) {
  return (
    <div className={cn('grid grid-cols-[250px_1fr_1fr_1fr] items-stretch', dividerClass(isLast))}>
      <Cell>
        <Link
          href={ROUTES.DEALS.DETAIL(run.dealId)}
          className="truncate border-b border-foreground text-[18px] leading-[24px] tracking-[0.036px] text-foreground"
        >
          {run.dealName}
        </Link>
      </Cell>
      <Cell>
        <span className="text-[18px] leading-[24px] tracking-[0.036px] text-foreground">
          {run.runLabel}
        </span>
      </Cell>
      <Cell>
        <span className="text-[16px] leading-[20px] tracking-[0.032px] text-foreground">
          {formatCurrencyCompact(run.totalAllocated)}
        </span>
      </Cell>
      <Cell>
        <SettlementRunStatusChip status={run.status} />
      </Cell>
    </div>
  );
}

function RevenueBatchRows({
  batches,
  isLoading,
}: Readonly<{ batches: PendingRevenueBatch[]; isLoading: boolean }>) {
  if (isLoading) {
    return (
      <>
        <RowSkeleton />
        <RowSkeleton />
      </>
    );
  }
  if (batches.length === 0) {
    return <EmptyRow message="No batches pending validation." />;
  }
  return (
    <>
      {batches.map((batch, idx) => (
        <RevenueBatchRow key={batch.id} batch={batch} isLast={idx === batches.length - 1} />
      ))}
    </>
  );
}

function SettlementRunRows({
  runs,
  isLoading,
}: Readonly<{ runs: PendingSettlementRun[]; isLoading: boolean }>) {
  if (isLoading) return <RowSkeleton />;
  if (runs.length === 0) return <EmptyRow message="No runs pending finalization." />;
  return (
    <>
      {runs.map((run, idx) => (
        <SettlementRunRow key={run.id} run={run} isLast={idx === runs.length - 1} />
      ))}
    </>
  );
}

function RowSkeleton() {
  return (
    <div className="grid grid-cols-[250px_1fr_1fr_1fr] items-center border-b border-grey-100 py-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-6 w-24 rounded-full" />
    </div>
  );
}

function EmptyRow({ message }: Readonly<{ message: string }>) {
  return <p className="py-4 text-[14px] leading-[20px] text-neutral">{message}</p>;
}

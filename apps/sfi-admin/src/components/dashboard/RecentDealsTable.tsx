'use client';

import Link from 'next/link';

import { DealStatusBadge } from '@/components/deals/DealStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { formatNumber } from '@/utils/format';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';
import { useRecentDeals } from '@/hooks/deals/useRecentDeals';
import type { Deal } from '@/types/deal.types';

const GRID_COLS = 'grid grid-cols-[250px_1fr_1fr_1fr]';

/**
 * "Recent Deals" table. Figma: header row bg `#F2F2F2` with Bold 18px column
 * titles, rows separated by 1px `#D8D8D8` dividers, 4 columns (Deal Name |
 * Status | Participants | Updated At). Matches node 385:11501.
 */
export function RecentDealsTable() {
  const { data, isLoading } = useRecentDeals();
  const deals = data?.data ?? [];
  const isEmpty = !isLoading && deals.length === 0;

  return (
    <section className="flex w-full flex-col gap-6 rounded-[8px] border border-border bg-white p-6">
      <h2 className="text-[24px] font-bold leading-[28px] tracking-[0.048px] text-foreground">
        Recent Deals
      </h2>
      <div className="h-px w-full bg-border" />
      {isEmpty ? (
        <div className="flex flex-col items-center gap-5 py-10 text-center border border-dashed rounded-md">
          <span className="text-center text-[16px] leading-[20px] text-foreground flex gap-1 items-center justify-center">
            No deals yet. <span className="font-bold">Create your first deal</span> to get started.
          </span>
          <Link
            href={ROUTES.DEALS.CREATE}
            className="inline-flex h-[52px] items-center rounded-[8px] bg-foreground px-7 text-[14px] font-medium tracking-[0.7px] text-background"
          >
            Create New Deal
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Header row */}
            <div className={cn(GRID_COLS, 'bg-grey-50 border-b border-grey-200')}>
              <HeaderCell>Deal Name</HeaderCell>
              <HeaderCell>Status</HeaderCell>
              <HeaderCell>Participants</HeaderCell>
              <HeaderCell>Updated At</HeaderCell>
            </div>

            {/* Body rows */}
            <DealRows deals={deals} isLoading={isLoading} />
          </div>
        </div>
      )}
      {!isEmpty && (
        <Link
          href={ROUTES.DEALS.LIST}
          className="self-start text-[16px] font-bold leading-[20px] tracking-[0.032px] text-foreground underline underline-offset-2"
        >
          View All Deals
        </Link>
      )}
    </section>
  );
}

/* ─── Sub-components ────────────────────────────────────────────────────── */

function DealRows({ deals, isLoading }: Readonly<{ deals: Deal[]; isLoading: boolean }>) {
  if (isLoading) {
    return (
      <>
        {['s1', 's2', 's3', 's4', 's5'].map((k) => (
          <RowSkeleton key={k} />
        ))}
      </>
    );
  }
  return (
    <>
      {deals.map((deal, idx) => (
        <DealRow key={deal.id} deal={deal} isLast={idx === deals.length - 1} />
      ))}
    </>
  );
}

function HeaderCell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex items-center px-[10px] py-[14px]">
      <span className="text-[18px] font-bold leading-[24px] tracking-[0.036px] text-foreground">
        {children}
      </span>
    </div>
  );
}

function BodyCell({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <div className={cn('flex h-[48px] items-center px-[10px] py-[14px]', className)}>
      {children}
    </div>
  );
}

function DealRow({ deal, isLast }: Readonly<{ deal: Deal; isLast: boolean }>) {
  return (
    <div className={cn(GRID_COLS, 'bg-white', isLast ? '' : 'border-b border-grey-100')}>
      <BodyCell>
        <Link
          href={ROUTES.DEALS.DETAIL(deal.id)}
          className="truncate border-b border-foreground text-[18px] leading-[24px] tracking-[0.036px] text-foreground"
        >
          {deal.name}
        </Link>
      </BodyCell>
      <BodyCell>
        <DealStatusBadge status={deal.status} />
      </BodyCell>
      <BodyCell>
        <span className="text-[16px] leading-[20px] tracking-[0.032px] text-foreground">
          {formatNumber(deal.participantsCount ?? 0)}
        </span>
      </BodyCell>
      <BodyCell>
        <span className="text-[16px] leading-[20px] tracking-[0.032px] text-foreground">
          {formatDate(deal.updatedAt)}
        </span>
      </BodyCell>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className={cn(GRID_COLS, 'border-b border-grey-100')}>
      <BodyCell>
        <Skeleton className="h-4 w-40" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-6 w-20 rounded-full" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-4 w-8" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-4 w-24" />
      </BodyCell>
    </div>
  );
}

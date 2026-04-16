'use client';

import type { DealsStatusFilter } from '@/components/deals/DealsFilterBar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { DealsCountsResponse } from '@/types/deal.types';
import { formatNumber } from '@/utils/format';

type DealsListStatCardsProps = Readonly<{
  counts?: DealsCountsResponse | undefined;
  isLoading: boolean;
  activeFilter: DealsStatusFilter;
  onFilterChange: (next: DealsStatusFilter) => void;
}>;

type StatCell = Readonly<{
  label: string;
  filter: DealsStatusFilter;
  value: number | undefined;
}>;

/**
 * 4-card stat row at the top of the Deals List — All / Active / Draft /
 * Closed with live counts. Each card doubles as a status filter shortcut; the
 * currently-selected filter gets a foreground border to show what the table
 * is scoped to. On mobile the row wraps to a 2×2 grid, matching the mobile
 * Figma frame.
 */
export function DealsListStatCards({
  counts,
  isLoading,
  activeFilter,
  onFilterChange,
}: DealsListStatCardsProps) {
  const cells: ReadonlyArray<StatCell> = [
    { label: 'All', filter: 'ALL', value: counts?.all },
    { label: 'Active', filter: 'ACTIVE', value: counts?.active },
    { label: 'Draft', filter: 'DRAFT', value: counts?.draft },
    { label: 'Closed', filter: 'CLOSED', value: counts?.closed },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cells.map((cell) => {
        const isActive = activeFilter === cell.filter;
        return (
          <button
            key={cell.filter}
            type="button"
            onClick={() => onFilterChange(cell.filter)}
            aria-pressed={isActive}
            className={cn(
              'flex min-h-[112px] flex-col justify-between gap-3 rounded-[8px] border bg-white p-5 text-left transition-colors sm:min-h-[128px] sm:p-6',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20',
              isActive
                ? 'border-foreground shadow-sm'
                : 'border-border hover:border-foreground/40',
            )}
          >
            <span className="text-[14px] font-medium text-neutral">
              {cell.label}
            </span>
            {isLoading || cell.value === undefined ? (
              <Skeleton className="h-[40px] w-16" />
            ) : (
              <span className="text-[40px] font-semibold leading-[44px] tracking-[-0.8px] text-foreground sm:text-[48px] sm:leading-[52px] sm:tracking-[-0.96px]">
                {formatNumber(cell.value)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

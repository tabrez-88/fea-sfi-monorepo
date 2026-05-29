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
 * 4-card stat row at the top of the Deals List: All, Active, Draft,
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
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cells.map((cell) => {
        const isActive = activeFilter === cell.filter;
        return (
          <button
            key={cell.filter}
            type="button"
            onClick={() => onFilterChange(cell.filter)}
            aria-pressed={isActive}
            className={cn(
              'group flex min-h-[88px] flex-col justify-between gap-2 rounded-[8px] border border-border bg-white p-4 text-left text-foreground transition-colors sm:min-h-[96px]',
              'hover:border-foreground hover:bg-foreground hover:text-background focus-visible:border-foreground focus-visible:bg-foreground focus-visible:text-background focus-visible:outline-none',
            )}
          >
            <span className="text-[14px] font-medium leading-[20px] text-neutral transition-colors group-hover:text-background/80 group-focus-visible:text-background/80">
              {cell.label}
            </span>
            {isLoading || cell.value === undefined ? (
              <Skeleton className="h-[32px] w-14 group-hover:bg-background/20 group-focus-visible:bg-background/20" />
            ) : (
              <span className="text-[28px] font-semibold leading-[32px] tracking-[-0.56px]">
                {formatNumber(cell.value)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

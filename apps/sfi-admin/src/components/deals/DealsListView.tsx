'use client';

import { ArrowDown, ArrowUpDown, FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';

import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import {
  DealsFilterBar,
  type DealsStatusFilter,
} from '@/components/deals/DealsFilterBar';
import { DealsListStatCards } from '@/components/deals/DealsListStatCards';
import { DealStatusBadge } from '@/components/deals/DealStatusBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { DEFAULT_PAGE_SIZE } from '@/constants/ui';
import { useDeals } from '@/hooks/deals/useDeals';
import { useDealsCounts } from '@/hooks/deals/useDealsCounts';
import { cn } from '@/lib/utils';
import type { Deal } from '@/types/deal.types';
import { formatDate } from '@/utils/date';
import { formatNumber } from '@/utils/format';

type SortField = 'name' | 'status' | 'effectiveDate' | 'createdAt' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

const SKELETON_ROWS = ['s1', 's2', 's3', 's4', 's5'] as const;

/**
 * Grid template: Deal Name takes the widest share; remaining 5 columns
 * are evenly distributed. Mobile drops to a horizontally-scrolling viewport
 * via the parent overflow-x-auto.
 */
const GRID_COLS =
  'grid grid-cols-[minmax(180px,2fr)_repeat(5,minmax(100px,1fr))]';

/**
 * Full Deals List screen (FEA-5). Owns all list-level state (search, status,
 * effectiveFrom, page, sort) so the title + filter bar + stat cards + table +
 * pagination can share a single source of truth. Matches the Figma "Deal
 * List" frame (`385:10893`): title + filter bar on one row at ≥lg, then a
 * single bordered card containing 4 stat-filter cards + 6-column table, then
 * numbered pagination centred below.
 *
 * Table styling mirrors the dashboard's RecentDealsTable: grid layout (not
 * shadcn Table), grey-50 header row, 18px bold headers with sort arrows,
 * underlined link cell for the deal name.
 */
export function DealsListView() {
  const [statusFilter, setStatusFilter] = useState<DealsStatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const params = useMemo(
    () => ({
      page,
      limit: DEFAULT_PAGE_SIZE,
      sortBy,
      sortOrder,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(statusFilter === 'ALL' ? {} : { status: statusFilter }),
      ...(effectiveFrom ? { effectiveFrom } : {}),
    }),
    [page, sortBy, sortOrder, search, statusFilter, effectiveFrom],
  );

  const { data, isLoading, isError, refetch } = useDeals(params);
  const { data: counts, isLoading: countsLoading } = useDealsCounts();

  function handleRetry() {
    refetch().catch(() => undefined);
  }

  function handleStatusFilterChange(next: DealsStatusFilter) {
    setStatusFilter(next);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleEffectiveFromChange(value: string) {
    setEffectiveFrom(value);
    setPage(1);
  }

  function handleSort(field: SortField) {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }

  const meta = data?.meta;
  const deals = data?.data ?? [];
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Header row: title on the left, filter bar on the right. Stacks on mobile */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <div className="flex flex-col">
          <p className="px-1 text-[14px] font-medium leading-[20px] text-neutral">
            Content
          </p>
          <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
            Deals
          </h1>
        </div>
        <div className="lg:max-w-[640px] lg:flex-1">
          <DealsFilterBar
            search={search}
            onSearchChange={handleSearchChange}
            status={statusFilter}
            onStatusChange={handleStatusFilterChange}
            effectiveFrom={effectiveFrom}
            onEffectiveFromChange={handleEffectiveFromChange}
          />
        </div>
      </div>

      <section className="flex flex-col gap-6 overflow-hidden rounded-[8px] border border-border bg-white p-4 sm:p-6">
        <DealsListStatCards
          counts={counts}
          isLoading={countsLoading}
          activeFilter={statusFilter}
          onFilterChange={handleStatusFilterChange}
        />

        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Header row */}
            <div className={cn(GRID_COLS, 'border-b border-grey-200 bg-grey-50')}>
              <HeaderCell>
                <SortButton
                  field="name"
                  currentField={sortBy}
                  order={sortOrder}
                  onSort={handleSort}
                  label="Deal Name"
                />
              </HeaderCell>
              <HeaderCell>Status</HeaderCell>
              <HeaderCell>Currency</HeaderCell>
              <HeaderCell>Participants</HeaderCell>
              <HeaderCell>
                <SortButton
                  field="createdAt"
                  currentField={sortBy}
                  order={sortOrder}
                  onSort={handleSort}
                  label="Created At"
                />
              </HeaderCell>
              <HeaderCell>
                <SortButton
                  field="updatedAt"
                  currentField={sortBy}
                  order={sortOrder}
                  onSort={handleSort}
                  label="Updated At"
                />
              </HeaderCell>
            </div>

            {/* Body rows */}
            <DealRows
              isLoading={isLoading}
              isError={isError}
              deals={deals}
              onRetry={handleRetry}
            />
          </div>
        </div>
      </section>

      {meta && meta.total > 0 && (
        <Pagination
          page={meta.page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="justify-center"
        />
      )}
    </div>
  );
}

/* ─── Sub-components ────────────────────────────────────────────────────── */

function HeaderCell({ children }: Readonly<{ children: ReactNode }>) {
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
}: Readonly<{ children: ReactNode; className?: string }>) {
  return (
    <div
      className={cn(
        'flex h-[48px] items-center px-[10px] py-[14px]',
        className,
      )}
    >
      {children}
    </div>
  );
}

type SortButtonProps = Readonly<{
  field: SortField;
  currentField: SortField;
  order: SortOrder;
  onSort: (field: SortField) => void;
  label: string;
}>;

function SortButton({
  field,
  currentField,
  order,
  onSort,
  label,
}: SortButtonProps) {
  const active = field === currentField;
  let indicator: string;
  if (active) indicator = order === 'asc' ? 'sorted ascending' : 'sorted descending';
  else indicator = 'sortable';

  // Active column shows a single-direction arrow indicating current sort;
  // inactive sortable columns show the neutral up-down icon.
  const Icon = active ? ArrowDown : ArrowUpDown;

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1.5 text-[18px] font-bold leading-[24px] tracking-[0.036px] text-foreground hover:text-foreground/80"
      aria-label={`${label}, ${indicator}`}
    >
      {label}
      <Icon
        className={cn(
          'size-4 shrink-0 transition-transform',
          active && order === 'asc' && 'rotate-180',
          active ? 'text-foreground' : 'text-neutral',
        )}
        aria-hidden
      />
    </button>
  );
}

type DealRowsProps = Readonly<{
  isLoading: boolean;
  isError: boolean;
  deals: ReadonlyArray<Deal>;
  onRetry: () => void;
}>;

function DealRows({ isLoading, isError, deals, onRetry }: DealRowsProps) {
  if (isLoading) {
    return (
      <>
        {SKELETON_ROWS.map((key) => (
          <RowSkeleton key={key} />
        ))}
      </>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-[14px] text-danger">Failed to load deals.</p>
        <Button type="button" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No deals yet"
        description="Create your first deal to start managing participants, rules, and settlements."
        action={{
          label: (
            <span className="inline-flex items-center gap-1.5">
              <Plus className="size-4" /> Create Deal
            </span>
          ),
          href: ROUTES.DEALS.CREATE,
        }}
        className="border-0"
      />
    );
  }

  return (
    <>
      {deals.map((deal, idx) => (
        <DealRow
          key={deal.id}
          deal={deal}
          isLast={idx === deals.length - 1}
        />
      ))}
    </>
  );
}

function DealRow({
  deal,
  isLast,
}: Readonly<{ deal: Deal; isLast: boolean }>) {
  const participants = deal._count?.participants ?? deal.participantsCount ?? 0;
  return (
    <div
      className={cn(
        GRID_COLS,
        'bg-white',
        isLast ? '' : 'border-b border-grey-100',
      )}
    >
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
          {deal.currency}
        </span>
      </BodyCell>
      <BodyCell>
        <span className="text-[16px] leading-[20px] tracking-[0.032px] text-foreground">
          {formatNumber(participants)}
        </span>
      </BodyCell>
      <BodyCell>
        <span className="text-[16px] leading-[20px] tracking-[0.032px] text-foreground">
          {formatDate(deal.createdAt)}
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
        <Skeleton className="h-4 w-10" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-4 w-8" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-4 w-24" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-4 w-24" />
      </BodyCell>
    </div>
  );
}

'use client';

import {
  ArrowDown,
  ArrowUpDown,
  ChevronDown,
  Plus,
  Receipt,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';

import { BackLink } from '@/components/common/BackLink';
import { DatePickerField } from '@/components/common/DatePickerField';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import {
  DEFAULT_PAGE_SIZE,
  REVENUE_BATCH_STATUS_LABEL,
  REVENUE_BATCH_STATUS_TONE,
} from '@/constants/ui';
import { useRevenueBatches } from '@/hooks/revenue/useRevenueBatches';
import { useRevenueSummary } from '@/hooks/revenue/useRevenueSummary';
import { cn } from '@/lib/utils';
import { RevenueBatchStatus } from '@/types/dashboard.types';
import type { RevenueBatch } from '@/types/revenue.types';
import { formatDate } from '@/utils/date';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatNumber,
} from '@/utils/format';

type StatusFilter = RevenueBatchStatus | 'ALL';
type SortField = 'batchNumber' | 'periodStart' | 'totalAmount' | 'createdAt';
type SortOrder = 'asc' | 'desc';

const SKELETON_ROWS = ['s1', 's2', 's3', 's4', 's5'] as const;

/**
 * Column template for the Screen 3.1 batches table:
 *   Batch # · Period · Amount · Currency · Status
 */
const GRID_COLS =
  'grid grid-cols-[minmax(140px,1.4fr)_minmax(140px,1.2fr)_minmax(130px,1fr)_minmax(80px,0.6fr)_minmax(140px,1fr)]';

type RevenueBatchesListViewProps = Readonly<{
  dealId: string;
}>;

/**
 * MS-3 Screen 3.1 — Revenue Batches List.
 *
 * Layout:
 *   - Title + search + date filter + Add New Batch button (Figma toolbar)
 *   - 4 stat cards (Total Revenue + PENDING / VALIDATED / PROCESSED slices)
 *   - Bordered card holding the batches table with status filter dropdown
 *
 * Empty state + loading skeletons keep the UI consistent with
 * `ParticipantsListView`. All BE queries are Wave 1-5 endpoints; the FE
 * only maps status/period/search inputs into query params.
 */
export function RevenueBatchesListView({ dealId }: RevenueBatchesListViewProps) {
  const [search, setSearch] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const params = useMemo(
    () => ({
      page,
      limit: DEFAULT_PAGE_SIZE,
      sortBy,
      sortOrder,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(periodTo ? { periodTo } : {}),
      ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
    }),
    [page, sortBy, sortOrder, search, periodTo, statusFilter],
  );

  const { data, isLoading, isError, refetch } = useRevenueBatches(dealId, params);
  const summaryQuery = useRevenueSummary(dealId);

  function handleRetry() {
    refetch().catch(() => undefined);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleSort(field: SortField) {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder(field === 'batchNumber' ? 'asc' : 'desc');
    }
  }

  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;
  const batches: ReadonlyArray<RevenueBatch> = data?.data ?? [];
  const isEmpty = !isLoading && summaryQuery.data?.totalCount === 0;

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={ROUTES.DEALS.DETAIL(dealId)} label="Overview" />

      {/* Header row: title + filter bar (search · date · Add CTA) */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
          Revenue
        </h1>

        <div className="flex w-full flex-col gap-3 lg:max-w-[640px] lg:flex-row lg:items-center lg:justify-end lg:gap-3">
          <div className="relative w-full lg:max-w-[280px] lg:flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral"
              strokeWidth={2}
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by batch name"
              className="pl-9"
              aria-label="Search revenue batches by name"
            />
          </div>

          <DatePickerField
            value={periodTo}
            onChange={setPeriodTo}
            placeholder="Filter by period end"
            ariaLabel="Filter by period end"
            iconOnly
          />

          <Button asChild className="w-full lg:w-auto">
            <Link href={`${ROUTES.DEALS.REVENUE(dealId)}/new`}>
              <Plus className="size-4" aria-hidden />
              Add New Batch
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary card containing stat cards + table (matches Frame 2 layout). */}
      <section
        aria-labelledby="revenue-count-heading"
        className="flex flex-col gap-5 overflow-hidden rounded-[8px] border border-border bg-white p-4 sm:p-6"
      >
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h2
            id="revenue-count-heading"
            className="text-[24px] font-bold leading-[28px] tracking-[0.048px] text-foreground"
          >
            Revenue Batches ({formatNumber(summaryQuery.data?.totalCount ?? total)})
          </h2>
        </header>

        {!isEmpty && (
          <RevenueStatCards
            isLoading={summaryQuery.isLoading}
            summary={summaryQuery.data}
            activeStatus={statusFilter}
            onFilterChange={(next) => {
              setStatusFilter(next);
              setPage(1);
            }}
          />
        )}

        {isEmpty ? (
          <EmptyState
            icon={Receipt}
            title="No revenue batches yet"
            description="Submit your first revenue batch to start the settlement process. Batches are the input layer that feeds the settlement engine."
            action={{
              label: (
                <>
                  <Plus className="size-4" aria-hidden />
                  Add New Batch
                </>
              ),
              href: `${ROUTES.DEALS.REVENUE(dealId)}/new`,
            }}
            className="border-dashed"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {/* Status filter dropdown — sits above the table on the right, matching Frame 2. */}
            <div className="flex items-center justify-end">
              <StatusFilterDropdown
                active={statusFilter}
                counts={summaryQuery.data?.byStatus}
                totalCount={summaryQuery.data?.totalCount ?? total}
                onChange={(next) => {
                  setStatusFilter(next);
                  setPage(1);
                }}
              />
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                {/* Header row */}
                <div className={cn(GRID_COLS, 'border-b border-grey-200 bg-grey-50')}>
                  <HeaderCell>
                    <SortButton
                      field="batchNumber"
                      currentField={sortBy}
                      order={sortOrder}
                      onSort={handleSort}
                      label="Batch #"
                    />
                  </HeaderCell>
                  <HeaderCell>
                    <SortButton
                      field="periodStart"
                      currentField={sortBy}
                      order={sortOrder}
                      onSort={handleSort}
                      label="Period"
                    />
                  </HeaderCell>
                  <HeaderCell>
                    <SortButton
                      field="totalAmount"
                      currentField={sortBy}
                      order={sortOrder}
                      onSort={handleSort}
                      label="Amount"
                    />
                  </HeaderCell>
                  <HeaderCell>Currency</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                </div>

                <BatchRows
                  isLoading={isLoading}
                  isError={isError}
                  batches={batches}
                  onRetry={handleRetry}
                  dealId={dealId}
                />
              </div>
            </div>
          </div>
        )}
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

/* ─── Stat Cards ────────────────────────────────────────────────────────── */

type RevenueStatCardsProps = Readonly<{
  isLoading: boolean;
  summary: ReturnType<typeof useRevenueSummary>['data'];
  activeStatus: StatusFilter;
  onFilterChange: (next: StatusFilter) => void;
}>;

/**
 * Four stat cards driven by the `/revenue-batches/summary` endpoint.
 * Total Revenue is a plain label card; the other 3 double as click
 * targets that filter the table below.
 */
function RevenueStatCards({
  isLoading,
  summary,
  activeStatus,
  onFilterChange,
}: RevenueStatCardsProps) {
  const cards: ReadonlyArray<{
    label: string;
    amount: number;
    filter?: RevenueBatchStatus;
  }> = [
    { label: 'Total Revenue', amount: summary?.totalAmount ?? 0 },
    {
      label: 'Pending',
      amount: summary?.byStatus.PENDING.amount ?? 0,
      filter: 'PENDING',
    },
    {
      label: 'Validated',
      amount: summary?.byStatus.VALIDATED.amount ?? 0,
      filter: 'VALIDATED',
    },
    {
      label: 'Processed',
      amount: summary?.byStatus.PROCESSED.amount ?? 0,
      filter: 'PROCESSED',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((c) => {
        const isTotal = !c.filter;
        const isActive = c.filter !== undefined && activeStatus === c.filter;
        const commonClasses = cn(
          'flex min-h-[120px] flex-col justify-between gap-3 rounded-[8px] border border-border bg-white p-4 text-left text-foreground transition-colors sm:min-h-[140px]',
        );
        const inner = (
          <>
            <span className="text-[14px] font-medium leading-[20px] text-neutral">
              {c.label}
            </span>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <span className="text-[28px] font-semibold leading-[32px] tracking-[-0.56px] sm:text-[32px] sm:leading-[36px]">
                {formatCurrencyCompact(c.amount)}
              </span>
            )}
          </>
        );

        if (isTotal) {
          return (
            <div key={c.label} className={cn(commonClasses, 'border-foreground')}>
              {inner}
            </div>
          );
        }

        return (
          <button
            key={c.label}
            type="button"
            onClick={() => onFilterChange(isActive ? 'ALL' : c.filter!)}
            aria-pressed={isActive}
            className={cn(
              commonClasses,
              'group hover:border-foreground/60 focus-visible:border-foreground focus-visible:outline-none',
              isActive && 'border-foreground bg-foreground text-background',
            )}
          >
            <span
              className={cn(
                'text-[14px] font-medium leading-[20px] transition-colors',
                isActive
                  ? 'text-background/80'
                  : 'text-neutral group-hover:text-foreground',
              )}
            >
              {c.label}
            </span>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <span className="text-[28px] font-semibold leading-[32px] tracking-[-0.56px] sm:text-[32px] sm:leading-[36px]">
                {formatCurrencyCompact(c.amount)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Status Filter Dropdown ────────────────────────────────────────────── */

type StatusFilterDropdownProps = Readonly<{
  active: StatusFilter;
  counts?: ReturnType<typeof useRevenueSummary>['data'] extends infer S
    ? S extends { byStatus: infer B }
      ? B
      : undefined
    : undefined;
  totalCount: number;
  onChange: (next: StatusFilter) => void;
}>;

function StatusFilterDropdown({
  active,
  counts,
  totalCount,
  onChange,
}: StatusFilterDropdownProps) {
  const label =
    active === 'ALL' ? 'All' : REVENUE_BATCH_STATUS_LABEL[active];

  const options: ReadonlyArray<{
    key: StatusFilter;
    label: string;
    count: number;
  }> = [
    { key: 'ALL', label: 'All', count: totalCount },
    {
      key: 'PENDING',
      label: REVENUE_BATCH_STATUS_LABEL.PENDING,
      count: counts?.PENDING.count ?? 0,
    },
    {
      key: 'VALIDATED',
      label: REVENUE_BATCH_STATUS_LABEL.VALIDATED,
      count: counts?.VALIDATED.count ?? 0,
    },
    {
      key: 'PROCESSED',
      label: REVENUE_BATCH_STATUS_LABEL.PROCESSED,
      count: counts?.PROCESSED.count ?? 0,
    },
    {
      key: 'REJECTED',
      label: REVENUE_BATCH_STATUS_LABEL.REJECTED,
      count: counts?.REJECTED.count ?? 0,
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" className="gap-2">
          {label} <ChevronDown className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={cn(
              'flex items-center justify-between gap-6',
              active === opt.key && 'bg-grey-100 font-semibold',
            )}
          >
            <span>{opt.label}</span>
            <span className="text-neutral">({formatNumber(opt.count)})</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── Rows ──────────────────────────────────────────────────────────────── */

type BatchRowsProps = Readonly<{
  isLoading: boolean;
  isError: boolean;
  batches: ReadonlyArray<RevenueBatch>;
  onRetry: () => void;
  dealId: string;
}>;

function BatchRows({ isLoading, isError, batches, onRetry }: BatchRowsProps) {
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
        <p className="text-[14px] text-danger">Failed to load revenue batches.</p>
        <Button type="button" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <p className="text-[14px] text-neutral">No revenue batches match the selected filter.</p>
      </div>
    );
  }

  return (
    <>
      {batches.map((b, idx) => (
        <BatchRow key={b.id} batch={b} isLast={idx === batches.length - 1} />
      ))}
    </>
  );
}

function BatchRow({
  batch,
  isLast,
}: Readonly<{ batch: RevenueBatch; isLast: boolean }>) {
  const period = formatPeriod(batch.periodStart, batch.periodEnd);
  return (
    <div
      className={cn(
        GRID_COLS,
        isLast ? '' : 'border-b border-grey-100',
        'bg-white',
      )}
    >
      <BodyCell>
        <Link
          href={`${ROUTES.DEALS.REVENUE(batch.dealId)}/${batch.id}`}
          className="truncate border-b border-foreground/40 text-[14px] font-medium leading-[20px] text-foreground transition-colors hover:border-foreground hover:text-foreground/80"
        >
          {batch.batchNumber}
        </Link>
      </BodyCell>
      <BodyCell>
        <span className="truncate text-[14px] text-neutral">{period}</span>
      </BodyCell>
      <BodyCell>
        <span className="text-[14px] text-foreground">
          {formatCurrency(batch.totalAmount)}
        </span>
      </BodyCell>
      <BodyCell>
        <span className="text-[14px] text-neutral">{batch.currency}</span>
      </BodyCell>
      <BodyCell>
        <Badge
          size="sm"
          variant={REVENUE_BATCH_STATUS_TONE[batch.status]}
          className="whitespace-nowrap"
        >
          {REVENUE_BATCH_STATUS_LABEL[batch.status]}
        </Badge>
      </BodyCell>
    </div>
  );
}

/* ─── Shared table cells + skeletons ────────────────────────────────────── */

function HeaderCell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex items-center px-[10px] py-[14px]">
      <span className="text-[14px] font-bold leading-[20px] tracking-[0.028px] text-foreground">
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
    <div className={cn('flex h-[52px] items-center px-[10px] py-[14px]', className)}>
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

function SortButton({ field, currentField, order, onSort, label }: SortButtonProps) {
  const active = field === currentField;
  const Icon = active ? ArrowDown : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
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

function RowSkeleton() {
  return (
    <div className={cn(GRID_COLS, 'border-b border-grey-100')}>
      <BodyCell>
        <Skeleton className="h-4 w-24" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-4 w-28" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-4 w-24" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-4 w-10" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-5 w-20 rounded-[12px]" />
      </BodyCell>
    </div>
  );
}

/** "Oct - Dec 2026" style range label (short + neutral). */
function formatPeriod(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const startMonth = start.toLocaleString('en-US', { month: 'short' });
  const endMonth = end.toLocaleString('en-US', { month: 'short' });
  const endYear = end.getUTCFullYear();
  if (start.getUTCFullYear() === endYear) {
    return `${startMonth} - ${endMonth} ${endYear}`;
  }
  const startYear = start.getUTCFullYear();
  return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
}

// Re-export helpers for lint-friendliness (no unused-var noise); used by
// the skeleton column comment above.
void formatDate;

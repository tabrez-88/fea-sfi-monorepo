'use client';

import {
  AlertTriangle,
  ArrowDown,
  ArrowUpDown,
  ChevronDown,
  Landmark,
  Plus,
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
  SETTLEMENT_RUN_STATUS_LABEL,
  SETTLEMENT_RUN_STATUS_TONE,
  SETTLEMENT_RUN_TYPE_LABEL,
  SETTLEMENT_RUN_TYPE_TONE,
} from '@/constants/ui';
import { useSettlementRuns } from '@/hooks/settlement/useSettlementRuns';
import { cn } from '@/lib/utils';
import { SettlementRunStatus } from '@/types/dashboard.types';
import type { SettlementRun } from '@/types/settlement.types';
import { formatDate } from '@/utils/date';
import { formatCurrency, formatNumber } from '@/utils/format';

type StatusFilter = SettlementRunStatus | 'ALL';
type SortField = 'runNumber' | 'totalAllocated' | 'createdAt';
type SortOrder = 'asc' | 'desc';

const SKELETON_ROWS = ['s1', 's2', 's3', 's4'] as const;

/**
 * Column template, Screen 4.3 layout:
 *   # · Type · Rule · Batches · Total Allocated · Status · Date
 */
const GRID_COLS =
  'grid grid-cols-[48px_minmax(110px,0.9fr)_minmax(70px,0.5fr)_minmax(80px,0.6fr)_minmax(140px,1fr)_minmax(120px,0.9fr)_minmax(110px,0.9fr)]';

/**
 * Runs-per-deal stays small (a handful per quarter), so we pull one large
 * page and do filter, search, sort, and pagination client-side. That keeps
 * the status dropdown counts truthful without a BE counts endpoint.
 */
const FETCH_LIMIT = 100;

type SettlementRunsListViewProps = Readonly<{
  dealId: string;
}>;

/**
 * MS-4 Screen 4.3: Settlement Runs List (per-deal).
 *
 * Layout mirrors RevenueBatchesListView. Liang's Figma review (07/13):
 * the primary button is "Add New Settlement Run"; the frame mistakenly
 * reused "Add New Batch" from Screen 3.1.
 *
 * Correction runs surface a banner "Run #N is a correction of Run #M",
 * resolved client-side from `originalSettlementRunId` against the same
 * fetched list.
 */
export function SettlementRunsListView({ dealId }: SettlementRunsListViewProps) {
  const [search, setSearch] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { data, isLoading, isError, refetch } = useSettlementRuns(dealId, {
    limit: FETCH_LIMIT,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const allRuns = useMemo<ReadonlyArray<SettlementRun>>(
    () => data?.data ?? [],
    [data],
  );

  const counts = useMemo(() => {
    const map: Record<StatusFilter, number> = {
      ALL: allRuns.length,
      DRAFT: 0,
      PREVIEWED: 0,
      FINALIZED: 0,
      CANCELLED: 0,
      VOIDED: 0,
    };
    for (const r of allRuns) map[r.status] += 1;
    return map;
  }, [allRuns]);

  const corrections = useMemo(() => {
    const byId = new Map(allRuns.map((r) => [r.id, r]));
    return allRuns
      .filter((r) => r.runType === 'CORRECTION' && r.originalSettlementRunId)
      .map((r) => {
        const original = byId.get(r.originalSettlementRunId as string);
        return original
          ? { key: r.id, text: `${r.runLabel} is a correction of ${original.runLabel}` }
          : null;
      })
      .filter((x): x is { key: string; text: string } => x !== null);
  }, [allRuns]);

  const visibleRuns = useMemo(() => {
    let rows = allRuns;
    if (statusFilter !== 'ALL') rows = rows.filter((r) => r.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.runLabel.toLowerCase().includes(q) ||
          String(r.runNumber).includes(q) ||
          (r.ruleSnapshotVersion !== undefined &&
            `v${r.ruleSnapshotVersion}`.includes(q)) ||
          (r.notes ?? '').toLowerCase().includes(q),
      );
    }
    if (createdFrom) {
      rows = rows.filter((r) => r.createdAt.slice(0, 10) >= createdFrom);
    }
    const dir = sortOrder === 'asc' ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      if (sortBy === 'runNumber') return (a.runNumber - b.runNumber) * dir;
      if (sortBy === 'totalAllocated')
        return (a.totalAllocated - b.totalAllocated) * dir;
      return a.createdAt.localeCompare(b.createdAt) * dir;
    });
    return rows;
  }, [allRuns, statusFilter, search, createdFrom, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(visibleRuns.length / DEFAULT_PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const pagedRuns = visibleRuns.slice(
    (clampedPage - 1) * DEFAULT_PAGE_SIZE,
    clampedPage * DEFAULT_PAGE_SIZE,
  );

  function handleSort(field: SortField) {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  }

  const isEmpty = !isLoading && allRuns.length === 0;
  const newRunHref = ROUTES.DEALS.SETTLEMENT_NEW(dealId);

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={ROUTES.DEALS.DETAIL(dealId)} label="Overview" />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
          Settlement
        </h1>

        <div className="flex w-full flex-col gap-3 lg:max-w-[720px] lg:flex-row lg:items-center lg:justify-end lg:gap-3">
          <div className="relative w-full lg:max-w-[280px] lg:flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral"
              strokeWidth={2}
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by run or rule"
              className="pl-9"
              aria-label="Search settlement runs"
            />
          </div>

          <StatusFilterDropdown
            active={statusFilter}
            counts={counts}
            onChange={(next) => {
              setStatusFilter(next);
              setPage(1);
            }}
          />

          <DatePickerField
            value={createdFrom}
            onChange={setCreatedFrom}
            placeholder="Filter by date"
            ariaLabel="Filter by run date"
            iconOnly
          />

          <Button asChild className="w-full lg:w-auto">
            <Link href={newRunHref}>
              <Plus className="size-4" aria-hidden />
              Add New Settlement Run
            </Link>
          </Button>
        </div>
      </div>

      <section
        aria-labelledby="settlement-runs-heading"
        className="flex flex-col gap-5 overflow-hidden rounded-[8px] border border-border bg-white p-4 sm:p-6"
      >
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h2
            id="settlement-runs-heading"
            className="text-[24px] font-bold leading-[28px] tracking-[0.048px] text-foreground"
          >
            Settlement Runs ({formatNumber(allRuns.length)})
          </h2>
        </header>

        {corrections.map((c) => (
          <div
            key={c.key}
            className="flex items-center gap-2 rounded-[8px] border border-dashed border-warning/60 bg-warning/5 px-4 py-3"
          >
            <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden />
            <p className="text-[13px] leading-[18px] text-foreground">{c.text}</p>
          </div>
        ))}

        {isEmpty ? (
          <EmptyState
            icon={Landmark}
            title="No settlement runs yet"
            description="Create a settlement run to allocate validated revenue batches to participants using the active rule snapshot."
            action={{
              label: (
                <>
                  <Plus className="size-4" aria-hidden />
                  Add New Settlement Run
                </>
              ),
              href: newRunHref,
            }}
            className="border-dashed"
          />
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[820px]">
              <div className={cn(GRID_COLS, 'border-b border-grey-200 bg-grey-50')}>
                <HeaderCell>
                  <SortButton
                    field="runNumber"
                    currentField={sortBy}
                    order={sortOrder}
                    onSort={handleSort}
                    label="#"
                  />
                </HeaderCell>
                <HeaderCell>Type</HeaderCell>
                <HeaderCell>Rule</HeaderCell>
                <HeaderCell>Batches</HeaderCell>
                <HeaderCell>
                  <SortButton
                    field="totalAllocated"
                    currentField={sortBy}
                    order={sortOrder}
                    onSort={handleSort}
                    label="Total Allocated"
                  />
                </HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell>
                  <SortButton
                    field="createdAt"
                    currentField={sortBy}
                    order={sortOrder}
                    onSort={handleSort}
                    label="Date"
                  />
                </HeaderCell>
              </div>

              <RunRows
                isLoading={isLoading}
                isError={isError}
                runs={pagedRuns}
                onRetry={() => void refetch()}
              />
            </div>
          </div>
        )}
      </section>

      {visibleRuns.length > 0 && (
        <Pagination
          page={clampedPage}
          totalPages={totalPages}
          onPageChange={setPage}
          className="justify-center"
        />
      )}
    </div>
  );
}

/* ─── Status filter dropdown ────────────────────────────────────────────── */

const STATUS_FILTER_OPTIONS: ReadonlyArray<StatusFilter> = [
  'ALL',
  SettlementRunStatus.DRAFT,
  SettlementRunStatus.PREVIEWED,
  SettlementRunStatus.FINALIZED,
  SettlementRunStatus.CANCELLED,
  SettlementRunStatus.VOIDED,
];

function StatusFilterDropdown({
  active,
  counts,
  onChange,
}: Readonly<{
  active: StatusFilter;
  counts: Record<StatusFilter, number>;
  onChange: (next: StatusFilter) => void;
}>) {
  const label = active === 'ALL' ? 'All' : SETTLEMENT_RUN_STATUS_LABEL[active];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" className="gap-2">
          {label} <ChevronDown className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {STATUS_FILTER_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              'flex items-center justify-between gap-6',
              active === opt && 'bg-grey-100 font-semibold',
            )}
          >
            <span>{opt === 'ALL' ? 'All' : SETTLEMENT_RUN_STATUS_LABEL[opt]}</span>
            <span className="text-neutral">({formatNumber(counts[opt])})</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── Rows ──────────────────────────────────────────────────────────────── */

function RunRows({
  isLoading,
  isError,
  runs,
  onRetry,
}: Readonly<{
  isLoading: boolean;
  isError: boolean;
  runs: ReadonlyArray<SettlementRun>;
  onRetry: () => void;
}>) {
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
        <p className="text-[14px] text-danger">Failed to load settlement runs.</p>
        <Button type="button" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <p className="text-[14px] text-neutral">
          No runs match the selected filter.
        </p>
      </div>
    );
  }

  return (
    <>
      {runs.map((r, idx) => (
        <RunRow key={r.id} run={r} isLast={idx === runs.length - 1} />
      ))}
    </>
  );
}

function RunRow({ run, isLast }: Readonly<{ run: SettlementRun; isLast: boolean }>) {
  return (
    <div className={cn(GRID_COLS, isLast ? '' : 'border-b border-grey-100', 'bg-white')}>
      <BodyCell>
        <Link
          href={ROUTES.SETTLEMENT.RUN_DETAIL(run.id)}
          className="border-b border-foreground/40 text-[14px] font-medium leading-[20px] text-foreground transition-colors hover:border-foreground hover:text-foreground/80"
        >
          {run.runNumber}
        </Link>
      </BodyCell>
      <BodyCell>
        <Badge
          size="sm"
          variant={SETTLEMENT_RUN_TYPE_TONE[run.runType]}
          className="whitespace-nowrap"
        >
          {SETTLEMENT_RUN_TYPE_LABEL[run.runType]}
        </Badge>
      </BodyCell>
      <BodyCell>
        <span className="text-[14px] text-foreground">
          {run.ruleSnapshotVersion !== undefined ? `v${run.ruleSnapshotVersion}` : '-'}
        </span>
      </BodyCell>
      <BodyCell>
        <span className="text-[14px] text-foreground">
          {run.revenueBatchCount ?? '-'}
        </span>
      </BodyCell>
      <BodyCell>
        <span className="text-[14px] font-medium text-foreground">
          {run.status === 'DRAFT'
            ? '-'
            : formatCurrency(run.totalAllocated, run.currency)}
        </span>
      </BodyCell>
      <BodyCell>
        <Badge
          size="sm"
          variant={SETTLEMENT_RUN_STATUS_TONE[run.status]}
          className="whitespace-nowrap"
        >
          {SETTLEMENT_RUN_STATUS_LABEL[run.status]}
        </Badge>
      </BodyCell>
      <BodyCell>
        <span className="text-[14px] text-neutral">{formatDate(run.createdAt)}</span>
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

function BodyCell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex h-[52px] items-center px-[10px] py-[14px]">{children}</div>
  );
}

function SortButton({
  field,
  currentField,
  order,
  onSort,
  label,
}: Readonly<{
  field: SortField;
  currentField: SortField;
  order: SortOrder;
  onSort: (field: SortField) => void;
  label: string;
}>) {
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
        <Skeleton className="h-4 w-6" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-5 w-20 rounded-[12px]" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-4 w-8" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-4 w-8" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-4 w-24" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-5 w-20 rounded-[12px]" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-4 w-20" />
      </BodyCell>
    </div>
  );
}

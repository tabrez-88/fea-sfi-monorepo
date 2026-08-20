'use client';

import {
  ArrowDown,
  ArrowUpDown,
  FileText,
  Plus,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';

import { BackLink } from '@/components/common/BackLink';
import { Banner } from '@/components/common/Banner';
import { DatePickerField } from '@/components/common/DatePickerField';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { RuleSnapshotStatusBadge } from '@/components/rules/RuleSnapshotStatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { DEFAULT_PAGE_SIZE } from '@/constants/ui';
import { useRuleSnapshots } from '@/hooks/rules/useRuleSnapshots';
import { cn } from '@/lib/utils';
import {
  deriveRuleSnapshotStatus,
  type RuleSnapshot,
} from '@/types/rule-snapshot.types';
import { formatDate } from '@/utils/date';
import { formatNumber } from '@/utils/format';

type SortField = 'version' | 'effectiveFrom' | 'effectiveTo';
type SortOrder = 'asc' | 'desc';

const SKELETON_ROWS = ['s1', 's2', 's3', 's4', 's5'] as const;

/**
 * Column template: Version, Status, Participants, Effective From, Effective To.
 * Versions and Status are narrow; the two date columns get the largest share
 * so dates render comfortably without wrap.
 */
const GRID_COLS =
  'grid grid-cols-[minmax(90px,0.7fr)_minmax(110px,1fr)_minmax(110px,1fr)_minmax(140px,1.4fr)_minmax(140px,1.4fr)]';

type RuleSnapshotsListViewProps = Readonly<{
  dealId: string;
}>;

/**
 * Rule Snapshots list, the entry tab of a deal's MS-2 rules surface. Matches
 * the Figma Rule Snapshots frame (`1299:9474`): back link, page title with
 * search + date filter + Create-New-Rule on the right, a reusable warning
 * banner explaining snapshot immutability, then a single bordered card
 * containing the Versions count header and the 5-column grid-based table.
 *
 * Scope of this slice: table + pagination + search + create-link + banner.
 * The Create wizard (Steps 1 to 3) lands in follow-up slices once the Step 2
 * design (Round 3 + Round 4) is unblocked.
 */
export function RuleSnapshotsListView({ dealId }: RuleSnapshotsListViewProps) {
  const [search, setSearch] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>('effectiveFrom');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const params = useMemo(
    () => ({
      page,
      limit: DEFAULT_PAGE_SIZE,
      sortBy,
      sortOrder,
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [page, sortBy, sortOrder, search],
  );

  const { data, isLoading, isError, refetch } = useRuleSnapshots(
    dealId,
    params,
  );

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
      setSortOrder('asc');
    }
  }

  const meta = data?.meta;
  const snapshots = data?.data ?? [];
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;
  const isEmpty = !isLoading && total === 0;

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={ROUTES.DEALS.DETAIL(dealId)} label="Overview" />

      {/* Header row: title + filter bar (search, date, Create CTA) */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
          Rule Snapshots
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
              placeholder="Search by name"
              className="pl-9"
              aria-label="Search rule snapshots by name"
            />
          </div>

          <DatePickerField
            value={effectiveFrom}
            onChange={setEffectiveFrom}
            placeholder="Filter by date"
            ariaLabel="Filter by date"
            iconOnly
          />

          <Button asChild className="w-full lg:w-auto">
            <Link href={ROUTES.DEALS.RULES_NEW(dealId)}>
              <Plus className="size-4" aria-hidden />
              Create New Rule
            </Link>
          </Button>
        </div>
      </div>

      <Banner tone="warning">
        Rule snapshots are immutable. Once created, they cannot be edited.
        Create a new version to change rules.
      </Banner>

      <section
        aria-labelledby="versions-count-heading"
        className="flex flex-col gap-5 overflow-hidden rounded-[8px] border border-border bg-white p-4 sm:p-6"
      >
        <header className="flex items-center justify-between gap-4">
          <h2
            id="versions-count-heading"
            className="text-[24px] font-bold leading-[28px] tracking-[0.048px] text-foreground"
          >
            Versions ({formatNumber(total)})
          </h2>
        </header>

        {isEmpty ? (
          <EmptyState
            icon={FileText}
            title="No rule snapshots yet"
            description="Create your first rule snapshot to lock in how revenue gets distributed for this deal. Snapshots are immutable once created."
            className="border-dashed"
          />
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              {/* Header row */}
              <div className={cn(GRID_COLS, 'border-b border-grey-200 bg-grey-50')}>
                <HeaderCell>
                  <SortButton
                    field="version"
                    currentField={sortBy}
                    order={sortOrder}
                    onSort={handleSort}
                    label="Versions"
                  />
                </HeaderCell>
                <HeaderCell>Status</HeaderCell>
                <HeaderCell>Participants</HeaderCell>
                <HeaderCell>
                  <SortButton
                    field="effectiveFrom"
                    currentField={sortBy}
                    order={sortOrder}
                    onSort={handleSort}
                    label="Effective From"
                  />
                </HeaderCell>
                <HeaderCell>
                  <SortButton
                    field="effectiveTo"
                    currentField={sortBy}
                    order={sortOrder}
                    onSort={handleSort}
                    label="Effective To"
                  />
                </HeaderCell>
              </div>

              {/* Body rows */}
              <SnapshotRows
                isLoading={isLoading}
                isError={isError}
                snapshots={snapshots}
                onRetry={handleRetry}
              />
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

/* ─── Sub-components ────────────────────────────────────────────────────── */

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
    <div
      className={cn(
        'flex h-[52px] items-center px-[10px] py-[14px]',
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

  const Icon = active ? ArrowDown : ArrowUpDown;

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1.5 text-[14px] font-bold leading-[20px] tracking-[0.028px] text-foreground hover:text-foreground/80"
      aria-label={`${label}, ${indicator}`}
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

type SnapshotRowsProps = Readonly<{
  isLoading: boolean;
  isError: boolean;
  snapshots: ReadonlyArray<RuleSnapshot>;
  onRetry: () => void;
}>;

function SnapshotRows({
  isLoading,
  isError,
  snapshots,
  onRetry,
}: SnapshotRowsProps) {
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
        <p className="text-[14px] text-danger">
          Failed to load rule snapshots.
        </p>
        <Button type="button" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <>
      {snapshots.map((snapshot, idx) => (
        <SnapshotRow
          key={snapshot.id}
          snapshot={snapshot}
          isLast={idx === snapshots.length - 1}
        />
      ))}
    </>
  );
}

function SnapshotRow({
  snapshot,
  isLast,
}: Readonly<{ snapshot: RuleSnapshot; isLast: boolean }>) {
  const status = deriveRuleSnapshotStatus(snapshot);
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
          href={ROUTES.DEALS.RULE_DETAIL(snapshot.dealId, snapshot.id)}
          className="border-b border-foreground/40 text-[14px] font-semibold text-foreground transition-colors hover:border-foreground hover:text-foreground/80"
        >
          v{snapshot.version}
        </Link>
      </BodyCell>
      <BodyCell>
        <RuleSnapshotStatusBadge status={status} />
      </BodyCell>
      <BodyCell>
        <span className="text-[14px] text-foreground">
          {formatNumber(snapshot.participantCount)}
        </span>
      </BodyCell>
      <BodyCell>
        <span className="text-[14px] text-neutral">
          {formatDate(snapshot.effectiveFrom)}
        </span>
      </BodyCell>
      <BodyCell>
        <span className="text-[14px] text-neutral">
          {formatDate(snapshot.effectiveTo)}
        </span>
      </BodyCell>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className={cn(GRID_COLS, 'border-b border-grey-100')}>
      <BodyCell><Skeleton className="h-4 w-8" /></BodyCell>
      <BodyCell><Skeleton className="h-6 w-20 rounded-full" /></BodyCell>
      <BodyCell><Skeleton className="h-4 w-8" /></BodyCell>
      <BodyCell><Skeleton className="h-4 w-24" /></BodyCell>
      <BodyCell><Skeleton className="h-4 w-24" /></BodyCell>
    </div>
  );
}

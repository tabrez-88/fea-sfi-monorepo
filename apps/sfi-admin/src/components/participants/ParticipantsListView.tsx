'use client';

import {
  ArrowDown,
  ArrowUpDown,
  ChevronDown,
  Download,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/BackLink';
import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog';
import { DatePickerField } from '@/components/common/DatePickerField';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { ImportFlowDialog } from '@/components/participants/import/ImportFlowDialog';
import { ParticipantBehaviorBadge } from '@/components/participants/ParticipantBehaviorBadge';
import { InvestorPoolManagementCard } from '@/components/participants/pool/InvestorPoolManagementCard';
import { RoleNameChip } from '@/components/participants/RoleNameChip';
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
import { DEFAULT_PAGE_SIZE } from '@/constants/ui';
import { useDeleteParticipant } from '@/hooks/participants/useDeleteParticipant';
import { useParticipants } from '@/hooks/participants/useParticipants';
import { getApiErrorMessage } from '@/lib/axios';
import { cn } from '@/lib/utils';
import { ParticipantBehavior, type Participant } from '@/types/participant.types';
import { formatDate } from '@/utils/date';
import { formatCurrency, formatNumber } from '@/utils/format';

type BehaviorFilter = 'ALL' | 'RECOUPMENT' | 'DEDUCTIONS' | 'PROFIT';
type SortField = 'name' | 'createdAt';
type SortOrder = 'asc' | 'desc';

const SKELETON_ROWS = ['s1', 's2', 's3', 's4', 's5'] as const;

/**
 * Column template: 9 columns sized to fit comfortably at the 960px
 * minimum width inside the horizontal scroll container.
 *   Name · Behavior · Role · Email · Investment · Units · Price/Unit · Added · ⋮ (kebab actions)
 *
 * The final column is fixed-width at 56px for the kebab button so it
 * doesn't compete with the data columns for breathing room.
 */
const GRID_COLS =
  'grid grid-cols-[minmax(140px,1.5fr)_minmax(120px,1fr)_minmax(110px,1fr)_minmax(140px,1.5fr)_minmax(90px,0.9fr)_minmax(70px,0.7fr)_minmax(90px,0.9fr)_minmax(100px,1fr)_56px]';

type ParticipantsListViewProps = Readonly<{
  dealId: string;
}>;

/**
 * Participants list, the entry tab of a deal's MS-2 surface. Matches the Figma
 * Participants frame (`1299:5921`): back link, page title + search/date/Add
 * filter bar, then one bordered card with the count header + Import/Export
 * actions + behavior filter pills + grid-based table (same pattern as the
 * dashboard `RecentDealsTable`), and a centred pagination row below.
 *
 * Filter pills + pool aggregates are page-scoped placeholders, since BE lacks a
 * counts endpoint and a `?behaviorType=` filter on the participants list,
 * so the pills filter only what's loaded on the current page and the pool
 * aggregate stats reflect the current page only. TODO when BE catches up.
 */
export function ParticipantsListView({ dealId }: ParticipantsListViewProps) {
  const [search, setSearch] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [behaviorFilter, setBehaviorFilter] = useState<BehaviorFilter>('ALL');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [importOpen, setImportOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Participant | null>(null);
  const deleteMutation = useDeleteParticipant(dealId);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      toast.success(`${pendingDelete.name} deleted`);
      setPendingDelete(null);
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, 'Failed to delete participant. Please try again.'),
      );
    }
  }

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

  const { data, isLoading, isError, refetch } = useParticipants(dealId, params);

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
  const allParticipants = useMemo<ReadonlyArray<Participant>>(() => data?.data ?? [], [data]);
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;
  const isEmpty = !isLoading && total === 0;

  // Page-scoped counts (see file header note).
  const counts = useMemo(() => {
    return {
      all: total,
      recoupment: allParticipants.filter((p) => p.behaviorType === ParticipantBehavior.RECOUPMENT)
        .length,
      deductions: allParticipants.filter(
        (p) =>
          p.behaviorType === ParticipantBehavior.FEE_DEDUCTION ||
          p.behaviorType === ParticipantBehavior.FLAT_FEE,
      ).length,
      profit: allParticipants.filter((p) => p.behaviorType === ParticipantBehavior.NET_PROFIT_SHARE)
        .length,
    };
  }, [allParticipants, total]);

  const visibleParticipants = useMemo(() => {
    if (behaviorFilter === 'ALL') return allParticipants;
    return allParticipants.filter((p) => {
      if (behaviorFilter === 'RECOUPMENT') {
        return p.behaviorType === ParticipantBehavior.RECOUPMENT;
      }
      if (behaviorFilter === 'DEDUCTIONS') {
        return (
          p.behaviorType === ParticipantBehavior.FEE_DEDUCTION ||
          p.behaviorType === ParticipantBehavior.FLAT_FEE
        );
      }
      return p.behaviorType === ParticipantBehavior.NET_PROFIT_SHARE;
    });
  }, [allParticipants, behaviorFilter]);

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={ROUTES.DEALS.DETAIL(dealId)} label="Overview" />

      {/* Header row: title + filter bar (search · date · Add CTA) */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
          Participants
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
              aria-label="Search participants by name"
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
            <Link href={ROUTES.DEALS.PARTICIPANTS_NEW(dealId)}>
              <Plus className="size-4" aria-hidden />
              Add New Participant
            </Link>
          </Button>
        </div>
      </div>

      {/* Investor Pool management card. Same UI as the rule snapshot
          wizard so admins can build / extend the pool BEFORE entering
          the wizard. Reuses the same import flow (CSV) + inline Add
          Investor modal, all going through useCreateParticipant which
          refreshes the participants list below via the React Query
          invalidate chain. */}
      <InvestorPoolManagementCard
        dealId={dealId}
        title="Investor Pool"
        description="Drop a CSV or add investors manually. Members are created with Recoupment behavior and Part of Investor Pool checked so they appear under the pool group below and are ready to use in any rule snapshot."
      />

      {/* Single bordered card holds the sub-header, filter pills, and table. */}
      <section
        aria-labelledby="participants-count-heading"
        className="flex flex-col gap-5 overflow-hidden rounded-[8px] border border-border bg-white p-4 sm:p-6"
      >
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h2
            id="participants-count-heading"
            className="text-[24px] font-bold leading-[28px] tracking-[0.048px] text-foreground"
          >
            Participants ({formatNumber(total)})
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="size-4" aria-hidden />
              Import Data
            </Button>
            <Button type="button" variant="outline" disabled>
              <Download className="size-4" aria-hidden />
              Export Data
            </Button>
          </div>
        </header>

        {!isEmpty && (
          <BehaviorFilterPills
            counts={counts}
            activeFilter={behaviorFilter}
            onFilterChange={setBehaviorFilter}
          />
        )}

        {isEmpty ? (
          <EmptyState
            icon={Users}
            title="No participants yet"
            description="Add participants to this deal (investors, partners, fee-taking entities) so settlement runs have someone to allocate revenue to."
            className="border-dashed"
          />
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[960px]">
              {/* Header row */}
              <div className={cn(GRID_COLS, 'border-b border-grey-200 bg-grey-50')}>
                <HeaderCell>
                  <SortButton
                    field="name"
                    currentField={sortBy}
                    order={sortOrder}
                    onSort={handleSort}
                    label="Name"
                  />
                </HeaderCell>
                <HeaderCell>Default Behavior</HeaderCell>
                <HeaderCell>Role Name</HeaderCell>
                <HeaderCell>Email</HeaderCell>
                <HeaderCell>Investment</HeaderCell>
                <HeaderCell>Units</HeaderCell>
                <HeaderCell>Price/Unit</HeaderCell>
                <HeaderCell>
                  <SortButton
                    field="createdAt"
                    currentField={sortBy}
                    order={sortOrder}
                    onSort={handleSort}
                    label="Added At"
                  />
                </HeaderCell>
                {/* Spacer column for the per-row kebab button */}
                <HeaderCell>
                  <span className="sr-only">Actions</span>
                </HeaderCell>
              </div>

              {/* Body rows */}
              <ParticipantRows
                isLoading={isLoading}
                isError={isError}
                participants={visibleParticipants}
                onRetry={handleRetry}
                dealId={dealId}
                onRequestDelete={setPendingDelete}
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

      <ImportFlowDialog
        dealId={dealId}
        open={importOpen}
        onOpenChange={setImportOpen}
      />

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        title="Delete participant?"
        description={
          pendingDelete ? (
            <>
              This will permanently remove{' '}
              <span className="font-semibold text-foreground">
                {pendingDelete.name}
              </span>{' '}
              from this deal. The action is recorded in the audit log but
              cannot be undone.
            </>
          ) : null
        }
        isPending={deleteMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}

/* ─── Sub-components ────────────────────────────────────────────────────── */

type BehaviorFilterPillsProps = Readonly<{
  counts: { all: number; recoupment: number; deductions: number; profit: number };
  activeFilter: BehaviorFilter;
  onFilterChange: (next: BehaviorFilter) => void;
}>;

function BehaviorFilterPills({ counts, activeFilter, onFilterChange }: BehaviorFilterPillsProps) {
  const pills: ReadonlyArray<{
    label: string;
    filter: BehaviorFilter;
    value: number;
  }> = [
    { label: 'All', filter: 'ALL', value: counts.all },
    { label: 'Recoupment', filter: 'RECOUPMENT', value: counts.recoupment },
    { label: 'Deductions', filter: 'DEDUCTIONS', value: counts.deductions },
    { label: 'Profit', filter: 'PROFIT', value: counts.profit },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {pills.map((pill) => {
        const isActive = activeFilter === pill.filter;
        return (
          <button
            key={pill.filter}
            type="button"
            onClick={() => onFilterChange(pill.filter)}
            aria-pressed={isActive}
            className={cn(
              'group flex min-h-[88px] flex-col justify-between gap-2 rounded-[8px] border border-border bg-white p-4 text-left text-foreground transition-colors sm:min-h-[96px]',
              'hover:border-foreground hover:bg-foreground hover:text-background focus-visible:border-foreground focus-visible:bg-foreground focus-visible:text-background focus-visible:outline-none',
              isActive && 'border-foreground bg-foreground text-background',
            )}
          >
            <span
              className={cn(
                'text-[14px] font-medium leading-[20px] transition-colors',
                isActive
                  ? 'text-background/80'
                  : 'text-neutral group-hover:text-background/80 group-focus-visible:text-background/80',
              )}
            >
              {pill.label}
            </span>
            <span className="text-[28px] font-semibold leading-[32px] tracking-[-0.56px]">
              {formatNumber(pill.value)}
            </span>
          </button>
        );
      })}
    </div>
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

function BodyCell({ children, className }: Readonly<{ children: ReactNode; className?: string }>) {
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

type ParticipantRowsProps = Readonly<{
  isLoading: boolean;
  isError: boolean;
  participants: ReadonlyArray<Participant>;
  onRetry: () => void;
  dealId: string;
  onRequestDelete: (participant: Participant) => void;
}>;

/**
 * Pool members shown by default inside an expanded Investor Pool group.
 * Past this count the row list switches to a top-N preview with a
 * "View all X members" link to expand inline. Tracks the Figma frame
 * `1299:6249` (Investor Pool active state) "View all 100 members" pattern.
 */
const POOL_PREVIEW_COUNT = 5;

function ParticipantRows({
  isLoading,
  isError,
  participants,
  onRetry,
  dealId,
  onRequestDelete,
}: ParticipantRowsProps) {
  const [poolCollapsed, setPoolCollapsed] = useState(false);
  const [poolExpandedFull, setPoolExpandedFull] = useState(false);

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
        <p className="text-[14px] text-danger">Failed to load participants.</p>
        <Button type="button" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  if (participants.length === 0) {
    // Filtered-out state: table is non-empty overall but the active filter
    // has no matches on the current page. Empty-overall is handled outside.
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <p className="text-[14px] text-neutral">No participants match the selected filter.</p>
      </div>
    );
  }

  const poolMembers = participants.filter((p) => p.poolMember === true);
  const others = participants.filter((p) => !p.poolMember);
  const hasPool = poolMembers.length > 0;

  if (!hasPool) {
    return (
      <>
        {participants.map((p, idx) => (
          <ParticipantRow
            key={p.id}
            participant={p}
            isLast={idx === participants.length - 1}
            dealId={dealId}
            onRequestDelete={onRequestDelete}
          />
        ))}
      </>
    );
  }

  const totalUnits = poolMembers.reduce((acc, p) => acc + (p.units ?? 0), 0);
  const totalInvested = poolMembers.reduce((acc, p) => acc + (p.investmentAmount ?? 0), 0);
  const poolMembersVisible = !poolCollapsed;
  const showOtherRowsAfter = others.length > 0;

  const poolOverPreview = poolMembers.length > POOL_PREVIEW_COUNT;
  const visiblePoolMembers =
    poolOverPreview && !poolExpandedFull
      ? poolMembers.slice(0, POOL_PREVIEW_COUNT)
      : poolMembers;
  // The "View all" / "Show less" link row appears AFTER the visible pool
  // members and counts as the last row inside the pool group.
  const showPoolToggleLink = poolMembersVisible && poolOverPreview;

  return (
    <>
      <PoolGroupHeader
        memberCount={poolMembers.length}
        totalUnits={totalUnits}
        totalInvested={totalInvested}
        collapsed={poolCollapsed}
        onToggle={() => setPoolCollapsed((prev) => !prev)}
        // Drop the bottom border when the pool group is fully collapsed AND
        // there are no non-pool rows below: avoids a stray divider line.
        hasFollowing={poolMembersVisible || showOtherRowsAfter}
      />
      {poolMembersVisible &&
        visiblePoolMembers.map((p, idx) => {
          const isLastInList =
            idx === visiblePoolMembers.length - 1 &&
            !showPoolToggleLink &&
            !showOtherRowsAfter;
          return (
            <ParticipantRow
              key={p.id}
              participant={p}
              isLast={isLastInList}
              tinted
              dealId={dealId}
              onRequestDelete={onRequestDelete}
            />
          );
        })}
      {showPoolToggleLink && (
        <PoolViewToggleRow
          totalCount={poolMembers.length}
          expanded={poolExpandedFull}
          onToggle={() => setPoolExpandedFull((prev) => !prev)}
          isLast={!showOtherRowsAfter}
        />
      )}
      {others.map((p, idx) => (
        <ParticipantRow
          key={p.id}
          participant={p}
          isLast={idx === others.length - 1}
          dealId={dealId}
          onRequestDelete={onRequestDelete}
        />
      ))}
    </>
  );
}

type PoolViewToggleRowProps = Readonly<{
  totalCount: number;
  expanded: boolean;
  onToggle: () => void;
  isLast: boolean;
}>;

function PoolViewToggleRow({
  totalCount,
  expanded,
  onToggle,
  isLast,
}: PoolViewToggleRowProps) {
  const label = expanded
    ? 'Show less'
    : `View all ${formatNumber(totalCount)} members`;
  return (
    <div
      className={cn(
        'flex items-center bg-grey-50/60 px-[10px] py-[10px]',
        isLast ? '' : 'border-b border-grey-100',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="text-[14px] font-medium leading-[20px] text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
      >
        {label}
      </button>
    </div>
  );
}

type PoolGroupHeaderProps = Readonly<{
  memberCount: number;
  totalUnits: number;
  totalInvested: number;
  collapsed: boolean;
  onToggle: () => void;
  hasFollowing: boolean;
}>;

function PoolGroupHeader({
  memberCount,
  totalUnits,
  totalInvested,
  collapsed,
  onToggle,
  hasFollowing,
}: PoolGroupHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      aria-label={collapsed ? 'Expand Investor Pool' : 'Collapse Investor Pool'}
      className={cn(
        'flex w-full items-center gap-2 bg-grey-50 px-[10px] py-[10px] text-left transition-colors',
        'hover:bg-grey-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-foreground/20',
        hasFollowing && 'border-b border-grey-100',
      )}
    >
      <ChevronDown
        aria-hidden
        strokeWidth={2}
        className={cn(
          'size-4 text-foreground transition-transform duration-200',
          collapsed && '-rotate-90',
        )}
      />
      <span className="text-[14px] font-semibold text-foreground">Investor Pool</span>
      <span className="text-[14px] text-neutral">
        ({formatNumber(memberCount)} Members | {formatNumber(totalUnits)} Units
        {' | '}
        {formatCurrency(totalInvested)} Total)
      </span>
    </button>
  );
}

type ParticipantRowProps = Readonly<{
  participant: Participant;
  isLast: boolean;
  tinted?: boolean;
  dealId: string;
  onRequestDelete: (participant: Participant) => void;
}>;

function ParticipantRow({
  participant: p,
  isLast,
  tinted = false,
  dealId,
  onRequestDelete,
}: ParticipantRowProps) {
  return (
    <div
      className={cn(
        GRID_COLS,
        tinted ? 'bg-grey-50/60' : 'bg-white',
        isLast ? '' : 'border-b border-grey-100',
      )}
    >
      <BodyCell>
        <Link
          href={ROUTES.DEALS.PARTICIPANT_DETAIL(dealId, p.id)}
          className="truncate border-b border-foreground/40 text-[14px] font-medium leading-[20px] text-foreground transition-colors hover:border-foreground hover:text-foreground/80"
        >
          {p.name}
        </Link>
      </BodyCell>
      <BodyCell>
        <ParticipantBehaviorBadge behavior={p.behaviorType} size="sm" />
      </BodyCell>
      <BodyCell>
        <RoleNameChip roleName={p.roleName} />
      </BodyCell>
      <BodyCell>
        <span className="truncate text-[14px] text-neutral">{p.email ?? '-'}</span>
      </BodyCell>
      <BodyCell>
        <span className="text-[14px] text-foreground">{formatCurrency(p.investmentAmount)}</span>
      </BodyCell>
      <BodyCell>
        <span className="text-[14px] text-foreground">
          {p.units === null ? '-' : formatNumber(p.units)}
        </span>
      </BodyCell>
      <BodyCell>
        <span className="text-[14px] text-foreground">{formatCurrency(p.pricePerUnit)}</span>
      </BodyCell>
      <BodyCell>
        <span className="text-[14px] text-neutral">{formatDate(p.createdAt)}</span>
      </BodyCell>
      <BodyCell className="justify-center px-0">
        <RowActionsMenu participant={p} onRequestDelete={onRequestDelete} />
      </BodyCell>
    </div>
  );
}

type RowActionsMenuProps = Readonly<{
  participant: Participant;
  onRequestDelete: (participant: Participant) => void;
}>;

function RowActionsMenu({ participant, onRequestDelete }: RowActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-neutral hover:text-foreground"
          aria-label={`Actions for ${participant.name}`}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => onRequestDelete(participant)}
          className="text-danger focus:bg-danger/10 focus:text-danger"
        >
          <Trash2 className="size-4" aria-hidden />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RowSkeleton() {
  return (
    <div className={cn(GRID_COLS, 'border-b border-grey-100')}>
      <BodyCell>
        <Skeleton className="h-4 w-32" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-6 w-20 rounded-full" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-6 w-16 rounded-full" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-4 w-28" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-4 w-14" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-4 w-8" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-4 w-12" />
      </BodyCell>
      <BodyCell>
        <Skeleton className="h-4 w-20" />
      </BodyCell>
    </div>
  );
}


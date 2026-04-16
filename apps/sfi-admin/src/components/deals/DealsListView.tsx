'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowUpDown, FileText, Plus } from 'lucide-react';

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DEFAULT_PAGE_SIZE } from '@/constants/ui';
import { ROUTES } from '@/constants/routes';
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
 * Full Deals List screen (FEA-5). Owns all list-level state (search, status,
 * effectiveFrom, page, sort) so the title + filter bar + stat cards + table +
 * pagination can share a single source of truth. Matches the Figma "Deal
 * List" frame: title + filter bar on one row at ≥lg, stat cards row, then
 * the 6-column table with numbered pagination centred below.
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

  const { data, isLoading, isError, refetch, isFetching } = useDeals(params);
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
      {/* Header row: title on the left, filter bar on the right — stacks on mobile */}
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

      <DealsListStatCards
        counts={counts}
        isLoading={countsLoading}
        activeFilter={statusFilter}
        onFilterChange={handleStatusFilterChange}
      />

      <div className="overflow-hidden rounded-[8px] border border-border bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton field="name" currentField={sortBy} order={sortOrder} onSort={handleSort} label="Deal Name" />
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Currency</TableHead>
                <TableHead className="hidden md:table-cell">Participants</TableHead>
                <TableHead className="hidden lg:table-cell">
                  <SortButton field="createdAt" currentField={sortBy} order={sortOrder} onSort={handleSort} label="Created At" />
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  <SortButton field="updatedAt" currentField={sortBy} order={sortOrder} onSort={handleSort} label="Updated At" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <DealsTableBody
                isLoading={isLoading}
                isError={isError}
                deals={deals}
                onRetry={handleRetry}
              />
            </TableBody>
          </Table>
        </div>
      </div>

      {meta && meta.total > 0 && (
        <div className="flex flex-col items-center gap-2">
          <Pagination
            page={meta.page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
          <p className="text-[13px] text-neutral" aria-live="polite">
            {isFetching
              ? 'Updating…'
              : `Showing ${(meta.page - 1) * meta.limit + 1}-${Math.min(meta.page * meta.limit, meta.total)} of ${meta.total}`}
          </p>
        </div>
      )}
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

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground hover:text-foreground/80"
      aria-label={`${label} — ${indicator}`}
    >
      {label}
      <ArrowUpDown className={cn('size-3.5', active ? 'text-foreground' : 'text-neutral')} />
    </button>
  );
}

type DealsTableBodyProps = Readonly<{
  isLoading: boolean;
  isError: boolean;
  deals: ReadonlyArray<Deal>;
  onRetry: () => void;
}>;

function DealsTableBody({ isLoading, isError, deals, onRetry }: DealsTableBodyProps) {
  if (isLoading) {
    return (
      <>
        {SKELETON_ROWS.map((key) => (
          <TableRow key={key}>
            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
            <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-12" /></TableCell>
            <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-8" /></TableCell>
            <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
            <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
          </TableRow>
        ))}
      </>
    );
  }

  if (isError) {
    return (
      <TableRow>
        <TableCell colSpan={6} className="py-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <p className="text-[14px] text-danger">Failed to load deals.</p>
            <Button type="button" variant="outline" onClick={() => onRetry()}>
              Try again
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (deals.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={6} className="p-0">
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
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {deals.map((deal) => {
        const participants = deal._count?.participants ?? deal.participantsCount ?? 0;
        return (
          <TableRow key={deal.id}>
            <TableCell>
              <Link
                href={ROUTES.DEALS.DETAIL(deal.id)}
                className="text-[14px] font-semibold text-foreground underline-offset-4 hover:underline"
              >
                {deal.name}
              </Link>
            </TableCell>
            <TableCell>
              <DealStatusBadge status={deal.status} />
            </TableCell>
            <TableCell className="hidden text-[14px] text-foreground sm:table-cell">
              {deal.currency}
            </TableCell>
            <TableCell className="hidden text-[14px] text-foreground md:table-cell">
              {formatNumber(participants)}
            </TableCell>
            <TableCell className="hidden text-[14px] text-neutral lg:table-cell">
              {formatDate(deal.createdAt)}
            </TableCell>
            <TableCell className="hidden text-[14px] text-neutral lg:table-cell">
              {formatDate(deal.updatedAt)}
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}

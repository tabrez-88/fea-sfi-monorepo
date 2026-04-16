'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';

import { DatePickerField } from '@/components/common/DatePickerField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROUTES } from '@/constants/routes';
import { DealStatus } from '@/types/deal.types';

export type DealsStatusFilter = 'ALL' | keyof typeof DealStatus;

type DealsFilterBarProps = Readonly<{
  search: string;
  onSearchChange: (value: string) => void;
  status: DealsStatusFilter;
  onStatusChange: (value: DealsStatusFilter) => void;
  effectiveFrom: string;
  onEffectiveFromChange: (value: string) => void;
}>;

/**
 * Header action row for the Deals List — search + Status select + icon-only
 * date filter + primary [Create New Deal] CTA. The parent page lays this out
 * on the same row as the page title at ≥lg; on mobile the parent stacks it
 * below the title and this component wraps its own controls.
 */
export function DealsFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  effectiveFrom,
  onEffectiveFromChange,
}: DealsFilterBarProps) {
  return (
    <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-end lg:gap-3">
      <div className="relative w-full lg:max-w-[280px] lg:flex-1">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral"
          strokeWidth={2}
        />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by deal name"
          className="pl-9"
          aria-label="Search deals by name"
        />
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={status}
          onValueChange={(value) => onStatusChange(value as DealsStatusFilter)}
        >
          <SelectTrigger
            aria-label="Filter by status"
            className="w-full lg:w-[140px]"
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value={DealStatus.ACTIVE}>Active</SelectItem>
            <SelectItem value={DealStatus.DRAFT}>Draft</SelectItem>
            <SelectItem value={DealStatus.SUSPENDED}>Suspended</SelectItem>
            <SelectItem value={DealStatus.CLOSED}>Closed</SelectItem>
          </SelectContent>
        </Select>

        <DatePickerField
          value={effectiveFrom}
          onChange={onEffectiveFromChange}
          placeholder="Filter by effective date"
          ariaLabel="Filter by effective date"
          iconOnly
        />
      </div>

      <Button asChild className="w-full lg:w-auto">
        <Link href={ROUTES.DEALS.CREATE}>Create New Deal</Link>
      </Button>
    </div>
  );
}

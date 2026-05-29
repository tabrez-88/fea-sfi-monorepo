'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

type PaginationProps = Readonly<{
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Total siblings shown on each side of the current page. Default 1. */
  siblingCount?: number;
  className?: string;
}>;

/** A sentinel value representing an ellipsis gap in the rendered page list. */
const DOTS = '...' as const;
type PageItem = number | typeof DOTS;

function range(start: number, end: number): number[] {
  const length = end - start + 1;
  return Array.from({ length }, (_, idx) => start + idx);
}

/**
 * Build the compact page list: first/last always, and `siblingCount` pages
 * around the current page, with DOTS used to collapse the remaining ranges.
 * Matches the Figma `< 1 2 3 ... 10 >` pattern.
 */
function buildPageList(
  page: number,
  totalPages: number,
  siblingCount: number,
): ReadonlyArray<PageItem> {
  const firstPage = 1;
  const lastPage = totalPages;

  const totalNumbers = siblingCount * 2 + 5; // first + last + current + 2*siblings + 2 dots
  if (totalPages <= totalNumbers) {
    return range(firstPage, lastPage);
  }

  const leftSibling = Math.max(page - siblingCount, firstPage);
  const rightSibling = Math.min(page + siblingCount, lastPage);

  const showLeftDots = leftSibling > firstPage + 1;
  const showRightDots = rightSibling < lastPage - 1;

  if (!showLeftDots && showRightDots) {
    const leftItemCount = 3 + 2 * siblingCount;
    return [...range(firstPage, leftItemCount), DOTS, lastPage];
  }

  if (showLeftDots && !showRightDots) {
    const rightItemCount = 3 + 2 * siblingCount;
    return [firstPage, DOTS, ...range(lastPage - rightItemCount + 1, lastPage)];
  }

  return [firstPage, DOTS, ...range(leftSibling, rightSibling), DOTS, lastPage];
}

/**
 * Numbered pagination matching the Figma Deal List footer:
 *   `‹  1  2  3  …  10  ›`
 * with current page pill-filled and chevrons disabled at bounds.
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const items = buildPageList(page, totalPages, siblingCount);
  const atStart = page <= 1;
  const atEnd = page >= totalPages;

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1', className)}
    >
      <button
        type="button"
        aria-label="Previous page"
        disabled={atStart}
        onClick={() => onPageChange(page - 1)}
        className={cn(
          'inline-flex size-9 items-center justify-center rounded-[8px] text-foreground transition-colors',
          'hover:bg-grey-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20',
          'disabled:cursor-not-allowed disabled:opacity-40',
        )}
      >
        <ChevronLeft className="size-4" strokeWidth={2} />
      </button>

      {items.map((item, idx) => {
        if (item === DOTS) {
          return (
            <span
              key={`dots-${idx}`}
              aria-hidden
              className="inline-flex size-9 items-center justify-center text-[14px] text-neutral"
            >
              ...
            </span>
          );
        }
        const isCurrent = item === page;
        return (
          <button
            key={item}
            type="button"
            aria-current={isCurrent ? 'page' : undefined}
            aria-label={`Page ${item}`}
            onClick={() => onPageChange(item)}
            className={cn(
              'inline-flex size-9 items-center justify-center rounded-[8px] text-[14px] font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20',
              isCurrent
                ? 'bg-foreground text-background'
                : 'text-foreground hover:bg-grey-50',
            )}
          >
            {item}
          </button>
        );
      })}

      <button
        type="button"
        aria-label="Next page"
        disabled={atEnd}
        onClick={() => onPageChange(page + 1)}
        className={cn(
          'inline-flex size-9 items-center justify-center rounded-[8px] text-foreground transition-colors',
          'hover:bg-grey-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20',
          'disabled:cursor-not-allowed disabled:opacity-40',
        )}
      >
        <ChevronRight className="size-4" strokeWidth={2} />
      </button>
    </nav>
  );
}

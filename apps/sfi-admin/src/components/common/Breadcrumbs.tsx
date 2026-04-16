import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';

import { cn } from '@/lib/utils';

export type Crumb = Readonly<{
  label: string;
  href?: string;
}>;

type BreadcrumbsProps = Readonly<{
  items: ReadonlyArray<Crumb>;
  className?: string;
}>;

/**
 * Accessible breadcrumbs — `<nav aria-label="Breadcrumb">` + ordered list.
 * The final item is rendered as plain text (current page). All earlier items
 * render as `<Link>` when `href` is provided.
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('w-full', className)}>
      <ol className="flex flex-wrap items-center gap-1 text-[14px] leading-[20px] text-neutral">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <Fragment key={`${item.label}-${idx}`}>
              <li className={cn(isLast && 'text-foreground')}>
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="rounded-[4px] px-1 font-medium transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="px-1 font-medium" aria-current={isLast ? 'page' : undefined}>
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden className="flex items-center text-neutral">
                  <ChevronRight className="size-4" strokeWidth={2} />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

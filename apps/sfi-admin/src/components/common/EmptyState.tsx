import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type EmptyStateAction = Readonly<{
  label: ReactNode;
  href?: string;
  onClick?: () => void;
}>;

type EmptyStateProps = Readonly<{
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: EmptyStateAction;
  className?: string;
}>;

/**
 * Shared empty-state card — illustration (icon), headline, description, and an
 * optional primary action. Used by every list/table that can be empty so the
 * visual language stays consistent across the portal.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center gap-3 rounded-[8px] border border-dashed border-border bg-white px-6 py-12 text-center',
        className,
      )}
    >
      {Icon && (
        <div
          aria-hidden
          className="flex size-12 items-center justify-center rounded-full bg-grey-50 text-neutral"
        >
          <Icon className="size-6" strokeWidth={1.75} />
        </div>
      )}
      <h2 className="text-[18px] font-semibold leading-[24px] tracking-[-0.36px] text-foreground">
        {title}
      </h2>
      {description && (
        <p className="max-w-[420px] text-[14px] leading-[20px] text-neutral">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-2">
          {action.href ? (
            <Button asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button type="button" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Status pill: outlined rounded-12px chip. Matches Figma `Body/Outline/*`
 * tokens: bg-white, 1px colored border, matching colored SemiBold text.
 *
 * Sizes:
 *   - `default` (16/20 text, px-4) for top-level page chrome (Deal status,
 *     Rule Snapshot status, Add Participant form).
 *   - `sm` (13/18 text, px-3) for dense table rows like the CSV preview /
 *     bulk-import error tables where the default chip dwarfs the row text.
 */
const badgeVariants = cva(
  'inline-flex items-center rounded-[12px] border bg-white whitespace-nowrap',
  {
    variants: {
      variant: {
        success: 'border-success text-success',
        warning: 'border-warning text-warning',
        info: 'border-info text-info',
        danger: 'border-danger text-danger',
        neutral: 'border-neutral text-neutral',
        default: 'border-foreground text-foreground',
      },
      size: {
        default: 'px-4 py-[2px] text-[16px] font-semibold leading-[20px] tracking-[0.032px]',
        sm: 'px-3 py-[1px] text-[13px] font-semibold leading-[18px] tracking-[0.026px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: Readonly<BadgeProps>) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

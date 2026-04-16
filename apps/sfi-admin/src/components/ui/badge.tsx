import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Status pill — outlined rounded-12px chip. Matches Figma `Body/Outline/*`
 * tokens: bg-white, 1px colored border, matching colored SemiBold 16/20 text,
 * px-16 py-2, rounded-12.
 */
const badgeVariants = cva(
  'inline-flex items-center rounded-[12px] border bg-white px-4 py-[2px] text-[16px] font-semibold leading-[20px] tracking-[0.032px] whitespace-nowrap',
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
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: Readonly<BadgeProps>) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

'use client';

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';

import { cn } from '@/lib/utils';

const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      // Figma Label/Small: Inter Medium 14/16 tracking 0.7px
      'inline-flex items-center gap-1 text-[14px] font-medium leading-[16px] tracking-[0.7px] text-foreground',
      'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className,
    )}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

/** Render the Figma required-asterisk: same line, danger color. */
function RequiredMark() {
  return <span className="text-danger">*</span>;
}

export { Label, RequiredMark };

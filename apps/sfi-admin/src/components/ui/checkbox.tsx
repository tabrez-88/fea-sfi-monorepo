'use client';

import { CheckIcon, MinusIcon } from 'lucide-react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Checkbox primitive, styled to match the existing `Input` / `Select`
 * treatment (border-border, foreground fill when checked). Supports the
 * indeterminate state via `checked="indeterminate"`, which the
 * participants list uses for its partial "select all" header state.
 */
function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer size-4 shrink-0 rounded-[4px] border border-border bg-white outline-none transition-colors',
        'focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground/20',
        'data-[state=checked]:border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background',
        'data-[state=indeterminate]:border-foreground data-[state=indeterminate]:bg-foreground data-[state=indeterminate]:text-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        {props.checked === 'indeterminate' ? (
          <MinusIcon className="size-3.5" strokeWidth={3} aria-hidden />
        ) : (
          <CheckIcon className="size-3.5" strokeWidth={3} aria-hidden />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };

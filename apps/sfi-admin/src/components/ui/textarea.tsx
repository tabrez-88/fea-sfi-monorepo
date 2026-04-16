import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Textarea primitive — shadcn-structured, Figma-styled. Mirrors the existing
 * `Input` component: border-border, 8px radius, 16px/20px text, transitions
 * via `focus-visible:border-foreground`. Forwards ref so react-hook-form and
 * focus management work out of the box.
 */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        'flex min-h-[96px] w-full rounded-[8px] border border-border bg-white px-4 py-[12px]',
        'text-[16px] leading-[20px] tracking-[0.032px] text-foreground',
        'placeholder:text-neutral placeholder:font-normal',
        'transition-colors focus-visible:outline-none focus-visible:border-foreground',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-[invalid=true]:border-danger resize-y',
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };

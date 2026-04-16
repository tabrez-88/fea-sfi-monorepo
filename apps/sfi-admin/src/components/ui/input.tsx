import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Figma spec: h-48, bg-white, border #E0E0E0, rounded-8, px-16 py-14
          'flex h-[48px] w-full rounded-[8px] border border-border bg-white px-4 py-[14px]',
          'text-[16px] leading-[20px] tracking-[0.032px] text-foreground',
          'placeholder:text-neutral placeholder:font-normal',
          'transition-colors focus-visible:outline-none focus-visible:border-foreground',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-[invalid=true]:border-danger',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };

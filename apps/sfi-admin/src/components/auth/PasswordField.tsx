'use client';

import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type PasswordFieldProps = Omit<React.ComponentProps<'input'>, 'type'>;

/**
 * Password input with a show/hide toggle. Matches the Figma input shell — 48px
 * tall, 8px radius, border `#E0E0E0`, with a 15×15 lucide eye icon on the right.
 */
export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn('pr-12', className)}
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-0 top-0 flex h-[48px] w-12 items-center justify-center text-neutral hover:text-foreground"
          tabIndex={-1}
        >
          {visible ? (
            <EyeOff className="size-[15px]" strokeWidth={1.67} />
          ) : (
            <Eye className="size-[15px]" strokeWidth={1.67} />
          )}
        </button>
      </div>
    );
  },
);
PasswordField.displayName = 'PasswordField';

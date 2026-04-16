import type { ReactNode } from 'react';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type DealFormFieldProps = Readonly<{
  id: string;
  label: string;
  required?: boolean;
  error?: string | undefined;
  helpText?: ReactNode | undefined;
  children: ReactNode;
  className?: string;
}>;

/**
 * Single labelled form row used by `DealForm`. Keeps label, input slot,
 * inline error and help text in a consistent layout so every row on the
 * Create / Edit Deal screens lines up the same way.
 */
export function DealFormField({
  id,
  label,
  required,
  error,
  helpText,
  children,
  className,
}: DealFormFieldProps) {
  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="text-[14px] font-medium leading-[20px] text-foreground">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </Label>
      {children}
      {error ? (
        <p id={errorId} role="alert" className="text-[12px] leading-[16px] text-danger">
          {error}
        </p>
      ) : (
        helpText && (
          <p id={helpId} className="text-[12px] leading-[16px] text-neutral">
            {helpText}
          </p>
        )
      )}
    </div>
  );
}

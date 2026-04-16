import { cn } from '@/lib/utils';

type FormErrorProps = Readonly<{
  // `| undefined` is required by `exactOptionalPropertyTypes: true` so call
  // sites can pass `message={maybeError ?? undefined}` without a TS error.
  message?: string | undefined;
  className?: string | undefined;
}>;

export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className={cn(
        'rounded-[8px] border border-danger/30 bg-danger/5 px-3 py-2 text-[14px] leading-[20px] text-danger',
        className,
      )}
    >
      {message}
    </p>
  );
}

type FieldErrorProps = Readonly<{
  message?: string | undefined;
}>;

export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p className="mt-1 text-[12px] leading-[16px] tracking-[0.4px] text-danger">
      {message}
    </p>
  );
}

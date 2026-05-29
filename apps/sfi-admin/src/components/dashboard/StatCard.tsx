import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type StatCardProps = Readonly<{
  label: string;
  value: string | number;
  // React Query's `isLoading` is `boolean | undefined`. Accept both so
  // callers can spread `{...query}` without a separate guard.
  isLoading?: boolean | undefined;
  className?: string | undefined;
}>;

/**
 * Dashboard stat card: 240px wide, 1px #E0E0E0 border, 8px radius, 24px
 * padding. Label is Heading/Small (20/24 Medium) and value is Display/Small
 * (40/48 Medium). Matches Figma node 385:11474.
 */
export function StatCard({ label, value, isLoading, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col gap-4 rounded-[8px] border border-border bg-white p-4 sm:p-6',
        className,
      )}
    >
      <p className="text-[20px] font-medium leading-[24px] tracking-[-0.04px] text-foreground">
        {label}
      </p>
      {isLoading ? (
        <Skeleton className="h-12 w-32" />
      ) : (
        <p className="text-[28px] font-medium leading-[36px] tracking-[-0.2px] text-foreground sm:text-[40px] sm:leading-[48px]">
          {value}
        </p>
      )}
    </div>
  );
}

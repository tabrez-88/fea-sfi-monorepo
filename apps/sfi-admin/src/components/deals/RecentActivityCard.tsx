import { formatDate } from '@/utils/date';

export type RecentActivityEntry = Readonly<{
  id: string;
  /** ISO date string. */
  date: string;
  message: string;
}>;

type RecentActivityCardProps = Readonly<{
  entries: ReadonlyArray<RecentActivityEntry>;
}>;

/**
 * "Recent Activity" panel on the Deal Overview: two-column date | message
 * list with dividers between rows. Matches Figma `385:10602`. Empty state
 * tells the user activity will appear as they work on the deal.
 */
export function RecentActivityCard({ entries }: RecentActivityCardProps) {
  return (
    <section className="flex flex-col gap-4 rounded-[8px] border border-border bg-white p-4 sm:p-6">
      <h2 className="text-[18px] font-semibold leading-[24px] tracking-[-0.36px] text-foreground">
        Recent Activity
      </h2>

      {entries.length === 0 ? (
        <p className="py-4 text-center text-[14px] leading-[20px] text-neutral">
          All caught up! <span className="font-semibold text-foreground">No items need</span> your attention.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {entries.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:gap-6">
              <span className="w-[96px] shrink-0 text-[13px] text-neutral">
                {formatDate(entry.date)}
              </span>
              <span className="text-[14px] leading-[20px] text-foreground">
                {entry.message}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

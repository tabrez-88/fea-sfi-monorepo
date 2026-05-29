import { DealStatusBadge } from '@/components/deals/DealStatusBadge';
import type { Deal } from '@/types/deal.types';
import { formatDate } from '@/utils/date';

type DealHeaderProps = Readonly<{
  deal: Deal;
}>;

/**
 * Deal-name block that sits at the top of the Deal Overview card:
 *   <name>                   [status pill]
 *   Film deal · Created Feb 1, 2026
 *
 * Matches Figma `385:10602`: deal name large bold, subtitle 13px neutral,
 * status pill right-aligned. On suspended deals the page renders the yellow
 * "unresponsive" banner separately (DealOverviewView), not here.
 */
export function DealHeader({ deal }: DealHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-[24px] font-semibold leading-[28px] tracking-[-0.48px] text-foreground sm:text-[28px] sm:leading-[32px] sm:tracking-[-0.56px]">
          {deal.name}
        </h2>
        <p className="text-[13px] leading-[18px] text-neutral">
          Film deal · Created {formatDate(deal.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0">
        <DealStatusBadge status={deal.status} />
      </div>
    </div>
  );
}

import { Landmark } from 'lucide-react';
import type { Metadata } from 'next';

import { EmptyState } from '@/components/common/EmptyState';
import { ROUTES } from '@/constants/routes';

export const metadata: Metadata = {
  title: 'All Settlements',
};

/**
 * MS-4 Screen 4.1 placeholder. The sidebar links here, and before this
 * page existed the click 404ed. The real cross-deal settlements view
 * needs a cross-deal BE endpoint (per-deal lists exist today); until it
 * lands, this page routes admins to the per-deal Settlement tab.
 */
export default function AllSettlementsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[28px] font-light leading-[34px] tracking-[-0.56px] text-foreground sm:text-[40px] sm:leading-[44px] sm:tracking-[-0.8px]">
        All Settlements
      </h1>
      <EmptyState
        icon={Landmark}
        title="Cross-deal settlements view is on its way"
        description="Settlement runs are managed per deal for now: open a deal and use its Settlement tab to create, preview, and finalize runs. This page will aggregate every run across all deals once the cross-deal view ships."
        action={{ label: 'Browse Deals', href: ROUTES.DEALS.LIST }}
        className="border-dashed"
      />
    </div>
  );
}

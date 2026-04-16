import type { Metadata } from 'next';

import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { PendingReviewsCard } from '@/components/dashboard/PendingReviewsCard';
import { RecentDealsTable } from '@/components/dashboard/RecentDealsTable';
import { PageHeader } from '@/components/layout/PageHeader';

export const metadata: Metadata = {
  title: 'Dashboard',
};

/**
 * Global Dashboard page (FEA-4). Figma wraps everything below the breadcrumb
 * in a single bordered 8px-radius container with 24px gaps between cards.
 */
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Content" title="Dashboard" />

      <div className="flex flex-col items-center gap-6 rounded-[8px] border border-border bg-white p-4 sm:p-6">
        <DashboardStats />
        <PendingReviewsCard />
        <RecentDealsTable />
      </div>
    </div>
  );
}

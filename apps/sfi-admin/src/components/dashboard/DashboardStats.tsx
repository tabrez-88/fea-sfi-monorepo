'use client';

import { StatCard } from '@/components/dashboard/StatCard';
import { formatCurrencyCompact, formatNumber } from '@/utils/format';
import { useDashboardSummary } from '@/hooks/dashboard/useDashboardSummary';

/**
 * Row of 4 stat cards. Figma layout: flex row, `justify-between`, each card
 * width 240px, total content width approx 1000px.
 */
export function DashboardStats() {
  const { data, isLoading } = useDashboardSummary();

  return (
    <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Total Deals"
        value={formatNumber(data?.totalDeals ?? 0)}
        isLoading={isLoading}
      />
      <StatCard
        label="Active Deals"
        value={formatNumber(data?.activeDeals ?? 0)}
        isLoading={isLoading}
      />
      <StatCard
        label="Pending Review"
        value={formatNumber(data?.pendingReview ?? 0)}
        isLoading={isLoading}
      />
      <StatCard
        label="Total Settled"
        value={formatCurrencyCompact(data?.totalSettled ?? 0)}
        isLoading={isLoading}
      />
    </div>
  );
}

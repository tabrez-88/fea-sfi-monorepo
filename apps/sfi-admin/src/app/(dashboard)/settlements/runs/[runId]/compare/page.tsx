import type { Metadata } from 'next';

import { SettlementComparisonView } from '@/components/settlement/SettlementComparisonView';

export const metadata: Metadata = {
  title: 'Settlement Comparison',
};

/** MS-4 Screen 4.8 — Settlement Comparison (correction vs original). */
export default async function SettlementComparisonPage({
  params,
}: Readonly<{ params: Promise<{ runId: string }> }>) {
  const { runId } = await params;
  return <SettlementComparisonView runId={runId} />;
}

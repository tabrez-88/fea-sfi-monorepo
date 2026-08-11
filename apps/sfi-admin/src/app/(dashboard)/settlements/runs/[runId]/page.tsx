import type { Metadata } from 'next';

import { SettlementRunDetailView } from '@/components/settlement/SettlementRunDetailView';

export const metadata: Metadata = {
  title: 'Settlement Run',
};

/** MS-4 Screen 4.4 — Settlement Run Detail. */
export default async function SettlementRunDetailPage({
  params,
}: Readonly<{ params: Promise<{ runId: string }> }>) {
  const { runId } = await params;
  return <SettlementRunDetailView runId={runId} />;
}

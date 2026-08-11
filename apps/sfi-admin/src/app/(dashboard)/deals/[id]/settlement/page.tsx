import type { Metadata } from 'next';

import { SettlementRunsListView } from '@/components/settlement/SettlementRunsListView';

export const metadata: Metadata = {
  title: 'Settlement',
};

/** MS-4 Screen 4.3 — Settlement Runs List (per-deal). */
export default async function SettlementPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <SettlementRunsListView dealId={id} />;
}

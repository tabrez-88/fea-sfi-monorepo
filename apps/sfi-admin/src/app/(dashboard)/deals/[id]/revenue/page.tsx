import type { Metadata } from 'next';

import { RevenueBatchesListView } from '@/components/revenue/RevenueBatchesListView';

export const metadata: Metadata = {
  title: 'Revenue',
};

/** MS-3 Screen 3.1 — Revenue Batches List (`1263:41758`). */
export default async function RevenuePage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <RevenueBatchesListView dealId={id} />;
}

import type { Metadata } from 'next';

import { RevenueBatchDetailView } from '@/components/revenue/RevenueBatchDetailView';

export const metadata: Metadata = {
  title: 'Revenue Batch',
};

/** MS-3 Screen 3.2 — Revenue Batch Detail (`1263:41758`). */
export default async function RevenueBatchDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string; batchId: string }> }>) {
  const { id, batchId } = await params;
  return <RevenueBatchDetailView dealId={id} batchId={batchId} />;
}

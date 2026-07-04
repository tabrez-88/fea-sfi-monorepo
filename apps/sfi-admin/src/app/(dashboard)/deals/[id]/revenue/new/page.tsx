import type { Metadata } from 'next';

import { CreateRevenueBatchView } from '@/components/revenue/CreateRevenueBatchView';

export const metadata: Metadata = {
  title: 'New Revenue Batch',
};

/** MS-3 Screen 3.3 — Create Revenue Batch (`1263:41758`). */
export default async function NewRevenueBatchPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <CreateRevenueBatchView dealId={id} />;
}

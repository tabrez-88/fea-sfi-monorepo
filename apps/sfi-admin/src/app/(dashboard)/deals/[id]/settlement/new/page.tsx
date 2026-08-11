import type { Metadata } from 'next';

import { CreateSettlementRunView } from '@/components/settlement/CreateSettlementRunView';

export const metadata: Metadata = {
  title: 'New Settlement Run',
};

/** MS-4 Screen 4.5 — Create Settlement Run. */
export default async function NewSettlementRunPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <CreateSettlementRunView dealId={id} />;
}

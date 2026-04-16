import type { Metadata } from 'next';

import { EditDealView } from '@/components/deals/EditDealView';

export const metadata: Metadata = {
  title: 'Edit Deal',
};

/** FEA-8 — Edit Deal. Matches Figma node 384:1709 > "Deal Edit". */
export default async function EditDealPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <EditDealView dealId={id} />;
}

import type { Metadata } from 'next';

import { ProofOverviewView } from '@/components/reports/ProofOverviewView';

export const metadata: Metadata = {
  title: 'Proof',
};

/** MS-5 Screen 5.5: Proof Overview. */
export default async function ProofPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <ProofOverviewView dealId={id} />;
}

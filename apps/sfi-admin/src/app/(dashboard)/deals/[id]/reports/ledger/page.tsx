import type { Metadata } from 'next';

import { LedgerOverviewView } from '@/components/reports/LedgerOverviewView';

export const metadata: Metadata = {
  title: 'Ledger Overview',
};

/** MS-5 Screen 5.1: Ledger Overview. */
export default async function LedgerPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <LedgerOverviewView dealId={id} />;
}

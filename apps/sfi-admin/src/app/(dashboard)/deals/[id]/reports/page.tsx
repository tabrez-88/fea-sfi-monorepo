import type { Metadata } from 'next';

import { ReportsHubView } from '@/components/reports/ReportsHubView';

export const metadata: Metadata = {
  title: 'Reports',
};

/** MS-5 Reports hub: forks to Ledger, Recoupment, and Statements. */
export default async function ReportsPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <ReportsHubView dealId={id} />;
}

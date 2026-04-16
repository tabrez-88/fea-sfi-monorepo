import type { Metadata } from 'next';

import { DealOverviewView } from '@/components/deals/DealOverviewView';

export const metadata: Metadata = {
  title: 'Deal Overview',
};

/** FEA-7 — Deal Overview. Uses the Deal Context Mode sidebar (see DashboardShell). */
export default async function DealOverviewPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <DealOverviewView dealId={id} />;
}

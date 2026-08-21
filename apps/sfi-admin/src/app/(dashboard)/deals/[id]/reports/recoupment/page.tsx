import type { Metadata } from 'next';

import { RecoupmentReportView } from '@/components/reports/RecoupmentReportView';

export const metadata: Metadata = {
  title: 'Recoupment Report',
};

/** MS-5 Screen 5.3: Recoupment Report. */
export default async function RecoupmentPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <RecoupmentReportView dealId={id} />;
}

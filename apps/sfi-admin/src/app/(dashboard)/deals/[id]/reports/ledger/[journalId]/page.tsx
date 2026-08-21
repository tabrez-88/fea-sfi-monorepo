import type { Metadata } from 'next';

import { JournalDetailView } from '@/components/reports/JournalDetailView';

export const metadata: Metadata = {
  title: 'Journal Detail',
};

/** MS-5 Screen 5.2: Journal Detail. */
export default async function JournalPage({
  params,
}: Readonly<{ params: Promise<{ id: string; journalId: string }> }>) {
  const { id, journalId } = await params;
  return <JournalDetailView dealId={id} journalId={journalId} />;
}

import type { Metadata } from 'next';

import { ParticipantStatementView } from '@/components/reports/ParticipantStatementView';

export const metadata: Metadata = {
  title: 'Participant Statement',
};

/** MS-5 Screen 5.4: Participant Statement. */
export default async function StatementPage({
  params,
}: Readonly<{ params: Promise<{ id: string; participantId: string }> }>) {
  const { id, participantId } = await params;
  return <ParticipantStatementView dealId={id} participantId={participantId} />;
}

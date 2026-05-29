import type { Metadata } from 'next';

import { EditParticipantContainer } from '@/components/participants/EditParticipantContainer';

export const metadata: Metadata = {
  title: 'Participant',
};

/** Participant detail / edit page. Reuses the Add Participant form pre-filled. */
export default async function ParticipantDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string; participantId: string }> }>) {
  const { id, participantId } = await params;
  return <EditParticipantContainer dealId={id} participantId={participantId} />;
}

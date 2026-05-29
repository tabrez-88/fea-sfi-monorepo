import type { Metadata } from 'next';

import { ParticipantsListView } from '@/components/participants/ParticipantsListView';

export const metadata: Metadata = {
  title: 'Participants',
};

/** FB-001/FB-002: Participants list. Matches Figma node `1299:5921`. */
export default async function ParticipantsPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <ParticipantsListView dealId={id} />;
}

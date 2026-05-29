import type { Metadata } from 'next';

import { CreateParticipantContainer } from '@/components/participants/CreateParticipantContainer';

export const metadata: Metadata = {
  title: 'Add Participant',
};

/**
 * Add Participant page. Matches Figma node `1299:7231` (Fee Deduction default)
 * and `1299:7260` (Recoupment + Pool variant).
 */
export default async function AddParticipantPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <CreateParticipantContainer dealId={id} />;
}

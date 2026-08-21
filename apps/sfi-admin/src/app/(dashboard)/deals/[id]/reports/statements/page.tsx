import type { Metadata } from 'next';

import { StatementsIndexView } from '@/components/reports/ParticipantStatementView';

export const metadata: Metadata = {
  title: 'Participant Statements',
};

/** MS-5 Screen 5.4 index: pick a participant. */
export default async function StatementsPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <StatementsIndexView dealId={id} />;
}

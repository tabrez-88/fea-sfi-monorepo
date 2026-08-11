import type { Metadata } from 'next';

import { CreateCorrectionRunView } from '@/components/settlement/CreateCorrectionRunView';

export const metadata: Metadata = {
  title: 'Create Correction Run',
};

/** MS-4 Screen 4.6 — Create Correction Run. */
export default async function CreateCorrectionRunPage({
  params,
}: Readonly<{ params: Promise<{ runId: string }> }>) {
  const { runId } = await params;
  return <CreateCorrectionRunView runId={runId} />;
}

import type { Metadata } from 'next';

import { RuleSnapshotDetailView } from '@/components/rules/RuleSnapshotDetailView';

export const metadata: Metadata = {
  title: 'Rule Snapshot',
};

/** Read-only Rule Snapshot review (Liang 08/18). */
export default async function RuleSnapshotDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string; snapshotId: string }> }>) {
  const { id, snapshotId } = await params;
  return <RuleSnapshotDetailView dealId={id} snapshotId={snapshotId} />;
}

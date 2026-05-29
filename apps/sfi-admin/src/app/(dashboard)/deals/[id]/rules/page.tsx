import type { Metadata } from 'next';

import { RuleSnapshotsListView } from '@/components/rules/RuleSnapshotsListView';

export const metadata: Metadata = {
  title: 'Rule Snapshots',
};

/** FB-003: Rule Snapshots list. Matches Figma node `1299:9474`. */
export default async function RuleSnapshotsPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <RuleSnapshotsListView dealId={id} />;
}

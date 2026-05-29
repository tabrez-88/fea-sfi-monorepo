import type { Metadata } from 'next';

import { CreateRuleSnapshotContainer } from '@/components/rules/wizard/CreateRuleSnapshotContainer';

export const metadata: Metadata = {
  title: 'Create Rule Snapshot',
};

/**
 * Create Rule Snapshot wizard. Matches Figma frames `1299:9667` (Step 1),
 * `1299:9808 / 9990 / 10726` (Step 2 mode variants), `1299:11139` (Step 3).
 */
export default async function CreateRuleSnapshotPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <CreateRuleSnapshotContainer dealId={id} />;
}

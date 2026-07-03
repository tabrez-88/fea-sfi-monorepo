import type { Metadata } from 'next';

import { DocumentsListView } from '@/components/documents/DocumentsListView';

export const metadata: Metadata = {
  title: 'Documents',
};

/** MS-3 Screen 3.4 — Documents List (`1158:55276`). */
export default async function DocumentsPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  return <DocumentsListView dealId={id} />;
}

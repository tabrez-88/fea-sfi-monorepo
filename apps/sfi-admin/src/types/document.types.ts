/** MS-3 backend DocumentType enum — includes the Wave 3 Carta additions. */
export const DocumentType = {
  CONTRACT: 'CONTRACT',
  AMENDMENT: 'AMENDMENT',
  REVENUE_REPORT: 'REVENUE_REPORT',
  SETTLEMENT_REPORT: 'SETTLEMENT_REPORT',
  AUDIT_REPORT: 'AUDIT_REPORT',
  PROOF_RECORD: 'PROOF_RECORD',
  // MS-3 Wave 3 — Carta-style intake taxonomy.
  OFFERING_DOCUMENT: 'OFFERING_DOCUMENT',
  INVESTOR_AGREEMENT: 'INVESTOR_AGREEMENT',
  DISCLOSURE: 'DISCLOSURE',
  REVENUE_SHARE_TERMS: 'REVENUE_SHARE_TERMS',
  OTHER: 'OTHER',
} as const;

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const DocumentLinkedToType = {
  DEAL: 'DEAL',
  BATCH: 'BATCH',
  RUN: 'RUN',
} as const;

export type DocumentLinkedToType =
  (typeof DocumentLinkedToType)[keyof typeof DocumentLinkedToType];

/** MS-3 Wave 4 — human-readable linked-scope descriptor for Screen 3.4. */
export interface DocumentLinkedTo {
  type: DocumentLinkedToType;
  label: string;
  id: string | null;
}

export interface DocumentUploader {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface Document {
  id: string;
  dealId: string | null;
  revenueBatchId: string | null;
  settlementRunId: string | null;
  linkedTo: DocumentLinkedTo;
  docType: DocumentType;
  fileName: string;
  storageUrl: string;
  checksum: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: DocumentUploader | null;
  archivedAt: string | null;
  archivedBy: DocumentUploader | null;
  archivedReason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export type DocumentListParams = Readonly<{
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  docType?: DocumentType;
  archived?: 'true' | 'false' | 'all';
  uploadedByUserId?: string;
  search?: string;
  uploadedFrom?: string;
  uploadedTo?: string;
}>;

export const ParticipantBehavior = {
  FEE_DEDUCTION: 'FEE_DEDUCTION',
  RECOUPMENT: 'RECOUPMENT',
  NET_PROFIT_SHARE: 'NET_PROFIT_SHARE',
  FLAT_FEE: 'FLAT_FEE',
  PASS_THROUGH: 'PASS_THROUGH',
} as const;

export type ParticipantBehavior =
  (typeof ParticipantBehavior)[keyof typeof ParticipantBehavior];

export interface Participant {
  id: string;
  dealId: string;
  name: string;
  roleName: string;
  behaviorType: ParticipantBehavior;
  externalId: string | null;
  email: string | null;
  investmentAmount: number | null;
  units: number | null;
  pricePerUnit: number | null;
  poolMember: boolean | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateParticipantInput {
  name: string;
  roleName: string;
  behaviorType: ParticipantBehavior;
  externalId?: string;
  email?: string;
  investmentAmount?: number;
  units?: number;
  pricePerUnit?: number;
  poolMember?: boolean;
  /**
   * Opt into `(dealId, name)` upsert matching. Set by the Investor Pool CSV
   * import, whose template has no email / externalId to match on — without it
   * a re-import duplicates every member.
   */
  matchByName?: boolean;
  metadata?: Record<string, unknown>;
}

export type UpdateParticipantInput = Partial<CreateParticipantInput>;

/**
 * Result of `POST .../participants/bulk-delete` and
 * `PATCH .../participants/bulk-behavior`. `skipped` holds ids the server
 * refused because they belong to another deal (or no longer exist), so a
 * stale selection reports partial success instead of failing outright.
 */
export interface BulkActionResult {
  affected: number;
  skipped: string[];
}

/**
 * Per-row outcome the BE returns inside `BulkImportResult.rows[]`. Mirrors
 * `ImportRowOutcomeDto` on the API.
 */
export const ImportRowOutcome = {
  CREATED: 'created',
  UPDATED: 'updated',
  SKIPPED: 'skipped',
} as const;

export type ImportRowOutcome = (typeof ImportRowOutcome)[keyof typeof ImportRowOutcome];

export interface ImportParticipantRow {
  row: number;
  success: boolean;
  outcome: ImportRowOutcome;
  warnings?: string[];
  error?: string;
  participant?: Participant;
}

export interface BulkImportResult {
  imported: number;
  failed: number;
  rows: ImportParticipantRow[];
}

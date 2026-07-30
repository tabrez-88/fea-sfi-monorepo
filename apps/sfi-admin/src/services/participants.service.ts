import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/lib/axios';
import type { ListParams, PaginatedResponse } from '@/types/api.types';
import type {
  BulkActionResult,
  BulkImportResult,
  CreateParticipantInput,
  Participant,
  ParticipantBehavior,
  UpdateParticipantInput,
} from '@/types/participant.types';

export type ParticipantListParams = ListParams;

export type ImportCsvOptions = Readonly<{
  /** Validate without writing. Used by the Preview Import modal. */
  dryRun?: boolean;
  /** Continue past hard-failed rows. Tied to the "Skip rows with errors" checkbox. */
  skipErrors?: boolean;
}>;

/**
 * 8-column CSV header shipped by the "Download CSV Template" button. Order
 * is fixed (BE detects header variants by column count + names). `externalId`
 * is deliberately omitted from the template since the in-app UI hides it
 * from Phase 1; BE still accepts the legacy 5-col and v2 9-col headers for
 * back-compat with existing exports.
 */
const TEMPLATE_HEADERS = [
  'name',
  'roleName',
  'behaviorType',
  'email',
  'investmentAmount',
  'units',
  'pricePerUnit',
  'poolMember',
] as const;

const TEMPLATE_SAMPLE_ROWS: ReadonlyArray<ReadonlyArray<string>> = [
  ['Alice Chen', 'Investor', 'RECOUPMENT', 'alice@example.com', '5000', '50', '100', 'true'],
  ['Global Cinema Partners', 'Distributor', 'FEE_DEDUCTION', 'gc@cinema.com', '', '', '', ''],
];

export const participantsService = {
  async list(
    dealId: string,
    params?: ParticipantListParams,
  ): Promise<PaginatedResponse<Participant>> {
    const { data } = await apiClient.get<PaginatedResponse<Participant>>(
      API_ENDPOINTS.PARTICIPANTS.LIST(dealId),
      { params },
    );
    return data;
  },

  async listRoles(dealId: string, q?: string): Promise<string[]> {
    const { data } = await apiClient.get<string[]>(
      API_ENDPOINTS.PARTICIPANTS.ROLES(dealId),
      { params: q ? { q } : undefined },
    );
    return data;
  },

  async getById(id: string): Promise<Participant> {
    const { data } = await apiClient.get<Participant>(
      API_ENDPOINTS.PARTICIPANTS.DETAIL(id),
    );
    return data;
  },

  async create(
    dealId: string,
    input: CreateParticipantInput,
  ): Promise<Participant> {
    const { data } = await apiClient.post<Participant>(
      API_ENDPOINTS.PARTICIPANTS.CREATE(dealId),
      input,
    );
    return data;
  },

  async update(id: string, input: UpdateParticipantInput): Promise<Participant> {
    const { data } = await apiClient.patch<Participant>(
      API_ENDPOINTS.PARTICIPANTS.DETAIL(id),
      input,
    );
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.PARTICIPANTS.DETAIL(id));
  },

  async bulkRemove(
    dealId: string,
    participantIds: ReadonlyArray<string>,
  ): Promise<BulkActionResult> {
    const { data } = await apiClient.post<BulkActionResult>(
      API_ENDPOINTS.PARTICIPANTS.BULK_DELETE(dealId),
      { participantIds },
    );
    return data;
  },

  async bulkSetBehavior(
    dealId: string,
    participantIds: ReadonlyArray<string>,
    behaviorType: ParticipantBehavior,
  ): Promise<BulkActionResult> {
    const { data } = await apiClient.patch<BulkActionResult>(
      API_ENDPOINTS.PARTICIPANTS.BULK_BEHAVIOR(dealId),
      { participantIds, behaviorType },
    );
    return data;
  },

  async importCsv(
    dealId: string,
    file: File,
    options: ImportCsvOptions = {},
  ): Promise<BulkImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const params: Record<string, boolean> = {};
    if (options.dryRun) params.dryRun = true;
    if (options.skipErrors) params.skipErrors = true;

    const { data } = await apiClient.post<BulkImportResult>(
      API_ENDPOINTS.PARTICIPANTS.IMPORT(dealId),
      formData,
      {
        params,
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );
    return data;
  },

  /**
   * Generate the in-app CSV template (8-col, no externalId) as a string.
   * Pairs with `downloadCsvTemplate` for the browser save flow.
   */
  buildCsvTemplate(): string {
    const header = TEMPLATE_HEADERS.join(',');
    const sample = TEMPLATE_SAMPLE_ROWS.map((row) => row.join(','));
    return [header, ...sample].join('\r\n');
  },
};

/**
 * Trigger a browser download of the in-app CSV template. Runs entirely
 * client-side, no network round-trip required.
 */
export function downloadCsvTemplate(filename = 'participants-template.csv'): void {
  const blob = new Blob([participantsService.buildCsvTemplate()], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Serialize the per-row failed entries from a `BulkImportResult` into a
 * downloadable error report CSV. Used by the "Download errors" button on
 * the Import Complete modal so admins can fix their source data offline.
 */
export function downloadImportErrors(
  result: BulkImportResult,
  filename = 'participants-import-errors.csv',
): void {
  const skipped = result.rows.filter((r) => !r.success);
  if (skipped.length === 0) return;

  const headers = ['row', 'name', 'roleName', 'behaviorType', 'email', 'reason'];
  const rows = skipped.map((r) => {
    const p = r.participant;
    return [
      String(r.row),
      escapeCsvField(p?.name ?? ''),
      escapeCsvField(p?.roleName ?? ''),
      p?.behaviorType ?? '',
      escapeCsvField(p?.email ?? ''),
      escapeCsvField(r.error ?? ''),
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

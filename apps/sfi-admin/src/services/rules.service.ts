import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/lib/axios';
import type { ListParams, PaginatedResponse } from '@/types/api.types';
import type {
  RuleSnapshot,
  StoredRuleSnapshot,
} from '@/types/rule-snapshot.types';

export type RuleSnapshotListParams = ListParams;

export interface RuleSnapshotParticipantInput {
  participantId: string;
  participantData?: Record<string, unknown>;
}

/**
 * Payload accepted by `POST /deals/:dealId/rule-snapshots`. Mirrors the BE
 * `CreateRuleSnapshotDto`. The `rules` shape accepts either v1 (legacy
 * flat) or v2 (mode-discriminated) per the BE engine's schemaVersion
 * branching. The Create wizard always writes v2 once the feature flag is
 * on, but the type stays permissive so future verification flows can
 * round-trip v1 snapshots without a separate type.
 */
export interface CreateRuleSnapshotInput {
  effectiveFrom?: string;
  rules: StoredRuleSnapshot;
  participants: RuleSnapshotParticipantInput[];
  notes?: string;
}

export const rulesService = {
  async list(
    dealId: string,
    params?: RuleSnapshotListParams,
  ): Promise<PaginatedResponse<RuleSnapshot>> {
    const { data } = await apiClient.get<PaginatedResponse<RuleSnapshot>>(
      API_ENDPOINTS.RULES.LIST(dealId),
      { params },
    );
    return data;
  },

  async getById(id: string): Promise<RuleSnapshot> {
    const { data } = await apiClient.get<RuleSnapshot>(
      API_ENDPOINTS.RULES.DETAIL(id),
    );
    return data;
  },

  async create(
    dealId: string,
    input: CreateRuleSnapshotInput,
  ): Promise<RuleSnapshot> {
    const { data } = await apiClient.post<RuleSnapshot>(
      API_ENDPOINTS.RULES.LIST(dealId),
      input,
    );
    return data;
  },
};

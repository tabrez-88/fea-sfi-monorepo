import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/lib/axios';
import type { PaginatedResponse } from '@/types/api.types';
import type {
  CreateCorrectionRunInput,
  CreateSettlementRunInput,
  FinalizeSettlementResult,
  PreviewSettlementResult,
  ProofVerificationResult,
  SettlementRun,
  SettlementRunDetail,
  SettlementRunListParams,
} from '@/types/settlement.types';

/**
 * Settlement runs API surface (MS-4). Thin wrappers around the BE
 * endpoints; composition + caching live in the hook layer.
 */
export const settlementService = {
  async list(
    dealId: string,
    params?: SettlementRunListParams,
  ): Promise<PaginatedResponse<SettlementRun>> {
    const { data } = await apiClient.get<PaginatedResponse<SettlementRun>>(
      API_ENDPOINTS.SETTLEMENT.RUNS(dealId),
      { params },
    );
    return data;
  },

  async getById(id: string): Promise<SettlementRunDetail> {
    const { data } = await apiClient.get<SettlementRunDetail>(
      API_ENDPOINTS.SETTLEMENT.RUN_DETAIL(id),
    );
    return data;
  },

  async create(
    dealId: string,
    input: CreateSettlementRunInput,
  ): Promise<SettlementRun> {
    const { data } = await apiClient.post<SettlementRun>(
      API_ENDPOINTS.SETTLEMENT.RUNS(dealId),
      input,
    );
    return data;
  },

  async preview(id: string): Promise<PreviewSettlementResult> {
    const { data } = await apiClient.post<PreviewSettlementResult>(
      API_ENDPOINTS.SETTLEMENT.PREVIEW(id),
      {},
    );
    return data;
  },

  async finalize(id: string): Promise<FinalizeSettlementResult> {
    const { data } = await apiClient.post<FinalizeSettlementResult>(
      API_ENDPOINTS.SETTLEMENT.FINALIZE(id),
      {},
    );
    return data;
  },

  async verify(id: string): Promise<ProofVerificationResult> {
    const { data } = await apiClient.post<ProofVerificationResult>(
      API_ENDPOINTS.SETTLEMENT.VERIFY(id),
      {},
    );
    return data;
  },

  async createCorrection(
    id: string,
    input: CreateCorrectionRunInput,
  ): Promise<SettlementRun> {
    const { data } = await apiClient.post<SettlementRun>(
      API_ENDPOINTS.SETTLEMENT.CORRECTIONS(id),
      input,
    );
    return data;
  },
};

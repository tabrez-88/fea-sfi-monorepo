import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/lib/axios';
import type { PaginatedResponse } from '@/types/api.types';
import type {
  RevenueBatch,
  RevenueBatchListParams,
  RevenueBatchSummary,
} from '@/types/revenue.types';

/**
 * Revenue batches API surface. All methods are thin wrappers around the
 * MS-3 BE endpoints — the FE keeps composition + caching concerns in the
 * hook layer.
 */
export const revenueService = {
  async list(
    dealId: string,
    params?: RevenueBatchListParams,
  ): Promise<PaginatedResponse<RevenueBatch>> {
    const { data } = await apiClient.get<PaginatedResponse<RevenueBatch>>(
      API_ENDPOINTS.REVENUE.LIST(dealId),
      { params },
    );
    return data;
  },

  async summary(dealId: string): Promise<RevenueBatchSummary> {
    const { data } = await apiClient.get<RevenueBatchSummary>(
      API_ENDPOINTS.REVENUE.SUMMARY(dealId),
    );
    return data;
  },

  async getById(id: string): Promise<RevenueBatch> {
    const { data } = await apiClient.get<RevenueBatch>(
      API_ENDPOINTS.REVENUE.DETAIL(id),
    );
    return data;
  },

  async validate(id: string, validationNotes?: string): Promise<RevenueBatch> {
    const { data } = await apiClient.patch<RevenueBatch>(
      API_ENDPOINTS.REVENUE.VALIDATE(id),
      validationNotes ? { validationNotes } : {},
    );
    return data;
  },

  async reject(id: string, rejectionReason: string): Promise<RevenueBatch> {
    const { data } = await apiClient.patch<RevenueBatch>(
      API_ENDPOINTS.REVENUE.REJECT(id),
      { rejectionReason },
    );
    return data;
  },
};

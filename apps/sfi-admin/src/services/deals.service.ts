import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/lib/axios';
import type { ListParams, PaginatedResponse } from '@/types/api.types';
import type {
  CreateDealInput,
  Deal,
  DealStatus,
  DealsCountsResponse,
  UpdateDealInput,
} from '@/types/deal.types';

export interface DealListParams extends ListParams {
  status?: DealStatus;
}

export const dealsService = {
  async list(params?: DealListParams): Promise<PaginatedResponse<Deal>> {
    const { data } = await apiClient.get<PaginatedResponse<Deal>>(
      API_ENDPOINTS.DEALS.LIST,
      { params },
    );
    return data;
  },

  async counts(): Promise<DealsCountsResponse> {
    const { data } = await apiClient.get<DealsCountsResponse>(
      API_ENDPOINTS.DEALS.COUNTS,
    );
    return data;
  },

  async getById(id: string): Promise<Deal> {
    const { data } = await apiClient.get<Deal>(API_ENDPOINTS.DEALS.DETAIL(id));
    return data;
  },

  async create(input: CreateDealInput): Promise<Deal> {
    const { data } = await apiClient.post<Deal>(
      API_ENDPOINTS.DEALS.CREATE,
      input,
    );
    return data;
  },

  async update(id: string, input: UpdateDealInput): Promise<Deal> {
    const { data } = await apiClient.patch<Deal>(
      API_ENDPOINTS.DEALS.UPDATE(id),
      input,
    );
    return data;
  },

  async duplicate(id: string): Promise<Deal> {
    const { data } = await apiClient.post<Deal>(
      API_ENDPOINTS.DEALS.DUPLICATE(id),
    );
    return data;
  },

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.delete<{ success: boolean; message: string }>(
      API_ENDPOINTS.DEALS.DELETE(id),
    );
    return data;
  },
};

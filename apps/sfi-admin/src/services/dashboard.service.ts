import { apiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/constants/api';
import type {
  DashboardPendingReviews,
  DashboardSummary,
} from '@/types/dashboard.types';

export const dashboardService = {
  async summary(): Promise<DashboardSummary> {
    const { data } = await apiClient.get<DashboardSummary>(
      API_ENDPOINTS.DASHBOARD.SUMMARY,
    );
    return data;
  },

  async pendingReviews(): Promise<DashboardPendingReviews> {
    const { data } = await apiClient.get<DashboardPendingReviews>(
      API_ENDPOINTS.DASHBOARD.PENDING_REVIEWS,
    );
    return data;
  },
};

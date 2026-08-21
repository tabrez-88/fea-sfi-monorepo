import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/lib/axios';
import type {
  ParticipantStatement,
  RecoupmentReport,
} from '@/types/reports.types';

/** MS-5 report reads (Screens 5.3 and 5.4). */
export const reportsService = {
  async recoupment(dealId: string): Promise<RecoupmentReport> {
    const { data } = await apiClient.get<RecoupmentReport>(
      API_ENDPOINTS.REPORTS.RECOUPMENT(dealId),
    );
    return data;
  },

  async statement(
    dealId: string,
    participantId: string,
  ): Promise<ParticipantStatement> {
    const { data } = await apiClient.get<ParticipantStatement>(
      API_ENDPOINTS.REPORTS.STATEMENT(dealId, participantId),
    );
    return data;
  },
};

import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/lib/axios';
import type { PaginatedResponse } from '@/types/api.types';
import type {
  Document,
  DocumentListParams,
  DocumentType,
} from '@/types/document.types';

export type UploadDocumentInput = Readonly<{
  file: File;
  docType: DocumentType;
  revenueBatchId?: string;
  settlementRunId?: string;
  metadata?: Record<string, unknown>;
}>;

export const documentsService = {
  async listByDeal(
    dealId: string,
    params?: DocumentListParams,
  ): Promise<PaginatedResponse<Document>> {
    const { data } = await apiClient.get<PaginatedResponse<Document>>(
      API_ENDPOINTS.DOCUMENTS.LIST_BY_DEAL(dealId),
      { params },
    );
    return data;
  },

  async listByBatch(
    batchId: string,
    params?: DocumentListParams,
  ): Promise<PaginatedResponse<Document>> {
    const { data } = await apiClient.get<PaginatedResponse<Document>>(
      API_ENDPOINTS.DOCUMENTS.LIST_BY_BATCH(batchId),
      { params },
    );
    return data;
  },

  async listByRun(
    runId: string,
    params?: DocumentListParams,
  ): Promise<PaginatedResponse<Document>> {
    const { data } = await apiClient.get<PaginatedResponse<Document>>(
      API_ENDPOINTS.DOCUMENTS.LIST_BY_RUN(runId),
      { params },
    );
    return data;
  },

  async getById(id: string): Promise<Document> {
    const { data } = await apiClient.get<Document>(
      API_ENDPOINTS.DOCUMENTS.DETAIL(id),
    );
    return data;
  },

  async uploadForDeal(
    dealId: string,
    input: UploadDocumentInput,
  ): Promise<Document> {
    const form = new FormData();
    form.append('file', input.file);
    form.append('docType', input.docType);
    if (input.revenueBatchId) form.append('revenueBatchId', input.revenueBatchId);
    if (input.settlementRunId) form.append('settlementRunId', input.settlementRunId);
    if (input.metadata) form.append('metadata', JSON.stringify(input.metadata));

    const { data } = await apiClient.post<Document>(
      API_ENDPOINTS.DOCUMENTS.UPLOAD_BY_DEAL(dealId),
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },

  async archive(id: string, reason?: string): Promise<Document> {
    const { data } = await apiClient.post<Document>(
      API_ENDPOINTS.DOCUMENTS.ARCHIVE(id),
      reason ? { reason } : {},
    );
    return data;
  },

  async restore(id: string): Promise<Document> {
    const { data } = await apiClient.post<Document>(
      API_ENDPOINTS.DOCUMENTS.RESTORE(id),
      {},
    );
    return data;
  },

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.delete<{ success: boolean; message: string }>(
      API_ENDPOINTS.DOCUMENTS.DELETE(id),
    );
    return data;
  },
};

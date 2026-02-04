import { randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { PaginationQueryDto } from '../../deals/dto';
import {
  UploadDocumentDto,
  DocumentResponseDto,
  DocumentListResponseDto,
  DocumentTypeEnum,
} from '../dto';

interface DocumentFilter {
  dealId?: string;
  revenueBatchId?: string;
  settlementRunId?: string;
}

/**
 * Documents Service
 *
 * Handles document storage and evidence management.
 *
 * Responsibilities:
 * - Handle file uploads with checksum computation
 * - Store documents in object storage
 * - Retrieve documents by ID or associations
 * - Link documents to deals, revenue batches, and settlement runs
 */
@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Upload a document
   *
   * @param file - The uploaded file
   * @param uploadDto - Document metadata and associations
   * @returns The created document response
   */
  async uploadDocument(
    file: Express.Multer.File,
    uploadDto: UploadDocumentDto,
  ): Promise<DocumentResponseDto> {
    this.logger.log(`Uploading document: ${file?.originalname || 'unknown'}`);

    // TODO: Implement actual file storage and checksum computation
    // For now, return a dummy response
    const documentId = randomUUID();
    const now = new Date().toISOString();

    return {
      id: documentId,
      fileName: file?.originalname || 'document.pdf',
      mimeType: file?.mimetype || 'application/pdf',
      fileSize: file?.size || 1024,
      checksum: 'sha256:dummy-checksum-' + documentId.slice(0, 8),
      storageUrl: `https://storage.example.com/documents/${documentId}`,
      docType: uploadDto.docType as DocumentTypeEnum,
      dealId: uploadDto.dealId || null,
      revenueBatchId: uploadDto.revenueBatchId || null,
      settlementRunId: uploadDto.settlementRunId || null,
      metadata: uploadDto.metadata || {},
      uploadedAt: now,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * List documents with filters
   *
   * @param filter - Filter by deal, revenue batch, or settlement run
   * @param query - Pagination parameters
   * @returns Paginated list of documents
   */
  async listDocuments(
    filter: DocumentFilter,
    query: PaginationQueryDto,
  ): Promise<DocumentListResponseDto> {
    const { page = 1, limit = 20 } = query;

    this.logger.log(`Listing documents with filter: ${JSON.stringify(filter)}`);

    // TODO: Implement actual database query
    // For now, return dummy data
    const dummyDocuments: DocumentResponseDto[] = [
      {
        id: randomUUID(),
        fileName: 'contract-v1.pdf',
        mimeType: 'application/pdf',
        fileSize: 245678,
        checksum: 'sha256:abc123def456',
        storageUrl: 'https://storage.example.com/documents/doc-1',
        docType: DocumentTypeEnum.CONTRACT,
        dealId: filter.dealId || null,
        revenueBatchId: filter.revenueBatchId || null,
        settlementRunId: filter.settlementRunId || null,
        metadata: {},
        uploadedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: randomUUID(),
        fileName: 'amendment-1.pdf',
        mimeType: 'application/pdf',
        fileSize: 123456,
        checksum: 'sha256:def789ghi012',
        storageUrl: 'https://storage.example.com/documents/doc-2',
        docType: DocumentTypeEnum.AMENDMENT,
        dealId: filter.dealId || null,
        revenueBatchId: filter.revenueBatchId || null,
        settlementRunId: filter.settlementRunId || null,
        metadata: {},
        uploadedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    return {
      data: dummyDocuments,
      meta: {
        page,
        limit,
        total: 2,
        totalPages: 1,
      },
    };
  }

  /**
   * Get a document by ID
   *
   * @param id - The document ID
   * @returns The document details
   */
  async getDocument(id: string): Promise<DocumentResponseDto> {
    this.logger.log(`Fetching document: ${id}`);

    // TODO: Implement actual database lookup
    // For now, return dummy data
    const now = new Date().toISOString();

    return {
      id,
      fileName: 'sample-document.pdf',
      mimeType: 'application/pdf',
      fileSize: 567890,
      checksum: 'sha256:sample-checksum-' + id.slice(0, 8),
      storageUrl: `https://storage.example.com/documents/${id}`,
      docType: DocumentTypeEnum.OTHER,
      dealId: null,
      revenueBatchId: null,
      settlementRunId: null,
      metadata: { note: 'This is a sample document' },
      uploadedAt: now,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Delete a document
   *
   * @param id - The document ID to delete
   * @returns Success status and message
   */
  async deleteDocument(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Deleting document: ${id}`);

    // TODO: Implement actual deletion
    // - Check if document exists
    // - Check if document is protected (e.g., finalized settlement)
    // - Delete from storage
    // - Delete from database

    return {
      success: true,
      message: `Document ${id} has been deleted successfully`,
    };
  }
}

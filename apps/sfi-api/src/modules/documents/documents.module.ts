import { Module } from '@nestjs/common';

import { DocumentsController } from './controllers/documents.controller';
import { DocumentsService } from './services/documents.service';

/**
 * Documents Module
 *
 * Handles document storage and evidence management.
 *
 * Features:
 * - Document upload with multipart/form-data
 * - SHA-256 checksum computation for integrity verification
 * - Document retrieval by ID or associations
 * - Document linking to deals, revenue batches, and settlement runs
 * - Secure object storage integration
 */
@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}

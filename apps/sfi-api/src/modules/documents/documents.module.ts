import { Module } from '@nestjs/common';

import { AuditLogModule } from '../audit-log/audit-log.module';

import { DocumentsController } from './controllers/documents.controller';
import { DocumentsService } from './services/documents.service';

/**
 * Documents Module (FB-003 Run 4)
 *
 * Real implementation: Prisma-backed persistence + storage-adapter
 * file IO + uploadedBy capture + archive/restore + audit-log + raw
 * streaming endpoint for the FE Preview drawer (Round 3 Comment 16 +
 * Round 4 Comments 18–22).
 *
 * Storage backend is injected via `FILE_STORAGE` from the global
 * `StorageModule` (defaults to `LocalFileStorage`). Swap to GCS/S3
 * later via `STORAGE_BACKEND` env without touching this module.
 */
@Module({
  imports: [AuditLogModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}

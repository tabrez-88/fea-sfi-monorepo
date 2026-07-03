import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';

import { AuditLogModule } from '../audit-log/audit-log.module';

import { DocumentsController } from './controllers/documents.controller';
import { DocumentsService } from './services/documents.service';

/**
 * Default max upload size = 50 MB (per Screen 3.5 Upload Document spec).
 * Overridable via `MAX_UPLOAD_SIZE_BYTES` env for ops. When a client
 * exceeds this, Multer emits a `LIMIT_FILE_SIZE` error which Nest maps
 * to HTTP 413 Payload Too Large.
 */
const DEFAULT_MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

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
  imports: [
    AuditLogModule,
    // MulterModule.registerAsync so the file size limit is enforced
    // consistently across every FileInterceptor in this module. Without
    // this the default is unlimited and Screen 3.5's 50MB cap would live
    // only in FE validation (bypassable by any script/curl).
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        limits: {
          fileSize: Number(
            config.get<string>('MAX_UPLOAD_SIZE_BYTES') ?? DEFAULT_MAX_UPLOAD_BYTES,
          ),
        },
      }),
    }),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}

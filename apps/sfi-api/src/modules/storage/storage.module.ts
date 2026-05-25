/**
 * Storage Module (FB-003 Run 4 / BE-FB003-DOCUMENTS-V1)
 *
 * Provides an `IFileStorage` adapter via the `FILE_STORAGE` DI token.
 * Defaults to `LocalFileStorage` (writes to disk under
 * `STORAGE_LOCAL_PATH`, defaults to `./storage/documents`). Future
 * adapters (GCS, S3, etc.) can opt in via `STORAGE_BACKEND` env.
 *
 * The module exports BOTH the interface token and the concrete
 * `LocalFileStorage` class — the latter is needed by the streaming
 * controller to verify preview tokens (which is a backend-specific
 * concern, not part of the interface).
 */

import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';

import { LocalFileStorage } from './local-file-storage';
import { FILE_STORAGE, type IFileStorage } from './storage.interface';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [
    LocalFileStorage,
    {
      provide: FILE_STORAGE,
      useFactory: (config: ConfigService, jwt: JwtService): IFileStorage => {
        const backend = config.get<string>('STORAGE_BACKEND') ?? 'local';
        switch (backend) {
          case 'local':
            return new LocalFileStorage(config, jwt);
          // case 'gcs': return new GcsFileStorage(...) — slot in here when needed
          default:
            throw new Error(
              `Unknown STORAGE_BACKEND: ${backend}. Supported: 'local'.`,
            );
        }
      },
      inject: [ConfigService, JwtService],
    },
  ],
  exports: [FILE_STORAGE, LocalFileStorage],
})
export class StorageModule {}

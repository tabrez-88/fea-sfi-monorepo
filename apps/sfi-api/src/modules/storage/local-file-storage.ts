/**
 * Local Filesystem Storage Adapter (FB-003 Run 4 / BE-FB003-DOCUMENTS-V1)
 *
 * Default storage backend — writes to a directory on disk. Works on
 * dev machines and on a Contabo VM (just point `STORAGE_LOCAL_PATH` at
 * a mounted volume). GCS adapter slots in alongside this when needed.
 *
 * Storage key format: `<keyPrefix>/<uuid>-<sanitized-fileName>` so:
 *   - keys are unique even when two files share a name
 *   - the human-readable filename is preserved for ops visibility
 *   - the prefix groups related files (e.g. all docs for a deal)
 *
 * Preview URLs go through the API proxy (`GET /documents/:id/raw`) with
 * a short-lived JWT — no public bucket access, no IP-restricted signed
 * URLs. The proxy approach also lets us audit every download.
 */

import { createHash, randomUUID } from 'node:crypto';
import {
  createReadStream,
  createWriteStream,
  promises as fs,
  type ReadStream,
} from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import {
  IFileStorage,
  StorageNotFoundError,
  type UploadMetadata,
  type UploadResult,
} from './storage.interface';

@Injectable()
export class LocalFileStorage implements IFileStorage {
  private readonly logger = new Logger(LocalFileStorage.name);
  private readonly rootDir: string;
  private readonly apiBaseUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {
    this.rootDir = resolve(
      this.config.get<string>('STORAGE_LOCAL_PATH') ?? './storage/documents',
    );
    this.apiBaseUrl = this.config.get<string>('API_BASE_URL') ?? 'http://localhost:3001';
  }

  async upload(stream: Readable, metadata: UploadMetadata): Promise<UploadResult> {
    const storageKey = this.buildStorageKey(metadata);
    const absPath = this.toAbsolutePath(storageKey);

    await fs.mkdir(dirname(absPath), { recursive: true });

    // Stream pipe + checksum in one pass. The hash listens via a tap so
    // we don't have to read the file back from disk after writing.
    const hash = createHash('sha256');
    let fileSize = 0;

    const tap = new Readable({
      read() {
        /* no-op — pushes happen via the upstream pipe below */
      },
    });

    stream.on('data', (chunk: Buffer) => {
      hash.update(chunk);
      fileSize += chunk.length;
      tap.push(chunk);
    });
    stream.on('end', () => tap.push(null));
    stream.on('error', (err) => tap.destroy(err));

    const writeStream = createWriteStream(absPath);
    try {
      await pipeline(tap, writeStream);
    } catch (err) {
      // Clean up the partial file on failure so we don't leave orphans.
      await fs.unlink(absPath).catch(() => undefined);
      throw err;
    }

    const checksum = `sha256:${hash.digest('hex')}`;
    this.logger.log(`Uploaded ${fileSize} bytes to ${storageKey} (${checksum})`);
    return { storageKey, checksum, fileSize };
  }

  async getStream(storageKey: string): Promise<ReadStream> {
    const absPath = this.toAbsolutePath(storageKey);
    try {
      await fs.access(absPath);
    } catch {
      throw new StorageNotFoundError(storageKey);
    }
    return createReadStream(absPath);
  }

  async delete(storageKey: string): Promise<void> {
    const absPath = this.toAbsolutePath(storageKey);
    try {
      await fs.unlink(absPath);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new StorageNotFoundError(storageKey);
      }
      throw err;
    }
  }

  /**
   * For local FS, return a proxy URL pointing at the API streaming
   * endpoint. The JWT encodes the storage key + expiry; the streaming
   * controller verifies it before serving the file.
   */
  async getPreviewUrl(storageKey: string, ttlSeconds: number): Promise<string> {
    const token = await this.jwt.signAsync(
      { sk: storageKey, kind: 'doc-preview' },
      { expiresIn: ttlSeconds, secret: this.previewSecret() },
    );
    // Note: the actual streaming endpoint resolves the storage key from
    // the document id (so callers can't request arbitrary paths). The
    // JWT scopes the request to a specific key + TTL.
    return `${this.apiBaseUrl}/documents/raw?token=${encodeURIComponent(token)}`;
  }

  /**
   * Verify a preview token and return the embedded storage key. Throws
   * when expired / tampered. Called by the streaming controller.
   */
  async verifyPreviewToken(token: string): Promise<string> {
    const payload = await this.jwt.verifyAsync<{ sk: string; kind: string }>(token, {
      secret: this.previewSecret(),
    });
    if (payload.kind !== 'doc-preview' || typeof payload.sk !== 'string') {
      throw new Error('Invalid preview token');
    }
    return payload.sk;
  }

  // ──────────────────────────────────────────────────────────────────
  // Internals
  // ──────────────────────────────────────────────────────────────────

  private buildStorageKey(metadata: UploadMetadata): string {
    const sanitized = sanitizeFileName(metadata.fileName);
    const id = randomUUID();
    const prefix = metadata.keyPrefix ? `${trimSlashes(metadata.keyPrefix)}/` : '';
    return `${prefix}${id}-${sanitized}`;
  }

  /**
   * Resolve a storage key to an absolute path under the root dir, with
   * path-traversal defence. Any attempt to escape `rootDir` (via `..` or
   * absolute paths smuggled in via the key) throws.
   */
  private toAbsolutePath(storageKey: string): string {
    const joined = resolve(this.rootDir, storageKey);
    // Defence-in-depth: reject anything that resolves outside rootDir
    if (!joined.startsWith(this.rootDir + sep) && joined !== this.rootDir) {
      throw new Error(`Storage key escapes root: ${storageKey}`);
    }
    return joined;
  }

  /**
   * Preview JWTs use a separate secret from the auth access/refresh
   * tokens so a leaked preview token can never authenticate a session.
   * Falls back to the access secret in dev for convenience.
   */
  private previewSecret(): string {
    return (
      this.config.get<string>('STORAGE_PREVIEW_JWT_SECRET') ??
      this.config.get<string>('JWT_ACCESS_SECRET') ??
      'dev-preview-secret-do-not-use-in-prod'
    );
  }
}

function sanitizeFileName(name: string): string {
  // Strip path separators, then replace anything outside the whitelist
  // (alphanumerics, dots, underscores, hyphens) with `_`. The whitelist
  // also drops control chars + non-ASCII chars implicitly, so we don't
  // need an explicit control-char regex (would trip no-control-regex).
  const cleaned = name
    .replace(/[\\/]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 200);
  return cleaned.length > 0 ? cleaned : 'file';
}

function trimSlashes(s: string): string {
  return s.replace(/^\/+|\/+$/g, '');
}

// Re-export the join helper for the controller's streaming endpoint
export { join };

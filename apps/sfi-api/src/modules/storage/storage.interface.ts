/**
 * Storage Adapter Interface (FB-003 Run 4 / BE-FB003-DOCUMENTS-V1)
 *
 * Pluggable file-storage abstraction. Lets DocumentsService persist + read
 * file bytes without knowing about the underlying backend (local
 * filesystem on the Contabo VM today; future GCS/S3 adapter slots in
 * without touching DocumentsService).
 *
 * Decision context (this session): user is mid-migration from GCP to a
 * Contabo VM, so we shipped the local-filesystem adapter as the default
 * instead of adding a `@google-cloud/storage` dep. The GCS adapter is a
 * future opt-in selected via `STORAGE_BACKEND=gcs` env var.
 *
 * `storageKey` semantics: opaque adapter-managed identifier. For local
 * FS, it's a relative path under `STORAGE_LOCAL_PATH`. For GCS, it would
 * be `gs://bucket/object-name`. DocumentsService stores this key on
 * `Document.storageUrl` (column name is historical; it's a key now) and
 * regenerates the preview URL on every fetch via `getPreviewUrl()`.
 */

import { Readable } from 'node:stream';

export interface UploadMetadata {
  /** Original filename (used for sanitized storage key construction) */
  fileName: string;
  /** MIME type (passed through to storage backend metadata when supported) */
  mimeType: string;
  /** Size hint in bytes (optional — adapters may compute on stream) */
  fileSize?: number;
  /** Optional logical prefix for organizing keys (e.g. `deals/<dealId>/`) */
  keyPrefix?: string;
}

export interface UploadResult {
  /** Opaque storage key — pass to getStream / delete / getPreviewUrl */
  storageKey: string;
  /** SHA-256 hash of the uploaded bytes (computed server-side at upload) */
  checksum: string;
  /** Final byte count after the stream drained */
  fileSize: number;
}

/**
 * IFileStorage — adapter contract.
 *
 * All methods are async + side-effecting; implementations must clean up
 * on partial failure (no orphan files when upload throws). Storage keys
 * are opaque to callers — never parse them, never construct them.
 */
export interface IFileStorage {
  /**
   * Upload a file stream. Returns the assigned storage key + SHA-256
   * checksum + actual byte count. The adapter is responsible for stream
   * draining; callers must not consume the stream after passing it in.
   */
  upload(stream: Readable, metadata: UploadMetadata): Promise<UploadResult>;

  /**
   * Open a read stream for a previously-uploaded file. Throws
   * `StorageNotFoundError` if the key doesn't exist.
   */
  getStream(storageKey: string): Promise<Readable>;

  /**
   * Permanently remove the file (used by the archive endpoint when an
   * admin explicitly purges; Run 4 archive is soft-delete only, so the
   * service rarely calls this in v1).
   */
  delete(storageKey: string): Promise<void>;

  /**
   * Generate a time-limited preview URL the FE can fetch directly. For
   * GCS, this is a signed URL. For local FS, it's a proxy URL pointing
   * at the API's streaming endpoint with a short-lived JWT.
   */
  getPreviewUrl(storageKey: string, ttlSeconds: number): Promise<string>;
}

export class StorageNotFoundError extends Error {
  constructor(storageKey: string) {
    super(`Storage key not found: ${storageKey}`);
    this.name = 'StorageNotFoundError';
  }
}

/**
 * DI token for injecting the active adapter into NestJS providers.
 * StorageModule binds this to LocalFileStorage by default.
 */
export const FILE_STORAGE = Symbol('IFileStorage');

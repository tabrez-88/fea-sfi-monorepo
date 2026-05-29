import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Secret keys that will be loaded from GCP Secret Manager when
 * `SECRETS_PROVIDER=gcp`. Each key is suffixed with the upper-cased
 * `NODE_ENV` (e.g. `DATABASE_URL` → `DATABASE_URL_STAGING`).
 *
 * Note: `GCS_BUCKET_NAME` was removed when Documents storage moved to
 * the storage-adapter pattern (Run 4 / Contabo migration). If GCS ever
 * comes back, the adapter (`GcsFileStorage`) will read its bucket
 * directly from `STORAGE_GCS_BUCKET` env — independent of this list.
 */
const SECRET_KEYS = [
  'DATABASE_URL',
  'DIRECT_URL',
  // Auth — JWT signing
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  // Auth — Mailtrap SMTP (host/port are non-secret, set in env)
  'MAILTRAP_USER',
  'MAILTRAP_PASS',
  // Auth — public-facing app URL used inside email links
  'APP_URL',
  'CORS_ORIGIN',
  'LOG_LEVEL',
  'FRONTEND_URL',
  // Add more secrets as needed
] as const;

/**
 * Load secrets from GCP Secret Manager before NestJS app initialization.
 * This MUST be called before NestFactory.create() to ensure DATABASE_URL
 * is available when Prisma initializes.
 *
 * Provider-selection (Contabo migration):
 *   - When `SECRETS_PROVIDER=gcp` is set, this function loads secrets
 *     from GCP Secret Manager (the original behavior, preserved for
 *     teams still on GCP).
 *   - Otherwise (default, including unset), this function is a no-op
 *     and the app reads its config from plain environment variables
 *     (loaded by NestJS ConfigModule from `.env.*` files or set by
 *     systemd / docker-compose on the VM).
 *
 * Back-compat behavior: when `SECRETS_PROVIDER` is unset AND `NODE_ENV`
 * is staging/production AND `GCP_PROJECT_ID` is set, we still attempt
 * GCP loading — so existing GCP-deployed instances keep working without
 * an env-var change. To opt OUT of GCP on a GCP-deployed instance, set
 * `SECRETS_PROVIDER=env`.
 */
export async function loadGcpSecrets(): Promise<void> {
  const provider = process.env.SECRETS_PROVIDER?.toLowerCase();
  const nodeEnv = process.env.NODE_ENV?.toLowerCase();
  const hasGcpProject = Boolean(process.env.GCP_PROJECT_ID);

  // Explicit opt-out — Contabo / env-var path.
  if (provider === 'env') {
    console.log('[Secrets] SECRETS_PROVIDER=env — using process.env, skipping GCP.');
    return;
  }

  // Explicit opt-in — always go to GCP.
  // Auto-opt-in (back-compat) — staging/production with GCP_PROJECT_ID set.
  const shouldUseGcp =
    provider === 'gcp' ||
    (provider === undefined &&
      (nodeEnv === 'staging' || nodeEnv === 'production') &&
      hasGcpProject);

  if (!shouldUseGcp) {
    console.log(
      `[Secrets] Skipping GCP Secret Manager (provider=${provider ?? 'unset'}, ` +
        `nodeEnv=${nodeEnv}, hasGcpProject=${hasGcpProject}). ` +
        'Set SECRETS_PROVIDER=gcp to force.',
    );
    return;
  }

  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      'GCP_PROJECT_ID environment variable is required when SECRETS_PROVIDER=gcp',
    );
  }

  console.log('[Secrets] Loading secrets from Google Cloud Secret Manager...');
  const client = new SecretManagerServiceClient();

  const envSuffix = (nodeEnv ?? 'production').toUpperCase();

  for (const genericSecretName of SECRET_KEYS) {
    const secretNameInGCP = `${genericSecretName}_${envSuffix}`;

    try {
      const name = `projects/${projectId}/secrets/${secretNameInGCP}/versions/latest`;
      const [version] = await client.accessSecretVersion({ name });
      const payload = version.payload?.data?.toString();

      if (payload) {
        process.env[genericSecretName] = payload;
        console.log(`[Secrets] Loaded secret: ${genericSecretName}`);
      } else {
        console.warn(`[Secrets] Secret ${secretNameInGCP} has no payload.`);
      }
    } catch (error: unknown) {
      const gcpError = error as { code?: number };
      // Error code 5 = NOT_FOUND
      if (gcpError.code === 5) {
        // If we already have the env var, use it as fallback
        if (process.env[genericSecretName]) {
          console.warn(
            `[Secrets] Secret ${secretNameInGCP} not found in GCP. Using existing env variable.`,
          );
        } else {
          console.warn(`[Secrets] Secret not found: ${secretNameInGCP}. Skipping.`);
        }
      } else {
        // For other errors, if we have a fallback, use it
        if (process.env[genericSecretName]) {
          console.warn(
            `[Secrets] Failed to load ${secretNameInGCP} from GCP. Using existing env variable.`,
          );
        } else {
          console.error(`[Secrets] Failed to load required secret: ${secretNameInGCP}`);
          throw error;
        }
      }
    }
  }

  console.log(`[Secrets] Secrets for ${envSuffix} loaded successfully.`);
}

@Injectable()
export class GcpSecretsService {
  private readonly logger = new Logger(GcpSecretsService.name);
  private client: SecretManagerServiceClient | null = null;

  /**
   * Get a specific secret value (useful for on-demand secret access)
   */
  async getSecret(secretName: string): Promise<string | null> {
    const projectId = process.env.GCP_PROJECT_ID;
    if (!projectId) {
      throw new Error('GCP_PROJECT_ID not set');
    }

    if (!this.client) {
      this.client = new SecretManagerServiceClient();
    }

    const nodeEnv = process.env.NODE_ENV?.toUpperCase() || 'STAGING';
    const fullSecretName = `${secretName}_${nodeEnv}`;

    return this.accessSecretVersion(projectId, fullSecretName);
  }

  private async accessSecretVersion(
    projectId: string,
    secretName: string,
  ): Promise<string | null> {
    if (!this.client) {
      throw new Error('Secret Manager client not initialized');
    }

    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;

    try {
      const [version] = await this.client.accessSecretVersion({ name });
      const payload = version.payload?.data?.toString();

      if (!payload) {
        this.logger.warn(`Secret ${secretName} has no payload.`);
        return null;
      }

      return payload;
    } catch (error: unknown) {
      const gcpError = error as { code?: number };
      // Error code 5 = NOT_FOUND
      if (gcpError.code === 5) {
        this.logger.warn(`Secret not found: ${secretName}. Skipping.`);
        return null;
      }
      throw error;
    }
  }
}

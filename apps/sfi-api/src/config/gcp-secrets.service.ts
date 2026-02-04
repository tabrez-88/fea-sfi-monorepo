import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Secret keys that will be loaded from GCP Secret Manager.
 * Each key will be suffixed with _STAGING or _PRODUCTION based on NODE_ENV.
 *
 * Example: DATABASE_URL -> DATABASE_URL_STAGING in GCP Secret Manager
 */
const SECRET_KEYS = [
  'DATABASE_URL',
  'DIRECT_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'CORS_ORIGIN',
  'LOG_LEVEL',
  'FRONTEND_URL',
  // GCS for document storage
  'GCS_BUCKET_NAME',
  // Add more secrets as needed
] as const;

/**
 * Load secrets from GCP Secret Manager before NestJS app initialization.
 * This MUST be called before NestFactory.create() to ensure DATABASE_URL
 * is available when Prisma initializes.
 */
export async function loadGcpSecrets(): Promise<void> {
  const nodeEnv = process.env.NODE_ENV?.toLowerCase();

  // Only load secrets in staging or production
  if (nodeEnv !== 'staging' && nodeEnv !== 'production') {
    console.log(`[GcpSecrets] Skipping secret loading for environment: ${nodeEnv}`);
    return;
  }

  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      'GCP_PROJECT_ID environment variable is required for staging/production',
    );
  }

  console.log('[GcpSecrets] Loading secrets from Google Cloud Secret Manager...');
  const client = new SecretManagerServiceClient();

  const envSuffix = nodeEnv.toUpperCase();

  for (const genericSecretName of SECRET_KEYS) {
    const secretNameInGCP = `${genericSecretName}_${envSuffix}`;

    try {
      const name = `projects/${projectId}/secrets/${secretNameInGCP}/versions/latest`;
      const [version] = await client.accessSecretVersion({ name });
      const payload = version.payload?.data?.toString();

      if (payload) {
        process.env[genericSecretName] = payload;
        console.log(`[GcpSecrets] Loaded secret: ${genericSecretName}`);
      } else {
        console.warn(`[GcpSecrets] Secret ${secretNameInGCP} has no payload.`);
      }
    } catch (error: unknown) {
      const gcpError = error as { code?: number };
      // Error code 5 = NOT_FOUND
      if (gcpError.code === 5) {
        // If we already have the env var, use it as fallback
        if (process.env[genericSecretName]) {
          console.warn(
            `[GcpSecrets] Secret ${secretNameInGCP} not found in GCP. Using existing env variable.`,
          );
        } else {
          console.warn(`[GcpSecrets] Secret not found: ${secretNameInGCP}. Skipping.`);
        }
      } else {
        // For other errors, if we have a fallback, use it
        if (process.env[genericSecretName]) {
          console.warn(
            `[GcpSecrets] Failed to load ${secretNameInGCP} from GCP. Using existing env variable.`,
          );
        } else {
          console.error(`[GcpSecrets] Failed to load required secret: ${secretNameInGCP}`);
          throw error;
        }
      }
    }
  }

  console.log(`[GcpSecrets] Secrets for ${envSuffix} loaded successfully.`);
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

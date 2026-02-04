import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

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

@Injectable()
export class GcpSecretsService implements OnModuleInit {
  private readonly logger = new Logger(GcpSecretsService.name);
  private client: SecretManagerServiceClient | null = null;
  private secretsLoaded = false;

  async onModuleInit() {
    const nodeEnv = process.env.NODE_ENV?.toLowerCase();

    // Only load secrets in staging or production
    if (nodeEnv !== 'staging' && nodeEnv !== 'production') {
      this.logger.log(
        `Skipping GCP secret loading for environment: ${nodeEnv}`,
      );
      return;
    }

    await this.loadSecrets();
  }

  private async loadSecrets(): Promise<void> {
    if (this.secretsLoaded) {
      return;
    }

    const projectId = process.env.GCP_PROJECT_ID;
    if (!projectId) {
      throw new Error(
        'GCP_PROJECT_ID environment variable is required for staging/production',
      );
    }

    this.logger.log('Loading secrets from Google Cloud Secret Manager...');
    this.client = new SecretManagerServiceClient();

    const nodeEnv = process.env.NODE_ENV?.toUpperCase();
    const secretPromises = SECRET_KEYS.map(async (genericSecretName) => {
      const secretNameInGCP = `${genericSecretName}_${nodeEnv}`;

      try {
        const secretValue = await this.accessSecretVersion(
          projectId,
          secretNameInGCP,
        );

        if (secretValue !== null) {
          process.env[genericSecretName] = secretValue;
          this.logger.debug(`Loaded secret: ${genericSecretName}`);
        }
      } catch (error) {
        // If we already have the env var, use it as fallback
        if (process.env[genericSecretName]) {
          this.logger.warn(
            `Failed to load ${secretNameInGCP} from GCP. Using existing env variable.`,
          );
        } else {
          this.logger.error(`Failed to load required secret: ${secretNameInGCP}`);
          throw error;
        }
      }
    });

    await Promise.all(secretPromises);
    this.secretsLoaded = true;
    this.logger.log(`Secrets for ${nodeEnv} loaded successfully.`);
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
}

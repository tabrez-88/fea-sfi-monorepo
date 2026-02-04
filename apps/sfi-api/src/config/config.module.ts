import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import { GcpSecretsService } from './gcp-secrets.service';

/**
 * Configuration module that handles:
 * - Loading .env files for local development
 * - Loading secrets from GCP Secret Manager for staging/production
 *
 * The GcpSecretsService runs on module init and populates process.env
 * with secrets from GCP Secret Manager before the app starts.
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      // Cache config values for performance
      cache: true,
      // Expand variables like ${VAR}
      expandVariables: true,
    }),
  ],
  providers: [GcpSecretsService],
  exports: [GcpSecretsService],
})
export class ConfigModule {}

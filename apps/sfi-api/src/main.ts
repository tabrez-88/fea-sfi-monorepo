import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { loadGcpSecrets } from './config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const nodeEnv = process.env.NODE_ENV || 'development';

  logger.log(`Starting SFI-FEA API in ${nodeEnv} mode...`);

  // Load secrets from GCP Secret Manager BEFORE creating the app
  // This ensures DATABASE_URL is available when Prisma initializes
  if (nodeEnv === 'staging' || nodeEnv === 'production') {
    logger.log('Loading secrets from GCP Secret Manager...');
    await loadGcpSecrets();
    logger.log('Secrets loaded successfully');
  }

  const app = await NestFactory.create(AppModule, {
    logger:
      nodeEnv === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Global prefix
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  const apiVersion = configService.get<string>('API_VERSION', 'v1');
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

  // CORS
  const corsOrigin = configService.get<string>(
    'CORS_ORIGIN',
    'http://localhost:3000',
  );
  const corsOrigins = corsOrigin.split(',').map((origin) => origin.trim());

  // Allow an additional admin origin (set via Cloud Run env vars)
  const adminOrigin = configService.get<string>('ADMIN_CORS_ORIGIN', '');
  if (adminOrigin) {
    corsOrigins.push(
      ...adminOrigin.split(',').map((origin) => origin.trim()),
    );
  }

  app.enableCors({
    origin: [...new Set(corsOrigins)],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation (disable in production if needed)
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SFI-FEA API')
      .setDescription(
        'Settlement and Financial Infrastructure API for real-world-asset (RWA) deals. ' +
          'All endpoints except those tagged `auth` require a valid JWT in the ' +
          '`Authorization: Bearer <token>` header. Obtain a token via `POST /auth/login`.',
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token issued by POST /auth/login or /auth/refresh',
        },
        'bearer',
      )
      .addTag('auth', 'Authentication, registration, password reset, and session management')
      .addTag('deals', 'Deal CRUD, counts, and list filters (user-scoped)')
      .addTag('dashboard', 'Dashboard summary stats and pending-review items (user-scoped)')
      .addTag('participants', 'Participant CRUD and CSV bulk import/export per deal')
      .addTag('rule-snapshots', 'Immutable rule snapshots that freeze allocation rules per deal')
      .addTag('revenue-batches', 'Revenue intake: create, list, validate, reject batches')
      .addTag('settlement-runs', 'Settlement execution: create, preview, finalize, verify, correction runs')
      .addTag('ledger', 'Double-entry ledger journals and postings (requires auth; not user-scoped)')
      .addTag('documents', 'Document evidence storage (stubbed — pending real storage integration)')
      .addTag('audit-log', 'System-wide audit log entries (requires auth; not user-scoped)')
      .addTag('health', 'Health / readiness / liveness endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  // Start server
  const port = configService.get<number>('PORT', 3001);
  const host = configService.get<string>('HOST', '0.0.0.0');

  await app.listen(port, host);

  logger.log(`SFI-FEA API is running on: http://${host}:${port}`);
  logger.log(`Environment: ${nodeEnv}`);

  if (nodeEnv !== 'production') {
    logger.log(`Swagger documentation: http://${host}:${port}/docs`);
  }
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start application:', error);
  process.exit(1);
});

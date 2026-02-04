import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const nodeEnv = process.env.NODE_ENV || 'development';

  logger.log(`Starting SFI-FEA API in ${nodeEnv} mode...`);

  // For staging/production, GCP secrets are loaded via GcpSecretsService onModuleInit
  if (nodeEnv === 'staging' || nodeEnv === 'production') {
    logger.log('GCP Secret Manager will be used for configuration');
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
  app.enableCors({
    origin: corsOrigin.split(',').map((origin) => origin.trim()),
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
      .setDescription('Settlement and Financial Infrastructure API')
      .setVersion('1.0.0')
      .addTag('deals', 'Deal management operations')
      .addTag('participants', 'Participant management operations')
      .addTag('rule-snapshots', 'Rule snapshot management')
      .addTag('revenue-batches', 'Revenue batch management')
      .addTag('settlement-runs', 'Settlement run operations')
      .addTag('ledger', 'Ledger and journal entries')
      .addTag('documents', 'Document management')
      .addTag('health', 'Health check endpoints')
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

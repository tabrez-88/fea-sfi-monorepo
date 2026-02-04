import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import supertest from 'supertest';

import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Health', () => {
    it('/api/v1/health (GET)', () => {
      return supertest(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res: supertest.Response) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('services');
        });
    });

    it('/api/v1/health/ready (GET)', () => {
      return supertest(app.getHttpServer())
        .get('/api/v1/health/ready')
        .expect(200)
        .expect((res: supertest.Response) => {
          expect(res.body).toHaveProperty('ready', true);
        });
    });

    it('/api/v1/health/live (GET)', () => {
      return supertest(app.getHttpServer())
        .get('/api/v1/health/live')
        .expect(200)
        .expect((res: supertest.Response) => {
          expect(res.body).toHaveProperty('live', true);
        });
    });
  });

  // TODO: Add more e2e tests for deals and participants
});

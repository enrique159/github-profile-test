import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';
import { configureApp } from '../src/app.config';
import { AppModule } from '../src/app.module';

describe('Application (e2e)', () => {
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health', () => {
    return request(server)
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('rejects an invalid GitHub username without calling GitHub', () => {
    return request(server)
      .get('/api/github/users/-invalid')
      .expect(400)
      .expect({
        statusCode: 400,
        message: 'Invalid GitHub username',
        error: 'Bad Request',
      });
  });
});

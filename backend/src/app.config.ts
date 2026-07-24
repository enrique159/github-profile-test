import { INestApplication } from '@nestjs/common';

const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:8080';

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? DEFAULT_FRONTEND_ORIGIN,
  });
}

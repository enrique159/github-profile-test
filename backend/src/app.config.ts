import { INestApplication } from '@nestjs/common';

const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:8080';

export function validateEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): void {
  if (
    environment.NODE_ENV === 'production' &&
    !environment.GITHUB_TOKEN?.trim()
  ) {
    throw new Error('GITHUB_TOKEN is required in production');
  }
}

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? DEFAULT_FRONTEND_ORIGIN,
  });
}

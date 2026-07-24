import { Module } from '@nestjs/common';
import { GitHubModule } from './github/github.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [GitHubModule],
  controllers: [HealthController],
})
export class AppModule {}

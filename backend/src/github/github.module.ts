import { Module } from '@nestjs/common';
import { GitHubController } from './github.controller';
import { GitHubService } from './github.service';

@Module({
  controllers: [GitHubController],
  providers: [GitHubService],
})
export class GitHubModule {}

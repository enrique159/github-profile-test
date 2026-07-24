import { Controller, Get, Param } from '@nestjs/common';
import { GitHubProfile } from './github-profile.interface';
import { GitHubUsernamePipe } from './github-username.pipe';
import { GitHubService } from './github.service';

@Controller('github/users')
export class GitHubController {
  constructor(private readonly gitHubService: GitHubService) {}

  @Get(':username')
  getUser(
    @Param('username', GitHubUsernamePipe) username: string,
  ): Promise<GitHubProfile> {
    return this.gitHubService.getUser(username);
  }
}

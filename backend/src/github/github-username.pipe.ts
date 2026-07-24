import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const GITHUB_USERNAME_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

@Injectable()
export class GitHubUsernamePipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const username = value.trim();

    if (!GITHUB_USERNAME_PATTERN.test(username)) {
      throw new BadRequestException('Invalid GitHub username');
    }

    return username;
  }
}

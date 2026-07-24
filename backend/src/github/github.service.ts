import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  getTopLanguages,
  normalizeActivity,
  normalizeOrganizations,
  normalizeProfile,
  normalizeRepositories,
  rankRepositories,
} from './github.mapper';
import { GitHubProfile, GitHubSectionStatus } from './github-profile.interface';

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_API_VERSION = '2026-03-10';
const REQUEST_TIMEOUT_MS = 5_000;

@Injectable()
export class GitHubService {
  async getUser(username: string): Promise<GitHubProfile> {
    const encodedUsername = encodeURIComponent(username);
    const profile = normalizeProfile(
      await this.request(`/users/${encodedUsername}`, username),
    );

    const [repositoriesResult, organizationsResult, activityResult] =
      await Promise.allSettled([
        this.request(
          `/users/${encodedUsername}/repos?per_page=100&sort=updated`,
        ).then(normalizeRepositories),
        this.request(`/users/${encodedUsername}/orgs`).then(
          normalizeOrganizations,
        ),
        this.request(
          `/users/${encodedUsername}/events/public?per_page=30`,
        ).then(normalizeActivity),
      ]);

    const repositoryCandidates =
      repositoriesResult.status === 'fulfilled' ? repositoriesResult.value : [];

    return {
      ...profile,
      repositories: rankRepositories(repositoryCandidates),
      topLanguages: getTopLanguages(repositoryCandidates),
      organizations:
        organizationsResult.status === 'fulfilled'
          ? organizationsResult.value
          : [],
      activity:
        activityResult.status === 'fulfilled' ? activityResult.value : [],
      sections: {
        repositories: this.sectionStatus(repositoriesResult),
        organizations: this.sectionStatus(organizationsResult),
        activity: this.sectionStatus(activityResult),
      },
    };
  }

  private async request(path: string, username?: string): Promise<unknown> {
    const abortController = new AbortController();
    const timeout = setTimeout(
      () => abortController.abort(),
      REQUEST_TIMEOUT_MS,
    );

    try {
      const response = await fetch(`${GITHUB_API_URL}${path}`, {
        headers: this.buildHeaders(),
        signal: abortController.signal,
      });

      this.assertSuccessfulResponse(response, username);

      try {
        const payload: unknown = await response.json();
        return payload;
      } catch {
        throw new BadGatewayException('GitHub returned an invalid response');
      }
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new GatewayTimeoutException('GitHub request timed out');
      }

      throw new ServiceUnavailableException('GitHub is unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'github-profile-viewer',
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
    };
    const token = process.env.GITHUB_TOKEN?.trim();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private assertSuccessfulResponse(
    response: Response,
    username?: string,
  ): void {
    if (response.status === 404 && username) {
      throw new NotFoundException(`GitHub user "${username}" was not found`);
    }

    if (response.status === 429 || response.status === 403) {
      throw new HttpException(
        'GitHub rate limit reached',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!response.ok) {
      throw new BadGatewayException('GitHub returned an unexpected response');
    }
  }

  private sectionStatus<T>(
    result: PromiseSettledResult<T>,
  ): GitHubSectionStatus {
    if (result.status === 'fulfilled') {
      return 'ok';
    }

    const error: unknown = result.reason;

    return error instanceof HttpException && error.getStatus() === 429
      ? 'rateLimited'
      : 'unavailable';
  }
}

import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GitHubProfile } from './github-profile.interface';

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_API_VERSION = '2026-03-10';
const REQUEST_TIMEOUT_MS = 5_000;

@Injectable()
export class GitHubService {
  async getUser(username: string): Promise<GitHubProfile> {
    const abortController = new AbortController();
    const timeout = setTimeout(
      () => abortController.abort(),
      REQUEST_TIMEOUT_MS,
    );

    try {
      const response = await fetch(
        `${GITHUB_API_URL}/users/${encodeURIComponent(username)}`,
        {
          headers: this.buildHeaders(),
          signal: abortController.signal,
        },
      );

      this.assertSuccessfulResponse(response, username);
      const payload: unknown = await response.json();

      return normalizeProfile(payload);
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

  private assertSuccessfulResponse(response: Response, username: string): void {
    if (response.status === 404) {
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
}

function normalizeProfile(value: unknown): GitHubProfile {
  if (!isRecord(value)) {
    throw new BadGatewayException('GitHub returned an invalid response');
  }

  return {
    login: readString(value, 'login'),
    name: readNullableString(value, 'name'),
    avatarUrl: readHttpsUrl(value, 'avatar_url'),
    bio: readNullableString(value, 'bio'),
    htmlUrl: readHttpsUrl(value, 'html_url'),
    location: readNullableString(value, 'location'),
    company: readNullableString(value, 'company'),
    followers: readNonNegativeNumber(value, 'followers'),
    following: readNonNegativeNumber(value, 'following'),
    publicRepos: readNonNegativeNumber(value, 'public_repos'),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: Record<string, unknown>, key: string): string {
  const field = value[key];

  if (typeof field !== 'string' || field.length === 0) {
    throw new BadGatewayException('GitHub returned an invalid response');
  }

  return field;
}

function readNullableString(
  value: Record<string, unknown>,
  key: string,
): string | null {
  const field = value[key];

  if (field === null || field === undefined) {
    return null;
  }

  if (typeof field !== 'string') {
    throw new BadGatewayException('GitHub returned an invalid response');
  }

  return field;
}

function readNonNegativeNumber(
  value: Record<string, unknown>,
  key: string,
): number {
  const field = value[key];

  if (typeof field !== 'number' || !Number.isFinite(field) || field < 0) {
    throw new BadGatewayException('GitHub returned an invalid response');
  }

  return field;
}

function readHttpsUrl(value: Record<string, unknown>, key: string): string {
  const field = readString(value, key);

  try {
    const url = new URL(field);

    if (url.protocol !== 'https:') {
      throw new Error('Unexpected URL protocol');
    }

    return url.toString();
  } catch {
    throw new BadGatewayException('GitHub returned an invalid response');
  }
}

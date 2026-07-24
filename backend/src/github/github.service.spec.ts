import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { GitHubService } from './github.service';

const profileResponse = {
  login: 'octocat',
  name: 'The Octocat',
  avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
  bio: 'GitHub mascot',
  html_url: 'https://github.com/octocat',
  blog: 'https://github.blog',
  twitter_username: 'github',
  location: 'San Francisco',
  company: '@github',
  hireable: true,
  type: 'User',
  followers: 18_000,
  following: 9,
  public_repos: 8,
  public_gists: 2,
  created_at: '2011-01-25T18:44:36Z',
  updated_at: '2026-07-20T12:00:00Z',
};

const repositoryResponse = [
  {
    id: 1,
    name: 'hello-world',
    full_name: 'octocat/hello-world',
    description: 'First repository',
    html_url: 'https://github.com/octocat/hello-world',
    homepage: 'https://example.com',
    language: 'TypeScript',
    stargazers_count: 100,
    forks_count: 20,
    topics: ['example'],
    license: { spdx_id: 'MIT' },
    pushed_at: '2026-07-20T12:00:00Z',
    updated_at: '2026-07-20T12:00:00Z',
    fork: false,
    archived: false,
    disabled: false,
  },
];

const organizationResponse = [
  {
    id: 1,
    login: 'github',
    avatar_url: 'https://avatars.githubusercontent.com/u/9919?v=4',
    description: 'The home of open source',
  },
];

const activityResponse = [
  {
    id: 'event-1',
    type: 'PushEvent',
    repo: { name: 'octocat/hello-world' },
    payload: {},
    created_at: '2026-07-23T12:00:00Z',
  },
];

describe('GitHubService', () => {
  let service: GitHubService;
  let fetchMock: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    service = new GitHubService();
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.useRealTimers();
    fetchMock.mockRestore();
  });

  it('fetches and aggregates a complete public profile', async () => {
    mockGitHubRequests(fetchMock);

    const result = await service.getUser('octocat');

    expect(result).toMatchObject({
      login: 'octocat',
      blogUrl: 'https://github.blog/',
      twitterUsername: 'github',
      publicGists: 2,
      repositories: [
        {
          name: 'hello-world',
          stars: 100,
          license: 'MIT',
        },
      ],
      topLanguages: [{ name: 'TypeScript', repositoryCount: 1 }],
      organizations: [{ login: 'github' }],
      activity: [{ type: 'push', repositoryName: 'octocat/hello-world' }],
      sections: {
        repositories: 'ok',
        organizations: 'ok',
        activity: 'ok',
      },
    });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls.map(([url]) => requestUrl(url))).toEqual([
      'https://api.github.com/users/octocat',
      'https://api.github.com/users/octocat/repos?per_page=100&sort=updated',
      'https://api.github.com/users/octocat/orgs',
      'https://api.github.com/users/octocat/events/public?per_page=30',
    ]);
  });

  it('returns available data when secondary sections fail', async () => {
    fetchMock.mockImplementation((input) => {
      const url = requestUrl(input);

      if (url.endsWith('/octocat')) {
        return jsonResponse(profileResponse);
      }

      if (url.includes('/repos?')) {
        return new Response(null, { status: 403 });
      }

      if (url.endsWith('/orgs')) {
        return new Response(null, { status: 502 });
      }

      return jsonResponse(activityResponse);
    });

    await expect(service.getUser('octocat')).resolves.toMatchObject({
      repositories: [],
      topLanguages: [],
      organizations: [],
      activity: [{ type: 'push' }],
      sections: {
        repositories: 'rateLimited',
        organizations: 'unavailable',
        activity: 'ok',
      },
    });
  });

  it('maps a missing GitHub user to 404 without fetching sections', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    await expect(service.getUser('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('maps a profile rate limit to 429', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 403 }));

    try {
      await service.getUser('octocat');
      fail('Expected getUser to reject');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);
    }
  });

  it('rejects invalid profile payloads', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ login: 'octocat' }));

    await expect(service.getUser('octocat')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('maps a profile timeout to 504', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation((_input, init) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const abortError = new Error('Request aborted');
          abortError.name = 'AbortError';
          reject(abortError);
        });
      });
    });

    const expectation = expect(
      service.getUser('octocat'),
    ).rejects.toBeInstanceOf(GatewayTimeoutException);
    await jest.advanceTimersByTimeAsync(5_000);

    await expectation;
  });
});

function mockGitHubRequests(fetchMock: jest.SpiedFunction<typeof fetch>): void {
  fetchMock.mockImplementation((input) => {
    const url = requestUrl(input);

    if (url.endsWith('/octocat')) {
      return jsonResponse(profileResponse);
    }

    if (url.includes('/repos?')) {
      return jsonResponse(repositoryResponse);
    }

    if (url.endsWith('/orgs')) {
      return jsonResponse(organizationResponse);
    }

    return jsonResponse(activityResponse);
  });
}

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function requestUrl(input: string | URL | Request): string {
  if (typeof input === 'string') {
    return input;
  }

  return input instanceof URL ? input.href : input.url;
}

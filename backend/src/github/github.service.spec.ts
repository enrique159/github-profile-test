import {
  BadGatewayException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { GitHubService } from './github.service';

const gitHubResponse = {
  login: 'octocat',
  name: 'The Octocat',
  avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
  bio: null,
  html_url: 'https://github.com/octocat',
  location: 'San Francisco',
  company: '@github',
  followers: 18_000,
  following: 9,
  public_repos: 8,
};

describe('GitHubService', () => {
  let service: GitHubService;
  let fetchMock: jest.SpiedFunction<typeof fetch>;

  beforeEach(() => {
    service = new GitHubService();
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('fetches and normalizes a public GitHub profile', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(gitHubResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(service.getUser('octocat')).resolves.toEqual({
      login: 'octocat',
      name: 'The Octocat',
      avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
      bio: null,
      htmlUrl: 'https://github.com/octocat',
      location: 'San Francisco',
      company: '@github',
      followers: 18_000,
      following: 9,
      publicRepos: 8,
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://api.github.com/users/octocat',
    );
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<
      string,
      string
    >;
    expect(headers.Accept).toBe('application/vnd.github+json');
    expect(headers['X-GitHub-Api-Version']).toBe('2026-03-10');
  });

  it('maps a missing GitHub user to 404', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    await expect(service.getUser('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('maps GitHub rate limits to 429', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 403 }));

    try {
      await service.getUser('octocat');
      fail('Expected getUser to reject');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);
    }
  });

  it('rejects invalid upstream payloads', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ login: 'octocat' }), { status: 200 }),
    );

    await expect(service.getUser('octocat')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});

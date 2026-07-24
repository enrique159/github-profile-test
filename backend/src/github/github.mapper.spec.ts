import {
  getTopLanguages,
  normalizeActivity,
  normalizeProfile,
  normalizeRepositories,
  rankRepositories,
} from './github.mapper';
import { GitHubRepository } from './github-profile.interface';

describe('GitHub mappers', () => {
  it('normalizes extended profile fields', () => {
    expect(
      normalizeProfile({
        login: 'octocat',
        name: 'The Octocat',
        avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
        bio: null,
        html_url: 'https://github.com/octocat',
        blog: 'github.blog',
        twitter_username: 'github',
        location: null,
        company: '@github',
        hireable: false,
        type: 'User',
        followers: 10,
        following: 2,
        public_repos: 8,
        public_gists: 3,
        created_at: '2011-01-25T18:44:36Z',
        updated_at: '2026-07-20T12:00:00Z',
      }),
    ).toMatchObject({
      blogUrl: 'https://github.blog/',
      twitterUsername: 'github',
      hireable: false,
      publicGists: 3,
      accountType: 'User',
    });
  });

  it('filters ineligible repositories and normalizes repository fields', () => {
    const rawRepository = repositoryPayload({
      topics: ['typescript', 'api'],
      license: { spdx_id: 'MIT' },
    });

    expect(
      normalizeRepositories([
        rawRepository,
        repositoryPayload({ id: 2, name: 'fork', fork: true }),
        repositoryPayload({ id: 3, name: 'archive', archived: true }),
      ]),
    ).toEqual([
      expect.objectContaining({
        name: 'project',
        topics: ['typescript', 'api'],
        license: 'MIT',
      }),
    ]);
  });

  it('ranks repositories using impact and recency with deterministic ties', () => {
    const now = Date.parse('2026-07-24T00:00:00Z');
    const repositories = [
      repository({ id: 1, name: 'popular', stars: 100, forks: 40 }),
      repository({
        id: 2,
        name: 'recent',
        stars: 35,
        forks: 10,
        pushedAt: '2026-07-23T00:00:00Z',
      }),
      repository({ id: 3, name: 'zeta', stars: 1, forks: 0 }),
      repository({ id: 4, name: 'alpha', stars: 1, forks: 0 }),
      repository({
        id: 5,
        name: 'fifth',
        stars: 0,
        forks: 0,
        pushedAt: '2026-07-22T00:00:00Z',
      }),
      repository({
        id: 6,
        name: 'sixth',
        stars: 0,
        forks: 0,
        pushedAt: '2026-07-21T00:00:00Z',
      }),
      repository({
        id: 7,
        name: 'seventh',
        stars: 0,
        forks: 0,
        pushedAt: '2020-01-01T00:00:00Z',
      }),
    ];

    const result = rankRepositories(repositories, now);

    expect(result).toHaveLength(6);
    expect(result[0]?.name).toBe('popular');
    expect(result.map(({ name }) => name)).not.toContain('seventh');
    expect(result.indexOf(repositories[3])).toBeLessThan(
      result.indexOf(repositories[2]),
    );
  });

  it('calculates the five most common primary languages', () => {
    const repositories = [
      repository({ id: 1, language: 'TypeScript' }),
      repository({ id: 2, language: 'TypeScript' }),
      repository({ id: 3, language: 'Go' }),
      repository({ id: 4, language: null }),
    ];

    expect(getTopLanguages(repositories)).toEqual([
      { name: 'TypeScript', repositoryCount: 2 },
      { name: 'Go', repositoryCount: 1 },
    ]);
  });

  it('maps supported public activity and ignores unknown events', () => {
    expect(
      normalizeActivity([
        eventPayload('PushEvent', {}),
        eventPayload('PullRequestEvent', { action: 'opened' }, '2'),
        eventPayload('CreateEvent', { ref_type: 'repository' }, '3'),
        eventPayload('UnknownEvent', {}, '4'),
      ]),
    ).toEqual([
      expect.objectContaining({ type: 'push', action: 'push' }),
      expect.objectContaining({ type: 'pullRequest', action: 'opened' }),
      expect.objectContaining({
        type: 'create',
        action: 'created:repository',
      }),
    ]);
  });
});

function repositoryPayload(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'project',
    full_name: 'octocat/project',
    description: null,
    html_url: 'https://github.com/octocat/project',
    homepage: '',
    language: 'TypeScript',
    stargazers_count: 10,
    forks_count: 2,
    topics: [],
    license: null,
    pushed_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    fork: false,
    archived: false,
    disabled: false,
    ...overrides,
  };
}

function repository(overrides: Partial<GitHubRepository>): GitHubRepository {
  return {
    id: 1,
    name: 'project',
    fullName: 'octocat/project',
    description: null,
    htmlUrl: 'https://github.com/octocat/project',
    homepageUrl: null,
    language: 'TypeScript',
    stars: 0,
    forks: 0,
    topics: [],
    license: null,
    pushedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function eventPayload(
  type: string,
  payload: Record<string, unknown>,
  id = '1',
) {
  return {
    id,
    type,
    repo: { name: 'octocat/project' },
    payload,
    created_at: '2026-07-23T12:00:00Z',
  };
}

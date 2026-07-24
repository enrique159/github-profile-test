import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'node:http';
import request from 'supertest';
import { configureApp } from '../src/app.config';
import { AppModule } from '../src/app.module';

describe('Application (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let fetchMock: jest.SpiedFunction<typeof fetch>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('GET /api/health', () => {
    return request(server)
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('rejects an invalid GitHub username without calling GitHub', async () => {
    await request(server).get('/api/github/users/-invalid').expect(400).expect({
      statusCode: 400,
      message: 'Invalid GitHub username',
      error: 'Bad Request',
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns a complete aggregated GitHub profile', async () => {
    mockGitHub(fetchMock);

    const response = await request(server)
      .get('/api/github/users/octocat')
      .expect(200);

    expect(response.body).toMatchObject({
      login: 'octocat',
      publicGists: 2,
      repositories: [{ name: 'hello-world', stars: 100 }],
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
  });

  it('returns 404 when the GitHub profile does not exist', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    await request(server).get('/api/github/users/missing').expect(404);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the profile when secondary GitHub requests fail', async () => {
    mockGitHub(fetchMock, true);

    const response = await request(server)
      .get('/api/github/users/octocat')
      .expect(200);

    expect(response.body).toMatchObject({
      login: 'octocat',
      repositories: [],
      organizations: [],
      activity: [{ type: 'push' }],
      sections: {
        repositories: 'rateLimited',
        organizations: 'unavailable',
        activity: 'ok',
      },
    });
  });
});

function mockGitHub(
  fetchMock: jest.SpiedFunction<typeof fetch>,
  withPartialFailures = false,
): void {
  fetchMock.mockImplementation((input) => {
    const url = requestUrl(input);

    if (url.endsWith('/octocat')) {
      return Promise.resolve(jsonResponse(profilePayload));
    }

    if (url.includes('/repos?')) {
      return Promise.resolve(
        withPartialFailures
          ? new Response(null, { status: 403 })
          : jsonResponse(repositoryPayload),
      );
    }

    if (url.endsWith('/orgs')) {
      return Promise.resolve(
        withPartialFailures
          ? new Response(null, { status: 502 })
          : jsonResponse(organizationPayload),
      );
    }

    return Promise.resolve(jsonResponse(activityPayload));
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

const profilePayload = {
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

const repositoryPayload = [
  {
    id: 1,
    name: 'hello-world',
    full_name: 'octocat/hello-world',
    description: 'First repository',
    html_url: 'https://github.com/octocat/hello-world',
    homepage: null,
    language: 'TypeScript',
    stargazers_count: 100,
    forks_count: 20,
    topics: ['example'],
    license: { spdx_id: 'MIT' },
    pushed_at: '2026-07-20T12:00:00Z',
    fork: false,
    archived: false,
    disabled: false,
  },
];

const organizationPayload = [
  {
    id: 1,
    login: 'github',
    avatar_url: 'https://avatars.githubusercontent.com/u/9919?v=4',
    description: 'The home of open source',
  },
];

const activityPayload = [
  {
    id: 'event-1',
    type: 'PushEvent',
    repo: { name: 'octocat/hello-world' },
    payload: {},
    created_at: '2026-07-23T12:00:00Z',
  },
];

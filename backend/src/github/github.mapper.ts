import { BadGatewayException } from '@nestjs/common';
import {
  GitHubActivity,
  GitHubActivityType,
  GitHubBaseProfile,
  GitHubLanguage,
  GitHubOrganization,
  GitHubRepository,
} from './github-profile.interface';

const DAY_IN_MS = 86_400_000;
const RECENCY_WINDOW_DAYS = 365;

export function normalizeProfile(value: unknown): GitHubBaseProfile {
  const record = readRecord(value);

  return {
    login: readString(record, 'login'),
    name: readOptionalString(record, 'name'),
    avatarUrl: readHttpsUrl(record, 'avatar_url'),
    bio: readOptionalString(record, 'bio'),
    htmlUrl: readHttpsUrl(record, 'html_url'),
    blogUrl: readOptionalWebUrl(record, 'blog'),
    twitterUsername: readOptionalString(record, 'twitter_username'),
    location: readOptionalString(record, 'location'),
    company: readOptionalString(record, 'company'),
    hireable: readOptionalBoolean(record, 'hireable'),
    accountType: readString(record, 'type'),
    followers: readNonNegativeNumber(record, 'followers'),
    following: readNonNegativeNumber(record, 'following'),
    publicRepos: readNonNegativeNumber(record, 'public_repos'),
    publicGists: readNonNegativeNumber(record, 'public_gists'),
    createdAt: readIsoDate(record, 'created_at'),
    updatedAt: readIsoDate(record, 'updated_at'),
  };
}

export function normalizeRepositories(value: unknown): GitHubRepository[] {
  return readArray(value)
    .map(readRecord)
    .filter(
      (repository) =>
        !readBoolean(repository, 'fork') &&
        !readBoolean(repository, 'archived') &&
        !readBoolean(repository, 'disabled'),
    )
    .map((repository) => {
      const pushedAt =
        readOptionalIsoDate(repository, 'pushed_at') ??
        readIsoDate(repository, 'updated_at');

      return {
        id: readNonNegativeNumber(repository, 'id'),
        name: readString(repository, 'name'),
        fullName: readString(repository, 'full_name'),
        description: readOptionalString(repository, 'description'),
        htmlUrl: readHttpsUrl(repository, 'html_url'),
        homepageUrl: readOptionalWebUrl(repository, 'homepage'),
        language: readOptionalString(repository, 'language'),
        stars: readNonNegativeNumber(repository, 'stargazers_count'),
        forks: readNonNegativeNumber(repository, 'forks_count'),
        topics: readStringArray(repository, 'topics'),
        license: readLicense(repository),
        pushedAt,
      };
    });
}

export function rankRepositories(
  repositories: GitHubRepository[],
  now = Date.now(),
): GitHubRepository[] {
  const maxStars = Math.max(1, ...repositories.map(({ stars }) => stars));
  const maxForks = Math.max(1, ...repositories.map(({ forks }) => forks));

  return [...repositories]
    .sort((left, right) => {
      const scoreDifference =
        repositoryScore(right, maxStars, maxForks, now) -
        repositoryScore(left, maxStars, maxForks, now);

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      const dateDifference =
        Date.parse(right.pushedAt) - Date.parse(left.pushedAt);

      return dateDifference !== 0
        ? dateDifference
        : left.name.localeCompare(right.name);
    })
    .slice(0, 6);
}

export function getTopLanguages(
  repositories: GitHubRepository[],
): GitHubLanguage[] {
  const counts = new Map<string, number>();

  for (const { language } of repositories) {
    if (language) {
      counts.set(language, (counts.get(language) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([name, repositoryCount]) => ({ name, repositoryCount }))
    .sort(
      (left, right) =>
        right.repositoryCount - left.repositoryCount ||
        left.name.localeCompare(right.name),
    )
    .slice(0, 5);
}

export function normalizeOrganizations(value: unknown): GitHubOrganization[] {
  return readArray(value)
    .map(readRecord)
    .map((organization) => {
      const login = readString(organization, 'login');

      return {
        id: readNonNegativeNumber(organization, 'id'),
        login,
        avatarUrl: readHttpsUrl(organization, 'avatar_url'),
        description: readOptionalString(organization, 'description'),
        htmlUrl: `https://github.com/${encodeURIComponent(login)}`,
      };
    })
    .slice(0, 6);
}

export function normalizeActivity(value: unknown): GitHubActivity[] {
  return readArray(value)
    .map(normalizeEvent)
    .filter((event): event is GitHubActivity => event !== null)
    .slice(0, 8);
}

function repositoryScore(
  repository: GitHubRepository,
  maxStars: number,
  maxForks: number,
  now: number,
): number {
  const ageInDays = Math.max(
    0,
    (now - Date.parse(repository.pushedAt)) / DAY_IN_MS,
  );
  const recency = Math.max(0, 1 - ageInDays / RECENCY_WINDOW_DAYS);

  return (
    0.55 * (repository.stars / maxStars) +
    0.2 * (repository.forks / maxForks) +
    0.25 * recency
  );
}

function normalizeEvent(value: unknown): GitHubActivity | null {
  const event = readRecord(value);
  const eventType = readString(event, 'type');
  const type = activityType(eventType);

  if (!type) {
    return null;
  }

  const repository = readRecord(event.repo);
  const repositoryName = readString(repository, 'name');

  return {
    id: readString(event, 'id'),
    type,
    action: eventAction(type, event.payload),
    repositoryName,
    repositoryUrl: repositoryUrl(repositoryName),
    createdAt: readIsoDate(event, 'created_at'),
  };
}

function activityType(type: string): GitHubActivityType | null {
  const types: Record<string, GitHubActivityType> = {
    PushEvent: 'push',
    PullRequestEvent: 'pullRequest',
    IssuesEvent: 'issue',
    CreateEvent: 'create',
    WatchEvent: 'star',
    ForkEvent: 'fork',
    ReleaseEvent: 'release',
  };

  return types[type] ?? null;
}

function eventAction(
  type: GitHubActivityType,
  payloadValue: unknown,
): string | null {
  if (!isRecord(payloadValue)) {
    return type === 'push' || type === 'fork' ? type : null;
  }

  const action = readOptionalString(payloadValue, 'action');

  if (type === 'create') {
    const refType = readOptionalString(payloadValue, 'ref_type');
    return refType ? `created:${refType}` : 'created';
  }

  return action ?? (type === 'push' || type === 'fork' ? type : null);
}

function repositoryUrl(fullName: string): string {
  const [owner, repository, ...rest] = fullName.split('/');

  if (!owner || !repository || rest.length > 0) {
    throw invalidResponse();
  }

  return `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`;
}

function readLicense(repository: Record<string, unknown>): string | null {
  const license = repository.license;

  if (license === null || license === undefined) {
    return null;
  }

  const record = readRecord(license);
  const identifier = readOptionalString(record, 'spdx_id');

  return identifier && identifier !== 'NOASSERTION' ? identifier : null;
}

function readRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw invalidResponse();
  }

  return value;
}

function readArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    throw invalidResponse();
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: Record<string, unknown>, key: string): string {
  const field = value[key];

  if (typeof field !== 'string' || field.length === 0) {
    throw invalidResponse();
  }

  return field;
}

function readOptionalString(
  value: Record<string, unknown>,
  key: string,
): string | null {
  const field = value[key];

  if (field === null || field === undefined || field === '') {
    return null;
  }

  if (typeof field !== 'string') {
    throw invalidResponse();
  }

  return field;
}

function readBoolean(value: Record<string, unknown>, key: string): boolean {
  const field = value[key];

  if (typeof field !== 'boolean') {
    throw invalidResponse();
  }

  return field;
}

function readOptionalBoolean(
  value: Record<string, unknown>,
  key: string,
): boolean | null {
  const field = value[key];

  if (field === null || field === undefined) {
    return null;
  }

  if (typeof field !== 'boolean') {
    throw invalidResponse();
  }

  return field;
}

function readNonNegativeNumber(
  value: Record<string, unknown>,
  key: string,
): number {
  const field = value[key];

  if (typeof field !== 'number' || !Number.isFinite(field) || field < 0) {
    throw invalidResponse();
  }

  return field;
}

function readStringArray(
  value: Record<string, unknown>,
  key: string,
): string[] {
  const field = value[key];

  if (!Array.isArray(field) || field.some((item) => typeof item !== 'string')) {
    throw invalidResponse();
  }

  return field.filter((item): item is string => typeof item === 'string');
}

function readIsoDate(value: Record<string, unknown>, key: string): string {
  const field = readString(value, key);

  if (Number.isNaN(Date.parse(field))) {
    throw invalidResponse();
  }

  return field;
}

function readOptionalIsoDate(
  value: Record<string, unknown>,
  key: string,
): string | null {
  const field = readOptionalString(value, key);

  if (field && Number.isNaN(Date.parse(field))) {
    throw invalidResponse();
  }

  return field;
}

function readHttpsUrl(value: Record<string, unknown>, key: string): string {
  const field = readString(value, key);

  try {
    const url = new URL(field);

    if (url.protocol !== 'https:') {
      throw invalidResponse();
    }

    return url.toString();
  } catch {
    throw invalidResponse();
  }
}

function readOptionalWebUrl(
  value: Record<string, unknown>,
  key: string,
): string | null {
  const field = readOptionalString(value, key);

  if (!field) {
    return null;
  }

  try {
    const url = new URL(
      field.startsWith('http://') || field.startsWith('https://')
        ? field
        : `https://${field}`,
    );

    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function invalidResponse(): BadGatewayException {
  return new BadGatewayException('GitHub returned an invalid response');
}

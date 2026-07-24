const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

const USERNAME_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const SECTION_STATUSES = ["ok", "rateLimited", "unavailable"] as const;
const ACTIVITY_TYPES = [
  "push",
  "pullRequest",
  "issue",
  "create",
  "star",
  "fork",
  "release",
] as const;

export type GitHubSectionStatus = (typeof SECTION_STATUSES)[number];
export type GitHubActivityType = (typeof ACTIVITY_TYPES)[number];

export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  homepageUrl: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  license: string | null;
  pushedAt: string;
}

export interface GitHubLanguage {
  name: string;
  repositoryCount: number;
}

export interface GitHubOrganization {
  id: number;
  login: string;
  avatarUrl: string;
  description: string | null;
  htmlUrl: string;
}

export interface GitHubActivity {
  id: string;
  type: GitHubActivityType;
  action: string | null;
  repositoryName: string;
  repositoryUrl: string;
  createdAt: string;
}

export interface GitHubProfile {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  htmlUrl: string;
  blogUrl: string | null;
  twitterUsername: string | null;
  location: string | null;
  company: string | null;
  hireable: boolean | null;
  accountType: string;
  followers: number;
  following: number;
  publicRepos: number;
  publicGists: number;
  createdAt: string;
  updatedAt: string;
  repositories: GitHubRepository[];
  topLanguages: GitHubLanguage[];
  organizations: GitHubOrganization[];
  activity: GitHubActivity[];
  sections: {
    repositories: GitHubSectionStatus;
    organizations: GitHubSectionStatus;
    activity: GitHubSectionStatus;
  };
}

export class GitHubApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

export async function getGitHubProfile(
  username: string,
  signal?: AbortSignal,
): Promise<GitHubProfile> {
  if (!USERNAME_PATTERN.test(username)) {
    throw new GitHubApiError("Escribe un nombre de usuario de GitHub válido.");
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_URL}/api/github/users/${encodeURIComponent(username)}`,
      {
        headers: { Accept: "application/json" },
        signal,
      },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw new GitHubApiError(
      "La API no está disponible. Verifica que el backend esté activo.",
      503,
    );
  }

  if (!response.ok) {
    throw new GitHubApiError(messageForStatus(response.status), response.status);
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw unexpectedResponse();
  }

  return parseProfile(payload);
}

function messageForStatus(status: number): string {
  if (status === 404) {
    return "No encontramos ese usuario en GitHub.";
  }

  if (status === 429) {
    return "GitHub alcanzó su límite de consultas. Inténtalo más tarde.";
  }

  if (status === 502 || status === 503 || status === 504) {
    return "El servicio de perfiles no está disponible en este momento.";
  }

  return "No pudimos consultar el perfil. Inténtalo de nuevo.";
}

function parseProfile(value: unknown): GitHubProfile {
  const profile = readRecord(value);
  const sections = readRecord(profile.sections);

  return {
    login: readString(profile, "login"),
    name: readNullableString(profile, "name"),
    avatarUrl: readHostUrl(
      profile,
      "avatarUrl",
      "avatars.githubusercontent.com",
    ),
    bio: readNullableString(profile, "bio"),
    htmlUrl: readHostUrl(profile, "htmlUrl", "github.com"),
    blogUrl: readNullableWebUrl(profile, "blogUrl"),
    twitterUsername: readNullableString(profile, "twitterUsername"),
    location: readNullableString(profile, "location"),
    company: readNullableString(profile, "company"),
    hireable: readNullableBoolean(profile, "hireable"),
    accountType: readString(profile, "accountType"),
    followers: readNumber(profile, "followers"),
    following: readNumber(profile, "following"),
    publicRepos: readNumber(profile, "publicRepos"),
    publicGists: readNumber(profile, "publicGists"),
    createdAt: readDate(profile, "createdAt"),
    updatedAt: readDate(profile, "updatedAt"),
    repositories: readArray(profile, "repositories")
      .map(parseRepository)
      .slice(0, 6),
    topLanguages: readArray(profile, "topLanguages")
      .map(parseLanguage)
      .slice(0, 5),
    organizations: readArray(profile, "organizations")
      .map(parseOrganization)
      .slice(0, 6),
    activity: readArray(profile, "activity").map(parseActivity).slice(0, 8),
    sections: {
      repositories: readSectionStatus(sections, "repositories"),
      organizations: readSectionStatus(sections, "organizations"),
      activity: readSectionStatus(sections, "activity"),
    },
  };
}

function parseRepository(value: unknown): GitHubRepository {
  const repository = readRecord(value);

  return {
    id: readNumber(repository, "id"),
    name: readString(repository, "name"),
    fullName: readString(repository, "fullName"),
    description: readNullableString(repository, "description"),
    htmlUrl: readHostUrl(repository, "htmlUrl", "github.com"),
    homepageUrl: readNullableWebUrl(repository, "homepageUrl"),
    language: readNullableString(repository, "language"),
    stars: readNumber(repository, "stars"),
    forks: readNumber(repository, "forks"),
    topics: readStringArray(repository, "topics"),
    license: readNullableString(repository, "license"),
    pushedAt: readDate(repository, "pushedAt"),
  };
}

function parseLanguage(value: unknown): GitHubLanguage {
  const language = readRecord(value);

  return {
    name: readString(language, "name"),
    repositoryCount: readNumber(language, "repositoryCount"),
  };
}

function parseOrganization(value: unknown): GitHubOrganization {
  const organization = readRecord(value);

  return {
    id: readNumber(organization, "id"),
    login: readString(organization, "login"),
    avatarUrl: readHostUrl(
      organization,
      "avatarUrl",
      "avatars.githubusercontent.com",
    ),
    description: readNullableString(organization, "description"),
    htmlUrl: readHostUrl(organization, "htmlUrl", "github.com"),
  };
}

function parseActivity(value: unknown): GitHubActivity {
  const activity = readRecord(value);
  const type = readString(activity, "type");

  if (!isActivityType(type)) {
    throw unexpectedResponse();
  }

  return {
    id: readString(activity, "id"),
    type,
    action: readNullableString(activity, "action"),
    repositoryName: readString(activity, "repositoryName"),
    repositoryUrl: readHostUrl(activity, "repositoryUrl", "github.com"),
    createdAt: readDate(activity, "createdAt"),
  };
}

function readRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw unexpectedResponse();
  }

  return value as Record<string, unknown>;
}

function readArray(
  value: Record<string, unknown>,
  key: string,
): unknown[] {
  const field = value[key];

  if (!Array.isArray(field)) {
    throw unexpectedResponse();
  }

  return field;
}

function readString(value: Record<string, unknown>, key: string): string {
  const field = value[key];

  if (typeof field !== "string" || !field) {
    throw unexpectedResponse();
  }

  return field;
}

function readStringArray(
  value: Record<string, unknown>,
  key: string,
): string[] {
  const field = value[key];

  if (!Array.isArray(field) || field.some((item) => typeof item !== "string")) {
    throw unexpectedResponse();
  }

  return field as string[];
}

function readNullableString(
  value: Record<string, unknown>,
  key: string,
): string | null {
  const field = value[key];

  if (field === null) {
    return null;
  }

  if (typeof field !== "string") {
    throw unexpectedResponse();
  }

  return field;
}

function readNullableBoolean(
  value: Record<string, unknown>,
  key: string,
): boolean | null {
  const field = value[key];

  if (field === null) {
    return null;
  }

  if (typeof field !== "boolean") {
    throw unexpectedResponse();
  }

  return field;
}

function readNumber(value: Record<string, unknown>, key: string): number {
  const field = value[key];

  if (typeof field !== "number" || !Number.isFinite(field) || field < 0) {
    throw unexpectedResponse();
  }

  return field;
}

function readDate(value: Record<string, unknown>, key: string): string {
  const field = readString(value, key);

  if (Number.isNaN(Date.parse(field))) {
    throw unexpectedResponse();
  }

  return field;
}

function readSectionStatus(
  value: Record<string, unknown>,
  key: string,
): GitHubSectionStatus {
  const field = value[key];

  if (!SECTION_STATUSES.some((status) => status === field)) {
    throw unexpectedResponse();
  }

  return field as GitHubSectionStatus;
}

function isActivityType(value: string): value is GitHubActivityType {
  return ACTIVITY_TYPES.some((candidate) => candidate === value);
}

function readHostUrl(
  value: Record<string, unknown>,
  key: string,
  allowedHostname: string,
): string {
  const field = readString(value, key);
  const url = parseWebUrl(field);

  if (url.protocol !== "https:" || url.hostname !== allowedHostname) {
    throw unexpectedResponse();
  }

  return url.toString();
}

function readNullableWebUrl(
  value: Record<string, unknown>,
  key: string,
): string | null {
  const field = readNullableString(value, key);
  return field ? parseWebUrl(field).toString() : null;
}

function parseWebUrl(value: string): URL {
  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Unsupported protocol");
    }

    return url;
  } catch {
    throw unexpectedResponse();
  }
}

function unexpectedResponse(): GitHubApiError {
  return new GitHubApiError("La API devolvió una respuesta inesperada.", 502);
}

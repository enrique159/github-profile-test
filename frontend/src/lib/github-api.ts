const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

const USERNAME_PATTERN =
  /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export interface GitHubProfile {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  htmlUrl: string;
  location: string | null;
  company: string | null;
  followers: number;
  following: number;
  publicRepos: number;
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
      },
    );
  } catch {
    throw new GitHubApiError(
      "La API no está disponible. Verifica que el backend esté activo.",
    );
  }

  if (!response.ok) {
    throw new GitHubApiError(messageForStatus(response.status), response.status);
  }

  return parseProfile(await response.json());
}

function messageForStatus(status: number) {
  if (status === 404) {
    return "No encontramos ese usuario en GitHub.";
  }

  if (status === 429) {
    return "GitHub alcanzó su límite de consultas. Inténtalo más tarde.";
  }

  return "No pudimos consultar el perfil. Inténtalo de nuevo.";
}

function parseProfile(value: unknown): GitHubProfile {
  if (!isRecord(value)) {
    throw new GitHubApiError("La API devolvió una respuesta inesperada.");
  }

  const profile: GitHubProfile = {
    login: readString(value, "login"),
    name: readNullableString(value, "name"),
    avatarUrl: readSafeUrl(value, "avatarUrl", "avatars.githubusercontent.com"),
    bio: readNullableString(value, "bio"),
    htmlUrl: readSafeUrl(value, "htmlUrl", "github.com"),
    location: readNullableString(value, "location"),
    company: readNullableString(value, "company"),
    followers: readNumber(value, "followers"),
    following: readNumber(value, "following"),
    publicRepos: readNumber(value, "publicRepos"),
  };

  return profile;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: Record<string, unknown>, key: string): string {
  const field = value[key];

  if (typeof field !== "string" || !field) {
    throw new GitHubApiError("La API devolvió una respuesta inesperada.");
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

  if (typeof field !== "string") {
    throw new GitHubApiError("La API devolvió una respuesta inesperada.");
  }

  return field;
}

function readNumber(value: Record<string, unknown>, key: string): number {
  const field = value[key];

  if (typeof field !== "number" || !Number.isFinite(field) || field < 0) {
    throw new GitHubApiError("La API devolvió una respuesta inesperada.");
  }

  return field;
}

function readSafeUrl(
  value: Record<string, unknown>,
  key: string,
  allowedHostname: string,
): string {
  const field = readString(value, key);

  try {
    const url = new URL(field);
    if (url.protocol !== "https:" || url.hostname !== allowedHostname) {
      throw new Error("Unexpected URL");
    }
    return url.toString();
  } catch {
    throw new GitHubApiError("La API devolvió una respuesta inesperada.");
  }
}

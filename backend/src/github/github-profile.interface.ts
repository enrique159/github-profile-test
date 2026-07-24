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

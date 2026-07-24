export type GitHubSectionStatus = 'ok' | 'rateLimited' | 'unavailable';

export type GitHubActivityType =
  'push' | 'pullRequest' | 'issue' | 'create' | 'star' | 'fork' | 'release';

export interface GitHubBaseProfile {
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
}

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

export interface GitHubProfile extends GitHubBaseProfile {
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

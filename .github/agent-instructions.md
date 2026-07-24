# Project Instructions for AI Agents

## 1. Product goal

Build a modern web application where a visitor can enter any public GitHub
username and view that user's public profile information.

The browser-facing application is built with Next.js. It must obtain GitHub data
from the NestJS API; the frontend must not call the GitHub API directly. The
backend is responsible for GitHub integration, response normalization, error
handling, and protection of any credentials.

The initial product should prioritize a polished search and profile-viewing
experience. Useful public information may include:

- avatar, name, username, biography, and profile URL;
- location, company, website, and social handle when available;
- follower, following, repository, and gist counts;
- a concise list of public repositories when the feature requires it.

This application is intentionally stateless. Do not add a database, ORM,
persistence, authentication, analytics, or unrelated integrations unless the
product scope explicitly changes.

## 2. Monorepo boundaries

```text
.
├── backend/   # NestJS application and all GitHub API access
└── frontend/  # Next.js application and user interface
```

- Keep each application's source, dependencies, configuration, tests, and
  environment examples inside its own directory.
- Run package commands from the application directory they belong to.
- Do not import source code directly across `frontend/` and `backend/`.
- Share contracts through explicit HTTP request and response shapes. If shared
  types become necessary, add a dedicated shared package only as a separate,
  intentional task.
- Do not move or recreate either application at the repository root.

## 3. Frontend standards (`frontend/`)

### Required stack

- Next.js with the App Router
- React
- TypeScript in strict mode
- Tailwind CSS for styling

### Implementation guidelines

- Prefer React Server Components. Add `"use client"` only when browser state,
  events, or browser-only APIs require it.
- Keep page components focused. Extract reusable UI, data-access functions, and
  types when doing so improves clarity.
- Centralize backend requests instead of scattering `fetch` calls throughout
  visual components.
- Configure the backend base URL through a documented environment variable,
  such as `NEXT_PUBLIC_API_URL`. It may contain only a public API origin, never
  a secret.
- Model loading, empty, success, not-found, rate-limit, and general error states
  explicitly.
- Treat GitHub data as untrusted. Render it as text and validate external links
  before using them.
- Use semantic HTML, visible keyboard focus, accessible labels, sufficient color
  contrast, and meaningful alternative text.
- Design mobile-first and verify layouts at narrow and wide viewport sizes.
- Use `next/image` for remote avatars when practical and allow only the required
  GitHub image hosts in Next.js configuration.
- Prefer simple HTML, CSS, and React over new UI frameworks or heavy animation
  libraries. Respect `prefers-reduced-motion` for nonessential motion.

### Frontend commands

Run from `frontend/` using the existing Yarn lockfile:

```bash
yarn dev --port 8080
yarn lint
yarn build
```

Do not start the development server automatically. The user owns that process.
For browser-based verification, use `http://localhost:8080`; if unavailable,
ask the user to start it.

## 4. Backend standards (`backend/`)

### Required stack

- NestJS
- TypeScript with strict type checking
- Nest's built-in HTTP adapter unless the task requires otherwise

### Architecture

Organize GitHub functionality as a feature module. Keep responsibilities
separate:

- controllers define routes and HTTP semantics;
- services contain application and integration logic;
- DTOs validate external input;
- GitHub client/provider code owns outbound API calls and GitHub-specific
  response handling;
- response types expose only the stable fields the frontend needs.

Do not return raw GitHub responses as the application's public contract.
Normalize them into project-owned DTOs or interfaces.

The backend is a stateless integration layer. Do not introduce database
connections, repositories, entities, migrations, or persistence configuration.

### API behavior

- Place application endpoints under an `/api` prefix.
- Use resource-oriented routes, for example
  `GET /api/github/users/:username`.
- Validate and safely encode usernames before making outbound requests.
- Map upstream failures to clear HTTP responses:
  - invalid input: `400`;
  - unknown GitHub user: `404`;
  - GitHub rate limit: `429` when appropriate;
  - unavailable upstream service: `502` or `503`.
- Return a consistent JSON error shape without stack traces, tokens, or
  sensitive upstream details.
- Set explicit timeouts for outbound requests. Add caching only when requested
  or when its behavior and invalidation are clear.
- Configure CORS narrowly for the known frontend origin.

### Configuration and secrets

- Read configuration through environment variables and NestJS configuration
  facilities.
- Store an optional GitHub token only in the backend, for example
  `GITHUB_TOKEN`.
- Never commit `.env` files. Maintain a safe `.env.example` when variables are
  introduced.
- Never log authorization headers, access tokens, or full sensitive error
  payloads.

### Backend commands

Run from `backend/` using the existing Yarn lockfile:

```bash
yarn start:dev
yarn lint
yarn test
yarn test:e2e
yarn build
```

Follow NestJS dependency injection and module conventions. Avoid global mutable
state and manually instantiated providers.

## 5. TypeScript, style, and dependencies

- Use descriptive English names for code, routes, types, and files.
- Do not use `any` unless an external boundary makes it unavoidable; narrow
  `unknown` values instead.
- Prefer immutable data and small functions with a single responsibility.
- Remove dead code and unused imports as part of the change that creates them.
- Follow each application's existing ESLint and formatter configuration.
- Add dependencies only when the platform or existing stack cannot reasonably
  solve the problem. Document the reason in the handoff.
- Do not edit generated output such as `.next/`, `dist/`, or coverage files.

## 6. Testing expectations

Match verification to the changed behavior:

- Frontend: lint and production build; add focused tests for meaningful logic
  when a test setup exists.
- Backend: unit-test services and error mapping; use e2e tests for public route
  behavior; run lint and a production build.
- Mock GitHub in automated tests. Tests must not depend on live GitHub
  availability, real credentials, or rate limits.
- Cover success and relevant failure states, especially invalid usernames,
  missing users, rate limits, and upstream errors.

Do not silently weaken lint, TypeScript, or test rules to make checks pass.

## 7. Agent workflow

Before editing:

1. Read this file and any more specific `AGENTS.md` in the target directory.
2. Inspect the relevant application, scripts, and configuration.
3. Preserve unrelated user changes and the existing package manager.
4. Identify the smallest change that fully satisfies the request.

While editing:

1. Keep changes inside the requested scope.
2. Reuse existing patterns before introducing new abstractions.
3. Update documentation and `.env.example` when configuration changes.
4. Do not start long-running servers unless the user explicitly requests it.

Before handing off:

1. Run the relevant lint, tests, and build commands.
2. Report what changed, what was verified, and any remaining limitation.
3. Never claim a check passed unless it was actually run.

## 8. Definition of done

A change is complete when:

- it respects the frontend/backend boundary;
- public input and upstream failures are handled safely;
- the UI is responsive and accessible for the affected flow;
- no credential is exposed to browser code or committed files;
- relevant documentation and environment examples are current;
- appropriate validation commands pass.

## 9. Official documentation

- Next.js: https://nextjs.org/docs
- NestJS: https://docs.nestjs.com
- GitHub REST API: https://docs.github.com/en/rest

# Profile/Scan frontend

Next.js frontend for the GitHub profile viewer. It requests normalized public
profile data from the NestJS backend; it does not call GitHub directly.

## Requirements

- Node.js 20.9 or later
- Yarn 1.22.22
- The backend available at the URL configured below

## Local setup

```bash
cp .env.example .env.local
yarn install --frozen-lockfile
yarn dev --port 8080
```

Open [http://localhost:8080](http://localhost:8080).

`NEXT_PUBLIC_API_URL` is the public origin of the NestJS application and
defaults to `http://localhost:3000`. Never put credentials in a
`NEXT_PUBLIC_*` variable.

The frontend consumes:

```text
GET /api/github/users/:username
```

with a normalized camelCase response matching `GitHubProfile` in
`src/lib/github-api.ts`.

## Quality checks

```bash
yarn lint
yarn build
```

# AI Agent Entry Point

This repository is a monorepo for a GitHub profile viewer. Before changing
code, read and follow the complete project rules in:

- [`.github/agent-instructions.md`](.github/agent-instructions.md)

That file is the source of truth for product scope, architecture, conventions,
commands, security, testing, and completion criteria. When instructions
conflict, follow the most specific instruction for the area being changed.

## Repository layout

```text
.
├── backend/   # NestJS API
└── frontend/  # Next.js web application
```

Keep application code inside the corresponding directory. Do not add a second
frontend or backend implementation at the repository root.

## Essential constraints

- The browser must communicate with GitHub through the NestJS backend.
- The backend is stateless and must not introduce a database or persistence
  layer.
- Never expose GitHub credentials or other secrets to the frontend.
- Use TypeScript and keep strict type safety in both applications.
- Prefer small, focused changes and avoid unnecessary dependencies.
- Do not start the frontend development server automatically.
- If browser testing is needed, use `http://localhost:8080`. If it is not
  available, ask the user to start the frontend server.

# GitHub Profile Viewer

Aplicación web orientada a reclutamiento técnico que transforma la información
pública de cualquier usuario de GitHub en un perfil claro, moderno y
compartible mediante la ruta `/users/:username`.

El navegador realiza una sola petición al backend. NestJS consulta GitHub,
normaliza los datos y agrega perfil, tecnologías, repositorios destacados,
organizaciones y actividad reciente. El proyecto es completamente **stateless**:
no utiliza base de datos, persistencia, ORM ni caché.

## Arquitectura

```text
Navegador
   │  GET /api/github/users/:username
   ▼
Next.js :8080 ───────────────► NestJS :3000
                                  │
                                  ├─ GET /users/:username
                                  ├─ GET /users/:username/repos
                                  ├─ GET /users/:username/orgs
                                  └─ GET /users/:username/events/public
                                             │
                                             ▼
                                      GitHub REST API
```

NestJS obtiene primero el perfil obligatorio. Sólo si existe lanza en paralelo
las otras tres consultas. Una búsqueda completa puede consumir hasta **cuatro
solicitudes** de la cuota de GitHub.

## Stack y estructura

- **Frontend:** Next.js App Router, React, TypeScript y Tailwind CSS.
- **Backend:** NestJS y TypeScript.
- **Integración:** GitHub REST API.
- **Desarrollo:** Yarn 1, Docker Compose y GNU Make.

```text
.
├── backend/
│   ├── src/github/          # Cliente, normalización y ranking
│   ├── src/health/          # Healthcheck
│   └── test/                # Pruebas e2e con GitHub simulado
├── frontend/
│   ├── src/app/             # Portada y /users/[username]
│   ├── src/components/      # Búsqueda y vista enriquecida
│   └── src/lib/             # Cliente y validación defensiva del contrato
├── docker-compose.yml
├── Makefile
├── AGENTS.md
└── .github/agent-instructions.md
```

Cada aplicación conserva sus propias dependencias y su `yarn.lock`. No se
importa código fuente entre frontend y backend: el límite es el contrato HTTP.

## Configuración

Para Docker Compose:

```bash
cp .env.example .env
```

| Variable | Predeterminado | Uso |
| --- | --- | --- |
| `BACKEND_PORT` | `3000` | Puerto público de NestJS |
| `FRONTEND_PORT` | `8080` | Puerto público de Next.js |
| `FRONTEND_ORIGIN` | `http://localhost:8080` | Origen permitido por CORS |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | API visible para el navegador |
| `GITHUB_TOKEN` | vacío | Token utilizado únicamente por NestJS |

`GITHUB_TOKEN` puede quedar vacío en desarrollo, aunque una consulta sin token
tiene una cuota menor. En `NODE_ENV=production` es obligatorio y el backend no
arranca si falta. Nunca se debe exponer mediante una variable
`NEXT_PUBLIC_*`.

## Ejecución con Docker

Sólo backend y la red:

```bash
make up-backend
```

Proyecto completo:

```bash
make up
```

- Frontend: [http://localhost:8080](http://localhost:8080)
- Backend: [http://localhost:3000/api](http://localhost:3000/api)
- Salud: [http://localhost:3000/api/health](http://localhost:3000/api/health)

Los servicios se ejecutan en modo desarrollo con recarga y volúmenes de
dependencias separados. No existe un contenedor de base de datos.

Comandos disponibles:

```bash
make help
make config
make build
make up-backend
make up
make ps
make logs
make backend-logs
make frontend-logs
make check
make down
make clean
```

## API pública del proyecto

### `GET /api/health`

```json
{ "status": "ok" }
```

### `GET /api/github/users/:username`

Entrega el perfil agregado. Ejemplo abreviado:

```json
{
  "login": "octocat",
  "name": "The Octocat",
  "avatarUrl": "https://avatars.githubusercontent.com/...",
  "bio": "GitHub mascot",
  "htmlUrl": "https://github.com/octocat",
  "blogUrl": "https://github.blog/",
  "twitterUsername": "github",
  "location": "San Francisco",
  "company": "@github",
  "hireable": true,
  "accountType": "User",
  "followers": 18000,
  "following": 9,
  "publicRepos": 8,
  "publicGists": 2,
  "createdAt": "2011-01-25T18:44:36Z",
  "updatedAt": "2026-07-20T12:00:00Z",
  "repositories": [
    {
      "id": 1,
      "name": "hello-world",
      "fullName": "octocat/hello-world",
      "description": "First repository",
      "htmlUrl": "https://github.com/octocat/hello-world",
      "homepageUrl": null,
      "language": "TypeScript",
      "stars": 100,
      "forks": 20,
      "topics": ["example"],
      "license": "MIT",
      "pushedAt": "2026-07-20T12:00:00Z"
    }
  ],
  "topLanguages": [
    { "name": "TypeScript", "repositoryCount": 4 }
  ],
  "organizations": [],
  "activity": [],
  "sections": {
    "repositories": "ok",
    "organizations": "ok",
    "activity": "ok"
  }
}
```

Los repositorios fork, archivados o deshabilitados se excluyen. Los seis
destacados se ordenan mediante una puntuación normalizada de 55 % estrellas,
20 % forks y 25 % recencia, con decaimiento a 365 días. Los cinco lenguajes
principales se calculan a partir del lenguaje primario de todos los repositorios
elegibles, sin solicitudes adicionales.

Cada sección secundaria tiene estado `ok`, `rateLimited` o `unavailable`. Si
una falla, contiene una lista vacía y el perfil sigue respondiendo `200`. Sólo
el perfil principal determina estos errores:

| Estado | Significado |
| --- | --- |
| `400` | Nombre de usuario inválido |
| `404` | Usuario inexistente |
| `429` | Límite de GitHub alcanzado |
| `502` | Respuesta inesperada de GitHub |
| `503` | GitHub no está disponible |
| `504` | Tiempo de espera agotado |

## Endpoints de GitHub consumidos

El backend usa la GitHub REST API y nunca reenvía respuestas sin normalizar:

```text
GET /users/{username}
GET /users/{username}/repos?per_page=100&sort=updated
GET /users/{username}/orgs
GET /users/{username}/events/public?per_page=30
```

La actividad reconoce `Push`, `PullRequest`, `Issues`, `Create`, `Watch`,
`Fork` y `Release`; otros eventos se ignoran. Se muestran como máximo seis
organizaciones y ocho eventos.

## Ejecución sin Docker

Backend:

```bash
cd backend
cp .env.example .env
yarn install --frozen-lockfile
yarn start:dev
```

Frontend:

```bash
cd frontend
cp .env.example .env.local
yarn install --frozen-lockfile
yarn dev --port 8080
```

## Calidad

```bash
cd backend
yarn lint
yarn test
yarn test:e2e
yarn build

cd ../frontend
yarn lint
yarn build
```

Todas las pruebas automatizadas del backend simulan `fetch`: no consumen
GitHub, credenciales ni límites reales.

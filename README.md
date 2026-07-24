# GitHub Profile Viewer

Aplicación web para buscar cualquier usuario público de GitHub y presentar su
perfil en una interfaz moderna, clara y responsiva.

El frontend nunca consulta GitHub directamente. Las peticiones pasan por el
backend NestJS, que valida el nombre de usuario, consume la API pública de
GitHub, normaliza la respuesta y entrega al navegador únicamente los campos que
la interfaz necesita.

El proyecto es completamente **stateless**: no utiliza base de datos,
persistencia, ORM, entidades ni migraciones.

## Arquitectura

```text
Navegador
   │
   │ http://localhost:8080
   ▼
Next.js (frontend)
   │
   │ GET /api/github/users/:username
   ▼
NestJS (backend)
   │
   │ GET https://api.github.com/users/:username
   ▼
GitHub REST API
```

## Stack

- **Frontend:** Next.js, React, TypeScript y Tailwind CSS.
- **Backend:** NestJS y TypeScript.
- **Integración:** GitHub REST API.
- **Entorno local:** Docker Compose y GNU Make.

## Estructura del repositorio

```text
.
├── backend/
│   ├── src/
│   │   ├── github/          # Integración, validación y normalización
│   │   ├── health/          # Comprobación de salud
│   │   ├── app.config.ts    # Prefijo global y CORS
│   │   └── app.module.ts
│   ├── test/                # Pruebas end-to-end
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/app/             # App Router, layout y páginas
│   ├── src/components/      # Búsqueda y presentación del perfil
│   ├── src/lib/             # Cliente HTTP y contrato de respuesta
│   ├── Dockerfile
│   └── package.json
├── .env.example             # Variables para Docker Compose
├── docker-compose.yml       # Backend, frontend y red local
├── Makefile                 # Atajos de desarrollo
├── AGENTS.md
└── .github/agent-instructions.md
```

Cada aplicación mantiene sus propias dependencias. El contrato entre ambas se
expresa mediante HTTP; no se comparte ni importa código fuente entre
`frontend/` y `backend/`.

## Requisitos

- Docker con el plugin Docker Compose.
- GNU Make, recomendado para utilizar los atajos documentados.

No es necesario instalar Node.js en el host si se utiliza Docker.

## Configuración

El proyecto funciona con valores locales predeterminados. Para personalizarlos:

```bash
cp .env.example .env
```

| Variable | Valor predeterminado | Descripción |
| --- | --- | --- |
| `BACKEND_PORT` | `3000` | Puerto público del backend |
| `FRONTEND_PORT` | `8080` | Puerto público del frontend |
| `FRONTEND_ORIGIN` | `http://localhost:8080` | Origen permitido por CORS |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | URL de API usada por el navegador |
| `GITHUB_TOKEN` | vacío | Token opcional, usado exclusivamente por NestJS |

El endpoint de GitHub utilizado permite consultar recursos públicos sin
autenticación. Un token es opcional y sólo sirve para aumentar el límite de
peticiones. Nunca debe colocarse en una variable `NEXT_PUBLIC_*`.

## Ejecución con Docker

### Sólo backend

Construye y levanta NestJS junto con la red del proyecto:

```bash
make up-backend
```

La API estará disponible en [http://localhost:3000/api](http://localhost:3000/api).

### Proyecto completo

Construye y levanta backend y frontend:

```bash
make up
```

- Frontend: [http://localhost:8080](http://localhost:8080)
- Backend: [http://localhost:3000/api](http://localhost:3000/api)

El código se monta dentro de los contenedores y ambos frameworks recargan
cambios durante el desarrollo.

## Comandos útiles

```bash
make help              # Lista todos los comandos
make config            # Valida Docker Compose
make build             # Construye ambas imágenes
make up-backend        # Levanta sólo NestJS
make up                # Levanta NestJS y Next.js
make ps                # Estado de los servicios
make logs              # Logs de todo el proyecto
make backend-logs      # Logs de NestJS
make frontend-logs     # Logs de Next.js
make backend-shell     # Terminal dentro del backend
make frontend-shell    # Terminal dentro del frontend
make check             # Pruebas y lint principales
make down              # Detiene contenedores y red
make clean             # Elimina también volúmenes de dependencias
```

## Endpoints

### `GET /api/health`

Comprobación de salud utilizada por Docker:

```json
{
  "status": "ok"
}
```

### `GET /api/github/users/:username`

Obtiene un perfil público desde
`GET https://api.github.com/users/{username}` y normaliza los nombres de sus
campos.

Ejemplo:

```http
GET /api/github/users/octocat
```

Respuesta:

```json
{
  "login": "octocat",
  "name": "The Octocat",
  "avatarUrl": "https://avatars.githubusercontent.com/u/583231?v=4",
  "bio": null,
  "htmlUrl": "https://github.com/octocat",
  "location": "San Francisco",
  "company": "@github",
  "followers": 18000,
  "following": 9,
  "publicRepos": 8
}
```

| Estado | Significado |
| --- | --- |
| `200` | Perfil encontrado |
| `400` | Nombre de usuario inválido |
| `404` | Usuario inexistente |
| `429` | Límite de GitHub alcanzado |
| `502` | GitHub devolvió una respuesta inesperada |
| `503` | GitHub no está disponible |
| `504` | La consulta a GitHub excedió el tiempo límite |

La respuesta completa de GitHub nunca se reenvía directamente al frontend.

## GitHub REST API

El backend envía los encabezados recomendados por GitHub y utiliza la versión
`2026-03-10` de la API. La consulta de un usuario público funciona sin
autenticación.

- [Endpoint “Get a user”](https://docs.github.com/en/rest/users/users#get-a-user)
- [Versiones de GitHub REST API](https://docs.github.com/en/rest/about-the-rest-api/api-versions)

## Ejecución sin Docker

Backend:

```bash
cd backend
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

Backend:

```bash
yarn lint
yarn test
yarn test:e2e
yarn build
```

Frontend:

```bash
yarn lint
yarn build
```

Las pruebas automatizadas del backend simulan `fetch`; no consumen GitHub ni
dependen de credenciales o límites externos.

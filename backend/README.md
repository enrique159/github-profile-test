# GitHub Profile Viewer API

API NestJS stateless que agrega datos públicos de GitHub para el frontend. No
usa base de datos, ORM, persistencia ni caché; cada consulta obtiene información
actualizada del proveedor.

## Configuración

```bash
cp .env.example .env
```

```dotenv
PORT=3000
FRONTEND_ORIGIN=http://localhost:8080
GITHUB_TOKEN=
```

El token es opcional en desarrollo y aumenta la cuota de GitHub. Es obligatorio
cuando `NODE_ENV=production`; el proceso termina al iniciar si no está definido.
Nunca debe llegar al frontend.

## Ejecución

```bash
yarn install --frozen-lockfile
yarn start:dev
```

La API queda disponible en `http://localhost:3000/api`.

## Endpoints del proyecto

```text
GET /api/health
GET /api/github/users/:username
```

El endpoint de usuario obtiene primero el perfil. Después consulta en paralelo:

```text
GET https://api.github.com/users/{username}/repos?per_page=100&sort=updated
GET https://api.github.com/users/{username}/orgs
GET https://api.github.com/users/{username}/events/public?per_page=30
```

Junto con `GET https://api.github.com/users/{username}`, una búsqueda completa
consume hasta cuatro solicitudes de GitHub.

## Contrato agregado

La respuesta incluye:

- perfil: identidad, bio, enlaces, ubicación, compañía, disponibilidad, tipo de
  cuenta, métricas y fechas ISO 8601;
- `repositories`: hasta seis repositorios normalizados con URL, homepage,
  lenguaje, estrellas, forks, temas, licencia y última actividad;
- `topLanguages`: hasta cinco lenguajes y su número de repositorios;
- `organizations`: hasta seis organizaciones públicas;
- `activity`: hasta ocho eventos normalizados;
- `sections`: estado independiente para repositorios, organizaciones y
  actividad.

Los repositorios fork, archivados y deshabilitados se descartan. La selección
usa una puntuación normalizada de `0.55 × estrellas + 0.20 × forks + 0.25 ×
recencia`, con recencia lineal hasta 365 días. Los lenguajes se cuentan sobre
todos los repositorios elegibles.

La actividad soporta `PushEvent`, `PullRequestEvent`, `IssuesEvent`,
`CreateEvent`, `WatchEvent`, `ForkEvent` y `ReleaseEvent`. Los demás tipos se
ignoran.

## Fallos parciales

`sections.repositories`, `sections.organizations` y `sections.activity` pueden
ser:

- `ok`: sección obtenida;
- `rateLimited`: GitHub limitó esa consulta;
- `unavailable`: timeout, payload inválido u otro fallo upstream.

Una sección secundaria fallida devuelve su colección vacía y HTTP `200`. El
perfil obligatorio sí puede producir `400`, `404`, `429`, `502`, `503` o `504`.
Cada solicitud externa tiene un timeout de cinco segundos.

## Verificación

```bash
yarn format
yarn lint
yarn test
yarn test:e2e
yarn build
```

Las pruebas unitarias y e2e simulan `fetch`; ninguna realiza llamadas reales a
GitHub.

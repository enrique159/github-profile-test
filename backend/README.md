# GitHub Profile Viewer API

API NestJS sin estado que consulta perfiles públicos en GitHub y entrega al
frontend un contrato pequeño y estable.

No utiliza base de datos, ORM, entidades ni migraciones. Los datos se solicitan
a GitHub en cada consulta.

## Configuración

Variables opcionales:

```bash
PORT=3000
FRONTEND_ORIGIN=http://localhost:8080
GITHUB_TOKEN=
```

El endpoint público funciona sin token. `GITHUB_TOKEN` puede configurarse
únicamente en el backend para obtener límites de peticiones más altos.

## Ejecución

```bash
yarn install --frozen-lockfile
yarn start:dev
```

La API queda disponible en `http://localhost:3000/api`.

## Endpoints

```text
GET /api/health
GET /api/github/users/:username
```

El endpoint de usuarios valida el nombre, consulta
`https://api.github.com/users/{username}` y transforma la respuesta de GitHub al
contrato camelCase consumido por el frontend.

## Verificación

```bash
yarn lint
yarn test
yarn test:e2e
yarn build
```

Las pruebas simulan `fetch`; no realizan peticiones a GitHub.

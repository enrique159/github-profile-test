# Profile/Scan frontend

Frontend Next.js orientado a explorar perfiles públicos de GitHub para
reclutamiento técnico. La portada busca un usuario y navega a la vista
compartible `/users/:username`.

## Experiencia

La página de perfil muestra:

- identidad, bio, enlaces, ubicación y antigüedad;
- repositorios, gists, seguidores y seguidos;
- cinco tecnologías principales;
- seis repositorios destacados;
- seis organizaciones públicas;
- ocho eventos recientes compatibles.

El navegador realiza una sola petición a NestJS:

```text
GET /api/github/users/:username
```

No consulta GitHub directamente. El contrato camelCase y su validación
defensiva viven en `src/lib/github-api.ts`. Los enlaces sólo se aceptan si usan
HTTP/HTTPS; los destinos de GitHub y avatares también validan hostname.

La vista modela skeleton, contenido vacío, fallo parcial, usuario inexistente,
límite de GitHub, backend no disponible y reintento. Un fallo secundario muestra
un aviso dentro de su sección sin ocultar el perfil.

## Requisitos y configuración

- Node.js 20.9 o posterior
- Yarn 1.22.22
- Backend disponible en la URL configurada

```bash
cp .env.example .env.local
yarn install --frozen-lockfile
yarn dev --port 8080
```

Abre [http://localhost:8080](http://localhost:8080).

`NEXT_PUBLIC_API_URL` define el origen público de NestJS y usa
`http://localhost:3000` de forma predeterminada. No se deben colocar
credenciales en variables `NEXT_PUBLIC_*`.

## Rutas

| Ruta | Función |
| --- | --- |
| `/` | Portada y búsqueda |
| `/users/:username` | Perfil enriquecido compartible |

## Calidad

```bash
yarn lint
yarn build
```

El proyecto usa App Router, React, TypeScript y Tailwind CSS sin bibliotecas
visuales ni de estado adicionales.

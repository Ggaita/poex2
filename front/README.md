# POEX2 — Frontend/Backend de Registro y Administración
Este documento describe el estado actual del proyecto, su stack, seguridad implementada, guía de ejecución local y convenciones recomendadas para estilos/recursos gráficos.

## Estado funcional actual
El sistema permite:
- Registro público de empresas mediante formulario (`/register`) persistido en PostgreSQL.
- Login real para `admin` y `empresa` contra usuarios de base de datos (`/login`).
- Panel privado con layout interno diferenciado por rol (sin header/footer públicos).
- Gestión admin de solicitudes (`/admin/applications`):
  - Listado, filtro, detalle.
  - Aprobación/rechazo.
  - Trazabilidad de revisión.

## Stack tecnológico
### Backend
- Node.js + TypeScript
- Express 5
- Prisma ORM
- PostgreSQL
- bcryptjs (hash de contraseñas)
- jsonwebtoken (JWT firmado)
- dotenv

### Frontend
- React 19 + TypeScript
- Vite
- React Router DOM
- CSS modular por página/layout

### Herramientas de desarrollo
- ts-node-dev
- TypeScript compiler (`tsc`)
- Scripts de integración en Node (`back/scripts/*.mjs`)

## Seguridad implementada (estado actual)
- Login emite JWT firmado con secret de entorno.
- Validación de token `Bearer` en backend.
- Autorización por rol para rutas sensibles (`admin`).
- Rutas admin protegidas en frontend por guard de rol.
- Si token expira/no es válido, el frontend limpia sesión y redirige a login.
- `reviewedBy` en aprobación/rechazo se toma del usuario autenticado en backend (no se confía en el body del request).

## Rutas principales
### Públicas (frontend)
- `/`
- `/search`
- `/register`
- `/login`

### Privadas (frontend)
- Admin:
  - `/admin/dashboard`
  - `/admin/applications`
- Empresa:
  - `/empresa/panel`

### API backend
- Auth:
  - `POST /api/auth/login`
- Registro público:
  - `POST /api/public/applications`
- Admin protegido con JWT + rol admin:
  - `GET /api/admin/applications`
  - `GET /api/admin/applications/:id`
  - `PATCH /api/admin/applications/:id/status`

## Variables de entorno backend
Archivo: `back/.env`
- `DATABASE_URL`
- `SHADOW_DATABASE_URL`
- `PORT`
- `AUTH_JWT_SECRET`
- `AUTH_JWT_EXPIRES_IN`

Nota: por decisión actual del proyecto, `back/.env.example` está ignorado por git.

## Cómo levantar el proyecto local
Requisito: PostgreSQL corriendo y base configurada.

### 1) Backend
Desde la raíz del repo:
```powershell
npm.cmd --prefix back install
npm.cmd --prefix back run prisma:generate
npm.cmd --prefix back run prisma:migrate
npm.cmd --prefix back run seed:auth-users
npm.cmd --prefix back run dev
```

### 2) Frontend
En otra terminal:
```powershell
npm.cmd --prefix front install
npm.cmd --prefix front run dev
```

## Credenciales de demo (seed)
- Admin: `admin@poex.local` / `Admin1234!`
- Empresa: `empresa@poex.local` / `Empresa1234!`

## Validaciones técnicas disponibles
Backend:
```powershell
npm.cmd --prefix back run typecheck
npm.cmd --prefix back run build
npm.cmd --prefix back run test:integration:auth-flow
npm.cmd --prefix back run test:integration:applications
```

Frontend:
```powershell
npm.cmd --prefix front run build
```

## Convención recomendada para CSS global (Gobierno del Chaco)
Para centralizar tipografía, paleta oficial, espaciados y tokens:
- Mantener `front/src/index.css` solo como punto de entrada global.
- Crear:
  - `front/src/styles/tokens.css` (colores institucionales, tamaños, z-index, sombras, radios).
  - `front/src/styles/typography.css` (fuentes, escala tipográfica, pesos, line-height).
  - `front/src/styles/base.css` (reset/base html-body-a-button, utilidades globales mínimas).
- Importar esos archivos desde `front/src/index.css`.

## Convención recomendada para imágenes, iconos e isotipo
Para assets institucionales y de UI:
- `front/src/assets/brand/` → isotipo, logotipo, versiones oficiales (svg/png/webp).
- `front/src/assets/icons/` → iconografía UI.
- `front/src/assets/images/` → imágenes de contenido, hero, ilustraciones.
- `front/src/assets/backgrounds/` → fondos/decorativos globales.

Sugerencia práctica:
- Preferir SVG para isotipo/logotipo/iconos.
- Versionar variantes de marca por tema/tamaño (`logo-chaco-dark.svg`, `logo-chaco-light.svg`).
- Exponer constantes en un archivo de ayuda (`front/src/shared/constants/brand.ts`) para no hardcodear rutas en múltiples componentes.

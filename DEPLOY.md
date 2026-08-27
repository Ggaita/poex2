# POEX2 — Guía de despliegue / producción

Esta guía es para correr el proyecto en el **servidor**.  
Para editar vistas y estilos en tu máquina, mirá `front/src/README.md`.

## Arquitectura rápida

| Parte | Carpeta | Puerto típico | Salida |
| --- | --- | --- | --- |
| API (Express + Prisma) | `back/` | `3001` | `back/dist/` + proceso Node |
| Front (React + Vite) | `front/` | estático (Nginx/IIS) | `front/dist/` |
| PostgreSQL | — | `5432` | base `poex2` |

Requisitos en el servidor:

- Node.js **18+** (recomendado 20 LTS)
- PostgreSQL **14+**
- Git
- (Opcional) Nginx / IIS / Caddy para servir el front y reverse-proxy del API

---

## 0) Primera vez en el servidor (clonar)

```bash
git clone <URL_DEL_REPO> poex2
cd poex2
```

Si el repo ya está clonado, saltá al paso 1.

---

## 1) Actualizar código

```bash
cd poex2
git pull
```

---

## 2) Backend — variables de entorno

```bash
cd back
copy .env.example .env
# en Linux/macOS: cp .env.example .env
```

Editá `back/.env` (mínimo obligatorio):

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/poex2?schema=public"
PORT=3001
AUTH_JWT_SECRET="un-secreto-largo-unico-de-produccion"
AUTH_JWT_EXPIRES_IN="8h"
```

Recomendado en producción:

```env
ADMIN_PANEL_URL="https://tu-dominio"
PUBLIC_APP_URL="https://tu-dominio"
ADMIN_NOTIFICATION_EMAIL="admin@tu-dominio"
```

Outlook/SMTP (cuando tengan credenciales):

```env
SMTP_HOST="smtp.office365.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="agencia@tu-dominio"
SMTP_PASS="********"
SMTP_FROM="Agencia POEX <agencia@tu-dominio>"
```

> `SHADOW_DATABASE_URL` solo se usa en desarrollo con `prisma migrate dev`. En producción usamos `migrate deploy` y no hace falta.

---

## 3) Backend — instalar, migrar, build

```bash
cd back
npm ci
# si npm ci falla por lock desfasado: npm install

npx prisma generate
npm run prisma:migrate:deploy
npm run build
```

### Seeds (elegí según el caso)

**Usuarios admin / empresa de acceso** (recomendado siempre en un entorno nuevo):

```bash
npm run seed:auth-users
```

Defaults (cambiables con env `SEED_ADMIN_*` / `SEED_EMPRESA_*`):

| Rol | Email | Password |
| --- | --- | --- |
| admin | `admin@poex.local` | `Admin1234!` |
| empresa | `empresa@poex.local` | `Empresa1234!` |

> En producción real, **cambiá esas claves** o creá usuarios propios y desactivá los de prueba.

**Empresas del relevamiento** (35 perfiles publicados + productos/NCM):

```bash
# Opcional: apuntar a los CSV en el servidor
# set RELEVAMIENTO_CSV=C:\ruta\Base completa.csv
# set NCM_CSV=C:\ruta\correcciones NCM.csv

npm run seed:relevamiento
```

Por defecto el script busca los CSV en `C:\Users\gaita\Downloads\...`.  
En el servidor **definí las rutas** con `RELEVAMIENTO_CSV` (y si aplica `NCM_CSV`) o copiá los CSV a esas rutas.

**No uses** `seed:demo-companies` en producción (eran datos de demo; ya se limpiaron en local).

---

## 4) Backend — arrancar

```bash
cd back
npm start
# equivale a: node dist/server.js
```

Deberías ver: `Server running on http://localhost:3001`

### Proceso persistente (elegí uno)

**Windows (NSSM / servicio)** o Task Scheduler, o:

```bash
npx pm2 start dist/server.js --name poex2-api
npx pm2 save
```

**Linux (pm2 / systemd)** igual idea: siempre `node dist/server.js` con cwd = `back/` y el `.env` cargado (dotenv lo lee al iniciar).

Health manual:

```bash
curl http://127.0.0.1:3001/api/public/profiles
```

---

## 5) Frontend — build de producción

```bash
cd front
copy .env.example .env
# o crear .env con:
# VITE_API_URL=https://api.tu-dominio
# (o http://IP:3001 si aún no hay dominio)
```

Importante: `VITE_API_URL` se **congela en el build**. Tiene que ser la URL que el **navegador del usuario** usará para hablar con el API.

```bash
npm ci
npm run build
```

Salida: carpeta `front/dist/` (HTML/JS/CSS estáticos).

Serví `front/dist` con Nginx/IIS/Caddy.  
Ejemplo conceptual Nginx:

- `/` → `front/dist`
- `/api` → proxy a `http://127.0.0.1:3001`
- `/uploads` → proxy a `http://127.0.0.1:3001` (logos/fotos)

Si el front llama directo a `http://servidor:3001`, asegurate de CORS (ya está `cors()` en el API) y firewall.

---

## 6) Checklist post-deploy

1. Abrir el sitio público → home, búsqueda, ficha empresa.
2. Login admin → perfiles (35), solicitudes, comunicaciones.
3. Login empresa (si hay usuario) → panel.
4. Subir un logo de prueba (carpeta `back/uploads/` debe ser escribible).
5. (Opcional) `cd back && npm run test:security:roles` en un entorno de staging.

---

## 7) Actualizaciones siguientes (día a día)

```bash
cd poex2
git pull

cd back
npm ci
npx prisma generate
npm run prisma:migrate:deploy
npm run build
# reiniciar el proceso Node (pm2 restart poex2-api / servicio Windows)

cd ../front
# revisar VITE_API_URL en .env si cambió el dominio
npm ci
npm run build
# republish front/dist en el web server
```

Seeds **no** se vuelven a correr en cada deploy, salvo que quieras:

- resetear passwords de seed → `npm run seed:auth-users`
- reimportar/actualizar empresas del CSV → `npm run seed:relevamiento` (hace upsert, no duplica por CUIT)

---

## 8) Dónde editar vos (estilos / vistas)

Documentado en `front/src/README.md`:

| Qué | Dónde |
| --- | --- |
| Colores / tipografía | `front/src/styles/tokens.css` |
| Header / menú | `front/src/components/header/` |
| Footer | `front/src/components/footer/` |
| Páginas públicas | `front/src/pages/public/` |
| Admin | `front/src/pages/admin/` |
| Empresa | `front/src/pages/company/` |
| Login/registro | `front/src/pages/auth/` |
| Formularios compartidos | `front/src/shared/components/` |
| Rutas | `front/src/app/router/index.tsx` |

Después de editar en local:

```bash
cd front
npm run build
# y subir/republish dist, o git commit + pull + build en servidor
```

---

## 9) Scripts útiles (backend)

| Script | Uso |
| --- | --- |
| `npm run build` | Compila TypeScript → `dist/` |
| `npm start` | Produce API |
| `npm run prisma:migrate:deploy` | Aplica migraciones en prod |
| `npm run seed:auth-users` | Admin + empresa demo |
| `npm run seed:relevamiento` | Importa empresas CSV |
| `npm run test:security:roles` | Authz rutas protegidas |
| `npm run test:integration:auth-flow` | Registro/login |
| `npm run test:integration:applications` | Altas de empresa |

---

## 10) Notas de producción

- **JWT**: no uses el secret de desarrollo.
- **Uploads**: el proceso Node necesita escritura en `back/uploads/`.
- **SMTP**: sin configurar, los mails quedan en outbox (`prepared`); la app no se cae.
- **Relevamiento**: 1 CUIT compartido se fusiona en un solo perfil (razón social legal + marca).
- **Front**: siempre rebuild si cambiás `VITE_API_URL`.

---

## Orden mínimo “servidor nuevo → online”

```text
1. git clone / git pull
2. back: .env → npm ci → prisma generate → migrate deploy → build → seed:auth-users
3. back: (opcional) seed:relevamiento con CSV en el server
4. back: npm start  (o pm2/servicio)
5. front: .env VITE_API_URL → npm ci → build → publicar dist/
6. Probar login admin + una ficha pública
```

# Organización del frontend (`src`)

Estructura pensada para trabajar por dominios, tocar estilos sin perderse y dejar comentarios humanos.

## Mapa rápido

```text
src/
  app/                 # Arranque de la app (router, guards)
  assets/              # Imágenes y estáticos
  components/          # UI compartida del sitio público (header, footer, button)
  layouts/             # Cascarones de página (público / privado)
  pages/
    public/            # Sitio público
    auth/              # Login / registro
    admin/             # Panel administración
    company/           # Panel empresa
  shared/              # Auth, formularios reutilizables, tipos API
  styles/              # Tokens de marca y base global
```

## Dónde va cada cosa

| Qué querés cambiar | Dónde mirar |
| --- | --- |
| Menú / logo / botones del header | `components/header/` |
| Footer | `components/footer/` |
| Colores, tipografías, radios | `styles/tokens.css` |
| Reset / tipografía base | `styles/base.css` |
| Home y buscador | `pages/public/Home/HomePage.css`, `pages/public/Search/SearchPage.css` |
| Páginas institucionales / sectores | `pages/public/Institutional`, `Sectors`, `TradeServices`, `CommercialOpportunities` |
| Admin perfiles / solicitudes / mails | `pages/admin/*` |
| Panel empresa | `pages/company/Panel` |
| Formularios compartidos (info, especiales, imágenes, mapa) | `shared/components/*` |
| Sesión JWT / roles | `shared/auth/session.ts` |
| Rutas | `app/router/index.tsx` |

## Convención de una página

Cada feature de página vive en su carpeta:

```text
pages/admin/Profiles/
  AdminProfilesPage.tsx      # UI + lógica de la pantalla
  AdminProfilesPage.css      # Estilos SOLO de esta pantalla
  admin-profiles.types.ts    # Tipos locales de la pantalla
```

Reglas simples:

1. **CSS de página** al lado del `.tsx` de esa página (`NombrePage.css`).
2. **No pongas componentes globales dentro de `pages/`**. Si se reusa en 2+ lugares → `components/` o `shared/components/`.
3. **Tokens primero**: preferí `var(--color-primary)` antes que hex sueltos.
4. **Nombres en español en UI**, en inglés en código/archivos de sistema (`admin`, `public`, `shared`).

## Comentarios (estilo humano)

Usá comentarios cortos que expliquen *por qué*, no lo obvio:

```tsx
// Badge de pendientes: se refresca al cambiar de ruta y cada 45s.
```

Evitar:

```tsx
// Importa React
// Setea el estado en true
```

En CSS:

```css
/* Header público: franja superior marca + acciones de acceso */
.header-top { ... }
```

## Layouts

- `layouts/MainLayouts.tsx` → sitio público (Header + Footer).
- `layouts/PrivateLayout.tsx` → admin / empresa (nav interna + badges).

Las páginas públicas envuelven con `MainLayout`.  
Las privadas envuelven con `PrivateLayout`.

## Cómo agregar una pantalla nueva

1. Crear carpeta en el dominio correcto (`pages/public/...` o `pages/admin/...`).
2. Agregar `MiPage.tsx` + `MiPage.css`.
3. Registrar la ruta lazy en `app/router/index.tsx`.
4. Si necesita API, tipar respuesta en `shared/types` o types locales de la página.

## Notas de mantenimiento

- Los imports relativos desde `pages/*/*` hacia `layouts` / `shared` suelen ser `../../../`.
- `shared/components` son piezas de negocio reutilizables (formularios, upload, mapa).
- `components/*` es chrome visual del portal (header/footer/ui).

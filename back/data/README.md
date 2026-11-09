# Datos de seed

## Archivos oficiales

| Archivo | Comando |
| --- | --- |
| `poex-empresas.csv` | `npm run seed:relevamiento` |
| `investment-opportunities-seed.json` | `npm run seed:investment-portfolio` |
| `industrial-parks-seed.json` | (mismo comando portfolio) |

## Auth

```bash
npm run seed:auth-users
```

Crea solo el **admin** (`admin@poex.local` / `Admin1234!` por default).

## Empresas + accesos

```bash
npm run seed:relevamiento
```

- Importa perfiles desde `poex-empresas.csv`
- Crea usuario `empresa` por cada email del CSV
- Genera claves automáticas y las escribe en `empresa-credentials.csv` (solo en esa corrida)
- Para regenerar claves: `SEED_RESET_EMPRESA_PASSWORDS=1 npm run seed:relevamiento`

El admin puede **resetear/definir** claves en Perfiles → Acceso empresa (no se pueden "ver" las claves hasheadas).

## Ya no se usan

- `seed:demo-companies` (eliminado)
- cuenta demo `empresa@poex.local`

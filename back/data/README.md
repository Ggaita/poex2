# Datos de seed (relevamiento)

Archivos usados por `npm run seed:relevamiento`:

| Archivo | Uso |
| --- | --- |
| `poex-empresas.csv` | **Principal (limpio)** — 1 fila por producto, campos separados |
| `base-completa.csv` | Relevamiento crudo original (fallback) |
| `ncm-correcciones.csv` | Referencia / backup de correcciones NCM |

## Generar CSV limpio desde el relevamiento

```bash
cd back
npm run build:clean-csv
```

Salida: `back/data/poex-empresas.csv`

## En el servidor

1. Subí `back/data/poex-empresas.csv`
2. Corré:

```bash
cd back
npm run seed:relevamiento
```

Override opcional:

```bash
RELEVAMIENTO_CSV=/ruta/poex-empresas.csv npm run seed:relevamiento
```

## Columnas del CSV limpio

company_name, trade_name, tax_id, contact_name, contact_email, phone,
description, sector, sub_sector, city, address, website, facebook, instagram,
linkedin, logo_url, export_destinations, certifications, is_published,
product_name, product_description, tariff_position

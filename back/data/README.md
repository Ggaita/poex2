# Datos de seed (relevamiento)

Archivos usados por `npm run seed:relevamiento`:

| Archivo | Uso |
| --- | --- |
| `base-completa.csv` | **Principal** — empresas + NCM validados (36 filas → 35 perfiles) |
| `ncm-correcciones.csv` | Referencia / backup de correcciones NCM (el seed actual usa la base completa) |

## En el servidor o Docker

```bash
cd back
npm run seed:relevamiento
```

No hace falta SCP del CSV si este directorio vino en el `git pull`.

Override opcional:

```bash
RELEVAMIENTO_CSV=/otra/ruta/archivo.csv npm run seed:relevamiento
```

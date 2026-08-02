# PairApp

App privada para dos personas. El empujón cómodo para decir lo que normalmente se calla.

- **Requisitos:** [`docs/REQUISITOS.md`](docs/REQUISITOS.md) — qué se construye y por qué (41 decisiones cerradas)
- **Plan:** [`docs/PLAN.md`](docs/PLAN.md) — stack, equipo, hitos y convenciones

---

## Arrancar en local

Hace falta **Node 24+**, **pnpm** y **Docker** (solo para la base de datos).

```bash
pnpm install
cp .env.example .env      # y rellenar los valores
pnpm db:up                # levanta Postgres en Docker
pnpm db:migrate           # aplica las migraciones
pnpm dev                  # http://localhost:3000
```

Para generar los secretos del `.env`:

```bash
openssl rand -base64 32                 # AUTH_SECRET
openssl rand -hex 32                    # CRON_SECRET
npx web-push generate-vapid-keys        # el par VAPID
```

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Compilación de producción |
| `pnpm check` | Formato y lint (Biome) |
| `pnpm check:fix` | Corrige lo que se pueda automáticamente |
| `pnpm test` | Pruebas (Vitest) |
| `pnpm db:up` / `pnpm db:down` | Levanta o para el Postgres local |
| `pnpm db:migrate` | Crea y aplica una migración |
| `pnpm db:studio` | Visor de datos de Prisma |

## Estructura

```
docs/           Requisitos y plan de trabajo
prisma/         Esquema y migraciones
src/app/        Rutas y pantallas (App Router)
src/lib/        Acceso a datos, motor de reglas, utilidades
src/generated/  Cliente de Prisma (generado, no se versiona)
```

## Reglas del proyecto

1. **Nunca se usa `prismaCrudo` fuera de `src/lib/db.ts`.** Todo acceso a datos pasa por `dbDelVinculo(vinculoId)`, que hace imposible leer datos de otra pareja.
2. **Toda variable de entorno nueva va a `.env` y a `.env.example` en el mismo commit.**
3. **Cada función lleva una línea explicando para qué existe**, con la referencia al requisito (`RF-1.2.1`, `§3.0.15`) cuando implementa una regla del documento.
4. **Todo se guarda en UTC.** Las zonas horarias se aplican solo al mostrar y al decidir.
5. **Las ideas nuevas van a `docs/REQUISITOS.md` §12.2**, no al código sobre la marcha.

## Despliegue

Railway construye desde el `Dockerfile` y aplica las migraciones al arrancar el contenedor. No hay pasos manuales tras cada despliegue.

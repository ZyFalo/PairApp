import "dotenv/config"
import { defineConfig } from "prisma/config"

/**
 * Configuración del CLI de Prisma. Desde la versión 7 la conexión vive aquí
 * y no en `schema.prisma`, que queda solo con el modelo de datos.
 *
 * En runtime la app no usa esta URL: crea su propio adaptador (`src/lib/db.ts`).
 * Esto es solo para `migrate`, `db` y `studio`.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL as string,
  },
})

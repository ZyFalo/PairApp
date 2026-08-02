import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@/generated/prisma/client"

/**
 * Cliente de Prisma sin filtrar. Solo puede importarse desde este archivo
 * y desde la autenticación, que todavía no sabe a qué vínculo pertenece nadie.
 * Cualquier otro uso es un fallo de revisión (D41).
 */
const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient }

function crearCliente() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  })
}

export const prismaCrudo = globalParaPrisma.prisma ?? crearCliente()

// En desarrollo, Next recarga los módulos en cada cambio: sin esto se abrirían
// conexiones nuevas hasta agotar el pool.
if (process.env.NODE_ENV !== "production") globalParaPrisma.prisma = prismaCrudo

/**
 * Devuelve un cliente acotado a un vínculo: inyecta `vinculoId` en el `where`
 * de toda consulta, de modo que sea imposible leer datos de otra pareja (RNF-4).
 *
 * Es la única forma admitida de acceder a datos de dominio. Un `findMany()` sin
 * filtro deja de ser un riesgo porque el filtro no depende de que nadie lo escriba.
 */
export function dbDelVinculo(vinculoId: string) {
  return prismaCrudo.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const conFiltro = args as { where?: Record<string, unknown> }
          conFiltro.where = { ...conFiltro.where, vinculoId }
          return query(args)
        },
      },
    },
  })
}

export type DbDelVinculo = ReturnType<typeof dbDelVinculo>

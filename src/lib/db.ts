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
 * Operaciones cuyo `where` admite cualquier filtro. Son las únicas donde se
 * puede inyectar `vinculoId` sin romper nada.
 *
 * Las que faltan lo hacen a propósito:
 * - `findUnique`, `update`, `upsert`, `delete` exigen un **identificador único**,
 *   y añadirle un campo suelto deja de serlo — Prisma las rechaza.
 * - `create` y `createMany` no llevan `where`; el vínculo va en los datos.
 */
const OPERACIONES_FILTRABLES = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "updateMany",
  "deleteMany",
])

/**
 * Devuelve un cliente acotado a un vínculo: inyecta `vinculoId` en el `where`
 * de toda consulta filtrable, de modo que un `findMany()` sin filtro nunca
 * devuelva datos de otra pareja (RNF-4).
 *
 * **Lo que esto no cubre, y hay que hacer a mano.** Las operaciones que buscan
 * por identificador único —`update`, `upsert`, `delete`, `findUnique`— no pueden
 * llevar el filtro inyectado. Antes de usarlas hay que comprobar la pertenencia
 * con un `findFirst` sobre este mismo cliente, que sí va acotado:
 *
 * ```ts
 * const entrega = await db.entrega.findFirst({ where: { id } })  // acotado
 * if (!entrega) return { error: "No encontramos ese mensaje" }
 * await db.respuesta.upsert({ where: { entregaId: entrega.id }, ... })
 * ```
 */
export function dbDelVinculo(vinculoId: string) {
  return prismaCrudo.$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, args, query }) {
          if (!OPERACIONES_FILTRABLES.has(operation)) return query(args)
          const conFiltro = args as { where?: Record<string, unknown> }
          conFiltro.where = { ...conFiltro.where, vinculoId }
          return query(args)
        },
      },
    },
  })
}

export type DbDelVinculo = ReturnType<typeof dbDelVinculo>

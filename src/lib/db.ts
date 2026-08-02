import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@/generated/prisma/client"

/**
 * Cliente de Prisma sin filtrar (D41).
 *
 * Solo pueden importarlo los módulos que trabajan **antes o por encima** de un
 * vínculo, donde el cliente acotado no sirve porque todavía no hay a qué
 * acotarse. La lista está en `MODULOS_SIN_VINCULO` (`lib/aislamiento.test.ts`)
 * y una prueba falla si alguien se añade a ella sin darse cuenta:
 *
 * - `auth.ts` autentica: al entrar aún no se sabe de quién es nadie.
 * - `sesion.ts` resuelve el vínculo; es quien construye el cliente acotado.
 * - `acciones/cuenta.ts` registra y vincula: la membresía todavía no existe.
 * - `app/vincular/page.tsx` es la pantalla previa a tener pareja.
 * - `api/cron/despachar` recorre **todos** los vínculos, por definición.
 * - `push.ts` opera sobre usuarios y suscripciones, que no cuelgan de vínculo.
 *
 * En cualquier otro sitio es un fallo: si conoces el vínculo, usa
 * `dbDelVinculo` y deja que el filtro lo ponga él. Escribir `where:
 * { vinculoId }` a mano funciona hasta el día en que alguien lo borra.
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

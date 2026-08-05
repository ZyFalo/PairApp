import { CUANTAS_CABEN, desdeCuandoCuenta } from "@/lib/motor/novedades"
import { dbDeSesion } from "@/lib/sesion"

/**
 * Lo que la otra persona añadió y todavía no has apartado (RF-7.10).
 *
 * Tres filtros y los tres importan:
 *
 * - **`autorId` distinto del mío.** Nadie necesita que le anuncien lo suyo, y
 *   una lista donde salen tus propios movimientos deja de ser noticia para ser
 *   un registro de actividad.
 * - **Sin apartar.** Apartar quita el aviso, no la cosa.
 * - **Reciente.** Es lo que impide que esto se convierta en una bandeja: lo de
 *   hace diez días desaparece solo, sin que nadie tenga que atenderlo.
 *
 * El tope de `take` no es paginación: es que esto vive encima del calendario y
 * un panel que crece empuja hacia abajo la pantalla por la que se entró.
 */
export async function loUltimo() {
  const { db, sesion } = await dbDeSesion()

  return db.novedad.findMany({
    where: {
      autorId: { not: sesion.usuarioId },
      apartadaEn: null,
      creadaEn: { gte: desdeCuandoCuenta(new Date()) },
    },
    orderBy: { creadaEn: "desc" },
    take: CUANTAS_CABEN,
  })
}

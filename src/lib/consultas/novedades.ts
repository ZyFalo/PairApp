import { CUANTAS_CABEN, desdeCuandoCuenta, sigueLlevandoAAlgunSitio } from "@/lib/motor/novedades"
import { dbDeSesion } from "@/lib/sesion"

/**
 * Lo que la otra persona añadió y todavía no has apartado (RF-7.10).
 *
 * Cuatro filtros y los cuatro importan:
 *
 * - **`autorId` distinto del mío.** Nadie necesita que le anuncien lo suyo, y
 *   una lista donde salen tus propios movimientos deja de ser noticia para ser
 *   un registro de actividad.
 * - **Sin apartar.** Apartar quita el aviso, no la cosa.
 * - **Reciente.** Es lo que impide que esto se convierta en una bandeja: lo de
 *   hace diez días desaparece solo, sin que nadie tenga que atenderlo.
 * - **Que su módulo siga encendido.** Este va después de la consulta y no en el
 *   `where` a propósito: la regla es de dominio y su sitio es el motor, donde
 *   además se puede probar sin base de datos.
 *
 * El tope de `take` no es paginación: es que esto vive encima del calendario y
 * un panel que crece empuja hacia abajo la pantalla por la que se entró. Se
 * piden algunas de más porque el filtro de módulo quita después: si no, apagar
 * la música podía dejar el panel a dos líneas teniendo cuatro que enseñar.
 */
export async function loUltimo() {
  const { db, sesion } = await dbDeSesion()

  const recientes = await db.novedad.findMany({
    where: {
      autorId: { not: sesion.usuarioId },
      apartadaEn: null,
      creadaEn: { gte: desdeCuandoCuenta(new Date()) },
    },
    orderBy: { creadaEn: "desc" },
    take: CUANTAS_CABEN * 3,
  })

  return recientes
    .filter((n) => sigueLlevandoAAlgunSitio(n.tipo, sesion.modulos))
    .slice(0, CUANTAS_CABEN)
}

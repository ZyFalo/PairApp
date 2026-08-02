import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { dbDelVinculo, prismaCrudo } from "@/lib/db"

/** Quién está usando la app y a qué vínculo pertenece. */
export type Sesion = {
  usuarioId: string
  vinculoId: string
  nombre: string
  genero: "MASCULINO" | "FEMENINO" | "NEUTRO"
  zonaHoraria: string
  /** Si llevo el registro de mi ciclo. Es mi decisión, no se deduce del género (RF-5.0). */
  llevaCiclo: boolean
  /** Hasta cuándo he pedido que la app no me hable. Null si no hay pausa (§12.2). */
  pausaHasta: Date | null
  /** La otra persona del vínculo. Null mientras nadie haya canjeado la invitación. */
  pareja: { id: string; nombre: string; zonaHoraria: string; llevaCiclo: boolean } | null
}

/**
 * Sesión activa con su vínculo ya resuelto. Redirige si no hay sesión o si
 * la persona aún no pertenece a ningún vínculo.
 *
 * Es la puerta por la que pasa toda pantalla de la app: a partir de aquí
 * siempre hay un `vinculoId` con el que acotar las consultas (RNF-4).
 */
export async function exigirSesion(): Promise<Sesion> {
  const sesion = await auth()
  if (!sesion?.user?.id) redirect("/entrar")
  if (!sesion.user.vinculoId) redirect("/vincular")

  const usuarioId = sesion.user.id
  const vinculoId = sesion.user.vinculoId

  const membresias = await prismaCrudo.membresia.findMany({
    where: { vinculoId },
    include: { usuario: true },
  })

  const yo = membresias.find((m) => m.usuarioId === usuarioId)
  if (!yo) redirect("/vincular")

  const otra = membresias.find((m) => m.usuarioId !== usuarioId)

  return {
    usuarioId,
    vinculoId,
    nombre: yo.usuario.nombre,
    genero: yo.usuario.genero,
    zonaHoraria: yo.usuario.zonaHoraria,
    llevaCiclo: yo.usuario.llevaCiclo,
    pausaHasta: yo.usuario.pausaHasta,
    pareja: otra
      ? {
          id: otra.usuario.id,
          nombre: otra.usuario.nombre,
          zonaHoraria: otra.usuario.zonaHoraria,
          llevaCiclo: otra.usuario.llevaCiclo,
        }
      : null,
  }
}

/** Acceso a datos acotado al vínculo de la sesión actual. Atajo de uso constante. */
export async function dbDeSesion() {
  const sesion = await exigirSesion()
  return { db: dbDelVinculo(sesion.vinculoId), sesion }
}

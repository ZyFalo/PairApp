import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { dbDelVinculo, prismaCrudo } from "@/lib/db"
import type { ModulosDelVinculo } from "@/lib/motor/modulos"

/** Quién está usando la app y a qué vínculo pertenece. */
export type Sesion = {
  usuarioId: string
  vinculoId: string
  nombre: string
  genero: "MASCULINO" | "FEMENINO" | "NEUTRO"
  zonaHoraria: string
  /** Si llevo el registro de mi ciclo. Es mi decisión, no se deduce del género (RF-5.0). */
  llevaCiclo: boolean
  /** Si dejo que la otra persona vea mi ánimo en el calendario del mes (RF-1.5). */
  compartoAnimo: boolean
  /** En qué ventanas de los 11:11 participo (RF-12.1). Nunca se expone de la pareja. */
  ventanasOnce: "AMBAS" | "MANANA" | "NOCHE" | "NINGUNA"
  /** Hasta cuándo he pedido que la app no me hable. Null si no hay pausa (§12.2). */
  pausaHasta: Date | null
  /**
   * Qué módulos usa esta pareja. Son de los dos: cualquiera los cambia y los
   * dos lo ven, al revés que `llevaCiclo` o `ventanasOnce`, que son míos.
   */
  modulos: ModulosDelVinculo
  /** Cuándo se eligieron los módulos, una vez para los dos. Null = nunca. */
  configuradoEn: Date | null
  /**
   * Cuándo pasé **yo** por «empezar». Null = no he elegido lo mío todavía.
   *
   * Separado del anterior porque quien llega segundo se encuentra los módulos
   * ya elegidos pero no ha decidido nada suyo: con un solo marcador se saltaba
   * la pantalla entera y se quedaba con los valores por defecto sin verlos.
   */
  empezoEn: Date | null
  /**
   * Quién tocó los módulos por última vez, para que el cambio no sea mudo.
   * `mio` porque la frase cambia: a uno le sobra su propio nombre.
   */
  ultimoCambioDeModulos: { nombre: string; cuando: Date; mio: boolean } | null
  /** La otra persona del vínculo. Null mientras nadie haya canjeado la invitación. */
  pareja: {
    id: string
    nombre: string
    zonaHoraria: string
    llevaCiclo: boolean
    /** Si ella dejó ver su ánimo día a día. Apagado de partida, lo enciende ella. */
    compartoAnimo: boolean
  } | null
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

  const [membresias, vinculo] = await Promise.all([
    prismaCrudo.membresia.findMany({ where: { vinculoId }, include: { usuario: true } }),
    prismaCrudo.vinculo.findUnique({ where: { id: vinculoId } }),
  ])

  const yo = membresias.find((m) => m.usuarioId === usuarioId)
  if (!yo || !vinculo) redirect("/vincular")

  const otra = membresias.find((m) => m.usuarioId !== usuarioId)

  // Quién cambió los módulos: se resuelve a un nombre aquí y no en la pantalla,
  // porque el identificador puede ser de cualquiera de los dos y la pantalla no
  // tiene por qué saber buscarlo.
  const quienCambio = membresias.find((m) => m.usuarioId === vinculo.modulosPorId)

  return {
    usuarioId,
    vinculoId,
    nombre: yo.usuario.nombre,
    genero: yo.usuario.genero,
    zonaHoraria: yo.usuario.zonaHoraria,
    llevaCiclo: yo.usuario.llevaCiclo,
    compartoAnimo: yo.usuario.compartoAnimo,
    // El de la pareja no se expone a propósito: quien se sale de los 11:11
    // tiene derecho a que el otro no lo sepa (RF-12.8), y un campo que no
    // viaja no se puede filtrar por descuido en una pantalla.
    ventanasOnce: yo.usuario.ventanasOnce,
    pausaHasta: yo.usuario.pausaHasta,
    modulos: {
      musica: vinculo.usaMusica,
      titulos: vinculo.usaTitulos,
      recuerdos: vinculo.usaRecuerdos,
      once: vinculo.usaOnce,
    },
    configuradoEn: vinculo.configuradoEn,
    empezoEn: yo.usuario.empezoEn,
    ultimoCambioDeModulos:
      quienCambio && vinculo.modulosEn
        ? {
            nombre: quienCambio.usuario.nombre,
            cuando: vinculo.modulosEn,
            mio: quienCambio.usuarioId === usuarioId,
          }
        : null,
    pareja: otra
      ? {
          id: otra.usuario.id,
          nombre: otra.usuario.nombre,
          zonaHoraria: otra.usuario.zonaHoraria,
          llevaCiclo: otra.usuario.llevaCiclo,
          compartoAnimo: otra.usuario.compartoAnimo,
        }
      : null,
  }
}

/** Acceso a datos acotado al vínculo de la sesión actual. Atajo de uso constante. */
export async function dbDeSesion() {
  const sesion = await exigirSesion()
  return { db: dbDelVinculo(sesion.vinculoId), sesion }
}

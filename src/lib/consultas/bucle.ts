/**
 * Lecturas del bucle: lo que hay para mí, lo que le mandé y lo que espera en frío.
 *
 * Viven fuera de `acciones/` a propósito. Un módulo `"use server"` publica
 * **todos** sus exports como puntos de entrada remotos, así que tener aquí
 * consultas que solo usan componentes de servidor las convertía en endpoints
 * sin necesitarlo.
 *
 * La regla, sin excepciones: **si escribe en la base va en `acciones/`; si solo
 * lee, va aquí.** Un fichero de consultas nunca lleva `"use server"`.
 */

import { ClaseMensaje, DestinoMensaje } from "@/generated/prisma/enums"
import { decidirPresentacion } from "@/lib/motor/entrega"
import { sePuedeRetirar } from "@/lib/motor/frio"
import { dbDeSesion } from "@/lib/sesion"

/**
 * Lo que hay para mí ahora mismo: el mensaje sin ver más antiguo, con la
 * presentación que decide la matriz (§3.0.15).
 *
 * Un mensaje aplazado no cuenta hasta que pasa su hora: aplazar es distinto
 * de leer, y distinto también de ignorar.
 */
export async function loQueHayParaMi() {
  const { db, sesion } = await dbDeSesion()
  const ahora = new Date()

  const pendiente = await db.entrega.findFirst({
    where: {
      destinatarioId: sesion.usuarioId,
      vistaEn: null,
      // Un mensaje eliminado por quien lo escribió ya no se abre; en el cofre
      // queda su rastro y nada más (RF-6.4.2).
      mensaje: { eliminadoEn: null },
      OR: [{ pospuestaHasta: null }, { pospuestaHasta: { lte: ahora } }],
    },
    orderBy: { entregadaEn: "asc" },
    include: { mensaje: { include: { adjunto: true } } },
  })
  if (!pendiente) return null

  const miUltimo = await db.checkin.findFirst({
    where: { autorId: sesion.usuarioId },
    orderBy: { creadoEn: "desc" },
  })

  const presentacion = decidirPresentacion(
    pendiente.mensaje.emocion,
    miUltimo
      ? { emocion: miUltimo.emocion, intensidad: miUltimo.intensidad, creadoEn: miUltimo.creadoEn }
      : null,
    ahora,
  )

  // El amortiguador necesita algo cálido de ella; si no hay, se muestra directo
  // sin rellenar con nada genérico (RF-3.0.7.2).
  let amortiguador: { texto: string; creadoEn: Date } | null = null
  if (presentacion.tipo === "amortiguado" && sesion.pareja) {
    const calido = await db.mensaje.findFirst({
      where: {
        autorId: sesion.pareja.id,
        clase: ClaseMensaje.PRESENCIA,
        // Solo lo que de verdad salió hacia mí. Sin esto, el amortiguador podía
        // sacar un mensaje que ella escribió "solo para mí" y enseñármelo: un
        // apunte privado suyo convertido en consuelo mío.
        destino: { not: DestinoMensaje.SOLO_PARA_MI },
        eliminadoEn: null,
      },
      orderBy: { creadoEn: "desc" },
    })
    if (calido) amortiguador = { texto: calido.texto, creadoEn: calido.creadoEn }
  }

  return {
    entregaId: pendiente.id,
    mensaje: pendiente.mensaje,
    presentacion: ajustar(presentacion, amortiguador !== null, pendiente.pospuestaHasta !== null),
    amortiguador,
  }
}

/**
 * Correcciones que la matriz no puede hacer sola porque dependen de qué hay
 * guardado, no de cómo está nadie.
 *
 * Si ya se aplazó una vez, no se vuelve a preguntar: la persona eligió esta
 * hora, y volver a ofrecerle "más tarde" convertiría una decisión en un bucle.
 */
function ajustar(
  presentacion: ReturnType<typeof decidirPresentacion>,
  hayAmortiguador: boolean,
  yaPospuesto: boolean,
): ReturnType<typeof decidirPresentacion> {
  // Sin nada cálido que poner delante no se puede amortiguar: antes directo
  // que rellenar con algo genérico (RF-3.0.7.2).
  if (presentacion.tipo === "amortiguado" && !hayAmortiguador) return { tipo: "directo" }
  if (presentacion.tipo === "nombrar_y_elegir" && yaPospuesto) return { tipo: "directo" }
  return presentacion
}

/**
 * Lo que le mandé y en qué punto está (§3.17). Los estados de entrega son
 * automáticos: sustituyen al botón de "te prometo que lo leo", que era una
 * promesa que después podía no cumplirse.
 */
export async function loQueLeMande(busqueda = "") {
  const { db, sesion } = await dbDeSesion()

  const mensajes = await db.mensaje.findMany({
    where: {
      autorId: sesion.usuarioId,
      destino: { in: [DestinoMensaje.AHORA, DestinoMensaje.CUANDO_LE_SIRVA] },
      ...(busqueda ? { texto: { contains: busqueda, mode: "insensitive" as const } } : {}),
    },
    orderBy: { creadoEn: "desc" },
    take: 60,
    include: { entrega: { include: { respuesta: true } } },
  })

  const ahora = new Date()

  return mensajes.map((m) => ({
    id: m.id,
    texto: m.texto,
    emocion: m.emocion,
    creadoEn: m.creadoEn,
    esperando: m.destino === DestinoMensaje.CUANDO_LE_SIRVA && !m.entrega,
    entregadaEn: m.entrega?.entregadaEn ?? null,
    vistaEn: m.entrega?.vistaEn ?? null,
    necesitaRatoEn: m.entrega?.necesitaRatoEn ?? null,
    respuesta: m.entrega?.respuesta ?? null,
    eliminado: m.eliminadoEn !== null,
    // La ventana de arrepentimiento se calcula aquí, con la hora del servidor:
    // el reloj del teléfono podría ir adelantado (RF-6.4.1).
    puedeRetirar:
      m.entrega !== null &&
      m.eliminadoEn === null &&
      sePuedeRetirar(m.entrega.entregadaEn, m.entrega.vistaEn, ahora),
  }))
}

/**
 * Lo que espera en frío y ya cumplió su plazo (§6.3).
 * Solo lo mío, solo lo no archivado, y de lo más antiguo a lo más nuevo.
 */
export async function loQueEsperaEnFrio() {
  const { db, sesion } = await dbDeSesion()

  return db.mensaje.findMany({
    where: {
      autorId: sesion.usuarioId,
      destino: DestinoMensaje.SOLO_PARA_MI,
      archivadoEn: null,
      enFrioHasta: { lte: new Date() },
    },
    orderBy: { enFrioHasta: "asc" },
    take: 5,
  })
}

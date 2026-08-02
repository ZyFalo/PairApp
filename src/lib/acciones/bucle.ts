"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  type CierreHilo,
  ClaseMensaje,
  DestinoMensaje,
  Emocion,
  type Necesidad,
  Visibilidad,
} from "@/generated/prisma/enums"
import { claseDe, grupoDe, puedeGuardarseParaDespues } from "@/lib/motor/emociones"
import { decidirPresentacion, topeDePosponer } from "@/lib/motor/entrega"
import { finDelFrio, HORAS_EN_FRIO, sePuedeRetirar } from "@/lib/motor/frio"
import { dbDeSesion } from "@/lib/sesion"

const enumDe = <T extends Record<string, string>>(e: T) =>
  z.enum(Object.values(e) as [string, ...string[]])

const esquemaCheckin = z.object({
  emocion: enumDe(Emocion),
  intensidad: z.coerce.number().int().min(1).max(5).default(3),
  visibilidad: enumDe(Visibilidad).default(Visibilidad.COMPLETO),
})

const esquemaMensaje = z.object({
  checkinId: z.string().min(1),
  texto: z.string().trim().min(1, "Escribe algo").max(4000),
  destino: enumDe(DestinoMensaje),
  necesidad: z.string().optional(),
  tonoMarcado: z.coerce.boolean().default(false),
  /** Guardado desde el umbral para decidir en frío (§6.3). */
  enFrio: z.coerce.boolean().default(false),
})

export type Resultado = { error?: string; ok?: boolean; checkinId?: string }

/**
 * Registra cómo estoy (RF-1.1.4). Un toque basta: la intensidad va a 3 por
 * defecto y el mensaje es aparte y opcional.
 */
export async function registrarCheckin(_previo: Resultado, datos: FormData): Promise<Resultado> {
  const analizado = esquemaCheckin.safeParse(Object.fromEntries(datos))
  if (!analizado.success) return { error: "No se pudo registrar" }

  const { db, sesion } = await dbDeSesion()
  const emocion = analizado.data.emocion as Emocion

  const checkin = await db.checkin.create({
    data: {
      vinculoId: sesion.vinculoId,
      autorId: sesion.usuarioId,
      emocion,
      grupo: grupoDe(emocion),
      intensidad: analizado.data.intensidad,
      visibilidad: analizado.data.visibilidad as Visibilidad,
    },
  })

  revalidatePath("/hoy")
  return { ok: true, checkinId: checkin.id }
}

/**
 * Deja un mensaje asociado al check-in recién hecho (§2.0).
 * El destino decide cuándo llega; la clase, si espera respuesta.
 */
export async function dejarMensaje(_previo: Resultado, datos: FormData): Promise<Resultado> {
  const analizado = esquemaMensaje.safeParse(Object.fromEntries(datos))
  if (!analizado.success) {
    return { error: analizado.error.issues[0]?.message ?? "Revisa el mensaje" }
  }
  const { checkinId, texto, destino, necesidad, tonoMarcado, enFrio } = analizado.data

  const { db, sesion } = await dbDeSesion()

  const checkin = await db.checkin.findFirst({
    where: { id: checkinId, autorId: sesion.usuarioId },
  })
  if (!checkin) return { error: "No encontramos ese registro" }

  const destinoFinal = destino as DestinoMensaje

  // Guardar para después solo tiene sentido desde las emociones cálidas:
  // un mensaje triste entregado cuando ella esté triste duplica la tristeza.
  if (
    destinoFinal === DestinoMensaje.CUANDO_LE_SIRVA &&
    !puedeGuardarseParaDespues(checkin.emocion)
  ) {
    return { error: "Desde este estado no se puede guardar para después" }
  }

  const mensaje = await db.mensaje.create({
    data: {
      vinculoId: sesion.vinculoId,
      autorId: sesion.usuarioId,
      checkinId: checkin.id,
      emocion: checkin.emocion,
      clase: claseDe(checkin.emocion),
      destino: destinoFinal,
      texto,
      necesidad: (necesidad as Necesidad) || null,
      tonoMarcado,
      // Guardado desde el umbral: espera en frío y ella no sabe que existe
      // (RF-6.3.1). Bloquea por tiempo, jamás por contenido.
      enFrioHasta:
        enFrio && destinoFinal === DestinoMensaje.SOLO_PARA_MI
          ? finDelFrio(HORAS_EN_FRIO, new Date())
          : null,
      disparadorEmociones:
        destinoFinal === DestinoMensaje.CUANDO_LE_SIRVA
          ? [Emocion.TRISTE, Emocion.ME_SIENTO_SOLO, Emocion.PREOCUPADO]
          : [],
    },
  })

  // "Ahora" se entrega en el acto. Los demás destinos esperan: el guardado a
  // que ella lo necesite, y "solo para mí" no se entrega nunca.
  if (destinoFinal === DestinoMensaje.AHORA && sesion.pareja) {
    await db.entrega.create({
      data: {
        vinculoId: sesion.vinculoId,
        mensajeId: mensaje.id,
        destinatarioId: sesion.pareja.id,
        llegadaEn: new Date(),
      },
    })
  }

  revalidatePath("/hoy")
  revalidatePath("/cofre")
  return { ok: true }
}

/** Marca un mensaje como visto. El visto es un hecho y no se puede ocultar (RF-3.17.4). */
export async function marcarVisto(entregaId: string) {
  const { db, sesion } = await dbDeSesion()
  await db.entrega.updateMany({
    where: { id: entregaId, destinatarioId: sesion.usuarioId, vistaEn: null },
    data: { vistaEn: new Date() },
  })
  revalidatePath("/hoy")
  revalidatePath("/cofre")
}

/**
 * "Ahora no puedo", ya habiéndolo leído (RF-3.14). Describe un estado presente,
 * no promete nada: es infinitamente mejor que el visto sin respuesta.
 *
 * Marca visto a propósito. El mensaje **sí** se leyó; lo que falta es la
 * respuesta, y fingir que no llegó sería mentir sobre un hecho (RF-3.17.4).
 */
export async function avisarNecesitoUnRato(entregaId: string) {
  const { db, sesion } = await dbDeSesion()
  await db.entrega.updateMany({
    where: { id: entregaId, destinatarioId: sesion.usuarioId },
    data: { necesitaRatoEn: new Date(), vistaEn: new Date() },
  })
  revalidatePath("/hoy")
  revalidatePath("/cofre")
}

/**
 * Aplazar la lectura **antes** de abrir (§3.0.15, celda "nombrar y elegir").
 *
 * Aquí no se marca visto: el mensaje sigue sin leer y vuelve cuando pasa la
 * hora. Es la diferencia entre "ahora no puedo con esto" y "lo leí y no
 * contesté" — dos cosas distintas que merecen dos registros distintos.
 *
 * Tres horas normalmente; hasta mañana si los dos están enojados, porque dormir
 * es la intervención más eficaz que existe para eso (RF-3.0.11).
 */
export async function posponerLectura(entregaId: string, ambosEnojados: boolean) {
  const { db, sesion } = await dbDeSesion()
  const hasta = topeDePosponer({ tipo: "nombrar_y_elegir", ambosEnojados }, new Date())
  await db.entrega.updateMany({
    where: { id: entregaId, destinatarioId: sesion.usuarioId, vistaEn: null },
    data: { pospuestaHasta: hasta },
  })
  revalidatePath("/hoy")
}

const esquemaRespuesta = z.object({
  entregaId: z.string().min(1),
  texto: z.string().trim().max(4000).optional(),
  emocionAdjunta: z.string().optional(),
  cierre: z.string().optional(),
})

/**
 * Responde a un mensaje (§3.3). La emoción adjunta describe **mi** estado
 * (RF-3.18): no puntúa el mensaje ajeno, por eso reutiliza el mismo vocabulario.
 */
export async function responder(_previo: Resultado, datos: FormData): Promise<Resultado> {
  const analizado = esquemaRespuesta.safeParse(Object.fromEntries(datos))
  if (!analizado.success) return { error: "No se pudo enviar" }
  const { entregaId, texto, emocionAdjunta, cierre } = analizado.data

  if (!texto && !cierre && !emocionAdjunta) return { error: "Escribe algo o elige una respuesta" }

  const { db, sesion } = await dbDeSesion()
  const entrega = await db.entrega.findFirst({
    where: { id: entregaId, destinatarioId: sesion.usuarioId },
  })
  if (!entrega) return { error: "No encontramos ese mensaje" }

  await db.respuesta.upsert({
    where: { entregaId },
    create: {
      vinculoId: sesion.vinculoId,
      entregaId,
      autorId: sesion.usuarioId,
      texto: texto || null,
      emocionAdjunta: (emocionAdjunta as Emocion) || null,
      cierre: (cierre as CierreHilo) || null,
    },
    update: {
      texto: texto || undefined,
      emocionAdjunta: (emocionAdjunta as Emocion) || undefined,
      cierre: (cierre as CierreHilo) || undefined,
    },
  })

  if (!entrega.vistaEn) {
    await db.entrega.update({ where: { id: entregaId }, data: { vistaEn: new Date() } })
  }

  // Adjuntar cómo me dejó cuenta también como check-in mío: no se pregunta
  // dos veces lo mismo (RF-3.18.2).
  if (emocionAdjunta) {
    const emo = emocionAdjunta as Emocion
    await db.checkin.create({
      data: {
        vinculoId: sesion.vinculoId,
        autorId: sesion.usuarioId,
        emocion: emo,
        grupo: grupoDe(emo),
        intensidad: 3,
      },
    })
  }

  revalidatePath("/hoy")
  revalidatePath("/cofre")
  return { ok: true }
}

/**
 * Guarda un mensaje en el cofre (§3.2.2). La señal solo existe en positivo:
 * quitar el guardado lo borra, y "no guardado" nunca se muestra (RF-3.9.1).
 */
export async function alternarGuardado(mensajeId: string) {
  const { db, sesion } = await dbDeSesion()

  const existente = await db.guardado.findFirst({
    where: { mensajeId, usuarioId: sesion.usuarioId },
  })

  if (existente) {
    await db.guardado.delete({ where: { id: existente.id } })
  } else {
    await db.guardado.create({
      data: { vinculoId: sesion.vinculoId, mensajeId, usuarioId: sesion.usuarioId },
    })
  }

  revalidatePath("/cofre")
  revalidatePath("/hoy")
}

/**
 * Archiva un apunte de "solo para mí": ya se habló o dejó de importar (RF-2.0.8).
 * Archivar no borra — guarda memoria sin presión (RF-2.0.9), y por eso existe
 * `desarchivarApunte`: si archivar fuese irreversible, sería borrar con otro nombre.
 */
export async function archivarApunte(mensajeId: string) {
  const { db, sesion } = await dbDeSesion()
  await db.mensaje.updateMany({
    where: { id: mensajeId, autorId: sesion.usuarioId, destino: DestinoMensaje.SOLO_PARA_MI },
    data: { archivadoEn: new Date() },
  })
  revalidatePath("/cofre")
}

/** Devuelve un apunte archivado a la lista de cosas por hablar (RF-2.0.9). */
export async function desarchivarApunte(mensajeId: string) {
  const { db, sesion } = await dbDeSesion()
  await db.mensaje.updateMany({
    where: { id: mensajeId, autorId: sesion.usuarioId, destino: DestinoMensaje.SOLO_PARA_MI },
    data: { archivadoEn: null },
  })
  revalidatePath("/cofre")
}

/**
 * Convierte un apunte privado en mensaje enviado (RF-2.0.6). Es el mecanismo
 * más importante de esa lista: mover algo de callado a hablado sin empezar de cero.
 */
export async function decirloAhora(mensajeId: string): Promise<Resultado> {
  const { db, sesion } = await dbDeSesion()

  const apunte = await db.mensaje.findFirst({
    where: { id: mensajeId, autorId: sesion.usuarioId, destino: DestinoMensaje.SOLO_PARA_MI },
  })
  if (!apunte) return { error: "No encontramos ese apunte" }
  if (!sesion.pareja) return { error: "Todavía no hay nadie más en el vínculo" }

  await db.mensaje.update({
    where: { id: apunte.id },
    data: { destino: DestinoMensaje.AHORA, clase: claseDe(apunte.emocion) },
  })
  await db.entrega.create({
    data: {
      vinculoId: sesion.vinculoId,
      mensajeId: apunte.id,
      destinatarioId: sesion.pareja.id,
      llegadaEn: new Date(),
    },
  })

  revalidatePath("/cofre")
  revalidatePath("/hoy")
  return { ok: true }
}

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
      where: { autorId: sesion.pareja.id, clase: ClaseMensaje.PRESENCIA },
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

/**
 * Enviar por fin lo que se escribió en caliente, con o sin retoques (RF-6.3.2).
 * La edición nace de quien escribe, nunca de la app (RF-6.3.4).
 */
export async function enviarDelFrio(mensajeId: string, texto?: string): Promise<Resultado> {
  const { db, sesion } = await dbDeSesion()

  const mensaje = await db.mensaje.findFirst({
    where: { id: mensajeId, autorId: sesion.usuarioId, enFrioHasta: { not: null } },
  })
  if (!mensaje) return { error: "No encontramos ese mensaje" }
  if (!sesion.pareja) return { error: "Todavía no hay nadie más en el vínculo" }

  const limpio = texto?.trim()
  if (texto !== undefined && !limpio) return { error: "Escribe algo o déjalo ir" }

  await db.mensaje.update({
    where: { id: mensaje.id },
    data: {
      destino: DestinoMensaje.AHORA,
      clase: claseDe(mensaje.emocion),
      enFrioHasta: null,
      ...(limpio ? { texto: limpio.slice(0, 4000) } : {}),
    },
  })
  await db.entrega.create({
    data: {
      vinculoId: sesion.vinculoId,
      mensajeId: mensaje.id,
      destinatarioId: sesion.pareja.id,
      llegadaEn: new Date(),
    },
  })

  revalidatePath("/hoy")
  revalidatePath("/cofre")
  return { ok: true }
}

/**
 * Dejarlo ir (RF-6.3.3). Lo archiva y no lo borra: a veces escribirlo ya era
 * el punto, y las tres salidas del frío pesan lo mismo.
 */
export async function dejarloIr(mensajeId: string) {
  const { db, sesion } = await dbDeSesion()
  await db.mensaje.updateMany({
    where: { id: mensajeId, autorId: sesion.usuarioId, enFrioHasta: { not: null } },
    data: { archivadoEn: new Date(), enFrioHasta: null },
  })
  revalidatePath("/hoy")
  revalidatePath("/cofre")
}

/**
 * Retirar algo recién enviado que la otra persona aún no ha abierto (RF-6.4.1).
 * Vuelve a tus apuntes, como si no hubiera salido — porque no lo ha visto nadie.
 */
export async function retirarEnviado(mensajeId: string): Promise<Resultado> {
  const { db, sesion } = await dbDeSesion()

  const mensaje = await db.mensaje.findFirst({
    where: { id: mensajeId, autorId: sesion.usuarioId },
    include: { entrega: true },
  })
  if (!mensaje?.entrega) return { error: "No encontramos ese mensaje" }

  if (!sePuedeRetirar(mensaje.entrega.entregadaEn, mensaje.entrega.vistaEn, new Date())) {
    return { error: "Ya no se puede retirar" }
  }

  await db.entrega.delete({ where: { id: mensaje.entrega.id } })
  await db.mensaje.update({
    where: { id: mensaje.id },
    data: { destino: DestinoMensaje.SOLO_PARA_MI },
  })

  revalidatePath("/cofre")
  revalidatePath("/hoy")
  return { ok: true }
}

/**
 * Eliminar un mensaje que la otra persona ya puede haber leído (RF-6.4.2).
 *
 * Deja rastro a propósito: donde estaba el texto queda dicho que hubo un
 * mensaje y que ya no está. Borrarlo en silencio sería reescribir una historia
 * que es de los dos, no solo de quien la escribió.
 */
export async function eliminarConRastro(mensajeId: string) {
  const { db, sesion } = await dbDeSesion()
  await db.mensaje.updateMany({
    where: { id: mensajeId, autorId: sesion.usuarioId, eliminadoEn: null },
    data: { eliminadoEn: new Date() },
  })
  revalidatePath("/cofre")
  revalidatePath("/hoy")
}

/** Retira un mensaje guardado que todavía no se ha entregado (RF-2.2.4). */
export async function retirarGuardado(mensajeId: string) {
  const { db, sesion } = await dbDeSesion()
  await db.mensaje.updateMany({
    where: {
      id: mensajeId,
      autorId: sesion.usuarioId,
      destino: DestinoMensaje.CUANDO_LE_SIRVA,
      entrega: { is: null },
    },
    data: { destino: DestinoMensaje.SOLO_PARA_MI },
  })
  // Sale de "enviados" y entra en "por hablar", las dos en el cofre.
  revalidatePath("/cofre")
}

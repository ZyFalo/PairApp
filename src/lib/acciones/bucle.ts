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
import { decidirPresentacion } from "@/lib/motor/entrega"
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
  const { checkinId, texto, destino, necesidad, tonoMarcado } = analizado.data

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
 * "Ahora no puedo" (RF-3.14). Describe un estado presente, no promete nada:
 * es infinitamente mejor que el visto sin respuesta.
 */
export async function avisarNecesitoUnRato(entregaId: string) {
  const { db, sesion } = await dbDeSesion()
  await db.entrega.updateMany({
    where: { id: entregaId, destinatarioId: sesion.usuarioId },
    data: { necesitaRatoEn: new Date(), vistaEn: new Date() },
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

/** Archiva un apunte de "solo para mí": ya se habló o dejó de importar (RF-2.0.8). */
export async function archivarApunte(mensajeId: string) {
  const { db, sesion } = await dbDeSesion()
  await db.mensaje.updateMany({
    where: { id: mensajeId, autorId: sesion.usuarioId, destino: DestinoMensaje.SOLO_PARA_MI },
    data: { archivadoEn: new Date() },
  })
  revalidatePath("/yo")
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

  revalidatePath("/yo")
  revalidatePath("/hoy")
  return { ok: true }
}

/**
 * Lo que hay para mí ahora mismo: el mensaje sin ver más antiguo, con la
 * presentación que decide la matriz (§3.0.15).
 */
export async function loQueHayParaMi() {
  const { db, sesion } = await dbDeSesion()
  const ahora = new Date()

  const pendiente = await db.entrega.findFirst({
    where: { destinatarioId: sesion.usuarioId, vistaEn: null },
    orderBy: { entregadaEn: "asc" },
    include: { mensaje: true },
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
  let amortiguador: { id: string; texto: string; creadoEn: Date } | null = null
  if (presentacion.tipo === "amortiguado" && sesion.pareja) {
    const calido = await db.mensaje.findFirst({
      where: { autorId: sesion.pareja.id, clase: ClaseMensaje.PRESENCIA },
      orderBy: { creadoEn: "desc" },
    })
    if (calido) amortiguador = { id: calido.id, texto: calido.texto, creadoEn: calido.creadoEn }
  }

  return {
    entregaId: pendiente.id,
    mensaje: pendiente.mensaje,
    presentacion: amortiguador ? presentacion : { tipo: "directo" as const },
    amortiguador,
  }
}

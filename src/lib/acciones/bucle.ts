"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { DestinoMensaje, Emocion, Necesidad, Visibilidad } from "@/generated/prisma/enums"
import { claseDe, grupoDe, puedeGuardarseParaDespues } from "@/lib/motor/emociones"
import { finDelFrio, HORAS_EN_FRIO } from "@/lib/motor/frio"
import { dbDeSesion } from "@/lib/sesion"

const enumDe = <T extends Record<string, string>>(e: T) =>
  z.enum(Object.values(e) as [string, ...string[]])

/**
 * Un enum que puede venir vacío. Los campos ocultos mandan `""` cuando no hay
 * nada elegido, y `""` no es un valor del enum: sin esto, no elegir necesidad
 * hacía fallar el envío entero.
 */
const enumOpcional = <T extends Record<string, string>>(e: T) =>
  z.preprocess((v) => (v === "" || v === undefined ? undefined : v), enumDe(e).optional())

const esquemaCheckin = z.object({
  emocion: enumDe(Emocion),
  intensidad: z.coerce.number().int().min(1).max(5).default(3),
  visibilidad: enumDe(Visibilidad).default(Visibilidad.COMPLETO),
})

const esquemaMensaje = z.object({
  checkinId: z.string().min(1),
  texto: z.string().trim().min(1, "Escribe algo").max(4000),
  destino: enumDe(DestinoMensaje),
  necesidad: enumOpcional(Necesidad),
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

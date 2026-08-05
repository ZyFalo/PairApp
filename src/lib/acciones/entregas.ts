"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { CierreHilo, DestinoMensaje, Emocion } from "@/generated/prisma/enums"
import { claseDe, grupoDe } from "@/lib/motor/emociones"
import { topeDePosponer } from "@/lib/motor/entrega"
import { sePuedeRetirar } from "@/lib/motor/frio"
import { dbDeSesion } from "@/lib/sesion"

import type { Resultado } from "./bucle"

const enumDe = <T extends Record<string, string>>(e: T) =>
  z.enum(Object.values(e) as [string, ...string[]])

const enumOpcional = <T extends Record<string, string>>(e: T) =>
  z.preprocess((v) => (v === "" || v === undefined ? undefined : v), enumDe(e).optional())

/**
 * Lo que pasa **después** de que un mensaje salga: verlo, aplazarlo,
 * responderlo, retirarlo o eliminarlo (§3.3, §6.3, §6.4).
 *
 * Separado de `bucle.ts`, que se ocupa de lo anterior —registrar cómo estoy y
 * dejar algo escrito—. Son dos mitades del mismo gesto y crecían juntas hasta
 * pasar de las cuatrocientas líneas.
 */

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
  // Enums de verdad, no cadenas sueltas: un valor inventado llegaba hasta el
  // `create` de Prisma y reventaba allí en vez de rebotar aquí.
  emocionAdjunta: enumOpcional(Emocion),
  cierre: enumOpcional(CierreHilo),
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

/**
 * Abrir lo que la otra persona dejó guardado y todavía no ha salido (RF-3.6).
 *
 * Se llama desde el botón discreto de un mal día, y **lo pide quien lo recibe**:
 * es la diferencia entre ofrecer y empujar. Un mensaje de amor entregado solo,
 * en el pico de un mal momento, se lee como invalidación (RF-3.4).
 *
 * Crea la entrega de verdad en vez de enseñar el texto sin más, porque el
 * estado de entrega es un hecho que no se puede falsear (RF-3.17.4): quien lo
 * escribió tiene que ver «le llegó» en su cofre, y lo vio.
 *
 * `findFirst` acotado antes de crear: el identificador viene del navegador y
 * las operaciones por identificador único no llevan el filtro del vínculo (ver
 * `lib/db.ts`).
 */
export async function abrirLoQueMeDejo(mensajeId: string): Promise<Resultado> {
  const { db, sesion } = await dbDeSesion()

  const mensaje = await db.mensaje.findFirst({
    where: {
      id: mensajeId,
      destino: DestinoMensaje.CUANDO_LE_SIRVA,
      autorId: { not: sesion.usuarioId },
      entrega: null,
      eliminadoEn: null,
    },
  })
  if (!mensaje) return { error: "Ya no está disponible" }

  const ahora = new Date()
  await db.entrega.create({
    data: {
      vinculoId: sesion.vinculoId,
      mensajeId: mensaje.id,
      destinatarioId: sesion.usuarioId,
      entregadaEn: ahora,
      llegadaEn: ahora,
    },
  })

  revalidatePath("/hoy")
  revalidatePath("/cofre")
  return { ok: true }
}

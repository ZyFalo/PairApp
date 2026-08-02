"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { FranjaDia } from "@/generated/prisma/enums"
import { diaLocal, ventanaOnceOnce } from "@/lib/motor/tiempo"
import { dbDeSesion } from "@/lib/sesion"

export type Resultado = { error?: string; ok?: boolean }

// ---------------------------------------------------------------------------
// Los 11:11 (M12)
// ---------------------------------------------------------------------------

/**
 * Pide un deseo de las 11:11 (RF-12.3). Máximo 140 caracteres: es un deseo,
 * no una carta. Solo dentro de la ventana, con cuatro minutos de gracia.
 */
export async function pedirOnceOnce(_previo: Resultado, datos: FormData): Promise<Resultado> {
  const texto = String(datos.get("texto") ?? "").trim()
  if (!texto) return { error: "Escribe tu deseo" }
  if (texto.length > 140) return { error: "Máximo 140 caracteres" }

  const { db, sesion } = await dbDeSesion()
  const ahora = new Date()
  const ventana = ventanaOnceOnce(sesion.zonaHoraria, ahora)
  if (!ventana.abierta) return { error: "La ventana de los 11:11 está cerrada" }

  const dia = diaLocal(sesion.zonaHoraria, ahora)
  const yaPidio = await db.onceOnce.findFirst({
    where: { autorId: sesion.usuarioId, dia, esNoche: ventana.esNoche },
  })
  if (yaPidio) return { error: "Ya pediste en esta ventana" }

  await db.onceOnce.create({
    data: {
      vinculoId: sesion.vinculoId,
      autorId: sesion.usuarioId,
      texto,
      dia,
      esNoche: ventana.esNoche,
    },
  })

  revalidatePath("/nosotros")
  revalidatePath("/hoy")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Calendario (M7)
// ---------------------------------------------------------------------------

const esquemaEvento = z.object({
  titulo: z.string().trim().min(1, "Falta el título").max(120),
  inicio: z.string().min(1, "Falta la fecha"),
  tipo: z.string().default("cita"),
  esDePareja: z.coerce.boolean().default(true),
  notas: z.string().trim().max(2000).optional(),
  avisoHoras: z.coerce.number().int().min(0).max(720).optional(),
})

/** Crea un evento en el calendario compartido (RF-7.1). */
export async function crearEvento(_previo: Resultado, datos: FormData): Promise<Resultado> {
  const analizado = esquemaEvento.safeParse(Object.fromEntries(datos))
  if (!analizado.success) {
    return { error: analizado.error.issues[0]?.message ?? "Revisa los datos" }
  }
  const { titulo, inicio, tipo, esDePareja, notas, avisoHoras } = analizado.data

  const { db, sesion } = await dbDeSesion()
  await db.evento.create({
    data: {
      vinculoId: sesion.vinculoId,
      creadorId: sesion.usuarioId,
      titulo,
      tipo,
      inicio: new Date(inicio),
      esDePareja,
      notas: notas || null,
      avisoHoras: avisoHoras || null,
    },
  })

  revalidatePath("/nosotros")
  return { ok: true }
}

/** Borra un evento del calendario. */
export async function borrarEvento(id: string) {
  const { db } = await dbDeSesion()
  await db.evento.deleteMany({ where: { id } })
  revalidatePath("/nosotros")
}

// ---------------------------------------------------------------------------
// Dedicatorias musicales (M8)
// ---------------------------------------------------------------------------

const esquemaDedicatoria = z.object({
  url: z.string().trim().url("Pega un enlace válido"),
  mensaje: z.string().trim().max(500).optional(),
  franja: z.enum(["MANANA", "TARDE", "NOCHE"]),
})

/**
 * Extrae título y miniatura de un enlace de YouTube mediante su oEmbed público,
 * que no pide clave ni registro (RF-8.2.1). Si falla, se guarda el enlace pelado.
 */
async function metadatosDeEnlace(url: string) {
  if (!/youtube\.com|youtu\.be/.test(url)) return { titulo: null, miniaturaUrl: null }
  try {
    const respuesta = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(4000) },
    )
    if (!respuesta.ok) return { titulo: null, miniaturaUrl: null }
    const datos = (await respuesta.json()) as { title?: string; thumbnail_url?: string }
    return { titulo: datos.title ?? null, miniaturaUrl: datos.thumbnail_url ?? null }
  } catch {
    return { titulo: null, miniaturaUrl: null }
  }
}

/** Dedica una canción para una franja del día (RF-8.1). Solo enlace pegado (D28). */
export async function dedicarCancion(_previo: Resultado, datos: FormData): Promise<Resultado> {
  const analizado = esquemaDedicatoria.safeParse(Object.fromEntries(datos))
  if (!analizado.success) {
    return { error: analizado.error.issues[0]?.message ?? "Revisa el enlace" }
  }
  const { url, mensaje, franja } = analizado.data

  const { db, sesion } = await dbDeSesion()
  const meta = await metadatosDeEnlace(url)

  await db.dedicatoria.create({
    data: {
      vinculoId: sesion.vinculoId,
      autorId: sesion.usuarioId,
      url,
      titulo: meta.titulo,
      miniaturaUrl: meta.miniaturaUrl,
      mensaje: mensaje || null,
      franja: franja as FranjaDia,
    },
  })

  revalidatePath("/nosotros")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Ciclo menstrual (M5)
// ---------------------------------------------------------------------------

/**
 * Enciende o apaga el registro de ciclo para quien lo pide (RF-5.0).
 *
 * Nunca se deduce del género gramatical: ese campo dice cómo conjugar las
 * etiquetas, no qué le pasa a nadie en el cuerpo. Apagarlo no borra lo ya
 * registrado —volver a encenderlo lo devuelve intacto—, pero mientras esté
 * apagado la pareja no ve nada.
 *
 * Usa `update` y no `updateMany` a propósito: `Usuario` no tiene `vinculoId`,
 * así que el cliente acotado reventaría al inyectarlo (ver `lib/db.ts`). Aquí
 * el identificador sale de la sesión, de modo que la pertenencia ya está
 * comprobada por quien haya iniciado sesión.
 */
export async function cambiarRegistroCiclo(activo: boolean): Promise<Resultado> {
  const { db, sesion } = await dbDeSesion()
  await db.usuario.update({
    where: { id: sesion.usuarioId },
    data: { llevaCiclo: activo },
  })

  revalidatePath("/yo")
  revalidatePath("/nosotros")
  return { ok: true }
}

const esquemaCiclo = z.object({
  inicio: z.string().min(1, "Falta la fecha"),
  fin: z.string().optional(),
  nivelVisibilidad: z.enum(["NADA", "SOLO_FECHAS", "FECHAS_Y_NOTA"]),
  notaParaPareja: z.string().trim().max(1000).optional(),
})

/**
 * Registra un periodo (RF-5.1). El diseño está invertido a propósito: la app
 * no le dice a nadie cómo está la otra persona — ella decide qué comparte
 * (RF-5.3) y escribe con sus palabras qué le sirve.
 */
export async function registrarCiclo(_previo: Resultado, datos: FormData): Promise<Resultado> {
  const analizado = esquemaCiclo.safeParse(Object.fromEntries(datos))
  if (!analizado.success) {
    return { error: analizado.error.issues[0]?.message ?? "Revisa los datos" }
  }
  const { inicio, fin, nivelVisibilidad, notaParaPareja } = analizado.data

  const { db, sesion } = await dbDeSesion()
  await db.ciclo.create({
    data: {
      vinculoId: sesion.vinculoId,
      usuarioId: sesion.usuarioId,
      inicio: new Date(inicio),
      fin: fin ? new Date(fin) : null,
      nivelVisibilidad,
      notaParaPareja: notaParaPareja || null,
    },
  })

  revalidatePath("/yo")
  revalidatePath("/nosotros")
  return { ok: true }
}

/**
 * Cambiar qué se comparte de un periodo ya registrado (RF-5.3).
 *
 * Poder cerrar lo que ya abriste es parte de decidir de verdad: sin esto, la
 * primera elección sería para siempre, y eso empuja a no compartir nada.
 */
export async function cambiarVisibilidadCiclo(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const analizado = z
    .object({
      cicloId: z.string().min(1),
      nivelVisibilidad: z.enum(["NADA", "SOLO_FECHAS", "FECHAS_Y_NOTA"]),
      notaParaPareja: z.string().trim().max(1000).optional(),
    })
    .safeParse(Object.fromEntries(datos))
  if (!analizado.success) return { error: "No se pudo cambiar" }

  const { db, sesion } = await dbDeSesion()
  await db.ciclo.updateMany({
    where: { id: analizado.data.cicloId, usuarioId: sesion.usuarioId },
    data: {
      nivelVisibilidad: analizado.data.nivelVisibilidad,
      notaParaPareja: analizado.data.notaParaPareja || null,
    },
  })

  revalidatePath("/yo")
  revalidatePath("/nosotros")
  return { ok: true }
}

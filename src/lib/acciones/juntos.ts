"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { EstadoTitulo, TipoTitulo } from "@/generated/prisma/enums"
import { dbDeSesion } from "@/lib/sesion"

export type Resultado = { error?: string; ok?: boolean }

// ---------------------------------------------------------------------------
// Series y películas (M9)
// ---------------------------------------------------------------------------

const esquemaTitulo = z.object({
  nombre: z.string().trim().min(1, "Falta el título").max(200),
  tipo: z.enum(["SERIE", "PELICULA"]),
  soloJuntos: z.coerce.boolean().default(false),
  minutos: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : v),
    z.coerce.number().int().min(1).max(1000).optional(),
  ),
})

/** Añade algo a la lista compartida (RF-9.1, RF-9.2). */
export async function anadirTitulo(_previo: Resultado, datos: FormData): Promise<Resultado> {
  const analizado = esquemaTitulo.safeParse(Object.fromEntries(datos))
  if (!analizado.success) {
    return { error: analizado.error.issues[0]?.message ?? "Revisa los datos" }
  }
  const { nombre, tipo, soloJuntos, minutos } = analizado.data

  const { db, sesion } = await dbDeSesion()
  await db.titulo.create({
    data: {
      vinculoId: sesion.vinculoId,
      propuestoPorId: sesion.usuarioId,
      nombre,
      tipo: tipo as TipoTitulo,
      soloJuntos,
      minutos: minutos ?? null,
    },
  })

  revalidatePath("/nosotros")
  return { ok: true }
}

/** Mueve un título entre los cuatro estados (RF-9.1). */
export async function cambiarEstadoTitulo(id: string, estado: EstadoTitulo) {
  const { db } = await dbDeSesion()
  await db.titulo.updateMany({ where: { id }, data: { estado } })
  revalidatePath("/nosotros")
}

/** "No la veas sin mí" (RF-9.5). Cualquiera de los dos puede ponerlo o quitarlo. */
export async function alternarSoloJuntos(id: string, soloJuntos: boolean) {
  const { db } = await dbDeSesion()
  await db.titulo.updateMany({ where: { id }, data: { soloJuntos } })
  revalidatePath("/nosotros")
}

/** Por dónde vamos, para no perder el hilo (RF-9.4). */
export async function guardarProgreso(id: string, temporada: number, episodio: number) {
  const { db } = await dbDeSesion()
  await db.titulo.updateMany({
    where: { id },
    data: { temporada: temporada || null, episodio: episodio || null },
  })
  revalidatePath("/nosotros")
}

/**
 * Lo que me pareció (RF-9.3). Uno por persona: la gracia del módulo es que
 * puedan no coincidir, así que nunca se promedia ni se mezcla.
 */
export async function votarTitulo(
  tituloId: string,
  puntuacion: number,
  comentario: string,
): Promise<Resultado> {
  if (puntuacion < 1 || puntuacion > 5) return { error: "La puntuación va de 1 a 5" }

  const { db, sesion } = await dbDeSesion()

  const titulo = await db.titulo.findFirst({ where: { id: tituloId } })
  if (!titulo) return { error: "No encontramos ese título" }

  const mio = await db.votoTitulo.findFirst({
    where: { tituloId, usuarioId: sesion.usuarioId },
  })

  const datos = { puntuacion, comentario: comentario.trim().slice(0, 500) || null }

  if (mio) await db.votoTitulo.update({ where: { id: mio.id }, data: datos })
  else
    await db.votoTitulo.create({
      data: { vinculoId: sesion.vinculoId, tituloId, usuarioId: sesion.usuarioId, ...datos },
    })

  revalidatePath("/nosotros")
  return { ok: true }
}

/** Quita un título de la lista. Aquí sí se borra: no es una conversación. */
export async function borrarTitulo(id: string) {
  const { db } = await dbDeSesion()
  await db.titulo.deleteMany({ where: { id } })
  revalidatePath("/nosotros")
}

// ---------------------------------------------------------------------------
// Recuerdos (M11)
// ---------------------------------------------------------------------------

const esquemaRecuerdo = z.object({
  titulo: z.string().trim().min(1, "Falta el título").max(200),
  nota: z.string().trim().max(2000).optional(),
  ocurrioEl: z.string().min(1, "Falta la fecha"),
})

/**
 * Guarda un momento que merece quedarse (RF-11.1).
 * La fecha es la del recuerdo, no la de hoy: es lo que hace que "hace un año"
 * signifique algo (RF-11.2).
 */
export async function crearRecuerdo(_previo: Resultado, datos: FormData): Promise<Resultado> {
  const analizado = esquemaRecuerdo.safeParse(Object.fromEntries(datos))
  if (!analizado.success) {
    return { error: analizado.error.issues[0]?.message ?? "Revisa los datos" }
  }
  const { titulo, nota, ocurrioEl } = analizado.data

  const { db, sesion } = await dbDeSesion()
  await db.recuerdo.create({
    data: {
      vinculoId: sesion.vinculoId,
      autorId: sesion.usuarioId,
      titulo,
      nota: nota || null,
      ocurrioEl: new Date(ocurrioEl),
    },
  })

  revalidatePath("/nosotros")
  return { ok: true }
}

/** Borra un recuerdo. */
export async function borrarRecuerdo(id: string) {
  const { db } = await dbDeSesion()
  await db.recuerdo.deleteMany({ where: { id } })
  revalidatePath("/nosotros")
}

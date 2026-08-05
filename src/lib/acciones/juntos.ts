"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { EstadoTitulo, TipoTitulo } from "@/generated/prisma/enums"
import { comoDiaSuelto } from "@/lib/motor/tiempo"
import { dbDeSesion } from "@/lib/sesion"
import { buscar, type Candidato, ficha } from "@/lib/tmdb"

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

/**
 * Busca en TMDB para la pantalla (RF-9.6).
 *
 * Es una acción y no una consulta porque la escribe el navegador mientras se
 * teclea: no hay página que la cargue por ella. No escribe en la base — es la
 * única de este fichero que no lo hace, y se queda aquí porque `consultas/` es
 * para lo que carga una pantalla desde el servidor.
 *
 * Sin clave devuelve lista vacía y la pantalla ni ofrece buscar.
 */
export async function buscarEnTmdb(consulta: string): Promise<Candidato[]> {
  await dbDeSesion() // Exige sesión: es una llamada a un tercero desde nuestra clave.
  return buscar(consulta)
}

/**
 * Añade un título elegido de la búsqueda, con sus metadatos (RF-9.6).
 *
 * Pide el detalle a TMDB en este momento y no antes: la búsqueda no trae los
 * minutos, y pedirlos para los ocho resultados serían ocho llamadas para
 * enseñar una lista. Si TMDB falla ahora, se guarda igual con lo que ya se
 * sabía — un título sin póster sigue siendo un título.
 */
export async function anadirDesdeTmdb(
  tmdbId: number,
  tipo: "SERIE" | "PELICULA",
  respaldo: { nombre: string; anio: number | null; posterUrl: string | null },
): Promise<Resultado> {
  const detalle = await ficha(tmdbId, tipo)
  const { db, sesion } = await dbDeSesion()

  await db.titulo.create({
    data: {
      vinculoId: sesion.vinculoId,
      propuestoPorId: sesion.usuarioId,
      nombre: detalle?.nombre || respaldo.nombre,
      tipo: tipo as TipoTitulo,
      anio: detalle?.anio ?? respaldo.anio,
      posterUrl: detalle?.posterUrl ?? respaldo.posterUrl,
      sinopsis: detalle?.sinopsis ?? null,
      minutos: detalle?.minutos ?? null,
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

/**
 * Guarda un plan que ya pasó como recuerdo (RF-7.7).
 *
 * El plan tiene título y fecha, así que no hay nada que teclear: la cena del
 * viernes se queda como el recuerdo del viernes. La nota es opcional y se
 * añade después, editando el recuerdo — aquí lo que importa es que el gesto
 * cueste un toque, o no se hace.
 *
 * `findFirst` antes de crear porque va acotado al vínculo, y de ahí salen el
 * título y la fecha: si el identificador fuera de otra pareja, no aparece
 * (RNF-4, y el matiz de `lib/db.ts` sobre las operaciones por identificador).
 *
 * El evento **no se borra**. Sigue en su día del calendario, que es donde pasó.
 */
export async function guardarPlanComoRecuerdo(eventoId: string): Promise<Resultado> {
  const { db, sesion } = await dbDeSesion()

  const evento = await db.evento.findFirst({ where: { id: eventoId } })
  if (!evento) return { error: "No encontramos ese plan" }

  const yaGuardado = await db.recuerdo.findFirst({
    where: { titulo: evento.titulo, ocurrioEl: comoDiaSuelto(evento.inicio, sesion.zonaHoraria) },
  })
  if (yaGuardado) return { error: "Ese plan ya está entre los recuerdos" }

  await db.recuerdo.create({
    data: {
      vinculoId: sesion.vinculoId,
      autorId: sesion.usuarioId,
      titulo: evento.titulo,
      nota: evento.notas,
      ocurrioEl: comoDiaSuelto(evento.inicio, sesion.zonaHoraria),
    },
  })

  revalidatePath("/nosotros")
  return { ok: true }
}

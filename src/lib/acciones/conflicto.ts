"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { DestinoMensaje } from "@/generated/prisma/enums"
import { anotar } from "@/lib/acciones/novedades"
import { claseDe } from "@/lib/motor/emociones"
import { gestoDe } from "@/lib/motor/reparacion"
import { dbDeSesion } from "@/lib/sesion"

export type Resultado = { error?: string; ok?: boolean }

// ---------------------------------------------------------------------------
// Reparación (§6.8)
// ---------------------------------------------------------------------------

/**
 * Da el primer paso después de una discusión (RF-6.8.1).
 *
 * Se manda como un mensaje normal a propósito: así hereda las entregas, los
 * estados, el cofre y los avisos, en vez de abrir un canal paralelo que
 * habría que mantener aparte. Para quien lo recibe es una carta más.
 */
export async function repararCon(clave: string): Promise<Resultado> {
  const gesto = gestoDe(clave)
  if (!gesto) return { error: "Ese gesto no existe" }

  const { db, sesion } = await dbDeSesion()
  if (!sesion.pareja) return { error: "Todavía no hay nadie más en el vínculo" }

  const mensaje = await db.mensaje.create({
    data: {
      vinculoId: sesion.vinculoId,
      autorId: sesion.usuarioId,
      emocion: gesto.emocion,
      clase: claseDe(gesto.emocion),
      destino: DestinoMensaje.AHORA,
      texto: gesto.mensaje,
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

// ---------------------------------------------------------------------------
// Registro de conflicto (§6.6)
// ---------------------------------------------------------------------------

const campo = z.string().trim().min(1, "Faltan campos por rellenar").max(2000)

const esquemaConflicto = z.object({
  quePaso: campo,
  queSenti: campo,
  queNecesitaba: campo,
  queHariaDistinto: campo,
  respondeAId: z.string().optional(),
  /** Compartirlo es una decisión aparte de escribirlo (RF-6.6.1). */
  compartir: z.coerce.boolean().default(false),
})

/**
 * Escribe un conflicto en los cuatro campos de la CNV (§6.6).
 *
 * Nace privado salvo que se marque lo contrario: escribirlo ya sirve aunque
 * no se comparta nunca, porque ordenar lo que pasó es la mitad del trabajo.
 */
export async function registrarConflicto(_previo: Resultado, datos: FormData): Promise<Resultado> {
  const analizado = esquemaConflicto.safeParse(Object.fromEntries(datos))
  if (!analizado.success) {
    return { error: analizado.error.issues[0]?.message ?? "Revisa los campos" }
  }
  const { compartir, respondeAId, ...campos } = analizado.data

  const { db, sesion } = await dbDeSesion()

  // Solo se puede responder a un relato que se haya compartido conmigo.
  let respondeA: string | null = null
  if (respondeAId) {
    const original = await db.conflicto.findFirst({
      where: { id: respondeAId, compartidoEn: { not: null } },
    })
    if (!original) return { error: "No encontramos ese relato" }
    respondeA = original.id
  }

  await db.conflicto.create({
    data: {
      vinculoId: sesion.vinculoId,
      autorId: sesion.usuarioId,
      ...campos,
      respondeAId: respondeA,
      compartidoEn: compartir ? new Date() : null,
    },
  })

  revalidatePath("/nosotros")
  return { ok: true }
}

/** Compartir un relato que estaba guardado (RF-6.6.1). No tiene vuelta atrás. */
export async function compartirConflicto(id: string): Promise<Resultado> {
  const { db, sesion } = await dbDeSesion()
  await db.conflicto.updateMany({
    where: { id, autorId: sesion.usuarioId, compartidoEn: null },
    data: { compartidoEn: new Date() },
  })
  revalidatePath("/nosotros")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Acuerdos (§6.7)
// ---------------------------------------------------------------------------

/**
 * Apunta un acuerdo al que llegaron los dos (RF-6.7.1).
 * Cualquiera de los dos puede escribirlo o retirarlo: un acuerdo del que solo
 * uno es dueño no es un acuerdo.
 */
export async function crearAcuerdo(_previo: Resultado, datos: FormData): Promise<Resultado> {
  const texto = String(datos.get("texto") ?? "").trim()
  if (!texto) return { error: "Escribe el acuerdo" }
  if (texto.length > 500) return { error: "Máximo 500 caracteres" }

  const { db, sesion } = await dbDeSesion()
  await db.acuerdo.create({
    data: { vinculoId: sesion.vinculoId, texto, creadorId: sesion.usuarioId },
  })

  // El acuerdo sí sale en «Lo último», y es el único del módulo que lo hace: es
  // lo que **los dos** decidieron, y por eso puede anunciarse. Lo demás de
  // «Después» —los relatos de un conflicto, la reparación— no aparece nunca
  // ahí: eso se lee cuando se está listo para leerlo, no porque la app lo saque
  // a la pantalla de entrada con un aspa al lado.
  await anotar("ACUERDO", texto, "/nosotros?vista=despues")

  revalidatePath("/nosotros")
  return { ok: true }
}

/**
 * Retira un acuerdo de la lista. Se archiva y no se borra: saber qué se
 * acordó alguna vez también es información.
 */
export async function archivarAcuerdo(id: string) {
  const { db } = await dbDeSesion()
  await db.acuerdo.updateMany({
    where: { id, archivadoEn: null },
    data: { archivadoEn: new Date() },
  })
  revalidatePath("/nosotros")
}

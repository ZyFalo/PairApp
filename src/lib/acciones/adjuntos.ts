"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { TipoAdjunto } from "@/generated/prisma/enums"
import { carpetaDeVinculo, credencialesDelEntorno, permisoDeSubida } from "@/lib/nube"
import { dbDeSesion } from "@/lib/sesion"

/**
 * Adjuntar una foto o una nota de voz a un mensaje (fase 2).
 *
 * El archivo va del navegador a Cloudinary sin pasar por aquí; lo único que
 * viaja a nuestro servidor es la dirección donde quedó. Ver `lib/nube.ts`.
 */

/** Permiso firmado para que este navegador suba a la carpeta de su vínculo. */
export async function pedirPermisoDeSubida() {
  const credenciales = credencialesDelEntorno()
  if (!credenciales) return { error: "Los adjuntos no están configurados" as const }

  const { sesion } = await dbDeSesion()
  return { permiso: permisoDeSubida(credenciales, sesion.vinculoId, new Date()) }
}

const esquemaAdjunto = z.object({
  mensajeId: z.string().min(1),
  tipo: z.enum(["IMAGEN", "AUDIO"]),
  url: z.string().url(),
  publicId: z.string().min(1),
  segundos: z.number().int().min(0).max(600).optional(),
})

/**
 * Guarda dónde quedó el archivo, una vez subido.
 *
 * Comprueba que la dirección sea de **nuestra** cuenta y de **nuestra**
 * carpeta antes de guardarla: sin eso, esta acción sería una forma de meter
 * cualquier enlace de internet dentro de un mensaje del vínculo.
 */
export async function adjuntarAMensaje(datos: unknown) {
  const analizado = esquemaAdjunto.safeParse(datos)
  if (!analizado.success) return { error: "Adjunto inválido" }

  const credenciales = credencialesDelEntorno()
  if (!credenciales) return { error: "Los adjuntos no están configurados" }

  const { db, sesion } = await dbDeSesion()
  const { mensajeId, tipo, url, publicId, segundos } = analizado.data

  const esperado = `https://res.cloudinary.com/${credenciales.cloudName}/`
  if (!url.startsWith(esperado) || !publicId.startsWith(carpetaDeVinculo(sesion.vinculoId))) {
    return { error: "Ese archivo no es de aquí" }
  }

  // El mensaje tiene que ser mío y del vínculo: el cliente acotado se encarga
  // de lo segundo, el `autorId` de lo primero.
  const mensaje = await db.mensaje.findFirst({
    where: { id: mensajeId, autorId: sesion.usuarioId },
  })
  if (!mensaje) return { error: "No encontramos ese mensaje" }

  await db.adjunto.upsert({
    where: { mensajeId },
    create: {
      vinculoId: sesion.vinculoId,
      mensajeId,
      tipo: tipo as TipoAdjunto,
      url,
      publicId,
      segundos: segundos ?? null,
    },
    update: { tipo: tipo as TipoAdjunto, url, publicId, segundos: segundos ?? null },
  })

  revalidatePath("/hoy")
  revalidatePath("/cofre")
  return { ok: true }
}

/** Quita el adjunto de un mensaje mío. El archivo en la nube caduca solo. */
export async function quitarAdjunto(mensajeId: string) {
  const { db, sesion } = await dbDeSesion()

  const mensaje = await db.mensaje.findFirst({
    where: { id: mensajeId, autorId: sesion.usuarioId },
  })
  if (!mensaje) return { error: "No encontramos ese mensaje" }

  await db.adjunto.deleteMany({ where: { mensajeId } })
  revalidatePath("/hoy")
  revalidatePath("/cofre")
  return { ok: true }
}

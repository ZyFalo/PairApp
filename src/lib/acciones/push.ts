"use server"

import { revalidatePath } from "next/cache"
import { finDePausa } from "@/lib/motor/tiempo"
import { dbDeSesion } from "@/lib/sesion"

/**
 * Silenciar la app unos días, o volver a encenderla (§12.2, modo pausa).
 *
 * Silencia avisos, no entregas. Lo que te manden sigue llegando y te espera al
 * abrir: retenerlo haría que el cofre de la otra persona dijera "le llegó"
 * cuando no es verdad, y un estado de entrega no se puede falsear (RF-3.17.4).
 *
 * `update` y no `updateMany` porque `Usuario` no tiene `vinculoId` y el cliente
 * acotado reventaría al inyectarlo (ver `lib/db.ts`); el identificador sale de
 * la sesión, así que la pertenencia ya está comprobada.
 */
export async function cambiarPausa(dias: number) {
  const { db, sesion } = await dbDeSesion()
  const hasta = dias > 0 ? finDePausa(dias, sesion.zonaHoraria, new Date()) : null

  await db.usuario.update({ where: { id: sesion.usuarioId }, data: { pausaHasta: hasta } })

  revalidatePath("/yo")
  return { ok: true }
}

/** Guarda la suscripción de este dispositivo a los avisos (M4). Una por navegador. */
export async function suscribirAPush(datos: { endpoint: string; p256dh: string; auth: string }) {
  if (!datos.endpoint || !datos.p256dh || !datos.auth) return { error: "Suscripción incompleta" }

  const { db, sesion } = await dbDeSesion()
  await db.suscripcionPush.upsert({
    where: { endpoint: datos.endpoint },
    create: {
      vinculoId: sesion.vinculoId,
      usuarioId: sesion.usuarioId,
      endpoint: datos.endpoint,
      p256dh: datos.p256dh,
      auth: datos.auth,
    },
    update: { p256dh: datos.p256dh, auth: datos.auth },
  })
  return { ok: true }
}

/**
 * Deja de avisar en este dispositivo. Poder apagarlos es parte de que sean
 * cómodos: unos avisos que no se pueden quitar acaban con la app desinstalada.
 */
export async function desuscribirDePush(endpoint: string) {
  if (!endpoint) return { error: "Falta el dispositivo" }

  const { db, sesion } = await dbDeSesion()
  await db.suscripcionPush.deleteMany({ where: { endpoint, usuarioId: sesion.usuarioId } })
  return { ok: true }
}

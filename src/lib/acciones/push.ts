"use server"

import { dbDeSesion } from "@/lib/sesion"

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

import webpush from "web-push"
import { prismaCrudo } from "@/lib/db"

let configurado = false

/** Configura las claves VAPID la primera vez que hace falta enviar algo. */
function asegurarConfiguracion() {
  if (configurado) return
  const publica = process.env.VAPID_PUBLIC_KEY
  const privada = process.env.VAPID_PRIVATE_KEY
  const sujeto = process.env.VAPID_SUBJECT ?? "mailto:hola@pairapp.local"
  if (!publica || !privada) throw new Error("Faltan las claves VAPID")
  webpush.setVapidDetails(sujeto, publica, privada)
  configurado = true
}

/**
 * Envía un aviso a todos los dispositivos de una persona.
 *
 * La vista previa nunca lleva contenido del mensaje (RF-4.4): "te dejó algo",
 * jamás el texto. Y si quien recibe está en el grupo "Algo pasó", el título se
 * reduce al mínimo (RF-4.1.1) — un "está enojada" en la pantalla de bloqueo a
 * las 23:00 es una bomba.
 */
export async function avisar(usuarioId: string, titulo: string, cuerpo?: string, url = "/hoy") {
  asegurarConfiguracion()

  const suscripciones = await prismaCrudo.suscripcionPush.findMany({ where: { usuarioId } })
  const carga = JSON.stringify({ titulo, cuerpo, url })

  await Promise.all(
    suscripciones.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          carga,
        )
      } catch (error) {
        // Una suscripción caducada se borra: el navegador ya no existe.
        const codigo = (error as { statusCode?: number }).statusCode
        if (codigo === 404 || codigo === 410) {
          await prismaCrudo.suscripcionPush.delete({ where: { id: s.id } }).catch(() => {})
        }
      }
    }),
  )
}

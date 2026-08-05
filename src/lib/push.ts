import webpush from "web-push"
import { prismaCrudo } from "@/lib/db"
import { type Clase, puedeAvisar } from "@/lib/motor/avisos"
import { enPausa } from "@/lib/motor/tiempo"

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
 * **Es la única puerta por la que sale un aviso**, y aquí se aplican los tres
 * frenos. Estar en un solo sitio no es comodidad: es lo que hace que añadir un
 * aviso nuevo no pueda saltarse ninguno por descuido.
 *
 * 1. **Modo pausa** (§12.2): alguien pidió que la app se calle.
 * 2. **Horario de silencio** (RF-4.3): de once de la noche a ocho, nada.
 * 3. **Espaciado** (M4): lo que decide la app espera noventa minutos entre
 *    avisos. Lo que hace la otra persona no espera turno.
 *
 * Los tres silencian el **aviso**, nunca la entrega. Lo que te manden sigue
 * llegando y te espera al abrir: retener la entrega haría que el cofre de quien
 * escribió dijera «le llegó» cuando no es verdad (RF-3.17.4).
 *
 * La vista previa nunca lleva contenido del mensaje (RF-4.4): «te dejó algo»,
 * jamás el texto.
 */
export async function avisar(
  usuarioId: string,
  titulo: string,
  cuerpo?: string,
  url = "/hoy",
  /** Por defecto rutina: lo nuevo espera turno salvo que se diga lo contrario. */
  clase: Clase = "rutina",
) {
  const ahora = new Date()
  const usuario = await prismaCrudo.usuario.findUnique({
    where: { id: usuarioId },
    select: { pausaHasta: true, zonaHoraria: true, ultimoAvisoEn: true },
  })
  if (!usuario) return
  if (enPausa(usuario.pausaHasta, ahora)) return
  if (!puedeAvisar(clase, usuario.zonaHoraria, ahora, usuario.ultimoAvisoEn)) return

  asegurarConfiguracion()

  // Se apunta antes de enviar: si el envío falla, el hueco de noventa minutos
  // se respeta igual. Lo contrario abriría la puerta a reintentos en cadena.
  await prismaCrudo.usuario.update({
    where: { id: usuarioId },
    data: { ultimoAvisoEn: ahora },
  })

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

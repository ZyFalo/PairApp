"use client"

import { RiNotification3Line, RiNotificationOffLine } from "@remixicon/react"
import { useCallback, useEffect, useState, useTransition } from "react"
import { Apunte, Boton, Pastilla } from "@/componentes/base"
import { cambiarPausa, desuscribirDePush, suscribirAPush } from "@/lib/acciones/push"
import { diaRelativo, finDePausa } from "@/lib/motor/tiempo"

/**
 * Avisos y silencio (M4, §12.2).
 *
 * Poder apagarlos es parte de que sean cómodos: unos avisos que no se pueden
 * quitar acaban con la app desinstalada.
 */

/** Cuánto silencio pido. "Sin pausa" no está aquí: se quita con su propio botón. */
const PAUSAS = [
  { dias: 1, texto: "Hoy" },
  { dias: 3, texto: "Tres días" },
  { dias: 7, texto: "Una semana" },
]

/**
 * Modo pausa (§12.2): que la app no me hable durante unos días.
 *
 * Silencia avisos, no entregas. Lo que te manden sigue llegando y te espera al
 * abrir — así el cofre de la otra persona nunca dice "le llegó" siendo mentira.
 * Sin explicaciones ni preguntas al volver: pedir silencio no se justifica.
 */
export function ControlPausa({ hasta, zonaHoraria }: { hasta: Date | null; zonaHoraria: string }) {
  const [, empezar] = useTransition()
  const [pausa, setPausa] = useState(hasta)

  function poner(dias: number) {
    setPausa(dias > 0 ? finDePausa(dias, zonaHoraria, new Date()) : null)
    empezar(async () => {
      await cambiarPausa(dias)
    })
  }

  if (pausa && pausa > new Date()) {
    return (
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-[14.5px] text-[var(--color-tinta)]">
          <RiNotificationOffLine size={16} className="text-[var(--color-acento)]" />
          En silencio hasta el {diaRelativo(pausa, zonaHoraria, new Date()).toLowerCase()}
        </p>
        <Apunte>Lo que te escriba sigue llegando; te espera al abrir.</Apunte>
        <button
          type="button"
          onClick={() => poner(0)}
          className="pulsable text-[13px] text-[var(--color-acento)]"
        >
          Volver a recibir avisos
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Apunte>Silenciar los avisos</Apunte>
      <div className="flex flex-wrap gap-2">
        {PAUSAS.map((p) => (
          <Pastilla key={p.dias} onClick={() => poner(p.dias)}>
            {p.texto}
          </Pastilla>
        ))}
      </div>
    </div>
  )
}

/**
 * Activa o apaga las notificaciones de este dispositivo (M4).
 *
 * Comprueba el estado real del navegador al abrir: decir "activar" cuando ya
 * están activas es la clase de mentira pequeña que hace desconfiar del resto.
 * En iOS solo funcionan con la app instalada en la pantalla de inicio (RF-4.4).
 */
export function PanelPush() {
  const [activo, setActivo] = useState<boolean | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const compatible = useCallback(
    () =>
      typeof navigator !== "undefined" && "serviceWorker" in navigator && "PushManager" in window,
    [],
  )

  useEffect(() => {
    if (!compatible()) {
      setActivo(false)
      setMensaje("Este navegador no admite avisos.")
      return
    }
    navigator.serviceWorker
      .getRegistration()
      .then((r) => r?.pushManager.getSubscription())
      .then((s) => setActivo(Boolean(s)))
      .catch(() => setActivo(false))
  }, [compatible])

  async function activar() {
    setOcupado(true)
    setMensaje(null)
    try {
      const permiso = await Notification.requestPermission()
      if (permiso !== "granted") {
        setMensaje("Sin permiso no se pueden enviar avisos.")
        return
      }
      const registro = await navigator.serviceWorker.register("/sw.js")
      const listo = await navigator.serviceWorker.ready
      const clave = await fetch("/api/push/clave").then((r) => r.text())
      const suscripcion = await (listo.pushManager ?? registro.pushManager).subscribe({
        userVisibleOnly: true,
        applicationServerKey: clave,
      })
      const datos = suscripcion.toJSON() as {
        endpoint?: string
        keys?: { p256dh?: string; auth?: string }
      }
      await suscribirAPush({
        endpoint: datos.endpoint ?? "",
        p256dh: datos.keys?.p256dh ?? "",
        auth: datos.keys?.auth ?? "",
      })
      setActivo(true)
      setMensaje("Avisos activados en este dispositivo.")
    } catch {
      setMensaje("No se pudieron activar.")
    } finally {
      setOcupado(false)
    }
  }

  async function apagar() {
    setOcupado(true)
    setMensaje(null)
    try {
      const registro = await navigator.serviceWorker.getRegistration()
      const suscripcion = await registro?.pushManager.getSubscription()
      if (suscripcion) {
        await desuscribirDePush(suscripcion.endpoint)
        await suscripcion.unsubscribe()
      }
      setActivo(false)
      setMensaje("Este dispositivo ya no recibe avisos.")
    } catch {
      setMensaje("No se pudieron apagar.")
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="space-y-2">
      <Boton
        variante="suave"
        onClick={activo ? apagar : activar}
        disabled={ocupado || activo === null || !compatible()}
        className="w-full"
      >
        <span className="inline-flex items-center gap-2">
          {activo ? <RiNotificationOffLine size={17} /> : <RiNotification3Line size={17} />}
          {ocupado
            ? "Un momento…"
            : activo === null
              ? "Comprobando…"
              : activo
                ? "Apagar los avisos aquí"
                : "Activar avisos en este dispositivo"}
        </span>
      </Boton>
      {mensaje && <Apunte>{mensaje}</Apunte>}
      {!activo && (
        <Apunte>
          En iPhone hay que añadir la app a la pantalla de inicio antes de que funcionen.
        </Apunte>
      )}
    </div>
  )
}

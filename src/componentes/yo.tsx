"use client"

import { useActionState, useState, useTransition } from "react"
import { Apunte, Aviso, Boton, Campo, Tarjeta } from "@/componentes/base"
import { archivarApunte, decirloAhora } from "@/lib/acciones/bucle"
import { registrarCiclo } from "@/lib/acciones/nosotros"
import { suscribirAPush } from "@/lib/acciones/push"

/**
 * Qué hacer con un apunte privado. "Decirlo ahora" es el mecanismo más
 * importante de la lista: mover algo de callado a hablado sin empezar de
 * cero (RF-2.0.6). Archivar no borra: guarda memoria sin presión (RF-2.0.9).
 */
export function AccionesApunte({
  mensajeId,
  hayPareja,
}: {
  mensajeId: string
  hayPareja: boolean
}) {
  const [, empezar] = useTransition()

  return (
    <div className="flex gap-3 text-[13px]">
      {hayPareja && (
        <button
          type="button"
          onClick={() => empezar(() => void decirloAhora(mensajeId))}
          className="text-[--color-acento]"
        >
          Decirlo ahora
        </button>
      )}
      <button
        type="button"
        onClick={() => empezar(() => void archivarApunte(mensajeId))}
        className="text-[--color-tinta-tenue]"
      >
        Archivar
      </button>
    </div>
  )
}

/**
 * Registro de periodo (M5). Ella elige qué comparte y escribe con sus palabras
 * qué le sirve — la app nunca traduce eso a una etiqueta de "sensible" (RF-5.4).
 */
export function FormularioCiclo() {
  const [estado, accion, pendiente] = useActionState(registrarCiclo, {})
  const [abierto, setAbierto] = useState(false)

  if (!abierto) {
    return (
      <Boton variante="suave" onClick={() => setAbierto(true)} className="w-full">
        Registrar periodo
      </Boton>
    )
  }

  return (
    <Tarjeta className="aparece">
      <form action={accion} className="space-y-3">
        <Campo etiqueta="Primer día" name="inicio" type="date" required />
        <Campo etiqueta="Último día (opcional)" name="fin" type="date" />

        <label className="block">
          <span className="mb-1.5 block text-[13px] text-[--color-tinta-suave]">
            ¿Qué compartes?
          </span>
          <select
            name="nivelVisibilidad"
            defaultValue="SOLO_FECHAS"
            className="w-full rounded-[--radius-suave] border border-[--color-borde] bg-[--color-papel] px-4 py-3 text-[16px] outline-none"
          >
            <option value="NADA">Nada</option>
            <option value="SOLO_FECHAS">Solo las fechas</option>
            <option value="FECHAS_Y_NOTA">Las fechas y una nota mía</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] text-[--color-tinta-suave]">
            Qué te sirve estos días (lo verá solo si eliges compartirlo)
          </span>
          <textarea
            name="notaParaPareja"
            rows={3}
            maxLength={1000}
            placeholder="Por ejemplo: no me preguntes si estoy bien, solo trae té y pon una peli."
            className="w-full resize-none rounded-[--radius-suave] border border-[--color-borde] bg-[--color-papel] p-3 font-[family-name:--font-carta] text-[16px] outline-none"
          />
        </label>

        <Aviso>{estado.error}</Aviso>
        <div className="flex gap-2">
          <Boton type="submit" disabled={pendiente} className="flex-1">
            Guardar
          </Boton>
          <Boton variante="texto" type="button" onClick={() => setAbierto(false)}>
            Cancelar
          </Boton>
        </div>
      </form>
    </Tarjeta>
  )
}

/** Activa las notificaciones. En iOS solo funciona con la app instalada (RF-4.4). */
export function PanelPush() {
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  async function activar() {
    setOcupado(true)
    setMensaje(null)
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setMensaje("Este navegador no admite avisos.")
        return
      }
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
      setMensaje("Avisos activados.")
    } catch {
      setMensaje("No se pudieron activar.")
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="space-y-2">
      <Boton variante="suave" onClick={activar} disabled={ocupado} className="w-full">
        {ocupado ? "Activando…" : "Activar avisos en este dispositivo"}
      </Boton>
      {mensaje && <Apunte>{mensaje}</Apunte>}
      <Apunte>
        En iPhone hay que añadir la app a la pantalla de inicio antes de que funcionen.
      </Apunte>
    </div>
  )
}

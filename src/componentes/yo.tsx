"use client"

import {
  RiArchiveLine,
  RiCloseLine,
  RiInboxUnarchiveLine,
  RiNotification3Line,
  RiNotificationOffLine,
  RiSendPlaneLine,
} from "@remixicon/react"
import { useActionState, useCallback, useEffect, useState, useTransition } from "react"
import { Apunte, Aviso, Boton, Campo, Tarjeta } from "@/componentes/base"
import { Seleccion } from "@/componentes/nosotros"
import { archivarApunte, decirloAhora, desarchivarApunte } from "@/lib/acciones/bucle"
import { cambiarVisibilidadCiclo, registrarCiclo } from "@/lib/acciones/nosotros"
import { desuscribirDePush, suscribirAPush } from "@/lib/acciones/push"

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
  const [confirmando, setConfirmando] = useState(false)

  // Enviar es irreversible: un toque de más no debería bastar para que salga.
  if (confirmando) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => empezar(() => void decirloAhora(mensajeId))}
          className="pulsable inline-flex items-center gap-1.5 rounded-[var(--radius-pildora)] bg-[var(--color-acento)] px-3 py-1.5 text-[12.5px] font-medium text-[#fffcf7]"
        >
          <RiSendPlaneLine size={14} />
          Enviárselo
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          aria-label="Cancelar"
          className="pulsable rounded-full p-1 text-[var(--color-tinta-tenue)]"
        >
          <RiCloseLine size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 text-[13px]">
      {hayPareja && (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="pulsable inline-flex items-center gap-1.5 text-[var(--color-acento)]"
        >
          <RiSendPlaneLine size={14} />
          Decirlo ahora
        </button>
      )}
      <button
        type="button"
        onClick={() => empezar(() => void archivarApunte(mensajeId))}
        className="pulsable inline-flex items-center gap-1.5 text-[var(--color-tinta-tenue)] hover:text-[var(--color-tinta-suave)]"
      >
        <RiArchiveLine size={14} />
        Archivar
      </button>
    </div>
  )
}

/** Sacar un apunte del archivo (RF-2.0.9). */
export function BotonDesarchivar({ mensajeId }: { mensajeId: string }) {
  const [, empezar] = useTransition()

  return (
    <button
      type="button"
      onClick={() => empezar(() => void desarchivarApunte(mensajeId))}
      className="pulsable inline-flex items-center gap-1.5 text-[13px] text-[var(--color-tinta-tenue)] hover:text-[var(--color-acento)]"
    >
      <RiInboxUnarchiveLine size={14} />
      Recuperarlo
    </button>
  )
}

/** Qué comparto de mi periodo (RF-5.3). */
const VISIBILIDADES = [
  { valor: "NADA", texto: "Nada" },
  { valor: "SOLO_FECHAS", texto: "Solo las fechas" },
  { valor: "FECHAS_Y_NOTA", texto: "Las fechas y una nota mía" },
]

const EJEMPLO_NOTA = "Por ejemplo: no me preguntes si estoy bien, solo trae té y pon una peli."

/**
 * Registro de periodo (M5). Ella elige qué comparte y escribe con sus palabras
 * qué le sirve — la app nunca traduce eso a una etiqueta de "sensible" (RF-5.4).
 */
export function FormularioCiclo() {
  const [estado, accion, pendiente] = useActionState(registrarCiclo, {})
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    if (estado.ok) setAbierto(false)
  }, [estado.ok])

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
        <Campo etiqueta="Primer día" name="inicio" type="date" required autoFocus />
        <Campo etiqueta="Último día (opcional)" name="fin" type="date" />

        <Seleccion
          etiqueta="¿Qué compartes?"
          name="nivelVisibilidad"
          opciones={VISIBILIDADES}
          valorInicial="SOLO_FECHAS"
        />

        <label className="block">
          <span className="mb-2 block text-[12.5px] font-medium uppercase tracking-[0.08em] text-[var(--color-tinta-tenue)]">
            Qué te sirve estos días
          </span>
          <textarea
            name="notaParaPareja"
            rows={3}
            maxLength={1000}
            placeholder={EJEMPLO_NOTA}
            className="carta w-full resize-none rounded-[var(--radius-suave)] border border-[var(--color-borde)] bg-[var(--color-papel)] p-3 text-[16px] outline-none transition-colors focus:border-[var(--color-acento-suave)]"
          />
          <span className="mt-1.5 block text-[12.5px] text-[var(--color-tinta-tenue)]">
            Solo lo verá si eliges compartir la nota.
          </span>
        </label>

        <Aviso>{estado.error}</Aviso>
        <div className="flex gap-2">
          <Boton type="submit" disabled={pendiente} className="flex-1">
            {pendiente ? "Guardando…" : "Guardar"}
          </Boton>
          <Boton variante="texto" type="button" onClick={() => setAbierto(false)}>
            Cancelar
          </Boton>
        </div>
      </form>
    </Tarjeta>
  )
}

/**
 * Cambiar qué se comparte de un periodo ya registrado. Sin esto la primera
 * decisión sería para siempre, y eso empuja a no compartir nada (RF-5.3).
 */
export function CambiarVisibilidadCiclo({
  cicloId,
  nivelActual,
  notaActual,
}: {
  cicloId: string
  nivelActual: string
  notaActual: string | null
}) {
  const [estado, accion, pendiente] = useActionState(cambiarVisibilidadCiclo, {})
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    if (estado.ok) setAbierto(false)
  }, [estado.ok])

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="pulsable text-[13px] text-[var(--color-acento)]"
      >
        Cambiar qué comparto
      </button>
    )
  }

  return (
    <form action={accion} className="aparece space-y-3 pt-1">
      <input type="hidden" name="cicloId" value={cicloId} />
      <Seleccion
        etiqueta="¿Qué compartes?"
        name="nivelVisibilidad"
        opciones={VISIBILIDADES}
        valorInicial={nivelActual}
      />
      <textarea
        name="notaParaPareja"
        rows={3}
        maxLength={1000}
        defaultValue={notaActual ?? ""}
        placeholder={EJEMPLO_NOTA}
        aria-label="Qué te sirve estos días"
        className="carta w-full resize-none rounded-[var(--radius-suave)] border border-[var(--color-borde)] bg-[var(--color-papel)] p-3 text-[16px] outline-none transition-colors focus:border-[var(--color-acento-suave)]"
      />
      <Aviso>{estado.error}</Aviso>
      <div className="flex gap-2">
        <Boton type="submit" disabled={pendiente} className="flex-1">
          {pendiente ? "Guardando…" : "Guardar"}
        </Boton>
        <Boton variante="texto" type="button" onClick={() => setAbierto(false)}>
          Cancelar
        </Boton>
      </div>
    </form>
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

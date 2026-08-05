"use client"

import {
  RiArrowGoBackLine,
  RiBookmarkFill,
  RiBookmarkLine,
  RiDeleteBin6Line,
  RiInboxUnarchiveLine,
} from "@remixicon/react"
import { useState, useTransition } from "react"
import { alternarGuardado } from "@/lib/acciones/bucle"
import { eliminarConRastro, retirarEnviado, retirarGuardado } from "@/lib/acciones/entregas"

/**
 * Guardar un mensaje en el cofre. La señal solo existe en positivo: no hay
 * "no guardado", ni se cuenta, ni se menciona (RF-3.9.1).
 */
export function BotonGuardar({ mensajeId, guardado }: { mensajeId: string; guardado: boolean }) {
  const [activo, setActivo] = useState(guardado)
  const [, empezar] = useTransition()

  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={() => {
        setActivo(!activo)
        empezar(() => {
          void alternarGuardado(mensajeId)
        })
      }}
      className={`pulsable inline-flex items-center gap-1.5 text-[13px] ${
        activo
          ? "text-[var(--color-acento)]"
          : "text-[var(--color-tinta-tenue)] hover:text-[var(--color-tinta-suave)]"
      }`}
    >
      {activo ? <RiBookmarkFill size={15} /> : <RiBookmarkLine size={15} />}
      {activo ? "Guardado" : "Guardar"}
    </button>
  )
}

/**
 * Recuperar un mensaje que dejaste "para cuando le sirva" y todavía no ha
 * salido (RF-2.2.4). Vuelve a tus apuntes: arrepentirse antes de que llegue
 * tiene que ser posible, o guardar da miedo.
 */
export function BotonRetirar({ mensajeId }: { mensajeId: string }) {
  const [retirando, empezar] = useTransition()

  return (
    <button
      type="button"
      disabled={retirando}
      aria-busy={retirando || undefined}
      onClick={() =>
        empezar(async () => {
          await retirarGuardado(mensajeId)
        })
      }
      className="pulsable inline-flex items-center gap-1.5 text-[13px] text-[var(--color-tinta-tenue)] hover:text-[var(--color-acento)] disabled:opacity-100"
    >
      <RiInboxUnarchiveLine size={15} />
      {retirando ? "Retirándolo…" : "Retirarlo"}
    </button>
  )
}

/**
 * Deshacer un envío (§6.4). Dos botones distintos porque son dos cosas
 * distintas:
 *
 * - **Retirar** solo existe los dos primeros minutos y solo si aún no lo abrió.
 *   Vuelve a tus apuntes sin dejar nada, porque no lo ha visto nadie.
 * - **Eliminar** es lo que queda después, y **deja rastro** (RF-6.4.2): ella
 *   verá que hubo un mensaje y que ya no está. Borrarlo en silencio sería
 *   reescribir una historia que es de los dos.
 */
export function DeshacerEnvio({
  mensajeId,
  puedeRetirar,
}: {
  mensajeId: string
  puedeRetirar: boolean
}) {
  const [confirmando, setConfirmando] = useState(false)
  const [yendo, empezar] = useTransition()

  if (puedeRetirar) {
    return (
      <button
        type="button"
        disabled={yendo}
        aria-busy={yendo || undefined}
        onClick={() =>
          empezar(async () => {
            await retirarEnviado(mensajeId)
          })
        }
        className="pulsable inline-flex items-center gap-1.5 text-[13px] text-[var(--color-acento)] disabled:opacity-100"
      >
        <RiArrowGoBackLine size={15} />
        {yendo ? "Retirándolo…" : "Retirarlo"}
      </button>
    )
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="pulsable inline-flex items-center gap-1.5 text-[13px] text-[var(--color-tinta-tenue)] hover:text-[var(--color-acento)]"
      >
        <RiDeleteBin6Line size={15} />
        Eliminar
      </button>
    )
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="text-[12.5px] text-[var(--color-tinta-tenue)]">Verá que lo borraste.</span>
      {/* Una vez lanzado ya no hay nada que cancelar, así que el «No» se apaga
          con él. Y el que se pulsó **no** se atenúa: es el que dice qué está
          pasando. */}
      <button
        type="button"
        disabled={yendo}
        aria-busy={yendo || undefined}
        onClick={() =>
          empezar(async () => {
            await eliminarConRastro(mensajeId)
          })
        }
        className="pulsable rounded-[var(--radius-pildora)] bg-[var(--color-acento-tenue)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-acento-hondo)] disabled:opacity-100"
      >
        {yendo ? "Eliminando…" : "Eliminar igual"}
      </button>
      <button
        type="button"
        disabled={yendo}
        onClick={() => setConfirmando(false)}
        className="pulsable text-[12.5px] text-[var(--color-tinta-tenue)] disabled:opacity-40"
      >
        No
      </button>
    </span>
  )
}

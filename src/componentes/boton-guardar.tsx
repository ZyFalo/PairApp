"use client"

import { RiBookmarkFill, RiBookmarkLine, RiInboxUnarchiveLine } from "@remixicon/react"
import { useState, useTransition } from "react"
import { alternarGuardado, retirarGuardado } from "@/lib/acciones/bucle"

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
  const [, empezar] = useTransition()

  return (
    <button
      type="button"
      onClick={() => empezar(() => void retirarGuardado(mensajeId))}
      className="pulsable inline-flex items-center gap-1.5 text-[13px] text-[var(--color-tinta-tenue)] hover:text-[var(--color-acento)]"
    >
      <RiInboxUnarchiveLine size={15} />
      Retirarlo
    </button>
  )
}

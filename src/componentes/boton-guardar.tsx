"use client"

import { useState, useTransition } from "react"
import { alternarGuardado } from "@/lib/acciones/bucle"

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
      onClick={() => {
        setActivo(!activo)
        empezar(() => {
          void alternarGuardado(mensajeId)
        })
      }}
      className={`text-[13px] transition-colors duration-200 ${
        activo ? "text-[--color-acento]" : "text-[--color-tinta-tenue]"
      }`}
    >
      {activo ? "♥ Guardado" : "♡ Guardar"}
    </button>
  )
}

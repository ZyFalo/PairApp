"use client"

import { useState } from "react"
import { Apunte, Aviso, Boton, Tarjeta } from "@/componentes/base"
import { crearInvitacion, salir } from "@/lib/acciones/cuenta"

/** Genera y muestra el código de invitación (RF-0.2). */
export function PanelInvitacion() {
  const [codigo, setCodigo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function generar() {
    setCargando(true)
    setError(null)
    const resultado = await crearInvitacion()
    if ("error" in resultado) setError(resultado.error)
    else setCodigo(resultado.codigo)
    setCargando(false)
  }

  return (
    <div className="aparece space-y-5">
      {codigo ? (
        <Tarjeta className="space-y-3 text-center">
          <p className="font-[family-name:--font-carta] text-[34px] tracking-[0.2em] text-[--color-acento]">
            {codigo}
          </p>
          <Apunte>
            Que lo escriba al crear su cuenta. Cuando entre, esta pantalla desaparece sola.
          </Apunte>
        </Tarjeta>
      ) : (
        <Boton onClick={generar} disabled={cargando} className="w-full">
          {cargando ? "Generando…" : "Generar código"}
        </Boton>
      )}

      <Aviso>{error}</Aviso>

      <form action={salir}>
        <Boton type="submit" variante="texto" className="w-full">
          Cerrar sesión
        </Boton>
      </form>
    </div>
  )
}

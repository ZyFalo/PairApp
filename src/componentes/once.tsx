"use client"

import { RiSparkling2Line } from "@remixicon/react"
import { useActionState, useState } from "react"
import { Apunte, Aviso, Boton, Tarjeta } from "@/componentes/base"
import { pedirOnceOnce } from "@/lib/acciones/nosotros"

/**
 * Los 11:11 (M12). Cuatro minutos de gracia; si se pasa, el aviso desaparece
 * sin dejar rastro ni mención. Sin rachas ni contadores (RF-12.7).
 *
 * Tiene fichero propio porque es lo más efímero de la app y sale donde haga
 * falta: la ventana dura cuatro minutos y nadie va a cambiar de pestaña a
 * tiempo (RF-12.2).
 */
export function VentanaOnceOnce() {
  const [estado, accion, pendiente] = useActionState(pedirOnceOnce, {})
  const [texto, setTexto] = useState("")

  if (estado.ok) return null

  return (
    <Tarjeta alzada className="aparece space-y-3">
      <p className="flex items-center justify-center gap-2 carta text-[19px]">
        <RiSparkling2Line size={18} className="text-[var(--color-contigo)]" />
        11:11
      </p>
      <form action={accion} className="space-y-3">
        <textarea
          name="texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value.slice(0, 140))}
          rows={2}
          placeholder="Pide un deseo…"
          aria-label="Tu deseo"
          className="carta w-full resize-none rounded-[var(--radius-suave)] border border-[var(--color-borde)] bg-[var(--color-lienzo)] p-3 text-[16px] outline-none transition-colors focus:border-[var(--color-acento-suave)]"
        />
        <div className="flex items-center justify-between">
          <Apunte>{140 - texto.length} caracteres</Apunte>
          <Boton type="submit" disabled={pendiente || !texto.trim()}>
            Pedir
          </Boton>
        </div>
        <Aviso>{estado.error}</Aviso>
      </form>
    </Tarjeta>
  )
}

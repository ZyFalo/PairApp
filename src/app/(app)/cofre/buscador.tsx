"use client"

import { RiCloseLine, RiSearchLine } from "@remixicon/react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

/** Milisegundos de calma antes de buscar. Escribir no debería disparar una consulta por tecla. */
const ESPERA = 250

/**
 * Buscar en el cofre (RF-3.11.1).
 *
 * El texto vive en la URL y no en el estado del componente: así la búsqueda
 * sobrevive a cambiar de vista, se puede compartir y el botón atrás funciona.
 * El campo local existe solo para no consultar en cada tecla.
 */
export function Buscador({ inicial }: { inicial: string }) {
  const router = useRouter()
  const ruta = usePathname()
  const parametros = useSearchParams()
  const [texto, setTexto] = useState(inicial)

  // Si la URL cambia por fuera (tocar una vista, ir atrás), el campo la sigue.
  useEffect(() => setTexto(inicial), [inicial])

  useEffect(() => {
    if (texto === inicial) return
    const temporizador = setTimeout(() => {
      const siguientes = new URLSearchParams(parametros)
      if (texto.trim()) siguientes.set("q", texto.trim())
      else siguientes.delete("q")
      router.replace(`${ruta}?${siguientes}`, { scroll: false })
    }, ESPERA)
    return () => clearTimeout(temporizador)
  }, [texto, inicial, parametros, ruta, router])

  return (
    <div className="relative">
      <RiSearchLine
        size={16}
        className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3.5 text-[var(--color-tinta-tenue)]"
      />
      <input
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar…"
        aria-label="Buscar en el cofre"
        className="w-full rounded-[var(--radius-pildora)] border border-[var(--color-borde)] bg-[var(--color-papel)] py-2.5 pr-10 pl-10 text-[14.5px] text-[var(--color-tinta)] outline-none transition-colors focus:border-[var(--color-acento-suave)]"
      />
      {texto && (
        <button
          type="button"
          onClick={() => setTexto("")}
          aria-label="Borrar la búsqueda"
          className="-translate-y-1/2 pulsable absolute top-1/2 right-3 text-[var(--color-tinta-tenue)] hover:text-[var(--color-acento)]"
        >
          <RiCloseLine size={16} />
        </button>
      )}
    </div>
  )
}

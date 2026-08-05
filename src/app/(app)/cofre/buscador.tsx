"use client"

import { RiCloseLine, RiSearchLine } from "@remixicon/react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

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
  /** Lo último que este campo mandó a la URL. */
  const mio = useRef(inicial)

  /**
   * Si la URL cambia **por fuera** —tocar una vista, ir atrás— el campo la
   * sigue. Si el cambio es el eco de lo que acabo de mandar yo, no.
   *
   * Sin esa distinción la app se comía letras, y de la peor forma: solo al
   * escribir rápido. Tecleas «hola», a los 250 ms sale la consulta de «hol», y
   * cuando la respuesta vuelve el efecto pone «hol» en el campo — borrando la
   * «a» que ya habías escrito. Cuanto más deprisa escribes, más se pierde.
   */
  useEffect(() => {
    if (inicial === mio.current) return
    mio.current = inicial
    setTexto(inicial)
  }, [inicial])

  useEffect(() => {
    if (texto === inicial) return
    const temporizador = setTimeout(() => {
      const siguientes = new URLSearchParams(parametros)
      const limpio = texto.trim()
      if (limpio) siguientes.set("q", limpio)
      else siguientes.delete("q")
      mio.current = limpio
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

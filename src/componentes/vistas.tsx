"use client"

import type { ReactNode } from "react"
import { useEffect, useRef } from "react"

/**
 * El carril desplazable de las vistas del cofre y de Nosotros.
 *
 * **Se desplaza hasta la vista activa al abrir.** Sin eso, entrar en la última
 * dejaba el carril al principio, con su pastilla fuera de pantalla y ninguna
 * marcada: la pantalla decía "estás en Calendario" mientras enseñaba otra cosa.
 *
 * Recibe las pastillas ya dibujadas en vez de la lista de vistas, y no es un
 * detalle de estilo: los iconos son funciones, y una función no puede cruzar de
 * un componente de servidor a uno de cliente. Pasar `children` ya pintado
 * mantiene el icono del lado del servidor, que es donde se resuelve. Esto
 * compilaba, pasaba el lint y pasaba los tests; solo se vio abriendo la app.
 */
export function CarrilDeVistas({ children }: { children: ReactNode }) {
  const carril = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const elegida = carril.current?.querySelector('[aria-current="page"]')
    // `nearest` en vertical: centrar la pastilla no puede arrastrar la página.
    elegida?.scrollIntoView({ block: "nearest", inline: "center" })
  }, [])

  return (
    <div
      ref={carril}
      className="-mx-5 flex gap-1.5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {children}
    </div>
  )
}

"use client"

import { useLinkStatus } from "next/link"
import type { ReactNode } from "react"

/**
 * Que el sitio que acabas de tocar diga que va, mientras el servidor responde.
 *
 * Está aquí y no en `base.tsx` por una razón que no es de orden: `base.tsx`
 * **no puede llevar `"use client"` nunca**. `Seccion`, `Vacio` y
 * `PastillaDeVista` reciben `Icono` como función desde páginas de servidor, y
 * una función no cruza esa frontera (§7). La regla operativa que sale de ahí es
 * simple: nada con hooks entra en `base.tsx`.
 *
 * **Y este fichero no importa nada de `base.tsx`.** No es purismo: `base.tsx`
 * importa `EnCamino` para las pastillas de vista, y si la flecha apuntara en
 * los dos sentidos habría un ciclo entre un módulo de servidor y uno de
 * cliente. Lo que necesite a la vez un `Boton` y un hook va en el fichero de su
 * módulo, no aquí.
 *
 * Lo que se dibuja mientras llega el contenido vive en `esqueleto.tsx`, que es
 * de servidor: pintar rectángulos no necesita JavaScript en el navegador.
 */

/**
 * **Tiene que renderizarse dentro del `<Link>`.** `useLinkStatus` lee el
 * contexto que publica el propio enlace; desde el padre devuelve siempre
 * `false` y el cambio parece no hacer nada.
 *
 * Recibe `children` **ya dibujados**, nunca una función: es lo mismo que
 * documenta `vistas.tsx`, y ese comentario existe porque el bug compilaba,
 * pasaba el lint y pasaba los tests.
 *
 * Cuando no hay nada en vuelo **no pinta nada**: el DOM queda igual que si esto
 * no existiera.
 *
 * - `enciende` — lo tocado se queda en el acento. Para flechas e iconos.
 * - `apaga` — pierde color y deja de responder. Para lo que va a desaparecer.
 * - `marca` — dibuja encima **la misma marca que tendrá cuando llegue**, así
 *   que al llegar no cambia nada de sitio. Para casillas y pastillas.
 */
export function EnCamino({
  modo,
  children,
}: {
  modo: "enciende" | "apaga" | "marca"
  children?: ReactNode
}) {
  const { pending } = useLinkStatus()

  if (modo === "marca") {
    if (!pending) return null
    return (
      <span
        aria-hidden
        className="aparece pointer-events-none absolute inset-0 rounded-[inherit] bg-[var(--color-acento-tenue)] ring-1 ring-[var(--color-acento-suave)]"
      />
    )
  }

  if (!pending) return <>{children}</>

  return (
    <span
      className={
        modo === "enciende"
          ? "text-[var(--color-acento)]"
          : "pointer-events-none text-[var(--color-borde)]"
      }
    >
      {children}
    </span>
  )
}

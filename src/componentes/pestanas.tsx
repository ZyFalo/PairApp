"use client"

import {
  RiArchiveDrawerFill,
  RiArchiveDrawerLine,
  RiCalendar2Fill,
  RiCalendar2Line,
  RiSunFill,
  RiSunLine,
  RiUser3Fill,
  RiUser3Line,
} from "@remixicon/react"
import { motion } from "motion/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { EnCamino } from "@/componentes/espera"
import { pedirReinicio } from "@/lib/borrador"

/**
 * Las cuatro pestañas de §8.1. Ninguna lleva contador: un badge es una deuda
 * (RF-2.0.7).
 *
 * Nosotros va primera desde que su vista de partida es el calendario: es la
 * pantalla por la que se entra. Conserva su nombre y no pasa a llamarse
 * "Calendario" porque debajo siguen colgando las películas, la música y los
 * recuerdos — el mes es su puerta, no todo lo que hay dentro.
 *
 * El icono sí es un calendario: dice qué se va a encontrar quien toque.
 */
const PESTANAS = [
  { href: "/nosotros", texto: "Nosotros", Icono: RiCalendar2Line, IconoActivo: RiCalendar2Fill },
  { href: "/hoy", texto: "Hoy", Icono: RiSunLine, IconoActivo: RiSunFill },
  { href: "/cofre", texto: "Cofre", Icono: RiArchiveDrawerLine, IconoActivo: RiArchiveDrawerFill },
  { href: "/yo", texto: "Yo", Icono: RiUser3Line, IconoActivo: RiUser3Fill },
]

/** Navegación principal, fija abajo, sobre papel translúcido. */
export function Pestanas() {
  const ruta = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md">
      <div className="border-t border-[var(--color-borde-suave)] bg-[var(--color-papel)]/85 backdrop-blur-xl">
        <ul className="grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
          {PESTANAS.map((p) => {
            const activa = ruta === p.href || ruta.startsWith(`${p.href}/`)
            const Icono = activa ? p.IconoActivo : p.Icono
            return (
              <li key={p.href} className="relative">
                <Link
                  href={p.href}
                  className="pulsable flex flex-col items-center gap-1 py-3.5"
                  aria-current={activa ? "page" : undefined}
                  onClick={(evento) => {
                    // Tocar la pestaña en la que ya estás la devuelve a su vista
                    // de partida y tira lo que hubiera a medias. Es la salida
                    // del borrador: la memoria dura hasta este segundo toque.
                    if (!activa) return
                    evento.preventDefault()
                    pedirReinicio(p.href)
                  }}
                >
                  {/* El icono y el nombre se encienden en cuanto se toca, sin
                      esperar a que llegue la pantalla. Es la espera más
                      repetida de la app —cambiar de pestaña son cuatro rutas
                      dinámicas— y hasta ahora no pasaba absolutamente nada
                      entre el dedo y el contenido nuevo.

                      Dentro del `<Link>` porque `useLinkStatus` lee el contexto
                      que publica el enlace; desde fuera devuelve siempre falso. */}
                  <EnCamino modo="enciende">
                    <Icono
                      size={21}
                      className={
                        activa ? "text-[var(--color-acento)]" : "text-[var(--color-tinta-tenue)]"
                      }
                    />
                  </EnCamino>
                  <EnCamino modo="enciende">
                    <span
                      className={`text-[11px] font-medium tracking-wide ${
                        activa ? "text-[var(--color-acento)]" : "text-[var(--color-tinta-tenue)]"
                      }`}
                    >
                      {p.texto}
                    </span>
                  </EnCamino>
                </Link>
                {activa && (
                  // El indicador se desliza entre pestañas en vez de parpadear
                  <motion.span
                    layoutId="pestana-activa"
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                    className="absolute inset-x-6 top-0 h-[2px] rounded-full bg-[var(--color-acento)]"
                  />
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

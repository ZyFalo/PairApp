"use client"

import {
  RiArchiveDrawerFill,
  RiArchiveDrawerLine,
  RiHeart2Fill,
  RiHeart2Line,
  RiSunFill,
  RiSunLine,
  RiUser3Fill,
  RiUser3Line,
} from "@remixicon/react"
import { motion } from "motion/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

/** Las cuatro pestañas de §8.1. Ninguna lleva contador: un badge es una deuda (RF-2.0.7). */
const PESTANAS = [
  { href: "/hoy", texto: "Hoy", Icono: RiSunLine, IconoActivo: RiSunFill },
  { href: "/cofre", texto: "Cofre", Icono: RiArchiveDrawerLine, IconoActivo: RiArchiveDrawerFill },
  { href: "/nosotros", texto: "Nosotros", Icono: RiHeart2Line, IconoActivo: RiHeart2Fill },
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
                >
                  <Icono
                    size={21}
                    className={
                      activa ? "text-[var(--color-acento)]" : "text-[var(--color-tinta-tenue)]"
                    }
                  />
                  <span
                    className={`text-[11px] font-medium tracking-wide ${
                      activa ? "text-[var(--color-acento)]" : "text-[var(--color-tinta-tenue)]"
                    }`}
                  >
                    {p.texto}
                  </span>
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

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

/** Las cuatro pestañas de §8.1. Ninguna lleva contador: un badge es una deuda (RF-2.0.7). */
const PESTANAS = [
  { href: "/hoy", texto: "Hoy" },
  { href: "/cofre", texto: "Cofre" },
  { href: "/nosotros", texto: "Nosotros" },
  { href: "/yo", texto: "Yo" },
]

/** Navegación principal, fija abajo. */
export function Pestanas() {
  const ruta = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-[--color-borde] bg-[--color-papel]/95 backdrop-blur">
      <ul className="grid grid-cols-4">
        {PESTANAS.map((p) => {
          const activa = ruta === p.href || ruta.startsWith(`${p.href}/`)
          return (
            <li key={p.href}>
              <Link
                href={p.href}
                className={`block py-4 text-center text-[13px] transition-colors duration-200 ${
                  activa ? "text-[--color-acento]" : "text-[--color-tinta-tenue]"
                }`}
              >
                {p.texto}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

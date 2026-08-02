import Link from "next/link"
import type { ComponentProps, ReactNode } from "react"

/**
 * Componentes propios en lugar de una librería: §8.2 pide identidad visual
 * propia, y un kit genérico haría que la app se pareciera a cualquier otra.
 */

/** Botón. Uno principal por pantalla; el resto en suave o texto. */
export function Boton({
  children,
  variante = "solido",
  className = "",
  ...props
}: ComponentProps<"button"> & { variante?: "solido" | "suave" | "texto" }) {
  const estilos = {
    solido:
      "text-[#fffcf7] bg-gradient-to-b from-[var(--color-acento)] to-[var(--color-acento-hondo)] shadow-[var(--sombra-tinta)] hover:brightness-[1.06]",
    suave:
      "text-[var(--color-tinta)] bg-gradient-to-b from-[var(--color-papel-alto)] to-[var(--color-papel)] border border-[var(--color-borde)] shadow-[var(--sombra-papel)] hover:border-[var(--color-acento-suave)]",
    texto: "text-[var(--color-tinta-suave)] hover:text-[var(--color-acento)]",
  }[variante]

  return (
    <button
      className={`pulsable rounded-[var(--radius-suave)] px-5 py-3.5 text-[15px] font-medium disabled:opacity-40 ${estilos} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

/** Enlace con aspecto de botón, para navegación. */
export function BotonEnlace({
  href,
  children,
  variante = "suave",
}: {
  href: string
  children: ReactNode
  variante?: "solido" | "suave"
}) {
  const estilos =
    variante === "solido"
      ? "text-[#fffcf7] bg-gradient-to-b from-[var(--color-acento)] to-[var(--color-acento-hondo)] shadow-[var(--sombra-tinta)]"
      : "text-[var(--color-tinta)] bg-[var(--color-papel)] border border-[var(--color-borde)]"
  return (
    <Link
      href={href}
      className={`pulsable inline-block rounded-[var(--radius-suave)] px-5 py-3.5 text-center text-[15px] font-medium ${estilos}`}
    >
      {children}
    </Link>
  )
}

/** Campo de formulario con su etiqueta. */
export function Campo({ etiqueta, ...props }: ComponentProps<"input"> & { etiqueta: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[12.5px] font-medium uppercase tracking-[0.08em] text-[var(--color-tinta-tenue)]">
        {etiqueta}
      </span>
      <input
        className="w-full rounded-[var(--radius-suave)] border border-[var(--color-borde)] bg-[var(--color-papel)] px-4 py-3.5 text-[16px] text-[var(--color-tinta)] shadow-[inset_0_1px_2px_rgb(74_54_38_/_0.04)] outline-none transition-colors duration-200 focus:border-[var(--color-acento-suave)]"
        {...props}
      />
    </label>
  )
}

/** Superficie de contenido: una hoja de papel con grosor, no un rectángulo plano. */
export function Tarjeta({
  children,
  className = "",
  alzada = false,
}: {
  children: ReactNode
  className?: string
  alzada?: boolean
}) {
  return <div className={`hoja ${alzada ? "hoja-alzada" : ""} p-5 ${className}`}>{children}</div>
}

/** Texto de un mensaje. Serif: se lee como una carta, no como una notificación. */
export function TextoDeCarta({ children }: { children: ReactNode }) {
  return (
    <p className="carta whitespace-pre-wrap text-[18px] leading-[1.65] text-[var(--color-tinta)]">
      {children}
    </p>
  )
}

/** Aviso de error de formulario. Sin iconos de alarma (§1.2). */
export function Aviso({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <p className="rounded-[var(--radius-suave)] bg-[var(--color-acento-tenue)] px-3.5 py-2.5 text-[14px] text-[var(--color-acento-hondo)]">
      {children}
    </p>
  )
}

/** Encabezado de pantalla. */
export function Titulo({ children }: { children: ReactNode }) {
  return <h1 className="carta text-[30px] leading-tight text-[var(--color-tinta)]">{children}</h1>
}

/** Encabezado de sección, discreto y en mayúsculas espaciadas. */
export function Seccion({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--color-tinta-tenue)]">
      {children}
    </h2>
  )
}

/** Texto secundario, para contexto que no compite con lo principal. */
export function Apunte({ children }: { children: ReactNode }) {
  return <p className="text-[14px] leading-relaxed text-[var(--color-tinta-suave)]">{children}</p>
}

/** Cuando no hay nada que mostrar. "Nada" es una respuesta válida (RF-3.6). */
export function Vacio({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-tarjeta)] border border-dashed border-[var(--color-borde)] px-6 py-10 text-center">
      <p className="text-[15px] text-[var(--color-tinta-tenue)]">{children}</p>
    </div>
  )
}

/** Separador con un punto: más suave que una línea de lado a lado. */
export function Separador() {
  return (
    <div className="flex items-center gap-3 py-1" aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--color-borde)]" />
      <span className="size-1 rounded-full bg-[var(--color-borde)]" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--color-borde)]" />
    </div>
  )
}

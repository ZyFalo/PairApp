import Link from "next/link"
import type { ComponentProps, ReactNode } from "react"

/**
 * Componentes propios en lugar de una librería: §8.2 pide identidad visual
 * propia, y un kit genérico haría que la app se pareciera a cualquier otra.
 */

/** Botón principal de una pantalla. Nunca más de uno visible a la vez. */
export function Boton({
  children,
  variante = "solido",
  className = "",
  ...props
}: ComponentProps<"button"> & { variante?: "solido" | "suave" | "texto" }) {
  const estilos = {
    solido: "bg-[--color-acento] text-[#fffdfa] hover:opacity-90",
    suave:
      "bg-[--color-papel] text-[--color-tinta] border border-[--color-borde] hover:bg-[--color-lienzo-hondo]",
    texto: "text-[--color-tinta-suave] hover:text-[--color-tinta]",
  }[variante]

  return (
    <button
      className={`rounded-[--radius-suave] px-5 py-3 text-[15px] transition-opacity duration-200 disabled:opacity-50 ${estilos} ${className}`}
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
      ? "bg-[--color-acento] text-[#fffdfa]"
      : "bg-[--color-papel] text-[--color-tinta] border border-[--color-borde]"
  return (
    <Link
      href={href}
      className={`inline-block rounded-[--radius-suave] px-5 py-3 text-center text-[15px] ${estilos}`}
    >
      {children}
    </Link>
  )
}

/** Campo de formulario con su etiqueta. */
export function Campo({ etiqueta, ...props }: ComponentProps<"input"> & { etiqueta: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] text-[--color-tinta-suave]">{etiqueta}</span>
      <input
        className="w-full rounded-[--radius-suave] border border-[--color-borde] bg-[--color-papel] px-4 py-3 text-[16px] text-[--color-tinta] outline-none focus:border-[--color-acento-suave]"
        {...props}
      />
    </label>
  )
}

/** Superficie de contenido. La base visual de casi todo. */
export function Tarjeta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[--radius-tarjeta] border border-[--color-borde] bg-[--color-papel] p-5 ${className}`}
    >
      {children}
    </div>
  )
}

/** Texto de un mensaje. Serif: se lee como una carta, no como una notificación. */
export function TextoDeCarta({ children }: { children: ReactNode }) {
  return (
    <p className="whitespace-pre-wrap font-[family-name:--font-carta] text-[17px] leading-relaxed text-[--color-tinta]">
      {children}
    </p>
  )
}

/** Aviso de error de formulario. Sin iconos de alarma (§1.2). */
export function Aviso({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p className="text-[14px] text-[--color-acento]">{children}</p>
}

/** Encabezado de pantalla. */
export function Titulo({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-[family-name:--font-carta] text-[26px] text-[--color-tinta]">{children}</h1>
  )
}

/** Texto secundario, para contexto que no compite con lo principal. */
export function Apunte({ children }: { children: ReactNode }) {
  return <p className="text-[14px] leading-relaxed text-[--color-tinta-suave]">{children}</p>
}

/** Cuando no hay nada que mostrar. "Nada" es una respuesta válida (RF-3.6). */
export function Vacio({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-[15px] text-[--color-tinta-tenue]">{children}</p>
}

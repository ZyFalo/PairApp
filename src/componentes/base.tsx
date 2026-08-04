import Link from "next/link"
import type { ComponentProps, ReactNode } from "react"
import type { Icono } from "@/componentes/iconos"

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
      "text-[var(--color-sobre-acento)] bg-gradient-to-b from-[var(--color-acento)] to-[var(--color-acento-hondo)] shadow-[var(--sombra-tinta)] hover:brightness-[1.06]",
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
      ? "text-[var(--color-sobre-acento)] bg-gradient-to-b from-[var(--color-acento)] to-[var(--color-acento-hondo)] shadow-[var(--sombra-tinta)]"
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
export function Seccion({ children, Icono }: { children: ReactNode; Icono?: Icono }) {
  return (
    <h2 className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--color-tinta-tenue)]">
      {Icono && <Icono size={14} className="text-[var(--color-acento-suave)]" />}
      {children}
    </h2>
  )
}

/** Texto secundario, para contexto que no compite con lo principal. */
export function Apunte({ children }: { children: ReactNode }) {
  return <p className="text-[14px] leading-relaxed text-[var(--color-tinta-suave)]">{children}</p>
}

/** Cuando no hay nada que mostrar. "Nada" es una respuesta válida (RF-3.6). */
export function Vacio({ children, Icono }: { children: ReactNode; Icono?: Icono }) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-[var(--radius-tarjeta)] border border-dashed border-[var(--color-borde)] px-6 py-9 text-center">
      {Icono && <Icono size={22} className="text-[var(--color-borde)]" />}
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

/**
 * Pastilla seleccionable, con su icono. La usan las necesidades y las emociones
 * que se adjuntan a una respuesta.
 */
export function Pastilla({
  Icono,
  activa,
  children,
  ...props
}: ComponentProps<"button"> & { Icono?: Icono; activa?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={activa}
      className={`pulsable inline-flex items-center gap-1.5 rounded-[var(--radius-pildora)] px-3.5 py-2 text-[13px] font-medium ${
        activa
          ? "bg-[var(--color-acento)] text-[var(--color-sobre-acento)] shadow-[var(--sombra-tinta)]"
          : "border border-[var(--color-borde)] bg-[var(--color-papel)] text-[var(--color-tinta-suave)] hover:border-[var(--color-acento-suave)]"
      }`}
      {...props}
    >
      {Icono && <Icono size={15} />}
      {children}
    </button>
  )
}

/**
 * Marca de estado, para decir dónde está algo sin gritarlo (§3.17).
 * `viva` la enciende con el acento; apagada es un dato más, no una alerta.
 */
export function Insignia({
  Icono,
  children,
  viva = false,
}: {
  Icono?: Icono
  children: ReactNode
  viva?: boolean
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[var(--radius-pildora)] px-2.5 py-1 text-[12px] font-medium ${
        viva
          ? "bg-[var(--color-acento-tenue)] text-[var(--color-acento-hondo)]"
          : "bg-[var(--color-lienzo-hondo)] text-[var(--color-tinta-tenue)]"
      }`}
    >
      {Icono && <Icono size={13} />}
      {children}
    </span>
  )
}

/**
 * Una vista dentro de una pestaña: la pastilla del cofre y la de Nosotros.
 *
 * Vive aquí porque estaba escrita dos veces, con un comentario que decía
 * "gemelo del que usa el cofre" — que es la señal de que debía existir una sola.
 * Va dentro de `CarrilDeVistas`, que es quien la desplaza a la vista.
 */
export function PastillaDeVista({
  href,
  activa,
  texto,
  Icono,
}: {
  href: string
  activa: boolean
  texto: string
  Icono: Icono
}) {
  return (
    <Link
      href={href}
      aria-current={activa ? "page" : undefined}
      className={`pulsable inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[var(--radius-pildora)] px-3.5 py-2 text-[13px] font-medium ${
        activa
          ? "bg-[var(--color-acento)] text-[var(--color-sobre-acento)] shadow-[var(--sombra-tinta)]"
          : "border border-[var(--color-borde)] bg-[var(--color-papel)] text-[var(--color-tinta-suave)]"
      }`}
    >
      <Icono size={15} />
      {texto}
    </Link>
  )
}

/**
 * Conmutador de un ajuste que se guarda al tocarlo.
 *
 * El estado se lleva aquí y no se espera al servidor: un interruptor que tarda
 * en moverse se toca dos veces. `alGuardar` recibe el valor que la persona
 * acaba de elegir.
 *
 * `explica` es para los ajustes que cambian lo que ve otra persona. En esos, la
 * etiqueta sola nunca basta: hay que decir qué pasa al encenderlo.
 */
export function Interruptor({
  etiqueta,
  explica,
  activo,
  alGuardar,
}: {
  etiqueta: string
  explica?: string
  activo: boolean
  alGuardar: (activo: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span className="space-y-1">
        <span className="block text-[14.5px] text-[var(--color-tinta)]">{etiqueta}</span>
        {explica && (
          <span className="block text-[12.5px] leading-relaxed text-[var(--color-tinta-tenue)]">
            {explica}
          </span>
        )}
      </span>
      <input
        type="checkbox"
        checked={activo}
        onChange={(e) => alGuardar(e.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
          activo ? "bg-[var(--color-acento)]" : "bg-[var(--color-borde)]"
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-[var(--color-papel-alto)] shadow-[var(--sombra-papel)] transition-[left] duration-300 ${
            activo ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </label>
  )
}

/**
 * Desplegable con la misma piel que los campos de texto.
 * Con `valor` y `onCambio` va controlado; sin ellos, a su aire.
 */
export function Seleccion({
  etiqueta,
  name,
  opciones,
  valorInicial,
  valor,
  onCambio,
}: {
  etiqueta: string
  name: string
  opciones: { valor: string; texto: string }[]
  valorInicial?: string
  valor?: string
  onCambio?: (valor: string) => void
}) {
  const controlado = valor !== undefined && onCambio !== undefined

  return (
    <label className="block">
      <span className="mb-2 block text-[12.5px] font-medium uppercase tracking-[0.08em] text-[var(--color-tinta-tenue)]">
        {etiqueta}
      </span>
      <select
        name={name}
        {...(controlado
          ? { value: valor, onChange: (e) => onCambio(e.target.value) }
          : { defaultValue: valorInicial ?? opciones[0]?.valor })}
        className="w-full rounded-[var(--radius-suave)] border border-[var(--color-borde)] bg-[var(--color-papel)] px-4 py-3 text-[16px] text-[var(--color-tinta)] outline-none transition-colors focus:border-[var(--color-acento-suave)]"
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
    </label>
  )
}

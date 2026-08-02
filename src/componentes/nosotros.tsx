"use client"

import { RiCloseLine, RiDeleteBin6Line, RiSparkling2Line } from "@remixicon/react"
import { useActionState, useEffect, useState, useTransition } from "react"
import { Apunte, Aviso, Boton, Campo, Tarjeta } from "@/componentes/base"
import { borrarEvento, crearEvento, dedicarCancion, pedirOnceOnce } from "@/lib/acciones/nosotros"

/**
 * Los 11:11 (M12). Cuatro minutos de gracia; si se pasa, el aviso desaparece
 * sin dejar rastro ni mención. Sin rachas ni contadores (RF-12.7).
 */
export function VentanaOnceOnce() {
  const [estado, accion, pendiente] = useActionState(pedirOnceOnce, {})
  const [texto, setTexto] = useState("")

  if (estado.ok) return null

  return (
    <Tarjeta alzada className="aparece space-y-3">
      <p className="flex items-center justify-center gap-2 carta text-[19px]">
        <RiSparkling2Line size={18} className="text-[var(--color-contigo)]" />
        11:11
      </p>
      <form action={accion} className="space-y-3">
        <textarea
          name="texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value.slice(0, 140))}
          rows={2}
          placeholder="Pide un deseo…"
          aria-label="Tu deseo"
          className="carta w-full resize-none rounded-[var(--radius-suave)] border border-[var(--color-borde)] bg-[var(--color-lienzo)] p-3 text-[16px] outline-none transition-colors focus:border-[var(--color-acento-suave)]"
        />
        <div className="flex items-center justify-between">
          <Apunte>{140 - texto.length} caracteres</Apunte>
          <Boton type="submit" disabled={pendiente || !texto.trim()}>
            Pedir
          </Boton>
        </div>
        <Aviso>{estado.error}</Aviso>
      </form>
    </Tarjeta>
  )
}

/** Cuánto antes avisar de un plan (RF-7.2). "Sin aviso" es una opción legítima. */
const AVISOS = [
  { valor: "", texto: "Sin aviso" },
  { valor: "1", texto: "1 hora antes" },
  { valor: "3", texto: "3 horas antes" },
  { valor: "24", texto: "El día antes" },
]

/** Añadir un plan al calendario compartido (RF-7.1). */
export function FormularioEvento() {
  const [estado, accion, pendiente] = useActionState(crearEvento, {})
  const [abierto, setAbierto] = useState(false)

  // Cerrar al guardar: dejar el formulario abierto invita a repetir sin querer.
  useEffect(() => {
    if (estado.ok) setAbierto(false)
  }, [estado.ok])

  if (!abierto) {
    return (
      <Boton variante="suave" onClick={() => setAbierto(true)} className="w-full">
        Añadir un plan
      </Boton>
    )
  }

  return (
    <Tarjeta className="aparece">
      <form action={accion} className="space-y-3">
        <Campo etiqueta="Qué" name="titulo" required maxLength={120} autoFocus />
        <Campo etiqueta="Cuándo" name="inicio" type="datetime-local" required />

        <Seleccion etiqueta="Avisarme" name="avisoHoras" opciones={AVISOS} />

        <label className="block">
          <span className="mb-2 block text-[12.5px] font-medium uppercase tracking-[0.08em] text-[var(--color-tinta-tenue)]">
            Nota (opcional)
          </span>
          <textarea
            name="notas"
            rows={2}
            maxLength={2000}
            placeholder="Dónde, con quién, qué llevar…"
            className="w-full resize-none rounded-[var(--radius-suave)] border border-[var(--color-borde)] bg-[var(--color-papel)] p-3 text-[15px] outline-none transition-colors focus:border-[var(--color-acento-suave)]"
          />
        </label>

        <label className="flex items-center gap-2 text-[14px] text-[var(--color-tinta-suave)]">
          <input
            type="checkbox"
            name="esDePareja"
            value="true"
            defaultChecked
            className="accent-[var(--color-acento)]"
          />
          Es un plan de los dos
        </label>

        <Aviso>{estado.error}</Aviso>
        <div className="flex gap-2">
          <Boton type="submit" disabled={pendiente} className="flex-1">
            {pendiente ? "Guardando…" : "Guardar"}
          </Boton>
          <Boton variante="texto" type="button" onClick={() => setAbierto(false)}>
            Cancelar
          </Boton>
        </div>
      </form>
    </Tarjeta>
  )
}

/**
 * Quitar un plan. Pide confirmación en la propia fila en vez de abrir un
 * diálogo: un modal para borrar una cena es desproporcionado.
 */
export function BotonBorrarEvento({ id, titulo }: { id: string; titulo: string }) {
  const [confirmando, setConfirmando] = useState(false)
  const [, empezar] = useTransition()

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        aria-label={`Quitar ${titulo}`}
        className="pulsable shrink-0 rounded-full p-1.5 text-[var(--color-borde)] hover:text-[var(--color-acento)]"
      >
        <RiDeleteBin6Line size={16} />
      </button>
    )
  }

  return (
    <span className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={() => empezar(() => void borrarEvento(id))}
        className="pulsable rounded-[var(--radius-pildora)] bg-[var(--color-acento-tenue)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-acento-hondo)]"
      >
        Quitar
      </button>
      <button
        type="button"
        onClick={() => setConfirmando(false)}
        aria-label="Cancelar"
        className="pulsable rounded-full p-1 text-[var(--color-tinta-tenue)]"
      >
        <RiCloseLine size={15} />
      </button>
    </span>
  )
}

/** Cuándo entregar una dedicatoria (RF-8.1). */
const FRANJAS = [
  { valor: "MANANA", texto: "Por la mañana" },
  { valor: "TARDE", texto: "Media tarde" },
  { valor: "NOCHE", texto: "Por la noche" },
]

/** Dedicar una canción por enlace pegado (RF-8.2). Sin API ni OAuth. */
export function FormularioCancion() {
  const [estado, accion, pendiente] = useActionState(dedicarCancion, {})
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    if (estado.ok) setAbierto(false)
  }, [estado.ok])

  if (!abierto) {
    return (
      <Boton variante="suave" onClick={() => setAbierto(true)} className="w-full">
        Dedicar una canción
      </Boton>
    )
  }

  return (
    <Tarjeta className="aparece">
      <form action={accion} className="space-y-3">
        <Campo
          etiqueta="Enlace (YouTube, Spotify…)"
          name="url"
          type="url"
          required
          autoFocus
          placeholder="https://"
        />
        <Campo etiqueta="Dedicatoria (opcional)" name="mensaje" maxLength={500} />
        <Seleccion
          etiqueta="¿Cuándo le llega?"
          name="franja"
          opciones={FRANJAS}
          valorInicial="TARDE"
        />
        <Aviso>{estado.error}</Aviso>
        <div className="flex gap-2">
          <Boton type="submit" disabled={pendiente} className="flex-1">
            {pendiente ? "Dedicando…" : "Dedicar"}
          </Boton>
          <Boton variante="texto" type="button" onClick={() => setAbierto(false)}>
            Cancelar
          </Boton>
        </div>
      </form>
    </Tarjeta>
  )
}

/** Desplegable con la misma piel que los campos de texto. */
export function Seleccion({
  etiqueta,
  name,
  opciones,
  valorInicial,
}: {
  etiqueta: string
  name: string
  opciones: { valor: string; texto: string }[]
  valorInicial?: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[12.5px] font-medium uppercase tracking-[0.08em] text-[var(--color-tinta-tenue)]">
        {etiqueta}
      </span>
      <select
        name={name}
        defaultValue={valorInicial ?? opciones[0]?.valor}
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

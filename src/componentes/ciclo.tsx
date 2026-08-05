"use client"

import { RiLockLine } from "@remixicon/react"
import { useActionState, useEffect, useState } from "react"
import { Aviso, Boton, Campo, Seleccion, Tarjeta } from "@/componentes/base"
import { cambiarVisibilidadCiclo, registrarCiclo } from "@/lib/acciones/nosotros"
import { useEnfoqueQuieto } from "@/lib/enfoque"

/**
 * Registro de ciclo (M5).
 *
 * El módulo está invertido a propósito: la app no le dice a nadie cómo está la
 * otra persona. Ella decide qué comparte (RF-5.3) y escribe con sus palabras
 * qué le sirve. Los síntomas no salen de aquí nunca.
 */

/** Qué comparto de mi periodo (RF-5.3). */
const VISIBILIDADES = [
  { valor: "NADA", texto: "Nada" },
  { valor: "SOLO_FECHAS", texto: "Solo las fechas" },
  { valor: "FECHAS_Y_NOTA", texto: "Las fechas y una nota mía" },
]

const EJEMPLO_NOTA = "Por ejemplo: no me preguntes si estoy bien, solo trae té y pon una peli."

/**
 * Registro de periodo (M5). Ella elige qué comparte y escribe con sus palabras
 * qué le sirve — la app nunca traduce eso a una etiqueta de "sensible" (RF-5.4).
 */
export function FormularioCiclo() {
  const enfocar = useEnfoqueQuieto<HTMLInputElement>()
  const [estado, accion, pendiente] = useActionState(registrarCiclo, {})
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    if (estado.ok) setAbierto(false)
  }, [estado.ok])

  if (!abierto) {
    return (
      <Boton variante="suave" onClick={() => setAbierto(true)} className="w-full">
        Registrar periodo
      </Boton>
    )
  }

  return (
    <Tarjeta className="aparece">
      <form action={accion} className="space-y-3">
        <Campo etiqueta="Primer día" name="inicio" type="date" required ref={enfocar} />
        <Campo etiqueta="Último día (opcional)" name="fin" type="date" />

        <Seleccion
          etiqueta="¿Qué compartes?"
          name="nivelVisibilidad"
          opciones={VISIBILIDADES}
          valorInicial="SOLO_FECHAS"
        />

        <label className="block">
          <span className="mb-2 block text-[12.5px] font-medium uppercase tracking-[0.08em] text-[var(--color-tinta-tenue)]">
            Qué te sirve estos días
          </span>
          <textarea
            name="notaParaPareja"
            rows={3}
            maxLength={1000}
            placeholder={EJEMPLO_NOTA}
            className="carta w-full resize-none rounded-[var(--radius-suave)] border border-[var(--color-borde)] bg-[var(--color-papel)] p-3 text-[16px] outline-none transition-colors focus:border-[var(--color-acento-suave)]"
          />
          <span className="mt-1.5 block text-[12.5px] text-[var(--color-tinta-tenue)]">
            Solo lo verá si eliges compartir la nota.
          </span>
        </label>

        <Sintomas />

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

/** Las tres escalas de RF-5.1. Ninguna es obligatoria. */
const ESCALAS = [
  { nombre: "dolor", texto: "Dolor", flojo: "nada", fuerte: "mucho" },
  { nombre: "energia", texto: "Energía", flojo: "por el suelo", fuerte: "normal" },
  { nombre: "sueno", texto: "Sueño", flojo: "fatal", fuerte: "bien" },
]

/**
 * Síntomas opcionales (RF-5.1), plegados hasta que se piden.
 *
 * Van bajo llave a propósito: **no se comparten nunca**, ni con el nivel más
 * abierto de RF-5.3. Son para mirar el propio historial. Si se los diera a la
 * pareja, esto pasaría de ser un diario a ser un panel desde el que deducir
 * cómo está ella — que es justo lo que §M5 evita.
 */
function Sintomas() {
  const [abierto, setAbierto] = useState(false)

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="pulsable text-[13px] text-[var(--color-tinta-tenue)] hover:text-[var(--color-acento)]"
      >
        Apuntar cómo te sientes (opcional)
      </button>
    )
  }

  return (
    <div className="aparece space-y-3 rounded-[var(--radius-suave)] bg-[var(--color-lienzo)] p-3">
      <p className="flex items-center gap-1.5 text-[12.5px] text-[var(--color-tinta-tenue)]">
        <RiLockLine size={13} />
        Esto no se comparte nunca. Es para ti.
      </p>

      {ESCALAS.map((e) => (
        <label key={e.nombre} className="block">
          <span className="mb-1 flex items-center justify-between text-[13px] text-[var(--color-tinta-suave)]">
            {e.texto}
            <span className="text-[11.5px] text-[var(--color-tinta-tenue)]">
              {e.flojo} → {e.fuerte}
            </span>
          </span>
          <input type="range" name={e.nombre} min={1} max={5} defaultValue={3} className="w-full" />
        </label>
      ))}

      <label className="flex items-center gap-2 text-[14px] text-[var(--color-tinta-suave)]">
        <input
          type="checkbox"
          name="antojos"
          value="true"
          className="accent-[var(--color-acento)]"
        />
        Antojos
      </label>
    </div>
  )
}

/**
 * Cambiar qué se comparte de un periodo ya registrado. Sin esto la primera
 * decisión sería para siempre, y eso empuja a no compartir nada (RF-5.3).
 */
export function CambiarVisibilidadCiclo({
  cicloId,
  nivelActual,
  notaActual,
}: {
  cicloId: string
  nivelActual: string
  notaActual: string | null
}) {
  const [estado, accion, pendiente] = useActionState(cambiarVisibilidadCiclo, {})
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    if (estado.ok) setAbierto(false)
  }, [estado.ok])

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="pulsable text-[13px] text-[var(--color-acento)]"
      >
        Cambiar qué comparto
      </button>
    )
  }

  return (
    <form action={accion} className="aparece space-y-3 pt-1">
      <input type="hidden" name="cicloId" value={cicloId} />
      <Seleccion
        etiqueta="¿Qué compartes?"
        name="nivelVisibilidad"
        opciones={VISIBILIDADES}
        valorInicial={nivelActual}
      />
      <textarea
        name="notaParaPareja"
        rows={3}
        maxLength={1000}
        defaultValue={notaActual ?? ""}
        placeholder={EJEMPLO_NOTA}
        aria-label="Qué te sirve estos días"
        className="carta w-full resize-none rounded-[var(--radius-suave)] border border-[var(--color-borde)] bg-[var(--color-papel)] p-3 text-[16px] outline-none transition-colors focus:border-[var(--color-acento-suave)]"
      />
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
  )
}

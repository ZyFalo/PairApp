"use client"

import { RiDeleteBin6Line, RiDiceLine, RiLockLine, RiLockUnlockLine } from "@remixicon/react"
import { useActionState, useEffect, useState, useTransition } from "react"
import { Apunte, Aviso, Boton, Campo, Insignia, Pastilla, Tarjeta } from "@/componentes/base"
import { Seleccion } from "@/componentes/nosotros"
import type { EstadoTitulo } from "@/generated/prisma/enums"
import {
  alternarSoloJuntos,
  anadirTitulo,
  borrarRecuerdo,
  borrarTitulo,
  cambiarEstadoTitulo,
  crearRecuerdo,
  votarTitulo,
} from "@/lib/acciones/juntos"
import { useBorrador } from "@/lib/borrador"
import { ESTADOS_TITULO, elegirParaEstaNoche, type Sorteable } from "@/lib/motor/juntos"

const TIPOS = [
  { valor: "PELICULA", texto: "Película" },
  { valor: "SERIE", texto: "Serie" },
]

/** Añadir algo a la lista compartida (RF-9.1). */
export function FormularioTitulo() {
  const [estado, accion, pendiente] = useActionState(anadirTitulo, {})
  const [borrador, actualizar, olvidar] = useBorrador("titulo", {
    abierto: false,
    nombre: "",
    tipo: "PELICULA",
    minutos: "",
    soloJuntos: false,
  })

  useEffect(() => {
    if (estado.ok) olvidar()
  }, [estado.ok, olvidar])

  if (!borrador.abierto) {
    return (
      <Boton variante="suave" onClick={() => actualizar({ abierto: true })} className="w-full">
        Añadir algo
      </Boton>
    )
  }

  return (
    <Tarjeta className="aparece">
      <form action={accion} className="space-y-3">
        <Campo
          etiqueta="Qué"
          name="nombre"
          required
          maxLength={200}
          autoFocus
          value={borrador.nombre}
          onChange={(e) => actualizar({ nombre: e.target.value })}
        />
        <Seleccion
          etiqueta="Tipo"
          name="tipo"
          opciones={TIPOS}
          valor={borrador.tipo}
          onCambio={(v) => actualizar({ tipo: v })}
        />
        <Campo
          etiqueta="Cuánto dura, en minutos (opcional)"
          name="minutos"
          type="number"
          min={1}
          max={1000}
          value={borrador.minutos}
          onChange={(e) => actualizar({ minutos: e.target.value })}
        />
        <label className="flex items-start gap-2.5 text-[14px] text-[var(--color-tinta-suave)]">
          <input
            type="checkbox"
            name="soloJuntos"
            value="true"
            checked={borrador.soloJuntos}
            onChange={(e) => actualizar({ soloJuntos: e.target.checked })}
            className="mt-1 accent-[var(--color-acento)]"
          />
          <span>Esta no la vemos por separado</span>
        </label>
        <Aviso>{estado.error}</Aviso>
        <div className="flex gap-2">
          <Boton type="submit" disabled={pendiente} className="flex-1">
            {pendiente ? "Guardando…" : "Añadir"}
          </Boton>
          <Boton variante="texto" type="button" onClick={olvidar}>
            Cancelar
          </Boton>
        </div>
      </form>
    </Tarjeta>
  )
}

/**
 * El selector de las noches en que nadie decide (RF-9.7).
 *
 * El azar se echa aquí, en el navegador, y se le pasa a una función pura que
 * sí está probada: así "elige al azar" no acaba siendo "elige la primera".
 */
export function EligeTu({ candidatas }: { candidatas: (Sorteable & { nombre: string })[] }) {
  const [elegida, setElegida] = useState<string | null>(null)
  const [tope, setTope] = useState<number | undefined>(undefined)

  const hayPorVer = candidatas.some((c) => c.estado === "POR_VER")
  if (!hayPorVer) return null

  return (
    <Tarjeta className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Apunte>Como mucho</Apunte>
        {[90, 120, undefined].map((minutos) => (
          <Pastilla
            key={minutos ?? "todo"}
            activa={tope === minutos}
            onClick={() => setTope(minutos)}
          >
            {minutos ? `${minutos} min` : "lo que sea"}
          </Pastilla>
        ))}
      </div>

      <Boton
        variante="suave"
        className="w-full"
        onClick={() => {
          const salida = elegirParaEstaNoche(candidatas, Math.random(), tope)
          setElegida(salida ? salida.nombre : "Nada de esa duración por ver")
        }}
      >
        <span className="inline-flex items-center gap-2">
          <RiDiceLine size={17} />
          Elige tú por nosotros
        </span>
      </Boton>

      {elegida && <p className="carta text-center text-[19px]">{elegida}</p>}
    </Tarjeta>
  )
}

/** Una fila de la lista, con todo lo que se puede hacer con ella. */
export function FilaTitulo({
  id,
  nombre,
  estado,
  tipo,
  soloJuntos,
  loPropuseYo,
  nombrePareja,
  miVoto,
  suVoto,
}: {
  id: string
  nombre: string
  estado: EstadoTitulo
  tipo: string
  soloJuntos: boolean
  loPropuseYo: boolean
  nombrePareja: string | null
  miVoto: { puntuacion: number; comentario: string | null } | null
  suVoto: { puntuacion: number; comentario: string | null } | null
}) {
  const [, empezar] = useTransition()
  const [votando, setVotando] = useState(false)

  return (
    <Tarjeta className="aparece space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-[16px]">{nombre}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Apunte>
              {tipo === "SERIE" ? "Serie" : "Película"} ·{" "}
              {loPropuseYo ? "la propusiste tú" : `la propuso ${nombrePareja ?? "ella"}`}
            </Apunte>
            {soloJuntos && <Insignia Icono={RiLockLine}>Solo juntos</Insignia>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => empezar(() => void borrarTitulo(id))}
          aria-label={`Quitar ${nombre}`}
          className="pulsable shrink-0 rounded-full p-1.5 text-[var(--color-borde)] hover:text-[var(--color-acento)]"
        >
          <RiDeleteBin6Line size={16} />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ESTADOS_TITULO.map((e) => (
          <Pastilla
            key={e.estado}
            activa={estado === e.estado}
            onClick={() => empezar(() => void cambiarEstadoTitulo(id, e.estado))}
          >
            {e.texto}
          </Pastilla>
        ))}
      </div>

      {/* "No la veas sin mí" (RF-9.5). Suena tonto y evita discusiones reales. */}
      <button
        type="button"
        onClick={() => empezar(() => void alternarSoloJuntos(id, !soloJuntos))}
        className="pulsable inline-flex items-center gap-1.5 text-[12.5px] text-[var(--color-tinta-tenue)] hover:text-[var(--color-acento)]"
      >
        {soloJuntos ? <RiLockUnlockLine size={14} /> : <RiLockLine size={14} />}
        {soloJuntos ? "Se puede ver por separado" : "No verla por separado"}
      </button>

      {(estado === "VISTA" || miVoto || suVoto) && (
        <div className="space-y-2 border-[var(--color-borde-suave)] border-t pt-3">
          <Voto etiqueta="Tú" voto={miVoto} />
          <Voto etiqueta={nombrePareja ?? "Ella"} voto={suVoto} />
          {votando ? (
            <FormularioVoto tituloId={id} inicial={miVoto} onListo={() => setVotando(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setVotando(true)}
              className="pulsable text-[13px] text-[var(--color-acento)]"
            >
              {miVoto ? "Cambiar lo tuyo" : "Poner nota"}
            </button>
          )}
        </div>
      )}
    </Tarjeta>
  )
}

/** Lo que le pareció a uno. Nunca se promedian: la gracia es que difieran. */
function Voto({
  etiqueta,
  voto,
}: {
  etiqueta: string
  voto: { puntuacion: number; comentario: string | null } | null
}) {
  if (!voto) return null
  return (
    <div className="text-[14px]">
      <span className="text-[var(--color-tinta-tenue)]">{etiqueta}: </span>
      <span className="tabular-nums text-[var(--color-acento)]">{voto.puntuacion}/5</span>
      {voto.comentario && (
        <span className="text-[var(--color-tinta-suave)]"> — {voto.comentario}</span>
      )}
    </div>
  )
}

function FormularioVoto({
  tituloId,
  inicial,
  onListo,
}: {
  tituloId: string
  inicial: { puntuacion: number; comentario: string | null } | null
  onListo: () => void
}) {
  const [puntuacion, setPuntuacion] = useState(inicial?.puntuacion ?? 4)
  const [comentario, setComentario] = useState(inicial?.comentario ?? "")
  const [ocupado, empezar] = useTransition()

  return (
    <div className="aparece space-y-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Pastilla key={n} activa={puntuacion === n} onClick={() => setPuntuacion(n)}>
            {n}
          </Pastilla>
        ))}
      </div>
      <input
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        maxLength={500}
        placeholder="Una línea, si quieres"
        aria-label="Tu comentario"
        className="w-full rounded-[var(--radius-suave)] border border-[var(--color-borde)] bg-[var(--color-papel)] px-3 py-2 text-[15px] outline-none focus:border-[var(--color-acento-suave)]"
      />
      <div className="flex gap-2">
        <Boton
          disabled={ocupado}
          onClick={() =>
            empezar(async () => {
              await votarTitulo(tituloId, puntuacion, comentario)
              onListo()
            })
          }
        >
          Guardar
        </Boton>
        <Boton variante="texto" onClick={onListo}>
          Cancelar
        </Boton>
      </div>
    </div>
  )
}

/** Guardar un momento que merece quedarse (RF-11.1). */
export function FormularioRecuerdo() {
  const [estado, accion, pendiente] = useActionState(crearRecuerdo, {})
  const [borrador, actualizar, olvidar] = useBorrador("recuerdo", {
    abierto: false,
    titulo: "",
    nota: "",
    ocurrioEl: "",
  })

  useEffect(() => {
    if (estado.ok) olvidar()
  }, [estado.ok, olvidar])

  if (!borrador.abierto) {
    return (
      <Boton variante="suave" onClick={() => actualizar({ abierto: true })} className="w-full">
        Guardar un recuerdo
      </Boton>
    )
  }

  return (
    <Tarjeta className="aparece">
      <form action={accion} className="space-y-3">
        <Campo
          etiqueta="Qué pasó"
          name="titulo"
          required
          maxLength={200}
          autoFocus
          value={borrador.titulo}
          onChange={(e) => actualizar({ titulo: e.target.value })}
        />
        <Campo
          etiqueta="Cuándo"
          name="ocurrioEl"
          type="date"
          required
          value={borrador.ocurrioEl}
          onChange={(e) => actualizar({ ocurrioEl: e.target.value })}
        />
        <label className="block">
          <span className="mb-2 block text-[12.5px] font-medium uppercase tracking-[0.08em] text-[var(--color-tinta-tenue)]">
            Cómo lo recuerdas (opcional)
          </span>
          <textarea
            name="nota"
            rows={3}
            maxLength={2000}
            value={borrador.nota}
            onChange={(e) => actualizar({ nota: e.target.value })}
            className="carta w-full resize-none rounded-[var(--radius-suave)] border border-[var(--color-borde)] bg-[var(--color-papel)] p-3 text-[16px] outline-none focus:border-[var(--color-acento-suave)]"
          />
        </label>
        <Aviso>{estado.error}</Aviso>
        <div className="flex gap-2">
          <Boton type="submit" disabled={pendiente} className="flex-1">
            {pendiente ? "Guardando…" : "Guardar"}
          </Boton>
          <Boton variante="texto" type="button" onClick={olvidar}>
            Cancelar
          </Boton>
        </div>
      </form>
    </Tarjeta>
  )
}

/** Quitar un recuerdo. */
export function BotonBorrarRecuerdo({ id, titulo }: { id: string; titulo: string }) {
  const [, empezar] = useTransition()

  return (
    <button
      type="button"
      onClick={() => empezar(() => void borrarRecuerdo(id))}
      aria-label={`Quitar ${titulo}`}
      className="pulsable shrink-0 rounded-full p-1.5 text-[var(--color-borde)] hover:text-[var(--color-acento)]"
    >
      <RiDeleteBin6Line size={16} />
    </button>
  )
}

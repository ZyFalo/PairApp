"use client"

import { RiFilmLine, RiSearchLine } from "@remixicon/react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Apunte, Boton, Campo, Tarjeta } from "@/componentes/base"
import { anadirDesdeTmdb, buscarEnTmdb } from "@/lib/acciones/juntos"
import type { Candidato } from "@/lib/tmdb"

/**
 * Buscar una serie o película y añadirla con su póster (RF-9.6).
 *
 * **Solo aparece si hay clave de TMDB.** Sin ella la pantalla enseña el
 * formulario de siempre y se escribe a mano: una integración opcional no puede
 * quitar una función que ya funcionaba.
 *
 * Se busca al pulsar y no al teclear. Un buscador que dispara en cada letra
 * gasta ocho llamadas para encontrar una película, y aquí no hay ninguna prisa
 * que lo justifique.
 */
export function BuscarTitulo() {
  const router = useRouter()
  const [consulta, setConsulta] = useState("")
  const [resultados, setResultados] = useState<Candidato[] | null>(null)
  const [buscando, empezarBusqueda] = useTransition()
  const [anadiendo, empezarAlta] = useTransition()

  function buscar() {
    if (consulta.trim().length < 2) return
    empezarBusqueda(async () => setResultados(await buscarEnTmdb(consulta)))
  }

  function anadir(c: Candidato) {
    empezarAlta(async () => {
      await anadirDesdeTmdb(c.tmdbId, c.tipo, {
        nombre: c.nombre,
        anio: c.anio,
        posterUrl: c.posterUrl,
      })
      setResultados(null)
      setConsulta("")
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Campo
            etiqueta="Buscar"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                buscar()
              }
            }}
            placeholder="Nombre de la serie o película…"
          />
        </div>
        <Boton variante="suave" onClick={buscar} disabled={buscando || consulta.trim().length < 2}>
          <RiSearchLine size={17} />
        </Boton>
      </div>

      {buscando && <Apunte>Buscando…</Apunte>}

      {/* Que no haya resultados es una respuesta, no un error: se escribe a
          mano con el formulario de abajo y ya está. */}
      {resultados?.length === 0 && !buscando && (
        <Apunte>Nada con ese nombre. Puedes escribirlo a mano.</Apunte>
      )}

      {resultados && resultados.length > 0 && (
        <ul className="space-y-2">
          {resultados.map((c) => (
            <li key={`${c.tipo}-${c.tmdbId}`}>
              <button
                type="button"
                disabled={anadiendo}
                onClick={() => anadir(c)}
                className="pulsable w-full text-left"
              >
                <Tarjeta className="flex items-center gap-3">
                  {c.posterUrl ? (
                    // biome-ignore lint/performance/noImgElement: póster externo, sin optimización
                    <img
                      src={c.posterUrl}
                      alt=""
                      className="h-16 w-11 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <span className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-[var(--color-lienzo-hondo)]">
                      <RiFilmLine size={16} className="text-[var(--color-tinta-tenue)]" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px]">{c.nombre}</span>
                    <Apunte>
                      {c.tipo === "SERIE" ? "Serie" : "Película"}
                      {c.anio ? ` · ${c.anio}` : ""}
                    </Apunte>
                  </span>
                </Tarjeta>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

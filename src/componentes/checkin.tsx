"use client"

import { useActionState, useState } from "react"
import { Apunte, Aviso, Boton } from "@/componentes/base"
import type { Emocion, GrupoEmocion } from "@/generated/prisma/enums"
import { registrarCheckin } from "@/lib/acciones/bucle"
import { EMOCIONES, etiquetaDe, ficha, ORDEN_GRUPOS, TITULO_GRUPO } from "@/lib/motor/emociones"
import { Compositor } from "./compositor"

const FONDO_GRUPO: Record<GrupoEmocion, string> = {
  ESTOY_CONTIGO: "bg-[--color-contigo-fondo]",
  ME_FALTA_ALGO: "bg-[--color-falta-fondo]",
  ALGO_PASO: "bg-[--color-paso-fondo]",
}

/**
 * La pantalla de check-in (§M1.1.2): los tres grupos a la vez, un toque y listo.
 * El ojo elige zona antes de leer palabras, así que nunca se comparan nueve
 * opciones entre sí.
 */
export function Checkin({
  genero,
  nombrePareja,
  ultimaEmocion,
}: {
  genero: "MASCULINO" | "FEMENINO" | "NEUTRO"
  nombrePareja: string | null
  ultimaEmocion: Emocion | null
}) {
  const [estado, accion, pendiente] = useActionState(registrarCheckin, {})
  const [intensidad, setIntensidad] = useState(3)
  const [elegida, setElegida] = useState<Emocion | null>(null)

  // Tras registrar, se ofrece dejar algo. Nunca antes: el mensaje es opcional.
  if (estado.checkinId && elegida) {
    return <Compositor checkinId={estado.checkinId} emocion={elegida} nombrePareja={nombrePareja} />
  }

  return (
    <section className="aparece space-y-6">
      <h2 className="font-[family-name:--font-carta] text-[22px]">
        ¿Cómo estás{nombrePareja ? ` con ${nombrePareja}` : ""}?
      </h2>

      <form action={accion} className="space-y-5">
        <input type="hidden" name="intensidad" value={intensidad} />
        <input type="hidden" name="emocion" value={elegida ?? ""} />

        {ORDEN_GRUPOS.map((grupo) => (
          <div key={grupo} className={`rounded-[--radius-tarjeta] p-3 ${FONDO_GRUPO[grupo]}`}>
            <p className="mb-2 px-1 text-[12px] uppercase tracking-wider text-[--color-tinta-suave]">
              {TITULO_GRUPO[grupo]}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {EMOCIONES.filter((f) => f.grupo === grupo).map((f) => {
                const activa = elegida === f.emocion
                return (
                  <button
                    key={f.emocion}
                    type="button"
                    onClick={() => setElegida(f.emocion)}
                    className={`flex flex-col items-center gap-1 rounded-[--radius-suave] px-2 py-3 text-[12px] leading-tight transition-colors duration-200 ${
                      activa
                        ? "bg-[--color-papel] text-[--color-tinta] ring-2 ring-[--color-acento]"
                        : "bg-[--color-papel]/60 text-[--color-tinta-suave]"
                    }`}
                  >
                    <span className="text-[22px]">{f.icono}</span>
                    <span>{etiquetaDe(f.emocion, genero)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* La intensidad no se pregunta: aparece solo si la buscas (RF-1.1.5) */}
        {elegida && (
          <div className="aparece space-y-2">
            <div className="flex items-center justify-between">
              <Apunte>Intensidad</Apunte>
              <span className="text-[13px] text-[--color-tinta-suave]">{intensidad} de 5</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={intensidad}
              onChange={(e) => setIntensidad(Number(e.target.value))}
              className="w-full accent-[--color-acento]"
            />
          </div>
        )}

        <Aviso>{estado.error}</Aviso>

        <Boton type="submit" disabled={!elegida || pendiente} className="w-full">
          {pendiente
            ? "Guardando…"
            : elegida
              ? `Registrar: ${etiquetaDe(elegida, genero)}`
              : "Elige cómo estás"}
        </Boton>

        {ultimaEmocion && !elegida && (
          <button
            type="button"
            onClick={() => setElegida(ultimaEmocion)}
            className="w-full text-center text-[13px] text-[--color-tinta-tenue]"
          >
            ↺ Igual que la última vez · {ficha(ultimaEmocion).icono}{" "}
            {etiquetaDe(ultimaEmocion, genero)}
          </button>
        )}
      </form>
    </section>
  )
}

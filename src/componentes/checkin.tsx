"use client"

import { AnimatePresence, motion } from "motion/react"
import { useActionState, useState } from "react"
import { Apunte, Aviso, Boton } from "@/componentes/base"
import type { Emocion, GrupoEmocion } from "@/generated/prisma/enums"
import { registrarCheckin } from "@/lib/acciones/bucle"
import { EMOCIONES, etiquetaDe, ficha, ORDEN_GRUPOS, TITULO_GRUPO } from "@/lib/motor/emociones"
import { Compositor } from "./compositor"

/** Cada familia tiene su propia temperatura de color, ninguna en alarma (§M1.1.2). */
const ESTILO_GRUPO: Record<GrupoEmocion, { fondo: string; borde: string; punto: string }> = {
  ESTOY_CONTIGO: {
    fondo: "bg-[var(--color-contigo-fondo)]",
    borde: "border-[var(--color-contigo-borde)]",
    punto: "bg-[var(--color-contigo)]",
  },
  ME_FALTA_ALGO: {
    fondo: "bg-[var(--color-falta-fondo)]",
    borde: "border-[var(--color-falta-borde)]",
    punto: "bg-[var(--color-falta)]",
  },
  ALGO_PASO: {
    fondo: "bg-[var(--color-paso-fondo)]",
    borde: "border-[var(--color-paso-borde)]",
    punto: "bg-[var(--color-paso)]",
  },
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
    <section className="space-y-6">
      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
        className="carta text-[25px] leading-snug"
      >
        ¿Cómo estás{nombrePareja ? ` con ${nombrePareja}` : ""}?
      </motion.h2>

      <form action={accion} className="space-y-5">
        <input type="hidden" name="intensidad" value={intensidad} />
        <input type="hidden" name="emocion" value={elegida ?? ""} />

        {ORDEN_GRUPOS.map((grupo, indiceGrupo) => {
          const estilo = ESTILO_GRUPO[grupo]
          return (
            <motion.div
              key={grupo}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.55,
                delay: 0.08 + indiceGrupo * 0.09,
                ease: [0.22, 0.61, 0.36, 1],
              }}
              className={`rounded-[var(--radius-tarjeta)] border ${estilo.borde} ${estilo.fondo} p-3.5`}
            >
              <div className="mb-2.5 flex items-center gap-2 px-1">
                <span className={`size-1.5 rounded-full ${estilo.punto}`} />
                <span className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-[var(--color-tinta-suave)]">
                  {TITULO_GRUPO[grupo]}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {EMOCIONES.filter((f) => f.grupo === grupo).map((f) => {
                  const activa = elegida === f.emocion
                  return (
                    <motion.button
                      key={f.emocion}
                      type="button"
                      onClick={() => setElegida(f.emocion)}
                      whileTap={{ scale: 0.94 }}
                      className={`relative flex flex-col items-center gap-1.5 rounded-[var(--radius-suave)] px-2 py-3.5 text-[11.5px] font-medium leading-tight transition-all duration-300 ${
                        activa
                          ? "bg-[var(--color-papel-alto)] text-[var(--color-tinta)] shadow-[var(--sombra-alzada)]"
                          : "bg-[var(--color-papel)]/55 text-[var(--color-tinta-suave)] hover:bg-[var(--color-papel)]"
                      }`}
                    >
                      {activa && (
                        <motion.span
                          layoutId="emocion-elegida"
                          transition={{ type: "spring", stiffness: 420, damping: 36 }}
                          className="absolute inset-0 rounded-[var(--radius-suave)] ring-2 ring-[var(--color-acento)]"
                        />
                      )}
                      <span className="text-[23px] leading-none">{f.icono}</span>
                      <span className="relative">{etiquetaDe(f.emocion, genero)}</span>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          )
        })}

        {/* La intensidad no se pregunta: aparece solo si la buscas (RF-1.1.5) */}
        <AnimatePresence>
          {elegida && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <Apunte>Intensidad</Apunte>
                  <span className="text-[13px] tabular-nums text-[var(--color-tinta-suave)]">
                    {intensidad} de 5
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={intensidad}
                  onChange={(e) => setIntensidad(Number(e.target.value))}
                  className="w-full"
                  aria-label="Intensidad"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Aviso>{estado.error}</Aviso>

        <Boton type="submit" disabled={!elegida || pendiente} className="w-full">
          {pendiente
            ? "Guardando…"
            : elegida
              ? `Registrar · ${etiquetaDe(elegida, genero)}`
              : "Elige cómo estás"}
        </Boton>

        {ultimaEmocion && !elegida && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={() => setElegida(ultimaEmocion)}
            className="pulsable w-full text-center text-[13px] text-[var(--color-tinta-tenue)]"
          >
            ↺ Igual que la última vez · {ficha(ultimaEmocion).icono}{" "}
            {etiquetaDe(ultimaEmocion, genero)}
          </motion.button>
        )}
      </form>
    </section>
  )
}

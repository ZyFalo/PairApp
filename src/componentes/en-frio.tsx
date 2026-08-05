"use client"

import { RiArchiveLine, RiPencilLine, RiSendPlaneLine } from "@remixicon/react"
import { motion } from "motion/react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Apunte, Aviso, Boton, Tarjeta, TextoDeCarta } from "@/componentes/base"
import { COLOR_GRUPO, ICONO_EMOCION } from "@/componentes/iconos"
import type { Emocion } from "@/generated/prisma/enums"
import { dejarloIr, enviarDelFrio } from "@/lib/acciones/entregas"
import { useEnfoqueQuieto } from "@/lib/enfoque"
import { etiquetaDe, grupoDe } from "@/lib/motor/emociones"

type Props = {
  mensajeId: string
  texto: string
  emocion: Emocion
  cuandoLoEscribiste: string
  hayPareja: boolean
}

/**
 * La revisión del buzón en frío (§6.3).
 *
 * Aquí es donde el módulo se gana su nombre: pasaron doce horas, la otra
 * persona nunca supo que esto existía, y ahora lo lees con la cabeza fría.
 *
 * **Las tres salidas pesan lo mismo** (RF-6.3.3) y por eso se pintan iguales:
 * ni "enviar" es el botón grande ni "dejarlo ir" es el de renunciar. A veces
 * escribirlo ya era el punto, y la app no tiene opinión sobre cuál eliges.
 */
export function RevisionEnFrio(props: Props) {
  const enfocar = useEnfoqueQuieto<HTMLTextAreaElement>()
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(props.texto)
  const [error, setError] = useState<string | null>(null)
  const [ocupado, empezar] = useTransition()

  const Icono = ICONO_EMOCION[props.emocion]

  function enviar() {
    setError(null)
    empezar(async () => {
      const resultado = await enviarDelFrio(props.mensajeId, editando ? texto : undefined)
      if (resultado.error) setError(resultado.error)
      else router.refresh()
    })
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <h2 className="carta text-[21px] leading-snug">
          Escribiste esto {props.cuandoLoEscribiste}.
        </h2>
        <Apunte>Nunca salió de aquí. Tú decides qué hacer con ello.</Apunte>
      </div>

      <Tarjeta alzada className="space-y-3">
        <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-tinta-suave)]">
          <Icono size={15} className={COLOR_GRUPO[grupoDe(props.emocion)]} />
          {etiquetaDe(props.emocion, "NEUTRO").toLowerCase()}
        </span>

        {editando ? (
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={6}
            maxLength={4000}
            ref={enfocar}
            aria-label="Tu mensaje"
            className="carta w-full resize-none rounded-[var(--radius-suave)] border border-[var(--color-borde)] bg-[var(--color-papel)] p-3 text-[17px] leading-relaxed outline-none focus:border-[var(--color-acento-suave)]"
          />
        ) : (
          <TextoDeCarta>{texto}</TextoDeCarta>
        )}
      </Tarjeta>

      <Aviso>{error}</Aviso>

      {/* Tres botones del mismo peso: la app no tiene favorita (RF-6.3.3) */}
      <div className="grid gap-2">
        {props.hayPareja && (
          <Boton variante="suave" onClick={enviar} disabled={ocupado || !texto.trim()}>
            <span className="inline-flex items-center gap-2">
              <RiSendPlaneLine size={17} />
              {ocupado ? "Enviando…" : editando ? "Enviarlo así" : "Enviarlo"}
            </span>
          </Boton>
        )}

        {!editando && (
          <Boton variante="suave" onClick={() => setEditando(true)} disabled={ocupado}>
            <span className="inline-flex items-center gap-2">
              <RiPencilLine size={17} />
              Editarlo
            </span>
          </Boton>
        )}

        {/* `async` con `await` y no `() => void dejarloIr(…)`: soltar la promesa
            da la transición por terminada en el acto, así que el botón se
            apagaba y volvía a encenderse antes de que pasara nada. En esta
            pantalla —decidir qué hacer con algo escrito enojado— un botón que
            parpadea y revive se lee como que no funcionó, y se vuelve a pulsar. */}
        <Boton
          variante="suave"
          onClick={() =>
            empezar(async () => {
              await dejarloIr(props.mensajeId)
            })
          }
          ocupado={ocupado}
        >
          <span className="inline-flex items-center gap-2">
            <RiArchiveLine size={17} />
            Dejarlo ir
          </span>
        </Boton>
      </div>

      <p className="text-center text-[12.5px] text-[var(--color-tinta-tenue)]">
        «Dejarlo ir» lo guarda en tus apuntes. No lo borra.
      </p>
    </motion.section>
  )
}

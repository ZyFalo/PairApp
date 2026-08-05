"use client"

import { RiArchiveLine, RiCloseLine, RiInboxUnarchiveLine, RiSendPlaneLine } from "@remixicon/react"
import { useState, useTransition } from "react"
import { archivarApunte, decirloAhora, desarchivarApunte } from "@/lib/acciones/bucle"

/**
 * Lo que escribiste para ti y aún no has dicho (§2.0).
 *
 * Vive en el cofre, en la vista "Por hablar". Estos dos botones son todo lo
 * que se puede hacer con un apunte: contarlo o guardarlo.
 */

/**
 * Qué hacer con un apunte privado. "Decirlo ahora" es el mecanismo más
 * importante de la lista: mover algo de callado a hablado sin empezar de
 * cero (RF-2.0.6). Archivar no borra: guarda memoria sin presión (RF-2.0.9).
 */
export function AccionesApunte({
  mensajeId,
  hayPareja,
}: {
  mensajeId: string
  hayPareja: boolean
}) {
  const [enviando, empezar] = useTransition()
  const [confirmando, setConfirmando] = useState(false)

  // Enviar es irreversible: un toque de más no debería bastar para que salga.
  if (confirmando) {
    return (
      <div className="flex items-center gap-2">
        {/* Es el mismo verbo que ya dice «Enviando…» en el compositor: se
            copia, no se inventa uno nuevo. Y la X se apaga con él — una vez
            lanzado no queda nada que cancelar. */}
        <button
          type="button"
          disabled={enviando}
          aria-busy={enviando || undefined}
          onClick={() =>
            empezar(async () => {
              await decirloAhora(mensajeId)
            })
          }
          className="pulsable inline-flex items-center gap-1.5 rounded-[var(--radius-pildora)] bg-[var(--color-acento)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-sobre-acento)] disabled:opacity-100"
        >
          <RiSendPlaneLine size={14} />
          {enviando ? "Enviando…" : "Enviárselo"}
        </button>
        <button
          type="button"
          disabled={enviando}
          onClick={() => setConfirmando(false)}
          aria-label="Cancelar"
          className="pulsable rounded-full p-1 text-[var(--color-tinta-tenue)] disabled:opacity-40"
        >
          <RiCloseLine size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 text-[13px]">
      {hayPareja && (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="pulsable inline-flex items-center gap-1.5 text-[var(--color-acento)]"
        >
          <RiSendPlaneLine size={14} />
          Decirlo ahora
        </button>
      )}
      {/* Sin texto y sin atenuar, solo apagado: archivar y recuperar son la
          misma acción en dos direcciones, y una asimetría sugeriría que una
          pesa más que la otra. */}
      <button
        type="button"
        disabled={enviando}
        onClick={() =>
          empezar(async () => {
            await archivarApunte(mensajeId)
          })
        }
        className="pulsable inline-flex items-center gap-1.5 text-[var(--color-tinta-tenue)] hover:text-[var(--color-tinta-suave)]"
      >
        <RiArchiveLine size={14} />
        Archivar
      </button>
    </div>
  )
}

/** Sacar un apunte del archivo (RF-2.0.9). */
export function BotonDesarchivar({ mensajeId }: { mensajeId: string }) {
  const [, empezar] = useTransition()

  return (
    <button
      type="button"
      onClick={() =>
        empezar(async () => {
          await desarchivarApunte(mensajeId)
        })
      }
      className="pulsable inline-flex items-center gap-1.5 text-[13px] text-[var(--color-tinta-tenue)] hover:text-[var(--color-acento)]"
    >
      <RiInboxUnarchiveLine size={14} />
      Recuperarlo
    </button>
  )
}

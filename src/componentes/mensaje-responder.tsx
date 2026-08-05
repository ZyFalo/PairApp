"use client"

import { useRouter } from "next/navigation"
import { useActionState, useEffect } from "react"
import { Apunte, Aviso, Boton, Pastilla, Separador } from "@/componentes/base"
import { Acuse } from "@/componentes/formulario"
import { ICONO_CIERRE, ICONO_EMOCION } from "@/componentes/iconos"
import type { Emocion } from "@/generated/prisma/enums"
import { responder } from "@/lib/acciones/entregas"
import { useBorrador } from "@/lib/borrador"
import { CIERRES, ETIQUETA_CIERRE, etiquetaDe } from "@/lib/motor/emociones"

/**
 * Responder a un mensaje (§3.3).
 *
 * Separado de la lectura a propósito: son dos momentos distintos y la app pone
 * una pausa entre ellos. Leer no obliga a contestar en el mismo gesto.
 */

/** Las emociones que se pueden adjuntar a una respuesta (RF-3.18). */
const EMOCIONES_ADJUNTAS: Emocion[] = ["APENADO", "INCOMODO", "TRISTE", "AGRADECIDO", "BIEN"]

/** Responder, con la opción de adjuntar cómo me dejó el mensaje (RF-3.18). */
export function FormularioRespuesta({
  entregaId,
  onVolver,
}: {
  entregaId: string
  onVolver: () => void
}) {
  const router = useRouter()
  const [estado, accion, pendiente] = useActionState(responder, {})

  // Perder media respuesta escrita por mirar otra pestaña es de las cosas que
  // más desaniman a volver a escribir.
  const [borrador, actualizar, olvidar] = useBorrador(`hoy:respuesta:${entregaId}`, {
    texto: "",
    emocionAdjunta: "",
  })
  const { texto, emocionAdjunta } = borrador

  // Navegar es un efecto, no algo que ocurra mientras se pinta.
  useEffect(() => {
    if (!estado.ok) return
    olvidar()
    router.refresh()
  }, [estado.ok, olvidar, router])

  /**
   * Un final, y no el mismo formulario otra vez.
   *
   * Aquí no faltaba un indicador de espera: faltaba el **estado terminal**.
   * Entre que la acción vuelve y aterriza el refresco se veía el formulario en
   * blanco y vivo, y la lectura obvia era «se borró y no se envió» — sobre una
   * respuesta que la persona acababa de escribir a mano.
   */
  if (estado.ok) return <Acuse>Enviado.</Acuse>

  return (
    <section className="space-y-4">
      <form action={accion} className="space-y-4">
        <input type="hidden" name="entregaId" value={entregaId} />
        <input type="hidden" name="emocionAdjunta" value={emocionAdjunta} />

        <textarea
          name="texto"
          value={texto}
          onChange={(e) => actualizar({ texto: e.target.value })}
          rows={5}
          maxLength={4000}
          placeholder="Tu respuesta…"
          aria-label="Tu respuesta"
          className="carta w-full resize-none rounded-[var(--radius-tarjeta)] border border-[var(--color-borde)] bg-[var(--color-papel)] p-5 text-[17px] leading-relaxed shadow-[inset_0_1px_2px_rgb(74_54_38_/_0.04)] outline-none transition-colors focus:border-[var(--color-acento-suave)]"
        />

        <div className="space-y-2.5">
          <Apunte>Y de paso, cómo me dejó (opcional)</Apunte>
          <div className="flex flex-wrap gap-2">
            {EMOCIONES_ADJUNTAS.map((e) => (
              <Pastilla
                key={e}
                Icono={ICONO_EMOCION[e]}
                activa={emocionAdjunta === e}
                onClick={() => actualizar({ emocionAdjunta: emocionAdjunta === e ? "" : e })}
              >
                {etiquetaDe(e, "NEUTRO")}
              </Pastilla>
            ))}
          </div>
        </div>

        <Aviso>{estado.error}</Aviso>

        <Boton type="submit" disabled={pendiente} className="w-full">
          {pendiente ? "Enviando…" : "Enviar respuesta"}
        </Boton>

        <Separador />

        <div className="space-y-2">
          <Apunte>O responde con un toque</Apunte>
          <div className="grid gap-2">
            {CIERRES.map((c) => {
              const Icono = ICONO_CIERRE[c]
              return (
                <button
                  key={c}
                  type="submit"
                  name="cierre"
                  value={c}
                  disabled={pendiente}
                  className="pulsable flex items-center gap-2.5 rounded-[var(--radius-suave)] border border-[var(--color-borde)] bg-[var(--color-papel)] px-4 py-3 text-[14px] text-[var(--color-tinta-suave)] hover:border-[var(--color-acento-suave)] hover:text-[var(--color-tinta)] disabled:opacity-40"
                >
                  <Icono size={16} className="text-[var(--color-acento-suave)]" />
                  {ETIQUETA_CIERRE[c]}
                </button>
              )
            })}
          </div>
        </div>

        <Boton variante="texto" type="button" onClick={onVolver} className="w-full">
          Volver
        </Boton>
      </form>
    </section>
  )
}

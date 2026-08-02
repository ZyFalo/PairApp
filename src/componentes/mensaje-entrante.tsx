"use client"

import { useRouter } from "next/navigation"
import { useActionState, useState } from "react"
import { Apunte, Aviso, Boton, Tarjeta, TextoDeCarta } from "@/componentes/base"
import type { Emocion } from "@/generated/prisma/enums"
import { avisarNecesitoUnRato, marcarVisto, responder } from "@/lib/acciones/bucle"
import { ETIQUETA_NECESIDAD, esDificilDeResponder, etiquetaDe, ficha } from "@/lib/motor/emociones"

type Props = {
  entregaId: string
  nombreAutor: string
  emocion: Emocion
  texto: string
  necesidad: string | null
  tonoMarcado: boolean
  esPresencia: boolean
  amortiguador: { texto: string; creadoEn: string } | null
  ambosEnojados: boolean
}

/**
 * Recibir un mensaje: amortiguador si hace falta, lectura, y la pausa entre
 * leer y responder (§3.3).
 */
export function MensajeEntrante(props: Props) {
  const [fase, setFase] = useState<"amortiguador" | "leer" | "responder">(
    props.amortiguador ? "amortiguador" : "leer",
  )

  if (fase === "amortiguador" && props.amortiguador) {
    return (
      <section className="aparece space-y-4">
        <Apunte>{props.nombreAutor} te escribió. Antes de abrirlo, algo que te dejó ella:</Apunte>
        <Tarjeta className="revela">
          <TextoDeCarta>{props.amortiguador.texto}</TextoDeCarta>
          <p className="mt-3 text-right text-[12px] text-[--color-tinta-tenue]">
            {props.amortiguador.creadoEn}
          </p>
        </Tarjeta>
        <div className="grid gap-2">
          <Boton onClick={() => setFase("leer")}>Ahora sí, ábrelo</Boton>
          <Boton variante="suave" onClick={() => history.back()}>
            Un rato más
          </Boton>
        </div>
      </section>
    )
  }

  if (fase === "responder") {
    return <FormularioRespuesta {...props} onVolver={() => setFase("leer")} />
  }

  return <Lectura {...props} onResponder={() => setFase("responder")} />
}

/** El mensaje, solo, con espacio alrededor. La caja de respuesta no aparece aún. */
function Lectura({
  entregaId,
  nombreAutor,
  emocion,
  texto,
  necesidad,
  tonoMarcado,
  esPresencia,
  ambosEnojados,
  onResponder,
}: Props & { onResponder: () => void }) {
  const router = useRouter()
  const f = ficha(emocion)

  async function cerrarSinResponder() {
    await marcarVisto(entregaId)
    router.push("/hoy")
  }

  async function necesitoUnRato() {
    await avisarNecesitoUnRato(entregaId)
    router.push("/hoy")
  }

  return (
    <section className="aparece space-y-5">
      {ambosEnojados && (
        <p className="text-center font-[family-name:--font-carta] text-[18px]">
          Los dos están enojados.
        </p>
      )}

      <div className="flex items-center gap-2 text-[13px] text-[--color-tinta-suave]">
        <span className="text-[17px]">{f.icono}</span>
        <span>
          {nombreAutor} · {etiquetaDe(emocion, "NEUTRO").toLowerCase()}
        </span>
      </div>

      {tonoMarcado && <Apunte>Te escribió esto enojado, y quiso que lo supieras.</Apunte>}

      <Tarjeta className="revela">
        <TextoDeCarta>{texto}</TextoDeCarta>
      </Tarjeta>

      {necesidad && (
        <Apunte>
          Necesita:{" "}
          <strong className="text-[--color-tinta]">
            {ETIQUETA_NECESIDAD[necesidad as keyof typeof ETIQUETA_NECESIDAD]}
          </strong>
        </Apunte>
      )}

      {esPresencia ? (
        // Un mensaje de presencia no espera respuesta: tratarlo como algo que
        // la exige lo convierte en deuda (§3.2).
        <Boton variante="suave" onClick={cerrarSinResponder} className="w-full">
          Guardarlo y volver
        </Boton>
      ) : (
        <div className="grid gap-2">
          <Boton onClick={onResponder}>Responder</Boton>
          {esDificilDeResponder(emocion) && (
            <Boton variante="suave" onClick={necesitoUnRato}>
              Ahora no puedo
            </Boton>
          )}
        </div>
      )}
    </section>
  )
}

const CIERRES = [
  { valor: "GRACIAS", texto: "Gracias 💛" },
  { valor: "TE_QUIERO", texto: "Te quiero" },
  { valor: "HABLARLO_MAS", texto: "Quisiera hablarlo un poco más" },
  { valor: "HABLAMOS_LUEGO", texto: "Hablamos luego" },
] as const

const EMOCIONES_ADJUNTAS: Emocion[] = ["APENADO", "INCOMODO", "TRISTE", "AGRADECIDO", "BIEN"]

/** Responder, con la opción de adjuntar cómo me dejó el mensaje (RF-3.18). */
function FormularioRespuesta({ entregaId, onVolver }: Props & { onVolver: () => void }) {
  const router = useRouter()
  const [estado, accion, pendiente] = useActionState(responder, {})
  const [emocionAdjunta, setEmocionAdjunta] = useState("")

  if (estado.ok) {
    router.push("/hoy")
    router.refresh()
  }

  return (
    <section className="aparece space-y-4">
      <form action={accion} className="space-y-4">
        <input type="hidden" name="entregaId" value={entregaId} />
        <input type="hidden" name="emocionAdjunta" value={emocionAdjunta} />

        <textarea
          name="texto"
          rows={5}
          placeholder="Tu respuesta…"
          className="w-full resize-none rounded-[--radius-tarjeta] border border-[--color-borde] bg-[--color-papel] p-4 font-[family-name:--font-carta] text-[17px] leading-relaxed outline-none focus:border-[--color-acento-suave]"
        />

        <div className="space-y-2">
          <Apunte>Y de paso, cómo me dejó (opcional)</Apunte>
          <div className="flex flex-wrap gap-2">
            {EMOCIONES_ADJUNTAS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmocionAdjunta(emocionAdjunta === e ? "" : e)}
                className={`rounded-full px-3 py-1.5 text-[13px] transition-colors duration-200 ${
                  emocionAdjunta === e
                    ? "bg-[--color-acento] text-[#fffdfa]"
                    : "border border-[--color-borde] bg-[--color-papel] text-[--color-tinta-suave]"
                }`}
              >
                {ficha(e).icono} {etiquetaDe(e, "NEUTRO")}
              </button>
            ))}
          </div>
        </div>

        <Aviso>{estado.error}</Aviso>

        <Boton type="submit" disabled={pendiente} className="w-full">
          {pendiente ? "Enviando…" : "Enviar respuesta"}
        </Boton>

        <div className="space-y-2 border-t border-[--color-borde] pt-4">
          <Apunte>O responde con un toque</Apunte>
          <div className="grid gap-2">
            {CIERRES.map((c) => (
              <button
                key={c.valor}
                type="submit"
                name="cierre"
                value={c.valor}
                disabled={pendiente}
                className="rounded-[--radius-suave] border border-[--color-borde] bg-[--color-papel] px-4 py-2.5 text-[14px] text-[--color-tinta-suave]"
              >
                {c.texto}
              </button>
            ))}
          </div>
        </div>

        <Boton variante="texto" type="button" onClick={onVolver} className="w-full">
          Volver
        </Boton>
      </form>
    </section>
  )
}

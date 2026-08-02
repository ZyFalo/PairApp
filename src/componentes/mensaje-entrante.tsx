"use client"

import { RiHeart3Line, RiPauseCircleLine, RiQuillPenLine } from "@remixicon/react"
import { AnimatePresence, motion } from "motion/react"
import { useRouter } from "next/navigation"
import { useActionState, useState } from "react"
import { Apunte, Aviso, Boton, Separador, Tarjeta, TextoDeCarta } from "@/componentes/base"
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

const SUAVE = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }

/**
 * Recibir un mensaje: amortiguador si hace falta, lectura, y la pausa entre
 * leer y responder (§3.3).
 */
export function MensajeEntrante(props: Props) {
  const [fase, setFase] = useState<"amortiguador" | "leer" | "responder">(
    props.amortiguador ? "amortiguador" : "leer",
  )

  return (
    <AnimatePresence mode="wait">
      {fase === "amortiguador" && props.amortiguador ? (
        <motion.div key="amortiguador" exit={{ opacity: 0, y: -12 }} transition={SUAVE}>
          <Amortiguador
            nombreAutor={props.nombreAutor}
            texto={props.amortiguador.texto}
            fecha={props.amortiguador.creadoEn}
            onSeguir={() => setFase("leer")}
          />
        </motion.div>
      ) : fase === "responder" ? (
        <motion.div
          key="responder"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SUAVE}
        >
          <FormularioRespuesta {...props} onVolver={() => setFase("leer")} />
        </motion.div>
      ) : (
        <motion.div key="leer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={SUAVE}>
          <Lectura {...props} onResponder={() => setFase("responder")} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Algo cálido de ella antes de abrir un mensaje difícil (RF-3.0.7).
 * No esconde nada: el mensaje está a un toque. Solo da un segundo para
 * acordarse de quién es la persona que escribió.
 */
function Amortiguador({
  nombreAutor,
  texto,
  fecha,
  onSeguir,
}: {
  nombreAutor: string
  texto: string
  fecha: string
  onSeguir: () => void
}) {
  return (
    <section className="space-y-5">
      <Apunte>{nombreAutor} te escribió. Antes de abrirlo, algo que te dejó ella:</Apunte>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ ...SUAVE, duration: 0.9 }}
      >
        <Tarjeta alzada className="space-y-4">
          <RiHeart3Line size={20} className="text-[var(--color-acento-suave)]" />
          <TextoDeCarta>{texto}</TextoDeCarta>
          <p className="text-right text-[12px] text-[var(--color-tinta-tenue)]">{fecha}</p>
        </Tarjeta>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="grid gap-2"
      >
        <Boton onClick={onSeguir}>Ahora sí, ábrelo</Boton>
        <Boton variante="suave" onClick={() => history.back()}>
          Un rato más
        </Boton>
      </motion.div>
    </section>
  )
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
    <section className="space-y-5">
      {ambosEnojados && (
        <p className="carta text-center text-[19px] text-[var(--color-tinta-suave)]">
          Los dos están enojados.
        </p>
      )}

      <div className="flex items-center gap-2.5">
        <span className="text-[19px] leading-none">{f.icono}</span>
        <span className="text-[13.5px] text-[var(--color-tinta-suave)]">
          {nombreAutor} · {etiquetaDe(emocion, "NEUTRO").toLowerCase()}
        </span>
      </div>

      {tonoMarcado && <Apunte>Te escribió esto enojado, y quiso que lo supieras.</Apunte>}

      {/* El momento clave de la app: se revela, no aparece de golpe (§8.2) */}
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.97, filter: "blur(7px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
      >
        <Tarjeta alzada className="px-6 py-7">
          <TextoDeCarta>{texto}</TextoDeCarta>
        </Tarjeta>
      </motion.div>

      {necesidad && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-2"
        >
          <Apunte>Necesita</Apunte>
          <span className="rounded-[var(--radius-pildora)] bg-[var(--color-acento-tenue)] px-3 py-1 text-[13px] font-medium text-[var(--color-acento-hondo)]">
            {ETIQUETA_NECESIDAD[necesidad as keyof typeof ETIQUETA_NECESIDAD]}
          </span>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, ...SUAVE }}
        className="grid gap-2 pt-2"
      >
        {esPresencia ? (
          // Un mensaje de presencia no espera respuesta: tratarlo como algo que
          // la exige lo convierte en deuda (§3.2).
          <Boton variante="suave" onClick={cerrarSinResponder}>
            Guardarlo y volver
          </Boton>
        ) : (
          <>
            <Boton onClick={onResponder}>
              <span className="inline-flex items-center gap-2">
                <RiQuillPenLine size={17} />
                Responder
              </span>
            </Boton>
            {esDificilDeResponder(emocion) && (
              <Boton variante="suave" onClick={necesitoUnRato}>
                <span className="inline-flex items-center gap-2">
                  <RiPauseCircleLine size={17} />
                  Ahora no puedo
                </span>
              </Boton>
            )}
          </>
        )}
      </motion.div>
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
    <section className="space-y-4">
      <form action={accion} className="space-y-4">
        <input type="hidden" name="entregaId" value={entregaId} />
        <input type="hidden" name="emocionAdjunta" value={emocionAdjunta} />

        <textarea
          name="texto"
          rows={5}
          placeholder="Tu respuesta…"
          className="carta w-full resize-none rounded-[var(--radius-tarjeta)] border border-[var(--color-borde)] bg-[var(--color-papel)] p-5 text-[17px] leading-relaxed shadow-[inset_0_1px_2px_rgb(74_54_38_/_0.04)] outline-none transition-colors focus:border-[var(--color-acento-suave)]"
        />

        <div className="space-y-2.5">
          <Apunte>Y de paso, cómo me dejó (opcional)</Apunte>
          <div className="flex flex-wrap gap-2">
            {EMOCIONES_ADJUNTAS.map((e) => (
              <motion.button
                key={e}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => setEmocionAdjunta(emocionAdjunta === e ? "" : e)}
                className={`inline-flex items-center gap-1.5 rounded-[var(--radius-pildora)] px-3.5 py-2 text-[13px] font-medium transition-all duration-200 ${
                  emocionAdjunta === e
                    ? "bg-[var(--color-acento)] text-[#fffcf7] shadow-[var(--sombra-tinta)]"
                    : "border border-[var(--color-borde)] bg-[var(--color-papel)] text-[var(--color-tinta-suave)]"
                }`}
              >
                <span className="text-[15px] leading-none">{ficha(e).icono}</span>
                <span>{etiquetaDe(e, "NEUTRO")}</span>
              </motion.button>
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
            {CIERRES.map((c) => (
              <button
                key={c.valor}
                type="submit"
                name="cierre"
                value={c.valor}
                disabled={pendiente}
                className="pulsable rounded-[var(--radius-suave)] border border-[var(--color-borde)] bg-[var(--color-papel)] px-4 py-3 text-[14px] text-[var(--color-tinta-suave)] hover:border-[var(--color-acento-suave)] hover:text-[var(--color-tinta)]"
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

"use client"

import { RiHeart3Line, RiMoonClearLine, RiPauseCircleLine, RiQuillPenLine } from "@remixicon/react"
import { AnimatePresence, motion } from "motion/react"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useState } from "react"
import { type DatosAdjunto, VistaAdjunto } from "@/componentes/adjunto"
import {
  Apunte,
  Aviso,
  Boton,
  Pastilla,
  Separador,
  Tarjeta,
  TextoDeCarta,
} from "@/componentes/base"
import { COLOR_GRUPO, ICONO_CIERRE, ICONO_EMOCION, ICONO_NECESIDAD } from "@/componentes/iconos"
import type { Emocion, Necesidad } from "@/generated/prisma/enums"
import { avisarNecesitoUnRato, marcarVisto, posponerLectura, responder } from "@/lib/acciones/bucle"
import { useBorrador } from "@/lib/borrador"
import {
  CIERRES,
  ETIQUETA_CIERRE,
  ETIQUETA_NECESIDAD,
  esDificilDeResponder,
  etiquetaDe,
  grupoDe,
} from "@/lib/motor/emociones"

/** Cómo decidió la matriz que hay que presentar este mensaje (§3.0.15). */
export type Presentacion =
  | { tipo: "directo" }
  | { tipo: "amortiguado" }
  | { tipo: "nombrar_y_elegir"; ambosEnojados: boolean }

type Props = {
  entregaId: string
  nombreAutor: string
  emocion: Emocion
  texto: string
  necesidad: string | null
  tonoMarcado: boolean
  esPresencia: boolean
  presentacion: Presentacion
  amortiguador: { texto: string; creadoEn: string } | null
  adjunto: DatosAdjunto | null
}

const SUAVE = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }

/** Los cuatro momentos de recibir algo, en orden. */
type Fase = "nombrar" | "amortiguador" | "leer" | "responder"

/** Fase inicial según lo que decidió el motor: nunca se salta una celda. */
function faseInicial(presentacion: Presentacion): Fase {
  if (presentacion.tipo === "nombrar_y_elegir") return "nombrar"
  if (presentacion.tipo === "amortiguado") return "amortiguador"
  return "leer"
}

/**
 * Recibir un mensaje: las tres presentaciones de la matriz, la lectura, y la
 * pausa entre leer y responder (§3.3).
 */
export function MensajeEntrante(props: Props) {
  // La fase también se recuerda: si te vas a otra pestaña mientras respondes,
  // al volver sigues respondiendo y no en la pantalla de leer.
  const [borrador, actualizar] = useBorrador(`hoy:entrega:${props.entregaId}`, {
    fase: faseInicial(props.presentacion) as Fase,
  })
  const fase = borrador.fase
  const setFase = (siguiente: Fase) => actualizar({ fase: siguiente })

  return (
    <AnimatePresence mode="wait">
      {fase === "nombrar" && props.presentacion.tipo === "nombrar_y_elegir" ? (
        <motion.div key="nombrar" exit={{ opacity: 0, y: -12 }} transition={SUAVE}>
          <NombrarYElegir
            entregaId={props.entregaId}
            nombreAutor={props.nombreAutor}
            ambosEnojados={props.presentacion.ambosEnojados}
            onLeer={() => setFase("leer")}
          />
        </motion.div>
      ) : fase === "amortiguador" && props.amortiguador ? (
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
 * La tercera celda de la matriz (§3.0.15): quien recibe está en "algo pasó",
 * y ahí el cariño no consuela — en enojo invalida, en pena aumenta la culpa.
 *
 * Así que no se amortigua ni se abre de golpe: se nombra el hecho y se deja
 * elegir. Las dos opciones pesan lo mismo a propósito. Esperar no es fallar.
 */
function NombrarYElegir({
  entregaId,
  nombreAutor,
  ambosEnojados,
  onLeer,
}: {
  entregaId: string
  nombreAutor: string
  ambosEnojados: boolean
  onLeer: () => void
}) {
  const router = useRouter()
  const [ocupado, setOcupado] = useState(false)

  async function esperar() {
    setOcupado(true)
    await posponerLectura(entregaId, ambosEnojados)
    router.push("/hoy")
  }

  return (
    <section className="space-y-6 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SUAVE}
        className="space-y-3 text-center"
      >
        <p className="carta text-[26px] leading-snug">
          {ambosEnojados ? "Los dos están enojados." : `${nombreAutor} te escribió.`}
        </p>
        <Apunte>
          {ambosEnojados ? "Nada de esto se va a ninguna parte." : "Tú eliges cuándo."}
        </Apunte>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="grid gap-2"
      >
        <Boton variante="suave" onClick={onLeer} disabled={ocupado}>
          Leerlo ahora
        </Boton>
        <Boton variante="suave" onClick={esperar} disabled={ocupado}>
          <span className="inline-flex items-center gap-2">
            {ambosEnojados ? <RiMoonClearLine size={17} /> : <RiPauseCircleLine size={17} />}
            {ambosEnojados ? "Mañana por la mañana" : "Más tarde"}
          </span>
        </Boton>
      </motion.div>

      {/* Sin cuenta atrás: un reloj corriendo convierte esperar en deuda (RF-3.0.13.1) */}
      <p className="text-center text-[12.5px] text-[var(--color-tinta-tenue)]">
        {ambosEnojados
          ? "Dormir encima de esto suele ser lo que mejor funciona."
          : "Sigue aquí cuando vuelvas."}
      </p>
    </section>
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
      <Apunte>{nombreAutor} te escribió. Antes de abrirlo, algo que te dejó:</Apunte>

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
  adjunto,
  onResponder,
}: Props & { onResponder: () => void }) {
  const router = useRouter()
  const Icono = ICONO_EMOCION[emocion]
  const IconoNecesidad = necesidad ? ICONO_NECESIDAD[necesidad as Necesidad] : null

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
      <div className="flex items-center gap-2.5">
        <Icono size={19} className={COLOR_GRUPO[grupoDe(emocion)]} />
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
        <Tarjeta alzada className="space-y-4 px-6 py-7">
          <TextoDeCarta>{texto}</TextoDeCarta>
          {/* Debajo del texto, nunca en su lugar: lo que dice sigue mandando */}
          {adjunto && <VistaAdjunto adjunto={adjunto} alt={`Lo que te mandó ${nombreAutor}`} />}
        </Tarjeta>
      </motion.div>

      {necesidad && IconoNecesidad && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-2"
        >
          <Apunte>Necesita</Apunte>
          <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pildora)] bg-[var(--color-acento-tenue)] px-3 py-1 text-[13px] font-medium text-[var(--color-acento-hondo)]">
            <IconoNecesidad size={14} />
            {ETIQUETA_NECESIDAD[necesidad as Necesidad]}
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

/** Las emociones que se pueden adjuntar a una respuesta (RF-3.18). */
const EMOCIONES_ADJUNTAS: Emocion[] = ["APENADO", "INCOMODO", "TRISTE", "AGRADECIDO", "BIEN"]

/** Responder, con la opción de adjuntar cómo me dejó el mensaje (RF-3.18). */
function FormularioRespuesta({ entregaId, onVolver }: Props & { onVolver: () => void }) {
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

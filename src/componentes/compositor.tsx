"use client"

import { useRouter } from "next/navigation"
import { useActionState, useState } from "react"
import { Apunte, Aviso, Boton, Tarjeta } from "@/componentes/base"
import type { Emocion } from "@/generated/prisma/enums"
import { dejarMensaje } from "@/lib/acciones/bucle"
import {
  ETIQUETA_NECESIDAD,
  necesidadPorDefecto,
  pasaPorUmbral,
  puedeGuardarseParaDespues,
} from "@/lib/motor/emociones"

const NECESIDADES = [
  "ESCUCHA",
  "ESPACIO",
  "DISTRACCION",
  "CONTACTO",
  "SOLUCIONES",
  "NO_SE",
] as const

/**
 * Escribir el mensaje y elegir cuándo llega (§2.0). Siempre opcional: decir
 * "estoy triste" sin escribir nada es un uso legítimo y completo de la app.
 */
export function Compositor({
  checkinId,
  emocion,
  nombrePareja,
}: {
  checkinId: string
  emocion: Emocion
  nombrePareja: string | null
}) {
  const router = useRouter()
  const [estado, accion, pendiente] = useActionState(dejarMensaje, {})
  const [texto, setTexto] = useState("")
  const [necesidad, setNecesidad] = useState<string>(necesidadPorDefecto(emocion) ?? "")
  const [tonoMarcado, setTonoMarcado] = useState(false)
  const [destino, setDestino] = useState<string | null>(null)
  const [enUmbral, setEnUmbral] = useState(false)

  if (estado.ok) {
    router.refresh()
    return (
      <Tarjeta className="aparece space-y-3 text-center">
        <p className="carta text-[19px]">Listo.</p>
        <Boton variante="texto" onClick={() => router.push("/hoy")}>
          Volver
        </Boton>
      </Tarjeta>
    )
  }

  const puedeGuardar = puedeGuardarseParaDespues(emocion)
  const hayTexto = texto.trim().length > 0

  /**
   * El umbral solo aparece al enviar "ahora" desde un enojo intenso (§6.1).
   * Enuncia un hecho y abre el abanico: no juzga el contenido ni bloquea nada.
   */
  function alElegirDestino(elegido: string) {
    setDestino(elegido)
    if (elegido === "AHORA" && pasaPorUmbral(emocion, 4)) setEnUmbral(true)
  }

  return (
    <section className="aparece space-y-5">
      <div className="space-y-1">
        <h2 className="carta text-[21px]">Registrado.</h2>
        <Apunte>
          {nombrePareja
            ? `¿Quieres dejarle algo a ${nombrePareja}?`
            : "¿Quieres dejar algo escrito?"}
        </Apunte>
      </div>

      <form action={accion} className="space-y-4">
        <input type="hidden" name="checkinId" value={checkinId} />
        <input type="hidden" name="necesidad" value={necesidad} />
        <input type="hidden" name="tonoMarcado" value={tonoMarcado ? "true" : ""} />
        <input type="hidden" name="destino" value={destino ?? ""} />

        <textarea
          name="texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={6}
          placeholder="Lo que quieras decirle…"
          className="w-full resize-none rounded-[var(--radius-tarjeta)] border border-[var(--color-borde)] bg-[var(--color-papel)] p-4 carta text-[17px] leading-relaxed text-[var(--color-tinta)] outline-none focus:border-[var(--color-acento-suave)]"
        />

        {/* La necesidad es un chip, nunca una pantalla propia (RF-1.2) */}
        {hayTexto && necesidadPorDefecto(emocion) !== null && (
          <div className="aparece space-y-2">
            <Apunte>Necesito</Apunte>
            <div className="flex flex-wrap gap-2">
              {NECESIDADES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNecesidad(necesidad === n ? "" : n)}
                  className={`rounded-full px-3 py-1.5 text-[13px] transition-colors duration-200 ${
                    necesidad === n
                      ? "bg-[var(--color-acento)] text-[#fffdfa]"
                      : "bg-[var(--color-papel)] text-[var(--color-tinta-suave)] border border-[var(--color-borde)]"
                  }`}
                >
                  {ETIQUETA_NECESIDAD[n]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Marcar el tono a propósito: contextualiza en vez de suavizar (RF-6.2) */}
        {hayTexto && emocion === "ENOJADO" && (
          <label className="flex items-start gap-2.5 text-[14px] text-[var(--color-tinta-suave)]">
            <input
              type="checkbox"
              checked={tonoMarcado}
              onChange={(e) => setTonoMarcado(e.target.checked)}
              className="mt-1 accent-[var(--color-acento)]"
            />
            <span>Estoy enojado y quiero que se note</span>
          </label>
        )}

        <Aviso>{estado.error}</Aviso>

        {!hayTexto ? (
          <Boton
            variante="suave"
            type="button"
            onClick={() => router.push("/hoy")}
            className="w-full"
          >
            Ahora no
          </Boton>
        ) : enUmbral ? (
          <UmbralEnojo
            pendiente={pendiente}
            onEnviarAhora={() => setEnUmbral(false)}
            onGuardarParaMi={() => {
              setDestino("SOLO_PARA_MI")
              setEnUmbral(false)
            }}
          />
        ) : (
          <div className="space-y-2">
            <Apunte>¿Cuándo le llega?</Apunte>
            <div className="grid grid-cols-1 gap-2">
              <Boton
                type="submit"
                variante={destino === "AHORA" ? "solido" : "suave"}
                onClick={() => alElegirDestino("AHORA")}
                disabled={pendiente}
              >
                Ahora
              </Boton>
              {puedeGuardar && (
                <Boton
                  type="submit"
                  variante="suave"
                  onClick={() => setDestino("CUANDO_LE_SIRVA")}
                  disabled={pendiente}
                >
                  Cuando le sirva
                </Boton>
              )}
              <Boton
                type="submit"
                variante="suave"
                onClick={() => setDestino("SOLO_PARA_MI")}
                disabled={pendiente}
              >
                Solo para mí
              </Boton>
            </div>
          </div>
        )}
      </form>
    </section>
  )
}

/**
 * La pantalla del umbral (§6.1). No juzga el contenido: enuncia un hecho y
 * ofrece tres opciones del mismo peso. "Enviar ahora" no dice "de todas formas".
 */
function UmbralEnojo({
  pendiente,
  onEnviarAhora,
  onGuardarParaMi,
}: {
  pendiente: boolean
  onEnviarAhora: () => void
  onGuardarParaMi: () => void
}) {
  return (
    <div className="aparece space-y-3 rounded-[var(--radius-tarjeta)] border border-[var(--color-borde)] bg-[var(--color-paso-fondo)] p-4">
      <p className="text-center carta text-[17px]">Escribiste esto enojado.</p>
      <div className="grid gap-2">
        <Boton type="submit" variante="suave" onClick={onEnviarAhora} disabled={pendiente}>
          Enviar ahora
        </Boton>
        <Boton type="submit" variante="suave" onClick={onGuardarParaMi} disabled={pendiente}>
          Guardarlo y decidir después
        </Boton>
      </div>
    </div>
  )
}

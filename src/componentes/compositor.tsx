"use client"

import { RiInboxArchiveLine, RiLockLine, RiSendPlaneLine } from "@remixicon/react"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useState, useTransition } from "react"
import { Apunte, Aviso, Boton, Pastilla, Tarjeta } from "@/componentes/base"
import { ICONO_EMOCION, ICONO_NECESIDAD } from "@/componentes/iconos"
import type { DestinoMensaje, Emocion } from "@/generated/prisma/enums"
import { dejarMensaje } from "@/lib/acciones/bucle"
import {
  admiteNecesidad,
  ETIQUETA_NECESIDAD,
  NECESIDADES,
  necesidadPorDefecto,
  pasaPorUmbral,
  puedeGuardarseParaDespues,
} from "@/lib/motor/emociones"

/**
 * Escribir el mensaje y elegir cuándo llega (§2.0). Siempre opcional: decir
 * "estoy triste" sin escribir nada es un uso legítimo y completo de la app.
 *
 * **Por qué no hay `<form>` con botones `submit`.** Elegir destino cambia el
 * estado —a veces hasta desmontar el propio botón, como al abrir el umbral— y
 * el envío nativo del navegador leería el formulario a medio actualizar o no
 * llegaría a dispararse. Aquí los datos se arman a mano y se despachan: lo que
 * se envía es exactamente lo que se ve.
 */
export function Compositor({
  checkinId,
  emocion,
  intensidad,
  nombrePareja,
}: {
  checkinId: string
  emocion: Emocion
  intensidad: number
  nombrePareja: string | null
}) {
  const router = useRouter()
  const [estado, accion, pendiente] = useActionState(dejarMensaje, {})
  const [, empezar] = useTransition()
  const [texto, setTexto] = useState("")
  const [necesidad, setNecesidad] = useState<string>(necesidadPorDefecto(emocion) ?? "")
  const [tonoMarcado, setTonoMarcado] = useState(false)
  const [enUmbral, setEnUmbral] = useState(false)

  // Refrescar es un efecto, no algo que ocurra mientras se pinta.
  useEffect(() => {
    if (estado.ok) router.refresh()
  }, [estado.ok, router])

  if (estado.ok) {
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

  /** Arma los datos con lo que hay en pantalla ahora mismo y los despacha. */
  function enviar(destino: DestinoMensaje) {
    const datos = new FormData()
    datos.set("checkinId", checkinId)
    datos.set("texto", texto)
    datos.set("destino", destino)
    datos.set("necesidad", necesidad)
    datos.set("tonoMarcado", tonoMarcado ? "true" : "")
    empezar(() => accion(datos))
  }

  /**
   * El umbral solo aparece al enviar "ahora" desde un enojo intenso (§6.1).
   * Enuncia un hecho y abre el abanico: no juzga el contenido ni bloquea nada.
   * Un enojo flojo pasa de largo — la fricción es para lo que puede herir.
   */
  function pedirEnvioAhora() {
    if (pasaPorUmbral(emocion, intensidad)) setEnUmbral(true)
    else enviar("AHORA")
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

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={6}
        maxLength={4000}
        placeholder="Lo que quieras decirle…"
        aria-label="Tu mensaje"
        className="carta w-full resize-none rounded-[var(--radius-tarjeta)] border border-[var(--color-borde)] bg-[var(--color-papel)] p-4 text-[17px] leading-relaxed text-[var(--color-tinta)] shadow-[inset_0_1px_2px_rgb(74_54_38_/_0.04)] outline-none transition-colors focus:border-[var(--color-acento-suave)]"
      />

      {/* La necesidad es un chip, nunca una pantalla propia (RF-1.2) */}
      {hayTexto && admiteNecesidad(emocion) && (
        <div className="aparece space-y-2">
          <Apunte>Necesito</Apunte>
          <div className="flex flex-wrap gap-2">
            {NECESIDADES.map((n) => (
              <Pastilla
                key={n}
                Icono={ICONO_NECESIDAD[n]}
                activa={necesidad === n}
                onClick={() => setNecesidad(necesidad === n ? "" : n)}
              >
                {ETIQUETA_NECESIDAD[n]}
              </Pastilla>
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

      {/* Sin AnimatePresence a propósito: aquí las tres ramas se turnan según
          lo que escribes, y una transición de salida a medias dejaría la
          pantalla sin botones. Una aparición simple no puede atascarse. */}
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
          onEnviarAhora={() => enviar("AHORA")}
          onGuardarParaMi={() => enviar("SOLO_PARA_MI")}
          onVolver={() => setEnUmbral(false)}
        />
      ) : (
        <div className="aparece space-y-2">
          <Apunte>¿Cuándo le llega?</Apunte>
          <div className="grid gap-2">
            <Boton onClick={pedirEnvioAhora} disabled={pendiente}>
              <span className="inline-flex items-center gap-2">
                <RiSendPlaneLine size={17} />
                {pendiente ? "Enviando…" : "Ahora"}
              </span>
            </Boton>
            {puedeGuardar && (
              <Boton
                variante="suave"
                onClick={() => enviar("CUANDO_LE_SIRVA")}
                disabled={pendiente}
              >
                <span className="inline-flex items-center gap-2">
                  <RiInboxArchiveLine size={17} />
                  Cuando le sirva
                </span>
              </Boton>
            )}
            <Boton variante="suave" onClick={() => enviar("SOLO_PARA_MI")} disabled={pendiente}>
              <span className="inline-flex items-center gap-2">
                <RiLockLine size={17} />
                Solo para mí
              </span>
            </Boton>
          </div>
          <p className="pt-1 text-center text-[12.5px] text-[var(--color-tinta-tenue)]">
            {puedeGuardar
              ? "«Cuando le sirva» espera a un día flojo suyo."
              : "«Solo para mí» queda en tus apuntes, por si luego quieres decirlo."}
          </p>
        </div>
      )}
    </section>
  )
}

const IconoEnojado = ICONO_EMOCION.ENOJADO

/**
 * La pantalla del umbral (§6.1). No juzga el contenido: enuncia un hecho y
 * ofrece opciones del mismo peso. "Enviar ahora" no dice "de todas formas".
 */
function UmbralEnojo({
  pendiente,
  onEnviarAhora,
  onGuardarParaMi,
  onVolver,
}: {
  pendiente: boolean
  onEnviarAhora: () => void
  onGuardarParaMi: () => void
  onVolver: () => void
}) {
  return (
    <div className="space-y-3 rounded-[var(--radius-tarjeta)] border border-[var(--color-paso-borde)] bg-[var(--color-paso-fondo)] p-4">
      {/* El icono es el de la propia emoción, no un triángulo de alarma: el
          umbral enuncia un hecho, no advierte de un peligro (§1.2). */}
      <p className="flex items-center justify-center gap-2 carta text-[17px]">
        <IconoEnojado size={18} className="text-[var(--color-paso)]" />
        Escribiste esto enojado.
      </p>
      <div className="grid gap-2">
        <Boton variante="suave" onClick={onEnviarAhora} disabled={pendiente}>
          {pendiente ? "Enviando…" : "Enviar ahora"}
        </Boton>
        <Boton variante="suave" onClick={onGuardarParaMi} disabled={pendiente}>
          Guardarlo y decidir después
        </Boton>
        <Boton variante="texto" onClick={onVolver} disabled={pendiente}>
          Seguir escribiendo
        </Boton>
      </div>
    </div>
  )
}

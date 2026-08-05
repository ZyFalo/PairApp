"use client"

import { RiCheckLine, RiEyeLine, RiLockLine } from "@remixicon/react"
import { motion } from "motion/react"
import { useActionState, useEffect, useState, useTransition } from "react"
import { Apunte, Aviso, Boton, Insignia, Tarjeta } from "@/componentes/base"
import {
  archivarAcuerdo,
  compartirConflicto,
  crearAcuerdo,
  registrarConflicto,
  repararCon,
} from "@/lib/acciones/conflicto"
import { useBorrador } from "@/lib/borrador"
import { useEnfoqueQuieto } from "@/lib/enfoque"
import { GESTOS } from "@/lib/motor/reparacion"

/**
 * El primer paso después de una discusión (§6.8).
 *
 * Aparece solo cuando los dos están en "algo pasó", y desaparece cuando deja
 * de tener sentido. Las cuatro salidas están ya escritas porque el problema
 * nunca es querer decirlo: es encontrar las palabras justo cuando peor se
 * piensa. Ninguna obliga a nada — "necesito más tiempo" vale igual que
 * "lo siento".
 */
export function Reparacion({ nombrePareja }: { nombrePareja: string }) {
  const [enviado, setEnviado] = useState<string | null>(null)
  const [ocupado, empezar] = useTransition()

  if (enviado) {
    return (
      <Tarjeta className="aparece space-y-1 text-center">
        <p className="carta text-[17px]">Se lo dijiste.</p>
        <Apunte>«{enviado}»</Apunte>
      </Tarjeta>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <Tarjeta className="space-y-3">
        <div className="space-y-0.5">
          <p className="carta text-[17px]">Los dos están en un mal momento.</p>
          <Apunte>Si quieres decirle algo sin pensarlo mucho:</Apunte>
        </div>

        <div className="grid gap-2">
          {GESTOS.map((gesto) => (
            <Boton
              key={gesto.clave}
              variante="suave"
              disabled={ocupado}
              onClick={() =>
                empezar(async () => {
                  const resultado = await repararCon(gesto.clave)
                  if (resultado.ok) setEnviado(gesto.mensaje)
                })
              }
            >
              {gesto.texto}
            </Boton>
          ))}
        </div>

        <p className="text-center text-[12.5px] text-[var(--color-tinta-tenue)]">
          Le llega tal cual, sin más. {nombrePareja} no sabrá que dudaste.
        </p>
      </Tarjeta>
    </motion.div>
  )
}

/** Los cuatro campos de la CNV, con su ejemplo delante (§6.6). */
const CAMPOS = [
  {
    nombre: "quePaso",
    etiqueta: "Qué pasó",
    ayuda: "Solo hechos. «Llegaste a las diez» no admite discusión; «no te importó» sí.",
  },
  { nombre: "queSenti", etiqueta: "Qué sentí", ayuda: "Sin explicar todavía por qué." },
  { nombre: "queNecesitaba", etiqueta: "Qué necesitaba", ayuda: "Lo que te habría servido." },
  {
    nombre: "queHariaDistinto",
    etiqueta: "Qué haría distinto",
    ayuda: "Tuyo, no suyo. Es la parte que depende de ti.",
  },
]

/**
 * Contar un conflicto en cuatro campos (§6.6).
 *
 * El formato es el trabajo: separar los hechos de la interpretación es lo que
 * convierte "siempre haces lo mismo" en algo con lo que se puede hacer algo.
 * Nace privado — compartirlo es una decisión aparte de escribirlo (RF-6.6.1).
 */
export function FormularioConflicto({ respondeAId }: { respondeAId?: string }) {
  const [estado, accion, pendiente] = useActionState(registrarConflicto, {})
  const [borrador, actualizar, olvidar] = useBorrador(`conflicto:${respondeAId ?? "nuevo"}`, {
    abierto: false,
    quePaso: "",
    queSenti: "",
    queNecesitaba: "",
    queHariaDistinto: "",
    compartir: false,
  })

  useEffect(() => {
    if (estado.ok) olvidar()
  }, [estado.ok, olvidar])

  if (!borrador.abierto) {
    return (
      <Boton variante="suave" onClick={() => actualizar({ abierto: true })} className="w-full">
        {respondeAId ? "Contar tu versión" : "Escribir qué pasó"}
      </Boton>
    )
  }

  return (
    <Tarjeta className="aparece">
      <form action={accion} className="space-y-4">
        {respondeAId && <input type="hidden" name="respondeAId" value={respondeAId} />}
        <input type="hidden" name="compartir" value={borrador.compartir ? "true" : ""} />

        {CAMPOS.map((campo) => (
          <label key={campo.nombre} className="block">
            <span className="mb-1 block text-[12.5px] font-medium uppercase tracking-[0.08em] text-[var(--color-tinta-tenue)]">
              {campo.etiqueta}
            </span>
            <span className="mb-2 block text-[12.5px] text-[var(--color-tinta-tenue)]">
              {campo.ayuda}
            </span>
            <textarea
              name={campo.nombre}
              rows={2}
              maxLength={2000}
              required
              value={borrador[campo.nombre as keyof typeof borrador] as string}
              onChange={(e) => actualizar({ [campo.nombre]: e.target.value })}
              className="carta w-full resize-none rounded-[var(--radius-suave)] border border-[var(--color-borde)] bg-[var(--color-papel)] p-3 text-[16px] outline-none transition-colors focus:border-[var(--color-acento-suave)]"
            />
          </label>
        ))}

        <label className="flex items-start gap-2.5 text-[14px] text-[var(--color-tinta-suave)]">
          <input
            type="checkbox"
            checked={borrador.compartir}
            onChange={(e) => actualizar({ compartir: e.target.checked })}
            className="mt-1 accent-[var(--color-acento)]"
          />
          <span>Compartirlo ahora. Si no, queda guardado solo para ti.</span>
        </label>

        <Aviso>{estado.error}</Aviso>
        <div className="flex gap-2">
          <Boton type="submit" disabled={pendiente} className="flex-1">
            {pendiente ? "Guardando…" : "Guardar"}
          </Boton>
          <Boton variante="texto" type="button" onClick={olvidar}>
            Cancelar
          </Boton>
        </div>
      </form>
    </Tarjeta>
  )
}

/** Marca de si un relato está guardado o compartido, y el botón de compartirlo. */
export function EstadoConflicto({ id, compartido }: { id: string; compartido: boolean }) {
  const [, empezar] = useTransition()
  const [confirmando, setConfirmando] = useState(false)

  if (compartido) {
    return (
      <Insignia Icono={RiEyeLine} viva>
        Lo compartiste
      </Insignia>
    )
  }

  if (confirmando) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] text-[var(--color-tinta-tenue)]">
          No tiene vuelta atrás.
        </span>
        <button
          type="button"
          onClick={() => empezar(() => void compartirConflicto(id))}
          className="pulsable inline-flex items-center gap-1.5 rounded-[var(--radius-pildora)] bg-[var(--color-acento)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-sobre-acento)]"
        >
          <RiCheckLine size={13} />
          Compartirlo
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="pulsable text-[12.5px] text-[var(--color-tinta-tenue)]"
        >
          No
        </button>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-3">
      <Insignia Icono={RiLockLine}>Solo tú lo ves</Insignia>
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="pulsable text-[13px] text-[var(--color-acento)]"
      >
        Compartirlo
      </button>
    </span>
  )
}

/** Apuntar un acuerdo (§6.7). Corto a propósito: si no cabe, no es un acuerdo. */
export function FormularioAcuerdo() {
  const enfocar = useEnfoqueQuieto<HTMLTextAreaElement>()
  const [estado, accion, pendiente] = useActionState(crearAcuerdo, {})
  const [borrador, actualizar, olvidar] = useBorrador("acuerdo", { abierto: false, texto: "" })

  useEffect(() => {
    if (estado.ok) olvidar()
  }, [estado.ok, olvidar])

  if (!borrador.abierto) {
    return (
      <Boton variante="suave" onClick={() => actualizar({ abierto: true })} className="w-full">
        Apuntar un acuerdo
      </Boton>
    )
  }

  return (
    <Tarjeta className="aparece">
      <form action={accion} className="space-y-3">
        <textarea
          name="texto"
          rows={2}
          maxLength={500}
          required
          ref={enfocar}
          aria-label="El acuerdo"
          placeholder="Cuando uno diga «pausa», paramos veinte minutos."
          value={borrador.texto}
          onChange={(e) => actualizar({ texto: e.target.value })}
          className="carta w-full resize-none rounded-[var(--radius-suave)] border border-[var(--color-borde)] bg-[var(--color-papel)] p-3 text-[16px] outline-none transition-colors focus:border-[var(--color-acento-suave)]"
        />
        <Aviso>{estado.error}</Aviso>
        <div className="flex gap-2">
          <Boton type="submit" disabled={pendiente} className="flex-1">
            {pendiente ? "Guardando…" : "Guardar"}
          </Boton>
          <Boton variante="texto" type="button" onClick={olvidar}>
            Cancelar
          </Boton>
        </div>
      </form>
    </Tarjeta>
  )
}

/** Retirar un acuerdo. Se archiva, no se borra. */
export function BotonArchivarAcuerdo({ id }: { id: string }) {
  const [, empezar] = useTransition()

  return (
    <button
      type="button"
      onClick={() => empezar(() => void archivarAcuerdo(id))}
      className="pulsable shrink-0 text-[12.5px] text-[var(--color-tinta-tenue)] hover:text-[var(--color-acento)]"
    >
      Ya no
    </button>
  )
}

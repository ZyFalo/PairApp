"use client"

import { RiInboxUnarchiveLine } from "@remixicon/react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Aviso, Tarjeta } from "@/componentes/base"
import { abrirLoQueMeDejo } from "@/lib/acciones/entregas"

/**
 * El botón discreto de RF-3.4: *«Hay algo que te dejé. ¿Quieres leerlo?»*
 *
 * Un botón y no el mensaje abierto, y ahí está la diferencia entera: el mensaje
 * se entrega **cuando ella lo pide**. Empujado solo, en el pico de un mal
 * momento, un mensaje de amor se lee como invalidación.
 *
 * Al abrirlo pasa a ser una entrega normal y lo recoge la pantalla de siempre,
 * con su amortiguador y su respuesta. Aquí no se duplica nada de eso.
 *
 * Vive en su propio fichero porque es lo único de este módulo que necesita
 * cliente. La tarjeta que lo envuelve se queda en el servidor, que es donde se
 * resuelven los iconos y las fechas.
 */
export function BotonDeReserva({
  mensajeId,
  nombrePareja,
}: {
  mensajeId: string
  nombrePareja: string | null
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [ocupado, empezar] = useTransition()

  return (
    <Tarjeta className="aparece space-y-3">
      <p className="carta text-[17px] leading-snug">
        Hay algo que {nombrePareja ?? "te"} dejó guardado.
      </p>
      <button
        type="button"
        disabled={ocupado}
        onClick={() =>
          empezar(async () => {
            const resultado = await abrirLoQueMeDejo(mensajeId)
            if (resultado.error) setError(resultado.error)
            else router.refresh()
          })
        }
        className="pulsable inline-flex items-center gap-2 text-[14px] text-[var(--color-acento)]"
      >
        <RiInboxUnarchiveLine size={16} />
        {ocupado ? "Abriendo…" : "Leerlo ahora"}
      </button>
      <Aviso>{error}</Aviso>
    </Tarjeta>
  )
}

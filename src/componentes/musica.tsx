"use client"

import { useActionState, useEffect } from "react"
import { Aviso, Boton, Campo, Seleccion, Tarjeta } from "@/componentes/base"
import { dedicarCancion } from "@/lib/acciones/nosotros"
import { useBorrador } from "@/lib/borrador"

/**
 * Dedicatorias musicales (M8). Solo enlace pegado: sin API de Spotify, sin
 * OAuth, sin claves que caduquen (D28). El enlace da el 95 % del valor.
 */

/** Cuándo entregar una dedicatoria (RF-8.1). */
const FRANJAS = [
  { valor: "MANANA", texto: "Por la mañana" },
  { valor: "TARDE", texto: "Media tarde" },
  { valor: "NOCHE", texto: "Por la noche" },
]

/** Dedicar una canción por enlace pegado (RF-8.2). */
export function FormularioCancion() {
  const [estado, accion, pendiente] = useActionState(dedicarCancion, {})
  const [borrador, actualizar, olvidar] = useBorrador("nosotros:cancion", {
    abierto: false,
    url: "",
    mensaje: "",
    franja: "TARDE",
  })

  useEffect(() => {
    if (estado.ok) olvidar()
  }, [estado.ok, olvidar])

  if (!borrador.abierto) {
    return (
      <Boton variante="suave" onClick={() => actualizar({ abierto: true })} className="w-full">
        Dedicar una canción
      </Boton>
    )
  }

  return (
    <Tarjeta className="aparece">
      <form action={accion} className="space-y-3">
        <Campo
          etiqueta="Enlace (YouTube, Spotify…)"
          name="url"
          type="url"
          required
          autoFocus
          placeholder="https://"
          value={borrador.url}
          onChange={(e) => actualizar({ url: e.target.value })}
        />
        <Campo
          etiqueta="Dedicatoria (opcional)"
          name="mensaje"
          maxLength={500}
          value={borrador.mensaje}
          onChange={(e) => actualizar({ mensaje: e.target.value })}
        />
        <Seleccion
          etiqueta="¿Cuándo le llega?"
          name="franja"
          opciones={FRANJAS}
          valor={borrador.franja}
          onCambio={(v) => actualizar({ franja: v })}
        />
        <Aviso>{estado.error}</Aviso>
        <div className="flex gap-2">
          <Boton type="submit" disabled={pendiente} className="flex-1">
            {pendiente ? "Dedicando…" : "Dedicar"}
          </Boton>
          <Boton variante="texto" type="button" onClick={olvidar}>
            Cancelar
          </Boton>
        </div>
      </form>
    </Tarjeta>
  )
}

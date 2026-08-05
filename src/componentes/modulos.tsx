"use client"

import { useState, useTransition } from "react"
import { Apunte, Interruptor } from "@/componentes/base"
import { cambiarModulo } from "@/lib/acciones/ajustes"
import { type ClaveModulo, MODULOS, type ModulosDelVinculo } from "@/lib/motor/modulos"

/**
 * Qué usa esta pareja (RF-0.7).
 *
 * **Este componente es el único sitio donde se elige.** Lo pintan la pantalla
 * de «empezar» y la de «Yo», y por eso no hay dos verdades que puedan
 * divergir: el onboarding no es una copia de los ajustes, es la primera vez que
 * se ven los mismos ajustes.
 *
 * Se pregunta por ellos y no por funciones —«¿Veis series juntos?» y no
 * «¿activar el módulo de series?»—: nadie sabe si quiere un módulo, y todo el
 * mundo sabe si ve series con su pareja. Las preguntas están en el motor.
 *
 * Todo encendido de partida. Apagado por defecto significa que nadie descubre
 * nada, y apagar aquí no borra: lo escrito vuelve intacto al encender.
 */
export function EleccionDeModulos({
  modulos,
  ultimoCambio,
}: {
  modulos: ModulosDelVinculo
  /** Quién los tocó por última vez. Un cambio compartido no puede ser mudo. */
  ultimoCambio: { nombre: string; cuando: string; mio: boolean } | null
}) {
  const [puestos, setPuestos] = useState(modulos)
  const [, empezar] = useTransition()

  function alternar(clave: ClaveModulo, activo: boolean) {
    setPuestos((previos) => ({ ...previos, [clave]: activo }))
    empezar(async () => {
      await cambiarModulo(clave, activo)
    })
  }

  return (
    <div className="space-y-5">
      {MODULOS.map((modulo) => (
        <Interruptor
          key={modulo.clave}
          etiqueta={modulo.pregunta}
          explica={modulo.explica}
          activo={puestos[modulo.clave]}
          alGuardar={(activo) => alternar(modulo.clave, activo)}
        />
      ))}

      {/* Que un cambio no aparezca de la nada: si una pestaña desaparece, aquí
          está quién la quitó. Sin aviso ni notificación — se dice donde se va
          a mirar (RF-6.4.2). */}
      {ultimoCambio && (
        <Apunte>
          {ultimoCambio.mio
            ? `Lo cambiaste tú ${ultimoCambio.cuando}.`
            : `${ultimoCambio.nombre} lo cambió ${ultimoCambio.cuando}.`}
        </Apunte>
      )}
    </div>
  )
}

"use client"

import { useActionState, useState, useTransition } from "react"
import { Aviso, Interruptor, Seleccion } from "@/componentes/base"
import {
  cambiarCompartirAnimo,
  cambiarRegistroCiclo,
  cambiarVentanasOnce,
} from "@/lib/acciones/nosotros"

/**
 * Los dos interruptores de «Yo». Los dos hacen lo mismo en el fondo: decidir
 * qué existe y qué se ve. Ninguno se deduce de nada — se encienden a mano.
 */

/**
 * Encender o apagar el registro de ciclo (RF-5.0).
 *
 * Es un interruptor propio y explícito. La app **no** decide quién menstrúa a
 * partir de cómo alguien eligió que la nombren: "agradecido" o "agradecida" es
 * una cuestión de gramática, no del cuerpo, y confundir las dos cosas sería
 * exactamente la inferencia que RF-5.3 prohíbe.
 */
export function InterruptorCiclo({ activo }: { activo: boolean }) {
  const [puesto, setPuesto] = useState(activo)
  const [, empezar] = useTransition()

  return (
    <Interruptor
      etiqueta="Llevar el registro de mi ciclo"
      explica="Apagarlo no borra nada: vuelve intacto al encenderlo."
      activo={puesto}
      alGuardar={(siguiente) => {
        setPuesto(siguiente)
        empezar(() => void cambiarRegistroCiclo(siguiente))
      }}
    />
  )
}

/**
 * Dejar que la otra persona vea mi ánimo día a día en el calendario (RF-1.5).
 *
 * Existe porque el calendario cambia la naturaleza del dato. Hasta ahora ella
 * solo veía mi estado **actual**, que caduca a las ocho horas (RF-3.0.7.7); un
 * mes entero es otra cosa. "Hoy estoy triste" y "mira mis últimos treinta días"
 * no son la misma frase, y dar la segunda por dicha al decir la primera sería
 * inferir — justo lo que §1.2 prohíbe.
 *
 * No anula lo que se eligió en cada registro: un día marcado como privado sigue
 * sin aparecer. Los dos controles se multiplican, nunca se pisan.
 */
/** Las cuatro respuestas a «¿cuándo se abre esto para mí?» (RF-12.1, RF-12.8). */
const VENTANAS = [
  { valor: "AMBAS", texto: "Mañana y noche" },
  { valor: "MANANA", texto: "Solo la de la mañana" },
  { valor: "NOCHE", texto: "Solo la de la noche" },
  { valor: "NINGUNA", texto: "No participar" },
]

/**
 * En qué ventanas de los 11:11 participo (RF-12.1), incluida la de salirme
 * (RF-12.8).
 *
 * Un solo desplegable y no dos interruptores porque son la misma pregunta, y
 * dos controles para una pregunta obligan a pensar en qué combinación quieres.
 *
 * **La otra persona no se entera de nada**, y no hace falta esconderlo: dejar
 * de pedir ya era indistinguible de haberse olvidado (RF-12.5). Salirse tampoco
 * quema el archivo — la colección sigue abierta y lo que ella deje se lee igual.
 *
 * Se guarda al elegir, sin botón: un ajuste con «Guardar» es un ajuste que la
 * mitad de la gente deja a medias.
 */
export function VentanasDelOnce({ actual }: { actual: string }) {
  const [estado, accion] = useActionState(cambiarVentanasOnce, {})
  const [elegida, setElegida] = useState(actual)
  const [, empezar] = useTransition()

  /**
   * Sin `<form>`: elegir cambia el estado de la pantalla en el mismo gesto que
   * envía, y el envío nativo leería el desplegable a medio actualizar. Es el
   * segundo patrón de las reglas del proyecto, el que costó un bug en su día.
   */
  function elegir(valor: string) {
    setElegida(valor)
    const datos = new FormData()
    datos.set("ventanasOnce", valor)
    empezar(() => accion(datos))
  }

  return (
    <div className="space-y-2">
      <Seleccion
        etiqueta="Los 11:11"
        name="ventanasOnce"
        opciones={VENTANAS}
        valor={elegida}
        onCambio={elegir}
      />
      <span className="block text-[12.5px] leading-relaxed text-[var(--color-tinta-tenue)]">
        {elegida === "NINGUNA"
          ? "No se abrirá la ventana ni te llegará el aviso. Lo ya escrito sigue en la colección."
          : "Nadie se entera de lo que elijas aquí."}
      </span>
      <Aviso>{estado.error}</Aviso>
    </div>
  )
}

export function InterruptorCompartirAnimo({
  activo,
  nombrePareja,
}: {
  activo: boolean
  nombrePareja: string | null
}) {
  const [puesto, setPuesto] = useState(activo)
  const [, empezar] = useTransition()

  return (
    <Interruptor
      etiqueta={`Que ${nombrePareja ?? "la otra persona"} vea mi ánimo en el calendario`}
      explica="Solo los días que no marcaste como privados. Los de «solo el color» siguen sin nombrar la emoción."
      activo={puesto}
      alGuardar={(siguiente) => {
        setPuesto(siguiente)
        empezar(() => void cambiarCompartirAnimo(siguiente))
      }}
    />
  )
}

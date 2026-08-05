import { RiHeart2Line, RiNotification3Line, RiSettings3Line } from "@remixicon/react"
import { Seccion } from "@/componentes/base"
import { Esqueleto, HojaFantasma } from "@/componentes/esqueleto"

/**
 * Lo que se ve al entrar en «Yo» mientras llegan los ajustes.
 *
 * Los tres encabezados van **de verdad**, con su icono: no dependen de ningún
 * dato y siempre están los tres. Lo único que se finge es el nombre —ese sí
 * depende de quién entre— y el contenido de cada sección.
 *
 * **«Mi ciclo» no se dibuja.** Aparece o no según lo haya encendido la persona,
 * y adivinarlo sería inventar: media pantalla enseñando una sección que quizá
 * no existe es peor que empezar sin ella (§1.2).
 */
export default function Cargando() {
  return (
    <div className="space-y-8">
      <Esqueleto className="h-8 w-40" />

      <section className="space-y-3">
        <Seccion Icono={RiNotification3Line}>Avisos</Seccion>
        <HojaFantasma lineas={2} />
      </section>

      <section className="space-y-3">
        <Seccion Icono={RiSettings3Line}>Solo tuyo</Seccion>
        <HojaFantasma lineas={3} />
      </section>

      <section className="space-y-3">
        <Seccion Icono={RiHeart2Line}>Lo que usáis los dos</Seccion>
        <HojaFantasma lineas={3} />
      </section>
    </div>
  )
}

import { Titulo } from "@/componentes/base"
import { HojaFantasma } from "@/componentes/esqueleto"

/**
 * Lo que se ve al entrar en el Cofre mientras llegan los mensajes.
 *
 * **Dos fantasmas y no cinco.** No es una estimación de cuántos hay —eso sería
 * un contador con otra forma (RF-2.0.7)—: son los que caben sin llenar la
 * pantalla de huecos. Caso feo asumido a sabiendas: con el cofre vacío se ven
 * dos y luego el «todavía nada».
 *
 * El título va de verdad. Es texto que no depende de ningún dato, y fingirlo
 * con una barra gris sería inventar una espera que no existe.
 */
export default function Cargando() {
  return (
    <div className="space-y-6">
      <Titulo>Cofre</Titulo>
      <div className="h-9" />
      <div className="space-y-3">
        <HojaFantasma lineas={3} />
        <HojaFantasma lineas={2} />
      </div>
    </div>
  )
}

import {
  RiChatCheckLine,
  RiCheckLine,
  RiEyeLine,
  RiPauseCircleLine,
  RiSeedlingLine,
} from "@remixicon/react"
import { Insignia } from "@/componentes/base"

/**
 * En qué punto está algo que mandé (§3.17). Son estados automáticos: sustituyen
 * al botón de "te prometo que lo leo", que sonaba a compromiso y que, si luego
 * no se cumplía, daba más problemas de los que resolvía.
 *
 * Ninguno reprocha nada. "Lo vio" es un hecho, no una acusación; por eso no hay
 * un estado "sin responder" ni cuenta el tiempo que lleva así (RF-3.0.13.1).
 */
export function EstadoEnvio({
  esperando,
  vista,
  necesitaRato,
  respondido,
}: {
  esperando: boolean
  vista: boolean
  necesitaRato: boolean
  respondido: boolean
}) {
  if (esperando) {
    return <Insignia Icono={RiSeedlingLine}>Esperando un día suyo en que le sirva</Insignia>
  }
  if (respondido)
    return (
      <Insignia Icono={RiChatCheckLine} viva>
        Te respondió
      </Insignia>
    )
  if (necesitaRato)
    return (
      <Insignia Icono={RiPauseCircleLine} viva>
        Lo leyó · necesita un rato
      </Insignia>
    )
  if (vista) return <Insignia Icono={RiEyeLine}>Lo leyó</Insignia>
  return <Insignia Icono={RiCheckLine}>Le llegó</Insignia>
}

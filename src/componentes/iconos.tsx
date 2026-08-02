import {
  RiChat3Line,
  RiCloudyLine,
  RiEmpathizeLine,
  RiGameLine,
  RiHandHeartLine,
  RiHazeLine,
  RiHeart3Line,
  RiHeartsLine,
  RiMoonFoggyLine,
  RiOpenArmLine,
  RiPauseCircleLine,
  RiQuestionLine,
  RiRainyLine,
  RiSunLine,
  RiThunderstormsLine,
  RiTimeLine,
  RiToolsLine,
  RiWindyLine,
} from "@remixicon/react"
import type { ComponentType } from "react"
import type { CierreHilo, Emocion, GrupoEmocion, Necesidad } from "@/generated/prisma/enums"

/**
 * Todo icono de la app vive aquí. No se usan emojis en ninguna pantalla: cada
 * sistema operativo los dibuja distinto, no se pueden colorear, y su registro
 * gráfico —caras amarillas— choca con el papel y la tinta de §8.2.
 */
export type Icono = ComponentType<{ size?: number | string; className?: string }>

/**
 * Las nueve emociones son **clima**, no caras.
 *
 * Es la metáfora que sostiene todo el documento: un estado de ánimo pasa, viene
 * de fuera y no es culpa de nadie. Una cara enfadada señala a una persona; una
 * tormenta solo describe el día. Por eso ninguna emoción difícil se dibuja con
 * un gesto humano (§1.2: aquí no se juzga a nadie).
 *
 * Las dos que hablan de la otra persona —gratitud y añoranza— sí llevan manos y
 * corazones: no describen mi clima, describen el vínculo.
 */
export const ICONO_EMOCION: Record<Emocion, Icono> = {
  BIEN: RiSunLine,
  AGRADECIDO: RiHandHeartLine,
  TE_EXTRANO: RiHeartsLine,
  TRISTE: RiRainyLine,
  ME_SIENTO_SOLO: RiMoonFoggyLine,
  PREOCUPADO: RiCloudyLine,
  INCOMODO: RiWindyLine,
  APENADO: RiHazeLine,
  ENOJADO: RiThunderstormsLine,
}

/** Color de cada familia. Ninguno es rojo de alarma: el rojo juzga (§M1.1.2). */
export const COLOR_GRUPO: Record<GrupoEmocion, string> = {
  ESTOY_CONTIGO: "text-[var(--color-contigo)]",
  ME_FALTA_ALGO: "text-[var(--color-falta)]",
  ALGO_PASO: "text-[var(--color-paso)]",
}

/** Fondo, borde y punto de cada familia, para las tarjetas de grupo. */
export const ESTILO_GRUPO: Record<GrupoEmocion, { fondo: string; borde: string; punto: string }> = {
  ESTOY_CONTIGO: {
    fondo: "bg-[var(--color-contigo-fondo)]",
    borde: "border-[var(--color-contigo-borde)]",
    punto: "bg-[var(--color-contigo)]",
  },
  ME_FALTA_ALGO: {
    fondo: "bg-[var(--color-falta-fondo)]",
    borde: "border-[var(--color-falta-borde)]",
    punto: "bg-[var(--color-falta)]",
  },
  ALGO_PASO: {
    fondo: "bg-[var(--color-paso-fondo)]",
    borde: "border-[var(--color-paso-borde)]",
    punto: "bg-[var(--color-paso)]",
  },
}

/** Qué necesito cuando algo me pasa (RF-1.2.4). */
export const ICONO_NECESIDAD: Record<Necesidad, Icono> = {
  ESCUCHA: RiEmpathizeLine,
  ESPACIO: RiPauseCircleLine,
  DISTRACCION: RiGameLine,
  CONTACTO: RiOpenArmLine,
  SOLUCIONES: RiToolsLine,
  NO_SE: RiQuestionLine,
}

/** Las cuatro respuestas de un toque (§3.3). */
export const ICONO_CIERRE: Record<CierreHilo, Icono> = {
  GRACIAS: RiHandHeartLine,
  TE_QUIERO: RiHeart3Line,
  HABLARLO_MAS: RiChat3Line,
  HABLAMOS_LUEGO: RiTimeLine,
}

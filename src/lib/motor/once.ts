import { DateTime } from "luxon"
import type { VentanasOnce } from "@/generated/prisma/enums"

/**
 * El ritual de los 11:11 (M12).
 *
 * Es la función más pequeña de la app y probablemente la que más se use. Vivía
 * dentro de `tiempo.ts`, que es donde acaba todo lo que mira un reloj; se sacó
 * cuando dejó de ser una cuenta de horas y pasó a tener reglas propias: quién
 * participa, en qué ventana y qué pasa si alguien se sale.
 *
 * **Es la única excepción deliberada al desfase** (RF-12.9). Todo lo demás en
 * la app va desplazado a propósito —las preguntas, los avisos, las entregas—
 * para que nada se sienta como un chat. Aquí es al revés: la gracia entera está
 * en que ocurre a la misma hora para los dos.
 */

/** Cuándo empieza el ritual y hasta dónde llega la gracia (RF-12.2). */
export const ONCE_ONCE = { hora: 11, minuto: 11, graciaMin: 4 }

/** Máximo de un deseo. Es un deseo, no una carta (RF-12.3). */
export const LARGO_MAXIMO_DESEO = 140

/**
 * Si estamos dentro de la ventana de los 11:11 (RF-12.2).
 *
 * Cuatro minutos de gracia: el minuto exacto sería precioso y frustrante. Si se
 * pasa por estar en una reunión, el ritual se convierte en una fuente de fallo.
 */
export function ventanaOnceOnce(
  zonaHoraria: string,
  ahoraUtc: Date,
): { abierta: boolean; esNoche: boolean } {
  const local = DateTime.fromJSDate(ahoraUtc, { zone: "utc" }).setZone(zonaHoraria)
  const esHora = local.hour === ONCE_ONCE.hora || local.hour === ONCE_ONCE.hora + 12
  const dentro =
    local.minute >= ONCE_ONCE.minuto && local.minute <= ONCE_ONCE.minuto + ONCE_ONCE.graciaMin
  return { abierta: esHora && dentro, esNoche: local.hour >= 12 }
}

/**
 * Si esta persona participa en esta ventana (RF-12.1, RF-12.8).
 *
 * Gobierna las cuatro puertas a la vez —el aviso del cron, la ventana en Hoy,
 * la de Nosotros y la propia acción de pedir—, y por eso es una función y no
 * una condición repetida en cuatro sitios: cuatro copias de la misma regla se
 * desincronizan a la primera.
 *
 * `NINGUNA` no silencia: saca. Quien se sale deja de pedir, y no pedir ya era
 * indistinguible de haberse olvidado, así que la otra persona no puede notarlo
 * (RF-12.5, RF-12.8).
 *
 * Lo que **no** gobierna es la lectura. Salirse del ritual no quema el archivo:
 * la colección de RF-12.6 sigue abierta y lo que ella deje se sigue viendo.
 * Dejar de pedir no es dejar de querer leerlo.
 */
export function participaEnLaVentana(ventanas: VentanasOnce, esNoche: boolean): boolean {
  if (ventanas === "NINGUNA") return false
  if (ventanas === "AMBAS") return true
  return esNoche ? ventanas === "NOCHE" : ventanas === "MANANA"
}

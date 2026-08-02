import { DateTime } from "luxon"

/**
 * Minutos de margen que tiene el despacho para disparar algo programado.
 * El cron corre cada 15 minutos (PLAN.md §0.2), así que esa es la ventana.
 */
export const VENTANA_DESPACHO_MIN = 15

/** Minuto en que empieza el ritual de los 11:11 y hasta dónde llega la gracia (RF-12.2). */
export const ONCE_ONCE = { hora: 11, minuto: 11, graciaMin: 4 }

/**
 * Si a esta persona le toca su pregunta periódica ahora mismo (RF-1.0).
 * Las horas se guardan en local de cada quien; el servidor siempre trabaja en
 * UTC y convierte solo aquí (PLAN.md §0.3).
 */
export function tocaPreguntaPeriodica(
  horasLocales: number[],
  zonaHoraria: string,
  ahoraUtc: Date,
): boolean {
  const local = DateTime.fromJSDate(ahoraUtc, { zone: "utc" }).setZone(zonaHoraria)
  return horasLocales.includes(local.hour) && local.minute < VENTANA_DESPACHO_MIN
}

/**
 * Si estamos dentro de la ventana de los 11:11 (RF-12.2).
 * Cuatro minutos de gracia: el minuto exacto sería precioso y frustrante.
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

/** Día local en formato YYYY-MM-DD, para agrupar los 11:11 de una misma jornada. */
export function diaLocal(zonaHoraria: string, momentoUtc: Date): string {
  return DateTime.fromJSDate(momentoUtc, { zone: "utc" })
    .setZone(zonaHoraria)
    .toFormat("yyyy-MM-dd")
}

/** Franja del día en la zona de la persona, para entregar dedicatorias (RF-8.1). */
export function franjaActual(zonaHoraria: string, ahoraUtc: Date): "MANANA" | "TARDE" | "NOCHE" {
  const hora = DateTime.fromJSDate(ahoraUtc, { zone: "utc" }).setZone(zonaHoraria).hour
  if (hora < 12) return "MANANA"
  if (hora < 19) return "TARDE"
  return "NOCHE"
}

/**
 * Horas de pregunta para la segunda persona del vínculo: las mismas franjas
 * desplazadas una hora exacta (RF-1.0.3). Nunca coinciden las dos.
 */
export function horasDesfasadas(horasBase: number[]): number[] {
  return horasBase.map((h) => (h + 1) % 24)
}

/** Fecha y hora legible en la zona de quien mira. Sin cuentas atrás (RF-3.0.13.1). */
export function formatoLegible(momentoUtc: Date, zonaHoraria: string): string {
  return DateTime.fromJSDate(momentoUtc, { zone: "utc" })
    .setZone(zonaHoraria)
    .setLocale("es")
    .toFormat("d 'de' LLLL, HH:mm")
}

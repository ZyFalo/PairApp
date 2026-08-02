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

/**
 * Cuánto hace de algo, dicho como lo diría una persona: "ayer", "hace 3 días".
 *
 * Cuenta **días de calendario** en la zona de quien mira, no horas sueltas.
 * Escribir a las 23:00 y releer a las 10:00 son once horas, pero fue "ayer";
 * escribir a las 9:00 y releer a las 22:00 son trece y sigue siendo hoy. La
 * diferencia importa: la frase la lee alguien decidiendo qué hacer con algo
 * que escribió enojado (§6.3).
 *
 * Mira al pasado a propósito. Nunca dice cuánto falta (RF-3.0.13.1).
 */
export function haceEnPalabras(cuando: Date, ahoraUtc: Date, zonaHoraria: string): string {
  const dias = Math.round(
    -DateTime.fromJSDate(cuando, { zone: "utc" })
      .setZone(zonaHoraria)
      .startOf("day")
      .diff(
        DateTime.fromJSDate(ahoraUtc, { zone: "utc" }).setZone(zonaHoraria).startOf("day"),
        "days",
      ).days,
  )

  if (dias <= 0) return "hace unas horas"
  if (dias === 1) return "ayer"
  if (dias < 7) return `hace ${dias} días`
  return "hace más de una semana"
}

/**
 * Si esta persona ha pedido que la app se calle (§12.2, modo pausa).
 * Silencia avisos, no entregas: lo que le manden sigue llegando y la espera.
 */
export function enPausa(pausaHasta: Date | null, ahoraUtc: Date): boolean {
  return pausaHasta !== null && pausaHasta.getTime() > ahoraUtc.getTime()
}

/**
 * Hasta cuándo dura una pausa de N días, contando días enteros en la zona de
 * quien la pide. "Tres días" acaba cuando acaba el tercero, no a la misma hora
 * dentro de tres jornadas: nadie piensa en pausas de 72 horas exactas.
 */
export function finDePausa(dias: number, zonaHoraria: string, ahoraUtc: Date): Date {
  return DateTime.fromJSDate(ahoraUtc, { zone: "utc" })
    .setZone(zonaHoraria)
    .plus({ days: dias - 1 })
    .endOf("day")
    .toUTC()
    .toJSDate()
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

/**
 * Fecha de un plan, dicha como la diría una persona: "Hoy, 21:00".
 *
 * Es una fecha, no una cuenta atrás: dice cuándo es, nunca cuánto falta
 * (RF-3.0.13.1). "Faltan 3 días" mete prisa; "el 5 de agosto" solo informa.
 */
export function diaRelativo(momentoUtc: Date, zonaHoraria: string, ahoraUtc: Date): string {
  const cuando = DateTime.fromJSDate(momentoUtc, { zone: "utc" })
    .setZone(zonaHoraria)
    .setLocale("es")
  const hoy = DateTime.fromJSDate(ahoraUtc, { zone: "utc" }).setZone(zonaHoraria).startOf("day")
  const dias = cuando.startOf("day").diff(hoy, "days").days

  if (dias === 0) return `Hoy, ${cuando.toFormat("HH:mm")}`
  if (dias === 1) return `Mañana, ${cuando.toFormat("HH:mm")}`
  if (dias > 1 && dias < 7) return cuando.toFormat("cccc, HH:mm")
  return cuando.toFormat("d 'de' LLLL, HH:mm")
}

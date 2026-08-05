import { DateTime } from "luxon"

/**
 * Minutos de margen que tiene el despacho para disparar algo programado.
 * El cron corre cada 15 minutos (PLAN.md §0.2), así que esa es la ventana.
 */
export const VENTANA_DESPACHO_MIN = 15

/**
 * Un día en milisegundos. Sirve para aritmética de fechas sueltas, que se
 * guardan a medianoche UTC y no sufren cambios de horario.
 */
export const UN_DIA = 86_400_000

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
 * Una fecha sin hora: "2 de agosto de 2025".
 *
 * Para las columnas que guardan un día suelto (recuerdos, ciclos). Se lee en
 * UTC **a propósito**: esas fechas se guardan a medianoche UTC, y pasarlas por
 * una zona con desfase negativo las retrasa un día entero. Un recuerdo del 2
 * de agosto no puede aparecer como el 1 por vivir en Bogotá.
 */
export function fechaSuelta(dia: Date): string {
  return DateTime.fromJSDate(dia, { zone: "utc" }).setLocale("es").toFormat("d 'de' LLLL 'de' yyyy")
}

/**
 * Un día suelto como clave: "2026-08-02".
 *
 * Gemela de `fechaSuelta` y por el mismo motivo lee en UTC: es para colgar del
 * calendario lo que se guarda sin hora —recuerdos, periodos—, y pasarlo por una
 * zona con desfase negativo lo movería un día entero de casilla.
 *
 * Para lo que sí tiene hora —un plan, un check-in— la clave la da `diaLocal`,
 * que sí traduce a la zona de quien mira. Confundirlas coloca las cosas en el
 * día de al lado, que es el bug de calendario más difícil de ver.
 */
export function diaSuelto(dia: Date): string {
  return DateTime.fromJSDate(dia, { zone: "utc" }).toFormat("yyyy-MM-dd")
}

/**
 * El día suelto al que pertenece un instante, listo para guardar en una columna
 * `@db.Date`.
 *
 * Es el puente entre los dos relojes del proyecto: un plan es un **instante** y
 * un recuerdo es un **día sin hora**. Pasar del uno al otro sin la zona lo mueve
 * de casilla — una cena del viernes a las once de la noche se guardaría como
 * recuerdo del sábado.
 */
export function comoDiaSuelto(momento: Date, zonaHoraria: string): Date {
  return new Date(`${diaLocal(zonaHoraria, momento)}T00:00:00.000Z`)
}

/**
 * La inversa: de la clave de un día a cómo se dice. "2026-08-04" → "4 de
 * agosto de 2026".
 *
 * Existe para no repetir en cada pantalla el `new Date(dia + "T00:00:00Z")`,
 * que es fácil de escribir mal —sin la Z se lee en la zona del servidor— y
 * mueve la fecha un día sin que nada avise.
 */
export function fechaDeClave(dia: string): string {
  return fechaSuelta(new Date(`${dia}T00:00:00Z`))
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
 * Cuándo fue algo, sin techo: "ayer", "hace 3 días", "en marzo".
 *
 * `haceEnPalabras` se detiene en «hace más de una semana» porque se escribió
 * para el buzón en frío, donde nada tiene más de un día. Aquí hace falta llegar
 * más atrás: RF-3.11.2 pide literalmente *«Esto lo guardaste en marzo»*, y esa
 * frase es media función — lo que la hace sonar a alguien y no a un sistema.
 *
 * El año solo se dice si no es este. «En marzo de 2026» estando en 2026 es la
 * clase de precisión que delata a una máquina.
 */
export function cuandoFue(cuando: Date, ahoraUtc: Date, zonaHoraria: string): string {
  const fecha = DateTime.fromJSDate(cuando, { zone: "utc" }).setZone(zonaHoraria).setLocale("es")
  const hoy = DateTime.fromJSDate(ahoraUtc, { zone: "utc" }).setZone(zonaHoraria)
  const dias = Math.round(-fecha.startOf("day").diff(hoy.startOf("day"), "days").days)

  if (dias < 7) return haceEnPalabras(cuando, ahoraUtc, zonaHoraria)
  return fecha.year === hoy.year
    ? `en ${fecha.toFormat("LLLL")}`
    : `en ${fecha.toFormat("LLLL 'de' yyyy")}`
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

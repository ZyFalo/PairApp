import { UN_DIA } from "./tiempo"

/**
 * Estimación del próximo periodo (RF-5.2).
 *
 * Todo lo de aquí es una **estimación** y la interfaz tiene que decirlo con esa
 * palabra. Un cuerpo no es un calendario: presentar un cálculo como un hecho
 * invita justo a lo que §M5 quiere evitar —deducir cómo está alguien en vez de
 * preguntárselo—.
 */

/** Cuántos ciclos anteriores pesan en la media. Más allá, los viejos estorban. */
export const CICLOS_PARA_ESTIMAR = 6

/** Cuánto se asume que dura un periodo si no se marcó el último día (RF-5.1). */
export const DIAS_DE_PERIODO = 5

/**
 * Cuándo deja de estar en curso un periodo.
 *
 * Las fechas se guardan como días sueltos, sin hora. El último día tiene que
 * contar entero: un periodo que acaba "el día 2" no termina a las 00:00 de ese
 * día, así que el corte va al comenzar el siguiente.
 *
 * Vivía dentro de la página de Nosotros, que es una capa donde no puede estar
 * una regla del dominio. Ahora la usan la pantalla y el calendario.
 */
export function finDelPeriodo(ciclo: { inicio: Date; fin: Date | null }): Date {
  const ultimoDia = ciclo.fin ?? new Date(ciclo.inicio.getTime() + (DIAS_DE_PERIODO - 1) * UN_DIA)
  return new Date(ultimoDia.getTime() + UN_DIA)
}

/** Si un periodo está en curso ahora mismo. */
export function enCurso(ciclo: { inicio: Date; fin: Date | null }, ahora: Date): boolean {
  return ciclo.inicio <= ahora && ahora < finDelPeriodo(ciclo)
}

/**
 * Separación plausible entre dos periodos, en días. Fuera de esta horquilla se
 * descarta el dato: casi siempre es una fecha mal escrita, y una sola cifra
 * absurda arruinaría la media de todo el historial.
 */
export const DIAS_MINIMOS = 15
export const DIAS_MAXIMOS = 60

export type Estimacion = {
  /** Cuándo se estima que empieza el siguiente. */
  proximoInicio: Date
  /** Media de días entre periodos, redondeada. */
  duracionMedia: number
  /** Sobre cuántos ciclos se ha calculado. Cuantos menos, menos fiable. */
  sobre: number
}

/**
 * Estima cuándo toca el siguiente periodo a partir de los anteriores.
 *
 * Recibe las fechas de inicio **de la más reciente a la más antigua**, que es
 * como las devuelve la consulta. Con menos de dos no hay nada que estimar y
 * devuelve `null`: es mejor no decir nada que inventarse un número.
 */
export function estimarProximoCiclo(iniciosDesc: Date[]): Estimacion | null {
  if (iniciosDesc.length < 2) return null

  const separaciones: number[] = []
  for (let i = 0; i < iniciosDesc.length - 1 && separaciones.length < CICLOS_PARA_ESTIMAR; i++) {
    const dias = Math.round((iniciosDesc[i].getTime() - iniciosDesc[i + 1].getTime()) / UN_DIA)
    if (dias >= DIAS_MINIMOS && dias <= DIAS_MAXIMOS) separaciones.push(dias)
  }

  if (separaciones.length === 0) return null

  const duracionMedia = Math.round(
    separaciones.reduce((suma, dias) => suma + dias, 0) / separaciones.length,
  )

  return {
    proximoInicio: new Date(iniciosDesc[0].getTime() + duracionMedia * UN_DIA),
    duracionMedia,
    sobre: separaciones.length,
  }
}

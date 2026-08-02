/**
 * Buzón en frío (§6.3) y retirada (§6.4).
 *
 * Las dos piezas responden a lo mismo: **arrepentirse tiene que ser posible**.
 * Una bloquea antes de que salga, la otra da un margen justo después. Ninguna
 * juzga lo que escribiste — la única fricción que la app puede imponer es
 * temporal, nunca editorial (P9, RF-10.6).
 */

/** Horas que un mensaje espera en frío por defecto (RF-6.3.1). */
export const HORAS_EN_FRIO = 12

/** Horquilla configurable de esa espera (RF-6.3.1). */
export const HORAS_EN_FRIO_MINIMO = 1
export const HORAS_EN_FRIO_MAXIMO = 48

/**
 * Minutos para retirar algo recién enviado (RF-6.4.1).
 *
 * Dos, no diez: pasado ese rato ya no es arrepentirse, es cambiar de opinión
 * sobre algo que la otra persona probablemente ya tiene delante.
 */
export const MINUTOS_PARA_RETIRAR = 2

/** Cuándo hay que volver a mirar un mensaje guardado en frío. */
export function finDelFrio(horas: number, ahora: Date): Date {
  const acotadas = Math.min(Math.max(horas, HORAS_EN_FRIO_MINIMO), HORAS_EN_FRIO_MAXIMO)
  return new Date(ahora.getTime() + acotadas * 3_600_000)
}

/** Si a un mensaje en frío ya le toca revisión. */
export function tocaRevisarEnFrio(enFrioHasta: Date | null, ahora: Date): boolean {
  return enFrioHasta !== null && enFrioHasta.getTime() <= ahora.getTime()
}

/**
 * Si todavía se puede retirar un mensaje enviado (RF-6.4.1).
 *
 * En cuanto lo abre, deja de poderse: retirar algo que la otra persona ya leyó
 * sería borrarle un recuerdo, no deshacer un envío.
 */
export function sePuedeRetirar(entregadaEn: Date, vistaEn: Date | null, ahora: Date): boolean {
  if (vistaEn !== null) return false
  const minutos = (ahora.getTime() - entregadaEn.getTime()) / 60_000
  return minutos < MINUTOS_PARA_RETIRAR
}

/**
 * Qué se puede hacer con un mensaje ya enviado.
 *
 * Después de la ventana o de que lo abran queda "eliminar", que **deja rastro**
 * (RF-6.4.2): la otra persona ve que hubo un mensaje y que ya no está. Borrar
 * en silencio sería reescribir la historia compartida.
 */
export type OpcionSobreEnviado = "retirar" | "eliminar"

export function opcionSobreEnviado(
  entregadaEn: Date,
  vistaEn: Date | null,
  ahora: Date,
): OpcionSobreEnviado {
  return sePuedeRetirar(entregadaEn, vistaEn, ahora) ? "retirar" : "eliminar"
}

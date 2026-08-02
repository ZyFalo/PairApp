import { EstadoTitulo } from "@/generated/prisma/enums"

/**
 * Lista de series y películas (M9) y línea de tiempo de recuerdos (M11).
 *
 * Las dos son módulos ligeros a propósito: no hay motor que gobierne nada, solo
 * listas ordenadas. La única lógica que merece prueba es la que decide por ti
 * cuando nadie decide, y la que reconoce un aniversario.
 */

/** Cómo se lee cada estado, y en qué orden se pintan (RF-9.1). */
export const ESTADOS_TITULO: { estado: EstadoTitulo; texto: string }[] = [
  { estado: EstadoTitulo.VIENDO, texto: "Viendo" },
  { estado: EstadoTitulo.POR_VER, texto: "Por ver" },
  { estado: EstadoTitulo.VISTA, texto: "Vistas" },
  { estado: EstadoTitulo.ABANDONADA, texto: "Abandonadas" },
]

/** Lo mínimo que hace falta para poder sortear un título. */
export type Sorteable = {
  id: string
  estado: EstadoTitulo
  minutos: number | null
}

/**
 * Elige una para esta noche (RF-9.7), de entre las que están por ver.
 *
 * Recibe el azar de fuera —un número entre 0 y 1— en vez de llamar a
 * `Math.random()` dentro: así se puede probar, que es lo único que separa
 * "elige al azar" de "elige la primera y nadie se entera".
 *
 * `minutosMaximos` es para las noches en que hay sueño y no da la vida para
 * tres horas. Un título sin duración conocida entra siempre: descartarlo por
 * no tener el dato sería castigar al que se escribió a mano.
 */
export function elegirParaEstaNoche<T extends Sorteable>(
  titulos: T[],
  azar: number,
  minutosMaximos?: number,
): T | null {
  const candidatas = titulos.filter(
    (t) =>
      t.estado === EstadoTitulo.POR_VER &&
      (minutosMaximos === undefined || t.minutos === null || t.minutos <= minutosMaximos),
  )

  if (candidatas.length === 0) return null

  const indice = Math.min(Math.floor(azar * candidatas.length), candidatas.length - 1)
  return candidatas[indice]
}

/** Un recuerdo, a efectos de buscar aniversarios. */
export type Aniversariable = { ocurrioEl: Date }

/**
 * Si un recuerdo cumple años justo hoy (RF-11.2).
 *
 * Compara día y mes en UTC porque la fecha se guarda como día suelto, sin
 * hora ni zona: un recuerdo del 14 de febrero es del 14 de febrero en todas
 * partes.
 */
export function cumpleAnosHoy(recuerdo: Aniversariable, hoy: Date): boolean {
  const anos = hoy.getUTCFullYear() - recuerdo.ocurrioEl.getUTCFullYear()
  if (anos < 1) return false

  return (
    recuerdo.ocurrioEl.getUTCMonth() === hoy.getUTCMonth() &&
    recuerdo.ocurrioEl.getUTCDate() === hoy.getUTCDate()
  )
}

/** Cuántos años hace. Solo tiene sentido si `cumpleAnosHoy` dijo que sí. */
export function anosDesde(recuerdo: Aniversariable, hoy: Date): number {
  return hoy.getUTCFullYear() - recuerdo.ocurrioEl.getUTCFullYear()
}

/** "Hace un año" / "Hace 3 años", que es como se dice de verdad. */
export function haceAnos(anos: number): string {
  return anos === 1 ? "Hace un año" : `Hace ${anos} años`
}

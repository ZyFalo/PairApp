import { DateTime } from "luxon"
import type { Emocion, GrupoEmocion } from "@/generated/prisma/enums"
import { finDelPeriodo } from "./ciclo"
import { diaSuelto, UN_DIA } from "./tiempo"

/**
 * La rejilla del mes (M7): qué días se pintan y qué cae en cada uno.
 *
 * Todo lo de aquí es aritmética de calendario, sin base de datos y sin reloj
 * propio. Un mes se identifica por su nombre —"2026-08"— y un día por el suyo
 * —"2026-08-04"—; con esas dos cadenas se cuelga cualquier cosa de su casilla
 * sin arrastrar objetos de fecha por media aplicación.
 *
 * La generación del `.ics` vive en `ics.ts`: exportar un plan al teléfono y
 * dibujar un mes se llamaban igual y no se parecían en nada.
 */

/** Un mes, en el formato con el que viaja por la URL: "2026-08". */
export type Mes = string

/** Un día, en el formato con el que se indexa todo lo del calendario. */
export type Dia = string

/**
 * Los días de la semana, empezando en lunes.
 *
 * Lunes primero y no domingo: es como se lee un calendario en español, y tener
 * el fin de semana junto al final es media razón por la que existe la pantalla.
 *
 * Con nombre además de inicial porque tres de las siete iniciales se repiten:
 * quien navegue con lector de pantalla oiría "eme, eme" sin saber cuál es cuál.
 */
export const DIAS_SEMANA = [
  { inicial: "L", nombre: "lunes" },
  { inicial: "M", nombre: "martes" },
  { inicial: "X", nombre: "miércoles" },
  { inicial: "J", nombre: "jueves" },
  { inicial: "V", nombre: "viernes" },
  { inicial: "S", nombre: "sábado" },
  { inicial: "D", nombre: "domingo" },
]

/** Cuántas semanas se dibujan siempre, tengan o no días dentro. */
const SEMANAS_EN_REJILLA = 6

/** El mes al que pertenece un instante, en la zona de quien mira. */
export function mesDe(momentoUtc: Date, zonaHoraria: string): Mes {
  return DateTime.fromJSDate(momentoUtc, { zone: "utc" }).setZone(zonaHoraria).toFormat("yyyy-MM")
}

/** El mes de al lado. Negativo hacia atrás; cruza el año solo. */
export function mesVecino(mes: Mes, salto: number): Mes {
  return primeroDe(mes).plus({ months: salto }).toFormat("yyyy-MM")
}

/**
 * Cómo se nombra un mes: "agosto de 2026".
 *
 * Con el año siempre, incluso en el mes en curso. Sin él, al navegar tres meses
 * hacia atrás no hay forma de saber si se cruzó diciembre.
 */
export function nombreDelMes(mes: Mes): string {
  return primeroDe(mes).setLocale("es").toFormat("LLLL 'de' yyyy")
}

/** El primer día de un mes, en UTC: la rejilla son etiquetas, no instantes. */
function primeroDe(mes: Mes): DateTime {
  return DateTime.fromISO(`${mes}-01`, { zone: "utc" })
}

/** Una casilla de la rejilla. */
export type CasillaDeMes = {
  dia: Dia
  /** El número que se escribe dentro. */
  numero: number
  /**
   * Si pertenece al mes que se está mirando. Las de los meses vecinos se pintan
   * apagadas: quitarlas dejaría huecos y la semana dejaría de leerse como fila.
   */
  esDelMes: boolean
}

/**
 * El ánimo de un día, tal y como se deja ver.
 *
 * `emocion` va en null cuando su autora eligió compartir solo el color: se
 * pinta la familia y no se nombra nada. La app no rellena lo que alguien
 * decidió callar (RF-1.3).
 */
export type CapaAnimo = { grupo: GrupoEmocion; emocion: Emocion | null }

/**
 * Una casilla con todo lo que le toca dibujar.
 *
 * El tipo vive aquí y no en la consulta que lo compone porque describe **la
 * forma de un día**, que es cosa del dominio. Dejarlo en `consultas/` obligaba
 * a la rejilla a importar de la capa de lectura solo para saber qué pinta, y
 * eso es justo lo que la prueba de capas impide.
 */
export type CasillaLlena = CasillaDeMes & {
  esHoy: boolean
  miAnimo: CapaAnimo | null
  suAnimo: CapaAnimo | null
  miCiclo: MarcaCiclo | null
  suCiclo: MarcaCiclo | null
  hayPlan: boolean
  hayRecuerdo: boolean
}

/** Todo lo que hubo o habrá un día concreto, para la hoja que se abre al tocarlo. */
export type ElDia = {
  dia: Dia
  planes: {
    id: string
    titulo: string
    inicio: Date
    notas: string | null
    anual: boolean
    /** Si ya ocurrió. Solo entonces se puede guardar como recuerdo (RF-7.7). */
    pasado: boolean
  }[]
  recuerdos: { id: string; titulo: string; nota: string | null; ocurrioEl: Date }[]
  deseos: { id: string; texto: string; mio: boolean }[]
  miAnimo: CapaAnimo | null
  suAnimo: CapaAnimo | null
  miCiclo: MarcaCiclo | null
  suCiclo: MarcaCiclo | null
  /** Lo que ella escribió que le sirve estos días, si compartió la nota (RF-5.4). */
  suNota: string | null
}

/**
 * Los días que se dibujan al mirar un mes: seis semanas completas, siempre.
 *
 * Seis y no las que hagan falta —a veces bastan cuatro— porque si la rejilla
 * cambia de alto entre meses, todo lo que va debajo salta al pasar de página.
 * Una fila vacía cuesta menos que un salto.
 */
export function rejillaDelMes(mes: Mes): CasillaDeMes[] {
  const primero = primeroDe(mes)
  // `weekday` de Luxon ya da 1 el lunes, que es justo el orden que se pinta.
  const arranque = primero.minus({ days: primero.weekday - 1 })

  return Array.from({ length: SEMANAS_EN_REJILLA * 7 }, (_, i) => {
    const fecha = arranque.plus({ days: i })
    return {
      dia: fecha.toFormat("yyyy-MM-dd"),
      numero: fecha.day,
      esDelMes: fecha.toFormat("yyyy-MM") === mes,
    }
  })
}

/**
 * De cuándo a cuándo va un mes en instantes reales, para poder preguntárselo a
 * la base de datos.
 *
 * Cubre la rejilla entera y no solo el mes: si un plan cae en uno de los días
 * vecinos que sí se dibujan, tiene que salir. Los límites van en la zona de
 * quien mira, porque una cena del 31 a las once de la noche pertenece a su día,
 * no al que diga UTC.
 */
export function limitesDeLaRejilla(mes: Mes, zonaHoraria: string): { desde: Date; hasta: Date } {
  const casillas = rejillaDelMes(mes)
  const primera = casillas[0].dia
  const ultima = casillas[casillas.length - 1].dia

  return {
    desde: DateTime.fromISO(primera, { zone: zonaHoraria }).startOf("day").toUTC().toJSDate(),
    hasta: DateTime.fromISO(ultima, { zone: zonaHoraria }).endOf("day").toUTC().toJSDate(),
  }
}

/**
 * De cuándo a cuándo va un día concreto, en la zona de quien mira.
 *
 * Se calcula con Luxon y no sumando milisegundos: hay días de 23 y de 25 horas,
 * y en un país con cambio de horario la aritmética a pelo mete o saca una hora
 * de la casilla equivocada dos veces al año.
 */
export function limitesDelDia(dia: Dia, zonaHoraria: string): { desde: Date; hasta: Date } {
  const fecha = DateTime.fromISO(dia, { zone: zonaHoraria })
  return {
    desde: fecha.startOf("day").toUTC().toJSDate(),
    hasta: fecha.endOf("day").toUTC().toJSDate(),
  }
}

/**
 * En qué día de la rejilla cae este año un evento anual (RF-7.3).
 *
 * Devuelve `null` si su aniversario no toca en ninguna de las casillas que se
 * están pintando. No se guardan copias por año: editar un cumpleaños tiene que
 * ser editar una fila, no veinte.
 *
 * El 29 de febrero se recoge al 28 en los años que no son bisiestos. La
 * alternativa —no dibujarlo tres de cada cuatro años— es peor: quien nació ese
 * día también cumple.
 */
export function aniversarioEnLaRejilla(inicio: Date, mes: Mes, zonaHoraria: string): Dia | null {
  const original = DateTime.fromJSDate(inicio, { zone: "utc" }).setZone(zonaHoraria)

  // Se prueban los tres años que la rejilla puede tocar: el del mes y sus
  // vecinos, porque enero enseña días de diciembre y diciembre, de enero.
  const anioDelMes = Number(mes.slice(0, 4))
  const casillas = new Set(rejillaDelMes(mes).map((c) => c.dia))

  for (const anio of [anioDelMes - 1, anioDelMes, anioDelMes + 1]) {
    const candidato = DateTime.fromObject(
      { year: anio, month: original.month, day: original.day },
      { zone: zonaHoraria },
    )
    // Un 29 de febrero en año común sale inválido; se retrocede al 28.
    const dia = candidato.isValid
      ? candidato
      : DateTime.fromObject({ year: anio, month: original.month }, { zone: zonaHoraria }).endOf(
          "month",
        )

    const clave = dia.toFormat("yyyy-MM-dd")
    if (casillas.has(clave)) return clave
  }

  return null
}

/** Lo mínimo que hace falta de un check-in para saber qué ánimo representa el día. */
export type Registro = { emocion: string; intensidad: number }

/**
 * Qué ánimo representa un día cuando hubo varios registros (RF-1.0: se pregunta
 * tres veces al día, así que lo normal es que haya más de uno).
 *
 * **Gana el más intenso; a igual intensidad, el último.**
 *
 * Se descartó contar cuál se repite más, que era lo primero que uno escribe.
 * Con esa regla, dos "bien" de paso tapan un enojo del cinco, y la app acabaría
 * dibujando un día tranquilo encima de uno que no lo fue. Silenciar lo difícil
 * es exactamente el fallo que esta aplicación existe para no cometer.
 *
 * La intensidad tampoco es una interpretación: es el número que esa persona
 * movió con el dedo. La app no deduce cuál pesó más — usa el que le dijeron.
 *
 * El desempate por el último es por lo mismo que "así acabó el día": entre dos
 * lecturas igual de fuertes, la de después se hizo sabiendo más.
 */
export function animoDelDia<T extends Registro>(delDia: T[]): T | null {
  return delDia.reduce<T | null>(
    (mejor, actual) => (mejor === null || actual.intensidad >= mejor.intensidad ? actual : mejor),
    null,
  )
}

/** Si un día lleva periodo registrado o solo estimado (RF-5.2). */
export type MarcaCiclo = "REGISTRADO" | "ESTIMADO"

/**
 * Qué días de la rejilla llevan marca de ciclo, y de cuál de las dos clases.
 *
 * Lo registrado y lo estimado nunca se dibujan igual: uno es un hecho que
 * alguien escribió y el otro una media aritmética. Presentarlos con la misma
 * tinta convierte un cálculo en una certeza, y de ahí a deducir cómo está
 * alguien en vez de preguntárselo hay un paso (RF-5.2).
 *
 * Lo registrado pisa a lo estimado cuando coinciden: el dato real manda.
 */
export function diasDeCiclo(
  ciclos: { inicio: Date; fin: Date | null }[],
  proximoInicio: Date | null,
): Map<Dia, MarcaCiclo> {
  const marcas = new Map<Dia, MarcaCiclo>()

  // Un periodo que aún no ha pasado no tiene último día marcado, así que dura
  // lo que dura uno cualquiera. La misma regla que en el resto del módulo.
  if (proximoInicio) {
    for (const dia of diasDelPeriodo({ inicio: proximoInicio, fin: null })) {
      marcas.set(dia, "ESTIMADO")
    }
  }

  for (const ciclo of ciclos) {
    for (const dia of diasDelPeriodo(ciclo)) marcas.set(dia, "REGISTRADO")
  }

  return marcas
}

/** Los días que ocupa un periodo. En UTC: son fechas sueltas, sin hora. */
function diasDelPeriodo(ciclo: { inicio: Date; fin: Date | null }): Dia[] {
  const hasta = finDelPeriodo(ciclo).getTime()
  const dias: Dia[] = []
  for (let t = ciclo.inicio.getTime(); t < hasta; t += UN_DIA) {
    dias.push(diaSuelto(new Date(t)))
  }
  return dias
}

/**
 * Lo que se puede dibujar de la otra persona en un mismo día, sin que la
 * pantalla haga la cuenta que RF-5.6 prohíbe.
 *
 * Su periodo y su ánimo, uno al lado del otro en la misma casilla, **son** esa
 * correlación: es el "¿estás así por la regla?" dibujado en una rejilla. Que lo
 * calcule un ojo en vez de una función no lo mejora — lo empeora, porque nadie
 * lo revisó.
 *
 * Gana la marca de ciclo y se calla el ánimo. Es lo contrario de lo intuitivo,
 * y va así porque la marca es un tramo continuo: quitarle días sueltos la haría
 * ilegible, y saber el tramo es justo para lo que ella la compartió (RF-5.5).
 * El ánimo, en cambio, se pierde solo en esos días.
 *
 * Vale para el calendario entero, celda y detalle. Si el día se abriera y ahí
 * apareciera lo que la casilla calla, esto sería teatro.
 */
export function loQueSeVeDeElla<A, C>(
  animo: A | null,
  ciclo: C | null,
): { animo: A | null; ciclo: C | null } {
  return ciclo !== null ? { animo: null, ciclo } : { animo, ciclo: null }
}

import {
  CierreHilo,
  ClaseMensaje,
  Emocion,
  GrupoEmocion,
  Necesidad,
  Visibilidad,
} from "@/generated/prisma/enums"

/**
 * Cómo se presenta cada emoción en la interfaz. El vocabulario es fijo (RF-1.1.8).
 * El icono no vive aquí: este archivo es lógica pura y no sabe de React
 * (ver `componentes/iconos.tsx`).
 */
export type FichaEmocion = {
  emocion: Emocion
  grupo: GrupoEmocion
  /** Etiqueta en masculino y femenino: la interfaz concuerda con el género del perfil (RF-1.1.9). */
  etiqueta: { masculino: string; femenino: string; neutro: string }
}

/** Las nueve emociones en su orden fijo. Nunca se reordenan por uso (RF-1.1.7). */
export const EMOCIONES: FichaEmocion[] = [
  {
    emocion: Emocion.BIEN,
    grupo: GrupoEmocion.ESTOY_CONTIGO,
    etiqueta: { masculino: "Bien", femenino: "Bien", neutro: "Bien" },
  },
  {
    emocion: Emocion.AGRADECIDO,
    grupo: GrupoEmocion.ESTOY_CONTIGO,
    etiqueta: { masculino: "Agradecido", femenino: "Agradecida", neutro: "Con gratitud" },
  },
  {
    emocion: Emocion.TE_EXTRANO,
    grupo: GrupoEmocion.ESTOY_CONTIGO,
    etiqueta: { masculino: "Te extraño", femenino: "Te extraño", neutro: "Te extraño" },
  },
  {
    emocion: Emocion.TRISTE,
    grupo: GrupoEmocion.ME_FALTA_ALGO,
    etiqueta: { masculino: "Triste", femenino: "Triste", neutro: "Triste" },
  },
  {
    emocion: Emocion.ME_SIENTO_SOLO,
    grupo: GrupoEmocion.ME_FALTA_ALGO,
    etiqueta: {
      masculino: "Me siento solo",
      femenino: "Me siento sola",
      neutro: "Me siento en soledad",
    },
  },
  {
    emocion: Emocion.PREOCUPADO,
    grupo: GrupoEmocion.ME_FALTA_ALGO,
    etiqueta: { masculino: "Preocupado", femenino: "Preocupada", neutro: "Con preocupación" },
  },
  {
    emocion: Emocion.INCOMODO,
    grupo: GrupoEmocion.ALGO_PASO,
    etiqueta: { masculino: "Incómodo", femenino: "Incómoda", neutro: "Con incomodidad" },
  },
  {
    emocion: Emocion.APENADO,
    grupo: GrupoEmocion.ALGO_PASO,
    etiqueta: { masculino: "Apenado", femenino: "Apenada", neutro: "Con pena" },
  },
  {
    emocion: Emocion.ENOJADO,
    grupo: GrupoEmocion.ALGO_PASO,
    etiqueta: { masculino: "Enojado", femenino: "Enojada", neutro: "Con enojo" },
  },
]

/** Título de cada familia, tal como se lee en la pantalla de check-in (§M1.1.2). */
export const TITULO_GRUPO: Record<GrupoEmocion, string> = {
  [GrupoEmocion.ESTOY_CONTIGO]: "Estoy contigo",
  [GrupoEmocion.ME_FALTA_ALGO]: "Me falta algo",
  [GrupoEmocion.ALGO_PASO]: "Algo pasó",
}

/** Orden en que se pintan las tres familias. */
export const ORDEN_GRUPOS: GrupoEmocion[] = [
  GrupoEmocion.ESTOY_CONTIGO,
  GrupoEmocion.ME_FALTA_ALGO,
  GrupoEmocion.ALGO_PASO,
]

const POR_EMOCION = new Map(EMOCIONES.map((f) => [f.emocion, f]))

/** Devuelve la ficha de una emoción: su grupo, icono y etiquetas. */
export function ficha(emocion: Emocion): FichaEmocion {
  const encontrada = POR_EMOCION.get(emocion)
  if (!encontrada) throw new Error(`Emoción desconocida: ${emocion}`)
  return encontrada
}

/** A qué familia pertenece una emoción. El grupo gobierna todo el motor (§3.0.15). */
export function grupoDe(emocion: Emocion): GrupoEmocion {
  return ficha(emocion).grupo
}

/** Etiqueta concordada con el género gramatical de quien la lee (RF-1.1.9). */
export function etiquetaDe(emocion: Emocion, genero: "MASCULINO" | "FEMENINO" | "NEUTRO"): string {
  const e = ficha(emocion).etiqueta
  if (genero === "MASCULINO") return e.masculino
  if (genero === "FEMENINO") return e.femenino
  return e.neutro
}

/**
 * Si un mensaje escrito desde esta emoción espera respuesta (§3.2).
 * Presencia = "estoy aquí y te quiero"; conversación = "me pasa algo y te necesito".
 *
 * El incómodo es de conversación aunque sea barato de enviar: si no esperara
 * respuesta podría ignorarse sin coste, y una incomodidad ignorada es
 * precisamente la que se acumula hasta volverse enojo.
 */
export function claseDe(emocion: Emocion): ClaseMensaje {
  return grupoDe(emocion) === GrupoEmocion.ESTOY_CONTIGO
    ? ClaseMensaje.PRESENCIA
    : ClaseMensaje.CONVERSACION
}

/**
 * Si desde esta emoción se puede guardar un mensaje para más adelante (§2.0.1).
 * Solo desde las tres cálidas: guardar es un acto de abundancia, y un mensaje
 * triste entregado cuando la otra persona esté triste duplica la tristeza en
 * vez de consolar.
 */
export function puedeGuardarseParaDespues(emocion: Emocion): boolean {
  return grupoDe(emocion) === GrupoEmocion.ESTOY_CONTIGO
}

/**
 * Si al enviar hace falta pasar por el umbral (§6.1).
 * Solo el enojo: es la única emoción cuyo mensaje puede herir a quien lo lee.
 *
 * El incómodo queda fuera a propósito (RF-1.2.1): si cuesta decirlo, nadie lo
 * dice, y la incomodidad callada es la materia prima del enojo grande de dentro
 * de tres semanas. Barato lo pequeño para evitar lo caro.
 */
export function pasaPorUmbral(emocion: Emocion, intensidad: number): boolean {
  return emocion === Emocion.ENOJADO && intensidad >= 4
}

/**
 * Si recibir un mensaje de esta emoción merece ofrecer ayuda para responder
 * (§10.3). Son los cuatro difíciles de contestar bien.
 *
 * En el MVP la ayuda se limita a ofrecer una pausa antes de responder: la capa
 * de IA llega en la fase 3 (D31).
 */
export function esDificilDeResponder(emocion: Emocion): boolean {
  return (
    emocion === Emocion.ENOJADO ||
    emocion === Emocion.TRISTE ||
    emocion === Emocion.ME_SIENTO_SOLO ||
    emocion === Emocion.APENADO
  )
}

/** Necesidad que viene marcada por defecto según la emoción (RF-1.2.4). */
export function necesidadPorDefecto(emocion: Emocion): Necesidad | null {
  if (grupoDe(emocion) === GrupoEmocion.ESTOY_CONTIGO) return null
  if (emocion === Emocion.APENADO) return null
  return Necesidad.ESCUCHA
}

/** Cómo se lee cada necesidad en la interfaz. */
export const ETIQUETA_NECESIDAD: Record<Necesidad, string> = {
  [Necesidad.ESCUCHA]: "escucha",
  [Necesidad.ESPACIO]: "espacio",
  [Necesidad.DISTRACCION]: "distracción",
  [Necesidad.CONTACTO]: "contacto",
  [Necesidad.SOLUCIONES]: "soluciones",
  [Necesidad.NO_SE]: "no sé",
}

/** Orden fijo de las necesidades en la interfaz. */
export const NECESIDADES: Necesidad[] = [
  Necesidad.ESCUCHA,
  Necesidad.ESPACIO,
  Necesidad.DISTRACCION,
  Necesidad.CONTACTO,
  Necesidad.SOLUCIONES,
  Necesidad.NO_SE,
]

/**
 * Si desde esta emoción tiene sentido preguntar qué necesito (RF-1.2).
 * Solo cuando algo va mal: nadie "necesita" nada por estar bien.
 *
 * Ojo con la diferencia respecto a `necesidadPorDefecto`: apenado entra aquí
 * —se puede pedir espacio desde la pena— pero no trae ninguna marcada, porque
 * sugerirle "escucha" a quien se siente culpable es ponerle palabras.
 */
export function admiteNecesidad(emocion: Emocion): boolean {
  return grupoDe(emocion) !== GrupoEmocion.ESTOY_CONTIGO
}

/**
 * Cuánto ve la otra persona de un check-in (RF-1.3). Registrar sin contarlo es
 * un uso legítimo: el historial propio existe aunque no se comparta (RF-1.5).
 */
export const ETIQUETA_VISIBILIDAD: Record<Visibilidad, { corta: string; explica: string }> = {
  [Visibilidad.COMPLETO]: { corta: "Lo ve", explica: "Verá cómo estás" },
  [Visibilidad.SOLO_COLOR]: { corta: "Sin detalle", explica: "Sabrá que no estás bien, nada más" },
  [Visibilidad.PRIVADO]: { corta: "Solo yo", explica: "No verá nada" },
}

/** Cómo se lee cada respuesta de un toque (§3.3). */
export const ETIQUETA_CIERRE: Record<CierreHilo, string> = {
  [CierreHilo.GRACIAS]: "Gracias",
  [CierreHilo.TE_QUIERO]: "Te quiero",
  [CierreHilo.HABLARLO_MAS]: "Quisiera hablarlo un poco más",
  [CierreHilo.HABLAMOS_LUEGO]: "Hablamos luego",
}

/** Orden fijo de las respuestas de un toque. */
export const CIERRES: CierreHilo[] = [
  CierreHilo.GRACIAS,
  CierreHilo.TE_QUIERO,
  CierreHilo.HABLARLO_MAS,
  CierreHilo.HABLAMOS_LUEGO,
]

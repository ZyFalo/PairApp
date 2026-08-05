import { DateTime } from "luxon"
import { type Emocion, GrupoEmocion, Visibilidad } from "@/generated/prisma/enums"
import { grupoDe } from "./emociones"

/**
 * Cuándo puede la app tocarle a alguien el hombro, y con qué palabras (M4).
 *
 * Un aviso es una interrupción. La app tiene que **hacerse presente** —sin
 * avisos es un diario, no una presencia— y a la vez no ser el enésimo cacharro
 * que vibra. Todo lo de aquí existe para sostener esas dos cosas a la vez.
 *
 * Las reglas viven en el motor y no repartidas por el cron porque **eran seis
 * fuentes de aviso que no se conocían entre sí**: la pregunta del día, los
 * 11:11, un mensaje guardado, una cápsula, una dedicatoria y un recordatorio de
 * plan. Cada una decidía sola, así que un martes cualquiera podían salir seis.
 */

/** El horario de silencio por defecto (RF-4.3). De once de la noche a ocho. */
export const SILENCIO = { desde: 23, hasta: 8 }

/**
 * Cuánto tiene que pasar entre dos avisos de rutina, en minutos.
 *
 * No aplica a lo que hace la otra persona: si te escribe, te enteras. Aplica a
 * lo que decide la app —la pregunta del día, una dedicatoria, un recordatorio—,
 * que es lo que se acumula sin que nadie lo haya pedido.
 */
export const MINUTOS_ENTRE_RUTINAS = 90

/**
 * A qué hora local sale la cápsula de un plan (RF-7.6).
 *
 * A las nueve y no a las cero. El cron mira si el plan es hoy, y sin esta hora
 * lo cumplía en su primera pasada tras la medianoche: una cápsula escrita para
 * una cena llegaba a las 00:07, despertando a quien la recibe con lo que se le
 * quería regalar. Llega con el día, no antes del día.
 */
export const HORA_DE_LA_CAPSULA = 9

/**
 * Qué clase de aviso es, que decide cuánto puede molestar.
 *
 * - `de_ella`: algo que la otra persona acaba de hacer. Respeta el silencio de
 *   la noche, pero nada más — enterarse de que te escribieron no puede depender
 *   de cuántas veces vibró el teléfono antes.
 * - `rutina`: algo que decide la app. Respeta el silencio **y** el espaciado.
 */
export type Clase = "de_ella" | "rutina"

/** Si la hora local cae dentro del horario de silencio (RF-4.3). */
export function enSilencio(zonaHoraria: string, ahoraUtc: Date): boolean {
  const hora = DateTime.fromJSDate(ahoraUtc, { zone: "utc" }).setZone(zonaHoraria).hour
  // Cruza la medianoche, así que es «o» y no «y».
  return hora >= SILENCIO.desde || hora < SILENCIO.hasta
}

/**
 * Si se puede avisar ahora mismo.
 *
 * El silencio no retiene entregas, solo avisos — igual que el modo pausa. Lo
 * que te manden sigue llegando y te espera al abrir: retener la entrega haría
 * que el cofre de quien escribió dijera «le llegó» cuando no es verdad, y el
 * estado de entrega es un hecho que no se puede falsear (RF-3.17.4).
 */
export function puedeAvisar(
  clase: Clase,
  zonaHoraria: string,
  ahoraUtc: Date,
  ultimoAvisoEn: Date | null,
): boolean {
  if (enSilencio(zonaHoraria, ahoraUtc)) return false
  if (clase === "de_ella") return true
  if (!ultimoAvisoEn) return true

  const minutos = (ahoraUtc.getTime() - ultimoAvisoEn.getTime()) / 60_000
  return minutos >= MINUTOS_ENTRE_RUTINAS
}

/** Cuándo quiero que me avisen de cómo está (RF-1.4). */
export type FrecuenciaDeAnimo = "SIEMPRE" | "SOLO_INTENSO" | "NUNCA"

/** A partir de qué intensidad avisa `SOLO_INTENSO`. */
export const INTENSIDAD_QUE_AVISA = 4

/**
 * Si toca avisarme de su ánimo (RF-3.0.4).
 *
 * Por defecto solo lo intenso, y no es tacañería: si vibra el teléfono cada vez
 * que la otra persona toca un botón, en una semana se silencia la app entera y
 * entonces no llega ni lo que importa.
 *
 * Lo privado no llega nunca, diga lo que diga esta preferencia: es de quien
 * registra, y manda sobre lo que prefiera quien recibe (RF-1.3).
 */
export function tocaAvisarDeSuAnimo(
  frecuencia: FrecuenciaDeAnimo,
  visibilidad: Visibilidad,
  intensidad: number,
): boolean {
  if (visibilidad === Visibilidad.PRIVADO) return false
  if (frecuencia === "NUNCA") return false
  if (frecuencia === "SIEMPRE") return true
  return intensidad >= INTENSIDAD_QUE_AVISA
}

/**
 * Qué dice el aviso de su ánimo (RF-3.0.1 a RF-3.0.5).
 *
 * Cuatro reglas a la vez, y ninguna es opcional:
 *
 * - **La ausencia no se enuncia** (RF-3.0.2). Si no dejó mensaje, no se
 *   menciona. Nunca «no te dejó nada»: eso convierte un silencio en un reproche.
 * - **Respeta lo que ella eligió compartir** (RF-3.0.3). En «solo el color», el
 *   aviso dice que no está bien y no cuál de las seis cosas es.
 * - **Nunca el texto** (RF-3.0.5, RF-4.4). «Te dejó algo», jamás el contenido.
 * - **Se atenúa por el estado de quien lee** (RF-4.1.1). Si quien va a recibir
 *   esto está en «algo pasó», se queda en el mínimo: un «Cata está enojada» en
 *   la pantalla de bloqueo a las 23:00 es una bomba, y el detalle puede esperar
 *   a que abra la app.
 */
export function textoDeSuAnimo(datos: {
  nombre: string
  emocion: Emocion
  visibilidad: Visibilidad
  etiqueta: string
  dejoMensaje: boolean
  /** El grupo de quien va a leer el aviso, si tiene un estado vigente. */
  grupoDeQuienLee: GrupoEmocion | null
}): string {
  const conMensaje = datos.dejoMensaje ? " Te dejó algo." : ""

  // Quien lo lee está mal: lo mínimo que sigue siendo cierto.
  if (datos.grupoDeQuienLee === GrupoEmocion.ALGO_PASO) {
    return `${datos.nombre} registró cómo está.${conMensaje}`
  }

  if (datos.visibilidad === Visibilidad.SOLO_COLOR) {
    const bien = grupoDe(datos.emocion) === GrupoEmocion.ESTOY_CONTIGO
    return `${datos.nombre} ${bien ? "está bien" : "no está bien"}.${conMensaje}`
  }

  return `${datos.nombre} está ${datos.etiqueta.toLowerCase()}.${conMensaje}`
}

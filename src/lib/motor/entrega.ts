import { ClaseMensaje, Emocion, GrupoEmocion } from "@/generated/prisma/enums"
import { claseDe, grupoDe } from "./emociones"

/** Horas tras las cuales un check-in deja de gobernar el motor (RF-3.0.7.7). */
export const HORAS_CADUCIDAD_ESTADO = 8

/** Cómo se le presenta a alguien un mensaje que le acaba de llegar (§3.0.15). */
export type Presentacion =
  /** Se muestra sin intermediarios. */
  | { tipo: "directo" }
  /** Algo cálido de la pareja antes de abrirlo, porque quien recibe está en carencia. */
  | { tipo: "amortiguado" }
  /** Se nombra el hecho y se ofrece elegir cuándo leerlo. */
  | { tipo: "nombrar_y_elegir"; ambosEnojados: boolean }

/** Estado de quien va a recibir un mensaje, ya resuelto a efectos del motor. */
export type EstadoReceptor = {
  emocion: Emocion
  intensidad: number
  creadoEn: Date
} | null

/**
 * Si un check-in sigue vigente. Pasadas 8 horas la app vuelve a preguntar antes
 * de decidir nada: el William de las 8:30 no es el de las 23:12 (RF-3.0.7.7).
 */
export function estadoVigente(estado: EstadoReceptor, ahora: Date): boolean {
  if (!estado) return false
  const horas = (ahora.getTime() - estado.creadoEn.getTime()) / 3_600_000
  return horas < HORAS_CADUCIDAD_ESTADO
}

/**
 * El motor entero, en una función: decide cómo presentar un mensaje entrante
 * según el grupo de quien lo recibe (§3.0.15, tabla de seis celdas).
 *
 * Un caso que no esté probado cae igualmente en una celda existente; si alguna
 * vez falla, se corrige la celda y se arregla su familia entera.
 */
export function decidirPresentacion(
  emocionDelMensaje: Emocion,
  estadoReceptor: EstadoReceptor,
  ahora: Date,
): Presentacion {
  // Lo bueno llega siempre y de inmediato: los mensajes de presencia nunca
  // se modulan, sea cual sea el estado de quien los recibe.
  if (claseDe(emocionDelMensaje) === ClaseMensaje.PRESENCIA) return { tipo: "directo" }

  // Sin estado reciente no hay nada que amortiguar: la app preguntará cómo
  // estoy antes de mostrarme nada (RF-3.0.7.8).
  if (!estadoVigente(estadoReceptor, ahora)) return { tipo: "directo" }

  const receptor = estadoReceptor as NonNullable<EstadoReceptor>
  const grupoReceptor = grupoDe(receptor.emocion)

  if (grupoReceptor === GrupoEmocion.ESTOY_CONTIGO) return { tipo: "directo" }

  // Carencia: algo cálido de ella llena justo lo que falta (RF-3.0.7.6).
  if (grupoReceptor === GrupoEmocion.ME_FALTA_ALGO) {
    return receptor.intensidad >= 3 ? { tipo: "amortiguado" } : { tipo: "directo" }
  }

  // "Algo pasó": aquí el cariño no consuela. En enojo invalida, en pena
  // aumenta la culpa. Se nombra el hecho y se deja elegir.
  const ambosEnojados =
    receptor.emocion === Emocion.ENOJADO && emocionDelMensaje === Emocion.ENOJADO
  return { tipo: "nombrar_y_elegir", ambosEnojados }
}

/**
 * Texto que encabeza la pantalla de "nombrar y elegir". Enuncia un hecho, sin
 * juicio ni consejo (§1.2).
 */
export function tituloDeAviso(presentacion: Presentacion, nombrePareja: string): string {
  if (presentacion.tipo === "nombrar_y_elegir" && presentacion.ambosEnojados) {
    return "Los dos están enojados."
  }
  return `${nombrePareja} te escribió.`
}

/**
 * Hasta cuándo se puede posponer la lectura de un mensaje difícil.
 * Tres horas en general; hasta la mañana siguiente si ambos están enojados,
 * porque dormir es la intervención más eficaz que existe para eso (RF-3.0.11).
 */
export function topeDePosponer(presentacion: Presentacion, ahora: Date): Date {
  const horas = presentacion.tipo === "nombrar_y_elegir" && presentacion.ambosEnojados ? 12 : 3
  return new Date(ahora.getTime() + horas * 3_600_000)
}

/** Cuánto dura la carencia a efectos de entregar algo guardado (RF-2.2). */
export const MINUTOS_DE_CARENCIA = 60

/**
 * Si a alguien le vendría bien ahora mismo algo que le dejaron guardado.
 *
 * Vive aquí y no en el cron porque es una regla del dominio, no de la tarea
 * programada: quién necesita qué no lo decide el reloj de un servidor.
 *
 * La ventana es corta a propósito. Un mensaje guardado llega bien cuando el
 * mal rato es de ahora; entregado seis horas después ya no consuela nada,
 * porque quien lo lee no está donde estaba.
 */
export function leVendriaBienAlgoGuardado(estado: EstadoReceptor, ahora: Date): boolean {
  if (estado === null) return false
  if (grupoDe(estado.emocion) !== GrupoEmocion.ME_FALTA_ALGO) return false
  return ahora.getTime() - estado.creadoEn.getTime() < MINUTOS_DE_CARENCIA * 60_000
}

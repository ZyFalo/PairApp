import { Emocion, GrupoEmocion } from "@/generated/prisma/enums"
import { grupoDe } from "./emociones"
import { type EstadoReceptor, estadoVigente } from "./entrega"

/**
 * Reparación (§6.8): el primer paso después de una discusión.
 *
 * Ese primer paso es casi siempre lo más difícil. No porque no se quiera dar,
 * sino porque hay que encontrar las palabras justo cuando peor se piensa. Aquí
 * están ya escritas — cuatro, y ninguna obliga a nada.
 */

/** Los cuatro gestos de RF-6.8.1, en orden de menos a más compromiso. */
export const GESTOS = [
  {
    clave: "TIEMPO",
    texto: "Necesito más tiempo",
    emocion: Emocion.INCOMODO,
    /** Lo que le llega escrito. Dicho en primera persona, sin reproche. */
    mensaje: "Necesito un poco más de tiempo antes de hablarlo. No es que no quiera.",
  },
  {
    clave: "HABLAR",
    texto: "Quiero hablar",
    emocion: Emocion.INCOMODO,
    mensaje: "Quiero que lo hablemos cuando puedas.",
  },
  {
    clave: "LO_SIENTO",
    texto: "Lo siento",
    emocion: Emocion.APENADO,
    mensaje: "Lo siento.",
  },
  {
    clave: "YA_PASO",
    texto: "Estoy bien, ya pasó",
    emocion: Emocion.BIEN,
    mensaje: "Estoy bien. Ya pasó.",
  },
] as const

export type ClaveGesto = (typeof GESTOS)[number]["clave"]

/** Busca un gesto por su clave. Devuelve `null` si no existe. */
export function gestoDe(clave: string) {
  return GESTOS.find((g) => g.clave === clave) ?? null
}

/**
 * Si toca ofrecer el botón de reparación.
 *
 * Solo cuando **los dos** están en "Algo pasó" y con estados vigentes: ahí es
 * cuando el primer paso cuesta y cuando estas palabras sirven. Ofrecerlo en
 * cualquier otro momento sería la app dando por hecho que hay una pelea, que
 * es justo la clase de interpretación que §1.2 prohíbe.
 */
export function tocaOfrecerReparacion(
  mio: EstadoReceptor,
  suyo: EstadoReceptor,
  ahora: Date,
): boolean {
  if (!estadoVigente(mio, ahora) || !estadoVigente(suyo, ahora)) return false

  const enConflicto = (estado: EstadoReceptor) =>
    estado !== null && grupoDe(estado.emocion) === GrupoEmocion.ALGO_PASO

  return enConflicto(mio) && enConflicto(suyo)
}

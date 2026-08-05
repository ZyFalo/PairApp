/**
 * El fallback (RF-3.6): qué ofrecer cuando a alguien le vendría bien algo y no
 * hay ningún mensaje guardado esperándole.
 *
 * **La regla que gobierna este fichero es la última de la escalera: «nada».**
 * No se rellena con contenido genérico ni con frases motivacionales. Si no hay
 * nada que dar, la app calla — y eso es frecuente, no excepcional.
 *
 * Esa es también la razón de que esto no sea una entrega. Lo que hay aquí ya
 * estaba en la app: un mensaje que ella misma guardó, algo que él dejó sin
 * disparador, un recuerdo de hace un año. **Se ofrece, no se empuja.** Un push
 * diciendo «te dejé algo» cuando lo único que hay es un recuerdo de 2024 sería
 * mentir sobre lo que espera al otro lado.
 */

/** Los peldaños, en el orden en que se prueban (RF-3.6). */
export type Consuelo =
  /**
   * Un mensaje que ella misma guardó en el cofre (RF-3.11.2). El mejor, y no
   * por poco: son por definición los que a ella le importaron. Ninguna
   * inferencia, ninguna IA — ella marcó que le importaba.
   */
  | { tipo: "guardado_suyo"; mensajeId: string; texto: string; cuando: Date }
  /**
   * Algo que la otra persona dejó «para cuando le sirva» y sigue sin entregar,
   * aunque sus disparadores no casen con este estado exacto (RF-2.7). Es el
   * mensaje de reserva: existe justo para cuando no hay nada más.
   */
  | { tipo: "reserva"; mensajeId: string }
  /** Un recuerdo: «hace un año hicimos esto». */
  | { tipo: "recuerdo"; recuerdoId: string; titulo: string; ocurrioEl: Date }

/** Lo que hay disponible, ya buscado. Cada lista puede venir vacía. */
export type Candidatos = {
  guardadosSuyos: { mensajeId: string; texto: string; cuando: Date }[]
  reservas: { mensajeId: string }[]
  recuerdos: { recuerdoId: string; titulo: string; ocurrioEl: Date }[]
}

/**
 * Elige qué ofrecer, o nada.
 *
 * El orden no es negociable y viene del documento: lo que ella guardó pesa más
 * que lo que él dejó, y los dos pesan más que un recuerdo. Un recuerdo es
 * bonito pero no le habla a nadie; un mensaje sí.
 *
 * Dentro de cada peldaño se coge el primero: quien construye la lista decide
 * el orden, porque es quien sabe si conviene el más reciente o el más antiguo.
 */
export function elegirConsuelo(candidatos: Candidatos): Consuelo | null {
  const guardado = candidatos.guardadosSuyos[0]
  if (guardado) return { tipo: "guardado_suyo", ...guardado }

  const reserva = candidatos.reservas[0]
  if (reserva) return { tipo: "reserva", ...reserva }

  const recuerdo = candidatos.recuerdos[0]
  if (recuerdo) return { tipo: "recuerdo", ...recuerdo }

  // El quinto peldaño, y el más importante.
  return null
}

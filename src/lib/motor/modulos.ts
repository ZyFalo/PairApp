/**
 * Qué módulos usa una pareja, y cómo se le pregunta.
 *
 * **No se pregunta por funciones, se pregunta por ellos.** «¿Veis series
 * juntos?» en vez de «¿activar el módulo de series?»: nadie sabe si quiere el
 * M9, y todo el mundo sabe si ve series con su pareja. Describir la relación
 * en vez de elegir software da respuestas más sinceras, y es la voz que ya
 * tiene el resto de la app.
 *
 * Lo que **no** está aquí, a propósito: el umbral del enojo, el buzón en frío,
 * la ventana de retirada y el amortiguador. Esos no son extras, son los frenos.
 * Un interruptor para los frenos es un interruptor que se toca justo el peor
 * día, que es cuando hacen falta (P9).
 *
 * Tampoco están el ciclo ni compartir el ánimo: esos son **míos**, viven en
 * `Usuario` y la otra persona no puede verlos ni cambiarlos (RF-5.0, RF-1.5).
 * Mezclarlos aquí convertiría un ajuste privado en una negociación.
 */

/** Las claves de los módulos que se pueden apagar. */
export type ClaveModulo = "musica" | "titulos" | "recuerdos" | "once"

/** Qué usa esta pareja. Todo encendido de partida. */
export type ModulosDelVinculo = Record<ClaveModulo, boolean>

export type FichaModulo = {
  clave: ClaveModulo
  /** La pregunta, en segunda persona del plural. Es lo que se lee en pantalla. */
  pregunta: string
  /** Qué aparece si se dice que sí. Concreto: nada de "gestiona tu contenido". */
  explica: string
}

/**
 * El orden en que se preguntan. De lo más ligero a lo más comprometido: el
 * 11:11 va primero porque cuesta cero y engancha, y los recuerdos al final
 * porque son los que piden constancia.
 */
export const MODULOS: FichaModulo[] = [
  {
    clave: "once",
    pregunta: "¿Os escribís a las 11:11?",
    explica: "Una ventana de cuatro minutos, dos veces al día, para pedir un deseo.",
  },
  {
    clave: "musica",
    pregunta: "¿Os mandáis canciones?",
    explica: "Dedicar una canción con un mensaje, que llega en la franja que elijas.",
  },
  {
    clave: "titulos",
    pregunta: "¿Veis series o películas juntos?",
    explica: "Una lista compartida, con lo que váis viendo y lo que no se ve sin el otro.",
  },
  {
    clave: "recuerdos",
    pregunta: "¿Queréis ir guardando recuerdos?",
    explica: "Momentos con su fecha. El de hoy es el «hace un año» del año que viene.",
  },
]

/** Todo encendido: lo que se aplica a un vínculo nuevo y a la migración. */
export const MODULOS_POR_DEFECTO: ModulosDelVinculo = {
  once: true,
  musica: true,
  titulos: true,
  recuerdos: true,
}

/**
 * Si esta pareja no usa ninguno de los extras.
 *
 * Sirve para no dibujar una barra de vistas de un solo elemento: con todo
 * apagado, Nosotros es el calendario y nada más, y una barra con una sola
 * pastilla es ruido que no lleva a ningún sitio.
 */
export function soloElCalendario(modulos: ModulosDelVinculo): boolean {
  return MODULOS.every((m) => !modulos[m.clave])
}

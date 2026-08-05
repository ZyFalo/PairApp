import type { TipoNovedad } from "@/generated/prisma/enums"
import type { ClaveModulo, ModulosDelVinculo } from "@/lib/motor/modulos"

/**
 * «Lo último» (RF-7.10): lo que la otra persona añadió y todavía no has visto.
 *
 * La app tiene once módulos y lo que se añade en uno no se ve desde los demás.
 * Una canción dedicada esperaba en Música a que a alguien se le ocurriera
 * entrar; un plan apuntado el martes no existía hasta que abrías el calendario.
 * El calendario juntó los hechos **con fecha**; esto junta los **recientes**,
 * que no son los mismos: una canción de esta mañana no va en ninguna casilla.
 *
 * **Lo que no es: una bandeja de entrada.** Sin número al lado, sin insignia en
 * la pestaña, sin nada que se acumule mientras no lo atiendes (RF-2.0.7). Una
 * lista que crece sola convierte a la pareja en una cola de tareas, y entonces
 * abrir la app se parece a abrir el correo del trabajo.
 *
 * Lo que impide que crezca no es la buena voluntad: **caduca sola**. Aunque no
 * toques nada, a los pocos días está vacía otra vez.
 */

/**
 * Cuántos días se queda una novedad antes de irse sola.
 *
 * Una semana porque es lo que tarda en dar la vuelta la vida de una pareja: lo
 * que se apuntó el lunes se puede ver el domingo. Más allá deja de ser nuevo y
 * pasa a ser historial, y para el historial ya está su módulo.
 */
export const DIAS_QUE_DURA = 7

/**
 * Cuántas se enseñan a la vez.
 *
 * Hay tope porque esto vive **encima** del calendario, y un panel que crece
 * empuja hacia abajo justo aquello por lo que se entra en la pantalla. Cuatro
 * líneas caben sin desplazar la rejilla en un móvil.
 *
 * Las que sobran no se anuncian. Decir «y tres más» sería el contador que este
 * módulo existe para no tener: van saliendo según se apartan las de arriba.
 */
export const CUANTAS_CABEN = 4

/** Desde cuándo cuenta algo como reciente. */
export function desdeCuandoCuenta(ahora: Date): Date {
  return new Date(ahora.getTime() - DIAS_QUE_DURA * 24 * 60 * 60 * 1000)
}

/**
 * Qué hizo, en una línea.
 *
 * En pasado y con el nombre delante, porque es el relato de un hecho, no un
 * encargo: «Cata apuntó un plan», nunca «tienes un plan pendiente». La segunda
 * forma convierte lo que hizo la otra persona en algo que le debes.
 *
 * El verbo es lo único que pone la app; el qué lo puso quien lo añadió y viaja
 * aparte, con sus palabras (§1.2).
 */
const VERBO: Record<TipoNovedad, string> = {
  PLAN: "apuntó un plan",
  CANCION: "te dedicó una canción",
  TITULO: "añadió a la lista",
  RECUERDO: "guardó un recuerdo",
  ACUERDO: "escribió un acuerdo",
}

export function queHizo(tipo: TipoNovedad, nombre: string): string {
  return `${nombre} ${VERBO[tipo]}`
}

/**
 * De qué módulo depende cada aviso. `null` = de ninguno.
 *
 * El plan vive en el calendario y el acuerdo en «Después», y ninguna de las dos
 * se puede apagar: el calendario es la pantalla de entrada, y los acuerdos son
 * un freno, no un extra (P9).
 */
const MODULO_DE: Record<TipoNovedad, ClaveModulo | null> = {
  PLAN: null,
  ACUERDO: null,
  CANCION: "musica",
  TITULO: "titulos",
  RECUERDO: "recuerdos",
}

/**
 * Si este aviso todavía lleva a algún sitio.
 *
 * Apagar un módulo esconde su pestaña, y una vista escondida **no se pinta
 * aunque se escriba su URL a mano**: se cae al calendario. Así que un aviso de
 * una canción con la música apagada te dejaba en el mes, sin explicación y sin
 * que pareciera que hubieras pulsado nada.
 *
 * Se esconde, no se aparta. Apagar no borra —las canciones siguen guardadas y
 * vuelven intactas al encender (RF-0.7)—, y su aviso hace lo mismo: si el
 * módulo vuelve dentro de dos días y el aviso sigue siendo reciente, reaparece.
 */
export function sigueLlevandoAAlgunSitio(tipo: TipoNovedad, modulos: ModulosDelVinculo): boolean {
  const modulo = MODULO_DE[tipo]
  return modulo === null || modulos[modulo]
}

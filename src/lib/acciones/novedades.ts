"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { TipoNovedad } from "@/generated/prisma/enums"
import { dbDeSesion } from "@/lib/sesion"

/**
 * Dejar constancia de lo que uno añade, y apartarlo cuando el otro ya lo vio
 * (RF-7.10).
 *
 * **Quién anota: la acción que crea la cosa**, en la misma llamada. No hay un
 * observador que mire la base y deduzca qué ha cambiado: eso sería la app
 * infiriendo, y aquí lo que no se ha dicho no se sabe (§1.2). Si mañana alguien
 * añade una función nueva y no la anota, no sale en la lista — y eso es
 * preferible a una lista que adivina.
 *
 * `anotar` sale publicada como punto de entrada remoto, porque todo export de
 * un módulo `"use server"` lo está. Es inofensiva a propósito: no recibe ni el
 * vínculo ni el autor, los saca de la sesión. Lo peor que se puede hacer con
 * ella es anotarse a uno mismo en el vínculo propio, que es exactamente lo que
 * ya se puede hacer usando la app.
 */

/**
 * Anota que alguien añadió algo. La ve **la otra persona**, nunca su autor:
 * nadie necesita que le anuncien lo suyo.
 */
export async function anotar(tipo: TipoNovedad, titulo: string, enlace: string, refId?: string) {
  const { db, sesion } = await dbDeSesion()

  // Mientras se está sola no hay a quién contárselo, y la fila quedaría ahí
  // esperando a que entre alguien para saludarle con lo de hace tres semanas.
  if (!sesion.pareja) return

  await db.novedad.create({
    data: {
      vinculoId: sesion.vinculoId,
      autorId: sesion.usuarioId,
      tipo,
      titulo: titulo.slice(0, 200),
      enlace,
      refId,
    },
  })
}

/**
 * Retira el aviso de algo que ha dejado de estar.
 *
 * La llaman los borrados. Sin esto, quitar un plan recién apuntado dejaba su
 * aviso en pie: quien lo pulsara acababa en un día que dice «no hay nada
 * apuntado en este día», sin ninguna forma de saber por qué.
 *
 * Se aparta y no se borra la fila, igual que cuando lo aparta una persona: son
 * dos formas de que el aviso deje de estar, no dos cosas distintas.
 *
 * No falla si no encuentra nada. Lo normal es que no haya nada que retirar
 * —quien borra suele ser el mismo que lo creó, y a su autor nunca se le
 * anuncia lo suyo—, y eso no es un error.
 */
export async function retirarAviso(refId: string) {
  const { db } = await dbDeSesion()

  await db.novedad.updateMany({
    where: { refId, apartadaEn: null },
    data: { apartadaEn: new Date() },
  })
}

/**
 * Quita una novedad de la lista.
 *
 * **Aparta el aviso, no la cosa.** La canción sigue en Música y el plan en el
 * calendario; por eso la fila no se borra, solo se marca. Un borrado de verdad
 * y este gesto tienen que poder distinguirse, y aquí lo único que se pierde es
 * el recordatorio.
 *
 * `updateMany` y no `update` a propósito: es de los que el cliente acotado sí
 * filtra por vínculo (ver `lib/db.ts`), así que un identificador de otra pareja
 * no encuentra nada en vez de apartarle una novedad a alguien (RNF-4).
 */
export async function apartar(id: string) {
  const { db } = await dbDeSesion()

  await db.novedad.updateMany({
    where: { id, apartadaEn: null },
    data: { apartadaEn: new Date() },
  })

  revalidatePath("/nosotros")
}

/**
 * Ir a lo que pasó, y apartarlo por el camino.
 *
 * Las dos cosas en un gesto porque ya no hay nada que avisar: acabas de ir. Si
 * hubiera que apartarlo aparte, la lista se quedaría llena de cosas ya vistas y
 * en dos días nadie le haría caso.
 *
 * El enlace sale de la fila y no del formulario: viajar por el navegador lo
 * convertiría en un sitio al que cualquiera puede hacer que te lleve la app.
 */
export async function ver(id: string) {
  const { db } = await dbDeSesion()

  // Acotado al vínculo, así que un identificador ajeno simplemente no existe.
  const novedad = await db.novedad.findFirst({ where: { id } })
  if (!novedad) redirect("/nosotros")

  await db.novedad.updateMany({ where: { id }, data: { apartadaEn: new Date() } })
  redirect(novedad.enlace)
}

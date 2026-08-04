import { comoIcs, nombreDeArchivo } from "@/lib/motor/ics"
import { dbDeSesion } from "@/lib/sesion"

export const dynamic = "force-dynamic"

/**
 * Descarga un plan como archivo de calendario (§12.2).
 *
 * La consulta va por el cliente acotado, así que un identificador de otro
 * vínculo simplemente no encuentra nada (RNF-4). Se usa `findFirst` y no
 * `findUnique` justo por eso: es de las operaciones que sí llevan el filtro.
 */
export async function GET(_peticion: Request, contexto: { params: Promise<{ id: string }> }) {
  const { id } = await contexto.params
  const { db } = await dbDeSesion()

  const evento = await db.evento.findFirst({ where: { id } })
  if (!evento) return new Response("No encontramos ese plan", { status: 404 })

  const archivo = comoIcs(
    { id: evento.id, titulo: evento.titulo, inicio: evento.inicio, notas: evento.notas },
    new Date(),
  )

  return new Response(archivo, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="${nombreDeArchivo(evento.titulo)}"`,
    },
  })
}

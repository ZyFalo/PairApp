import { RiCloseLine } from "@remixicon/react"
import { Apunte } from "@/componentes/base"
import { ICONO_NOVEDAD } from "@/componentes/iconos"
import type { TipoNovedad } from "@/generated/prisma/enums"
import { apartar, ver } from "@/lib/acciones/novedades"
import { queHizo } from "@/lib/motor/novedades"
import { haceEnPalabras } from "@/lib/motor/tiempo"

/** Una novedad, con lo justo para pintarla. */
export type LoQueHizo = {
  id: string
  tipo: TipoNovedad
  titulo: string
  creadaEn: Date
}

/**
 * «Lo último» (RF-7.10): lo que hizo la otra persona en cualquier módulo, junto.
 *
 * Va **encima** del calendario porque es lo único de esta pantalla que caduca.
 * El mes sigue estando mañana; una canción dedicada esta tarde, no —o mejor
 * dicho, sigue estando pero ya no es noticia, y sin un sitio donde salga no se
 * entera nadie hasta que a alguien se le ocurre entrar en Música.
 *
 * **Sin número, sin insignia y sin nada que insista.** Un contador al lado de
 * una lista convierte una conversación en una deuda (RF-2.0.7), y aquí lo que
 * se cuenta serían gestos de la otra persona: exactamente lo que no puede
 * convertirse en algo que le debes. Cuando no hay nada, esto no se dibuja —ni
 * un «no hay novedades», que es un vacío que también señala—.
 *
 * Dos salidas y las dos cierran: ir a la cosa, o quitarla de aquí. Ninguna
 * borra nada, y eso se dice debajo en vez de en cada línea (§6).
 */
export function LoUltimo({
  novedades,
  nombrePareja,
  zonaHoraria,
}: {
  novedades: LoQueHizo[]
  nombrePareja: string
  zonaHoraria: string
}) {
  if (novedades.length === 0) return null
  const ahora = new Date()

  return (
    <section className="space-y-1.5">
      {/* Una sola hoja con las líneas dentro, y no una tarjeta por novedad.
          Cuatro tarjetas sueltas con su sombra y su hueco medían más que la
          mitad del alto del móvil y dejaban el calendario fuera de la pantalla
          —justo lo que este sitio tenía que evitar—. Juntas se leen además como
          un bloque: lo que ha pasado, no cuatro cosas que hacer. */}
      <ul className="hoja divide-y divide-[var(--color-borde-suave)] overflow-hidden">
        {novedades.map((n) => (
          <li key={n.id}>
            <Fila
              novedad={n}
              texto={queHizo(n.tipo, nombrePareja)}
              cuando={haceEnPalabras(n.creadaEn, ahora, zonaHoraria)}
            />
          </li>
        ))}
      </ul>
      <Apunte className="px-1 text-[12px]">Quitar algo de aquí no lo borra.</Apunte>
    </section>
  )
}

/**
 * Una línea.
 *
 * **Dos formularios hermanos y no uno con dos botones dentro.** Un `<button>`
 * dentro de otro es un nido inválido igual que dentro de un `<a>`: el navegador
 * reestructura el DOM al leerlo y la hidratación de la pantalla entera se cae
 * en silencio (§7). Aquí el área grande es un botón y el aspa es otro, cada uno
 * con su formulario.
 *
 * El icono es el de la pestaña a la que lleva, para saber a dónde vas sin leer.
 */
function Fila({ novedad, texto, cuando }: { novedad: LoQueHizo; texto: string; cuando: string }) {
  const Icono = ICONO_NOVEDAD[novedad.tipo]

  return (
    <div className="flex items-center gap-1 pr-1.5">
      <form action={ver.bind(null, novedad.id)} className="min-w-0 flex-1">
        <button
          type="submit"
          className="pulsable flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-[var(--color-lienzo-hondo)]"
        >
          <Icono size={16} className="shrink-0 text-[var(--color-acento-suave)]" />
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] leading-snug text-[var(--color-tinta)]">
              {texto}
            </span>
            <span className="block truncate text-[12px] leading-snug text-[var(--color-tinta-tenue)]">
              {novedad.titulo} · {cuando}
            </span>
          </span>
        </button>
      </form>

      <form action={apartar.bind(null, novedad.id)}>
        <button
          type="submit"
          aria-label="Quitar de aquí"
          title="Quitar de aquí. No lo borra."
          className="pulsable rounded-full p-1.5 text-[var(--color-tinta-tenue)] hover:text-[var(--color-tinta-suave)]"
        >
          <RiCloseLine size={15} />
        </button>
      </form>
    </div>
  )
}

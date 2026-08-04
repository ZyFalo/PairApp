import { RiExternalLinkLine, RiMusic2Line, RiSeedlingLine } from "@remixicon/react"
import { Apunte, Insignia, Tarjeta, Vacio } from "@/componentes/base"
import { FormularioCancion } from "@/componentes/musica"
import { dbDeSesion } from "@/lib/sesion"

/**
 * Nuestra banda sonora (M8): todo lo dedicado, en orden (RF-8.4).
 *
 * Tiene vista propia desde que el calendario ocupó la de partida. Antes colgaba
 * debajo de la lista de planes, que es donde acaba lo que no tiene sitio.
 */
export async function VistaMusica() {
  const { db, sesion } = await dbDeSesion()
  const dedicatorias = await db.dedicatoria.findMany({ orderBy: { creadoEn: "desc" }, take: 40 })

  return (
    <div className="space-y-3">
      {dedicatorias.length === 0 ? (
        <Vacio Icono={RiMusic2Line}>Ninguna canción dedicada aún.</Vacio>
      ) : (
        <ul className="space-y-2">
          {dedicatorias.map((d) => {
            const esMia = d.autorId === sesion.usuarioId
            return (
              <li key={d.id}>
                <a href={d.url} target="_blank" rel="noreferrer" className="block">
                  <Tarjeta className="aparece flex items-center gap-3">
                    {d.miniaturaUrl ? (
                      // biome-ignore lint/performance/noImgElement: miniatura externa, sin optimización
                      <img
                        src={d.miniaturaUrl}
                        alt=""
                        className="h-12 w-20 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg bg-[var(--color-lienzo-hondo)]">
                        <RiMusic2Line size={18} className="text-[var(--color-tinta-tenue)]" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-[15px]">{d.titulo ?? d.url}</p>
                      {d.mensaje && <Apunte>{d.mensaje}</Apunte>}
                      {/* Solo se anota lo que aún no ha salido: avisar de lo ya
                          entregado sería contarle a alguien lo que ya sabe. */}
                      {esMia && !d.entregadaEn && (
                        <Insignia Icono={RiSeedlingLine}>Le llega en su momento</Insignia>
                      )}
                    </div>
                    <RiExternalLinkLine
                      size={16}
                      className="shrink-0 text-[var(--color-tinta-tenue)]"
                    />
                  </Tarjeta>
                </a>
              </li>
            )
          })}
        </ul>
      )}
      <FormularioCancion />
    </div>
  )
}

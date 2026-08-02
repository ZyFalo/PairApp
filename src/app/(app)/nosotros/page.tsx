import {
  RiCalendarEventLine,
  RiExternalLinkLine,
  RiHeartsLine,
  RiMusic2Line,
  RiSeedlingLine,
  RiSparkling2Line,
} from "@remixicon/react"
import { Apunte, Insignia, Seccion, Tarjeta, Titulo, Vacio } from "@/componentes/base"
import {
  BotonBorrarEvento,
  FormularioCancion,
  FormularioEvento,
  VentanaOnceOnce,
} from "@/componentes/nosotros"
import { diaLocal, diaRelativo, ventanaOnceOnce } from "@/lib/motor/tiempo"
import { dbDeSesion } from "@/lib/sesion"

export const dynamic = "force-dynamic"

/** Calendario, canciones, 11:11 y el ciclo compartido: la vida en común (§8.1). */
export default async function PaginaNosotros() {
  const { db, sesion } = await dbDeSesion()
  const ahora = new Date()
  const ventana = ventanaOnceOnce(sesion.zonaHoraria, ahora)
  const hoy = diaLocal(sesion.zonaHoraria, ahora)

  const [eventos, dedicatorias, onceHoy, ciclosPareja] = await Promise.all([
    db.evento.findMany({
      where: { inicio: { gte: new Date(ahora.getTime() - 12 * 3_600_000) } },
      orderBy: { inicio: "asc" },
      take: 20,
    }),
    db.dedicatoria.findMany({ orderBy: { creadoEn: "desc" }, take: 20 }),
    db.onceOnce.findMany({ where: { dia: hoy }, orderBy: { creadoEn: "asc" } }),
    sesion.pareja
      ? db.ciclo.findMany({
          where: { usuarioId: sesion.pareja.id, nivelVisibilidad: { not: "NADA" } },
          orderBy: { inicio: "desc" },
          take: 1,
        })
      : Promise.resolve([]),
  ])

  // Ella decide cuánto se ve, y "las fechas" no incluye su nota (RF-5.3).
  const suCiclo = ciclosPareja[0] ?? null
  const suNota = suCiclo?.nivelVisibilidad === "FECHAS_Y_NOTA" ? suCiclo.notaParaPareja : null
  const enSusDias =
    suCiclo !== null &&
    suCiclo.inicio <= ahora &&
    (suCiclo.fin ?? new Date(suCiclo.inicio.getTime() + 5 * 86_400_000)) >= ahora

  const yaPedi = onceHoy.some(
    (o) => o.autorId === sesion.usuarioId && o.esNoche === ventana.esNoche,
  )
  const losDos = onceHoy.filter((o) => o.esNoche === ventana.esNoche).length === 2

  return (
    <div className="space-y-8">
      <Titulo>Nosotros</Titulo>

      {/* Los 11:11 — la única función simultánea de la app (RF-12.9) */}
      {(ventana.abierta || onceHoy.length > 0) && (
        <section className="space-y-3">
          <Seccion Icono={RiSparkling2Line}>11:11</Seccion>
          {ventana.abierta && !yaPedi && <VentanaOnceOnce />}
          {losDos && (
            <p className="carta text-center text-[17px] text-[var(--color-acento)]">
              Los dos pidieron a la vez.
            </p>
          )}
          {onceHoy.length > 0 && (
            <ul className="space-y-2">
              {onceHoy.map((o) => (
                <li key={o.id}>
                  <Tarjeta className="aparece">
                    <p className="carta text-[16px]">{o.texto}</p>
                    <Apunte>
                      {o.autorId === sesion.usuarioId ? "Tú" : (sesion.pareja?.nombre ?? "Ella")}
                    </Apunte>
                  </Tarjeta>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Su ciclo, con el detalle exacto que ella eligió dar (RF-5.4). La app
          nunca traduce esto a "está sensible": eso lo escribe ella o no existe. */}
      {enSusDias && (
        <section className="space-y-3">
          <Seccion Icono={RiSeedlingLine}>
            {suNota ? `Lo que ${sesion.pareja?.nombre} necesita estos días` : "Estos días"}
          </Seccion>
          <Tarjeta>
            {suNota ? (
              <p className="carta text-[16px] leading-relaxed">{suNota}</p>
            ) : (
              <p className="text-[15px] text-[var(--color-tinta-suave)]">
                {sesion.pareja?.nombre} está en su periodo.
              </p>
            )}
          </Tarjeta>
        </section>
      )}

      {/* Calendario compartido */}
      <section className="space-y-3">
        <Seccion Icono={RiCalendarEventLine}>Próximos planes</Seccion>
        {eventos.length === 0 ? (
          <Vacio Icono={RiCalendarEventLine}>Nada apuntado todavía.</Vacio>
        ) : (
          <ul className="space-y-2">
            {eventos.map((e) => (
              <li key={e.id}>
                <Tarjeta className="aparece flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-[16px]">{e.titulo}</p>
                    <Apunte>
                      {diaRelativo(e.inicio, sesion.zonaHoraria, ahora)}
                      {!e.esDePareja && " · individual"}
                    </Apunte>
                    {e.notas && (
                      <p className="pt-1 text-[13.5px] text-[var(--color-tinta-tenue)]">
                        {e.notas}
                      </p>
                    )}
                  </div>
                  <BotonBorrarEvento id={e.id} titulo={e.titulo} />
                </Tarjeta>
              </li>
            ))}
          </ul>
        )}
        <FormularioEvento />
      </section>

      {/* Dedicatorias musicales */}
      <section className="space-y-3">
        <Seccion Icono={RiMusic2Line}>Nuestra banda sonora</Seccion>
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
      </section>

      {!sesion.pareja && (
        <p className="flex items-center justify-center gap-2 pt-2 text-center text-[13px] text-[var(--color-tinta-tenue)]">
          <RiHeartsLine size={15} />
          Cuando entre la otra persona, esto se llena entre los dos.
        </p>
      )}
    </div>
  )
}

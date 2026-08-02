import { Apunte, Tarjeta, Titulo, Vacio } from "@/componentes/base"
import { FormularioCancion, FormularioEvento, VentanaOnceOnce } from "@/componentes/nosotros"
import { diaLocal, formatoLegible, ventanaOnceOnce } from "@/lib/motor/tiempo"
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
          <h2 className="text-[15px] text-[--color-tinta-suave]">11:11</h2>
          {ventana.abierta && !yaPedi && <VentanaOnceOnce />}
          {losDos && (
            <p className="text-center font-[family-name:--font-carta] text-[17px] text-[--color-acento]">
              Los dos pidieron a la vez.
            </p>
          )}
          {onceHoy.length > 0 && (
            <ul className="space-y-2">
              {onceHoy.map((o) => (
                <li key={o.id}>
                  <Tarjeta className="aparece">
                    <p className="font-[family-name:--font-carta] text-[16px]">{o.texto}</p>
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

      {/* Nota de ciclo, si ella eligió compartirla (RF-5.4) */}
      {ciclosPareja[0]?.notaParaPareja && (
        <section className="space-y-2">
          <h2 className="text-[15px] text-[--color-tinta-suave]">
            Lo que {sesion.pareja?.nombre} necesita estos días
          </h2>
          <Tarjeta>
            <p className="font-[family-name:--font-carta] text-[16px]">
              {ciclosPareja[0].notaParaPareja}
            </p>
          </Tarjeta>
        </section>
      )}

      {/* Calendario compartido */}
      <section className="space-y-3">
        <h2 className="text-[15px] text-[--color-tinta-suave]">Próximos planes</h2>
        {eventos.length === 0 ? (
          <Vacio>Nada apuntado todavía.</Vacio>
        ) : (
          <ul className="space-y-2">
            {eventos.map((e) => (
              <li key={e.id}>
                <Tarjeta className="aparece flex items-baseline justify-between gap-3">
                  <div>
                    <p className="text-[16px]">{e.titulo}</p>
                    <Apunte>
                      {formatoLegible(e.inicio, sesion.zonaHoraria)}
                      {!e.esDePareja && " · individual"}
                    </Apunte>
                  </div>
                </Tarjeta>
              </li>
            ))}
          </ul>
        )}
        <FormularioEvento />
      </section>

      {/* Dedicatorias musicales */}
      <section className="space-y-3">
        <h2 className="text-[15px] text-[--color-tinta-suave]">Nuestra banda sonora</h2>
        {dedicatorias.length === 0 ? (
          <Vacio>Ninguna canción dedicada aún.</Vacio>
        ) : (
          <ul className="space-y-2">
            {dedicatorias.map((d) => (
              <li key={d.id}>
                <a href={d.url} target="_blank" rel="noreferrer">
                  <Tarjeta className="aparece flex items-center gap-3">
                    {d.miniaturaUrl && (
                      // biome-ignore lint/performance/noImgElement: miniatura externa, sin optimización
                      <img src={d.miniaturaUrl} alt="" className="h-12 w-20 rounded object-cover" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[15px]">{d.titulo ?? d.url}</p>
                      {d.mensaje && <Apunte>{d.mensaje}</Apunte>}
                    </div>
                  </Tarjeta>
                </a>
              </li>
            ))}
          </ul>
        )}
        <FormularioCancion />
      </section>
    </div>
  )
}

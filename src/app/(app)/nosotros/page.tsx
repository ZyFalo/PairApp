import {
  RiCalendarCheckLine,
  RiCalendarEventLine,
  RiChatHistoryLine,
  RiExternalLinkLine,
  RiFilmLine,
  RiHandHeartLine,
  RiHeartsLine,
  RiImage2Line,
  RiMusic2Line,
  RiSeedlingLine,
  RiSparkling2Line,
} from "@remixicon/react"
import Link from "next/link"
import { Apunte, Insignia, Seccion, Tarjeta, Titulo, Vacio } from "@/componentes/base"
import {
  BotonArchivarAcuerdo,
  EstadoConflicto,
  FormularioAcuerdo,
  FormularioConflicto,
} from "@/componentes/conflicto"
import {
  BotonBorrarRecuerdo,
  EligeTu,
  FilaTitulo,
  FormularioRecuerdo,
  FormularioTitulo,
} from "@/componentes/juntos"
import {
  BotonBorrarEvento,
  FormularioCancion,
  FormularioEvento,
  VentanaOnceOnce,
} from "@/componentes/nosotros"
import { anosDesde, cumpleAnosHoy, haceAnos } from "@/lib/motor/juntos"
import {
  diaLocal,
  diaRelativo,
  fechaSuelta,
  formatoLegible,
  ventanaOnceOnce,
} from "@/lib/motor/tiempo"
import { dbDeSesion } from "@/lib/sesion"

export const dynamic = "force-dynamic"

/** Selector entre las vistas de Nosotros. Gemelo del que usa el cofre. */
function PestanaVista({
  href,
  activa,
  texto,
  Icono,
}: {
  href: string
  activa: boolean
  texto: string
  Icono: typeof RiFilmLine
}) {
  return (
    <Link
      href={href}
      aria-current={activa ? "page" : undefined}
      className={`pulsable inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[var(--radius-pildora)] px-3.5 py-2 text-[13px] font-medium ${
        activa
          ? "bg-[var(--color-acento)] text-[var(--color-sobre-acento)] shadow-[var(--sombra-tinta)]"
          : "border border-[var(--color-borde)] bg-[var(--color-papel)] text-[var(--color-tinta-suave)]"
      }`}
    >
      <Icono size={15} />
      {texto}
    </Link>
  )
}

/** Cuánto se asume que dura un periodo si no se marcó el último día (RF-5.1). */
const DIAS_DE_PERIODO = 5

/**
 * Cuándo deja de estar en curso un periodo.
 *
 * Las fechas se guardan como días sueltos, sin hora. El último día tiene que
 * contar entero: un periodo que acaba "el día 2" no termina a las 00:00 de ese
 * día, así que el corte va al comenzar el siguiente.
 */
function finDelPeriodo(ciclo: { inicio: Date; fin: Date | null }): Date {
  const ultimoDia =
    ciclo.fin ?? new Date(ciclo.inicio.getTime() + (DIAS_DE_PERIODO - 1) * 86_400_000)
  return new Date(ultimoDia.getTime() + 86_400_000)
}

const VISTAS = [
  { clave: "", texto: "Ahora", Icono: RiCalendarEventLine },
  { clave: "ver", texto: "Ver juntos", Icono: RiFilmLine },
  { clave: "recuerdos", texto: "Recuerdos", Icono: RiImage2Line },
  { clave: "despues", texto: "Después", Icono: RiHandHeartLine },
] as const

/**
 * La vida en común (§8.1), repartida en cuatro vistas.
 *
 * Se partió cuando la página llegó a ocho secciones apiladas: los 11:11 duran
 * cuatro minutos y no pueden estar debajo de una lista de películas. Lo que
 * caduca va arriba y siempre; lo demás se consulta cuando se busca.
 */
export default async function PaginaNosotros({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>
}) {
  const { vista } = await searchParams
  const esVer = vista === "ver"
  const esRecuerdos = vista === "recuerdos"
  const esDespues = vista === "despues"
  const esAhora = !esVer && !esRecuerdos && !esDespues
  const { db, sesion } = await dbDeSesion()
  const ahora = new Date()
  const ventana = ventanaOnceOnce(sesion.zonaHoraria, ahora)
  const hoy = diaLocal(sesion.zonaHoraria, ahora)

  const [eventos, dedicatorias, onceHoy, ciclosPareja, acuerdos, relatos, titulos, recuerdos] =
    await Promise.all([
      db.evento.findMany({
        where: { inicio: { gte: new Date(ahora.getTime() - 12 * 3_600_000) } },
        orderBy: { inicio: "asc" },
        take: 20,
      }),
      db.dedicatoria.findMany({ orderBy: { creadoEn: "desc" }, take: 20 }),
      db.onceOnce.findMany({ where: { dia: hoy }, orderBy: { creadoEn: "asc" } }),
      // Apagar el registro apaga también lo que se ve: lo ya guardado sigue ahí
      // para cuando ella vuelva a encenderlo, pero mientras tanto no sale (RF-5.0).
      sesion.pareja?.llevaCiclo
        ? db.ciclo.findMany({
            where: { usuarioId: sesion.pareja.id, nivelVisibilidad: { not: "NADA" } },
            orderBy: { inicio: "desc" },
            take: 1,
          })
        : Promise.resolve([]),
      esDespues
        ? db.acuerdo.findMany({
            where: { archivadoEn: null },
            orderBy: { creadoEn: "desc" },
            take: 20,
          })
        : Promise.resolve([]),
      // Los míos, más los suyos que ella haya decidido compartir (RF-6.6.1).
      esDespues
        ? db.conflicto.findMany({
            where: { OR: [{ autorId: sesion.usuarioId }, { compartidoEn: { not: null } }] },
            orderBy: { creadoEn: "desc" },
            take: 10,
          })
        : Promise.resolve([]),
      esVer
        ? db.titulo.findMany({ orderBy: { creadoEn: "desc" }, take: 60, include: { votos: true } })
        : Promise.resolve([]),
      esRecuerdos
        ? db.recuerdo.findMany({ orderBy: { ocurrioEl: "desc" }, take: 60 })
        : Promise.resolve([]),
    ])

  // Ella decide cuánto se ve, y "las fechas" no incluye su nota (RF-5.3).
  const suCiclo = ciclosPareja[0] ?? null
  const suNota = suCiclo?.nivelVisibilidad === "FECHAS_Y_NOTA" ? suCiclo.notaParaPareja : null
  const enSusDias = suCiclo !== null && suCiclo.inicio <= ahora && ahora < finDelPeriodo(suCiclo)

  const yaPedi = onceHoy.some(
    (o) => o.autorId === sesion.usuarioId && o.esNoche === ventana.esNoche,
  )
  const losDos = onceHoy.filter((o) => o.esNoche === ventana.esNoche).length === 2

  return (
    <div className="space-y-8">
      <Titulo>Nosotros</Titulo>

      {/* Misma barra desplazable que el cofre: si dos sitios hacen lo mismo,
          que se vean igual. */}
      <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {VISTAS.map((v) => (
          <PestanaVista
            key={v.clave}
            href={v.clave ? `/nosotros?vista=${v.clave}` : "/nosotros"}
            activa={(vista ?? "") === v.clave}
            texto={v.texto}
            Icono={v.Icono}
          />
        ))}
      </div>

      {/* Los 11:11 — la única función simultánea de la app (RF-12.9).
          Fuera de las vistas: cuatro minutos no esperan a que cambies de
          pestaña, así que salen estés donde estés. */}
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
      {esAhora && enSusDias && (
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
      {esAhora && (
        <>
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
                      <div className="flex shrink-0 items-center gap-1">
                        {/* Al calendario del teléfono sin OAuth ni permisos (D29) */}
                        <a
                          href={`/api/evento/${e.id}/ics`}
                          aria-label={`Añadir ${e.titulo} a tu calendario`}
                          className="pulsable rounded-full p-1.5 text-[var(--color-borde)] hover:text-[var(--color-acento)]"
                        >
                          <RiCalendarCheckLine size={16} />
                        </a>
                        <BotonBorrarEvento id={e.id} titulo={e.titulo} />
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
        </>
      )}

      {esVer && (
        <>
          <EligeTu candidatas={titulos} />
          {titulos.length === 0 ? (
            <Vacio Icono={RiFilmLine}>
              Nada en la lista. Aquí van las que os vais diciendo y luego nadie recuerda.
            </Vacio>
          ) : (
            <ul className="space-y-3">
              {titulos.map((t) => (
                <li key={t.id}>
                  <FilaTitulo
                    id={t.id}
                    nombre={t.nombre}
                    estado={t.estado}
                    tipo={t.tipo}
                    soloJuntos={t.soloJuntos}
                    loPropuseYo={t.propuestoPorId === sesion.usuarioId}
                    nombrePareja={sesion.pareja?.nombre ?? null}
                    miVoto={t.votos.find((v) => v.usuarioId === sesion.usuarioId) ?? null}
                    suVoto={t.votos.find((v) => v.usuarioId !== sesion.usuarioId) ?? null}
                  />
                </li>
              ))}
            </ul>
          )}
          <FormularioTitulo />
        </>
      )}

      {esRecuerdos && (
        <>
          {recuerdos.length === 0 ? (
            <Vacio Icono={RiImage2Line}>
              Todavía nada. Un recuerdo guardado hoy es el «hace un año» del año que viene.
            </Vacio>
          ) : (
            <ul className="space-y-3">
              {recuerdos.map((r) => {
                const aniversario = cumpleAnosHoy(r, ahora)
                return (
                  <li key={r.id}>
                    <Tarjeta className="aparece space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          {aniversario && (
                            <Insignia Icono={RiSparkling2Line} viva>
                              {haceAnos(anosDesde(r, ahora))}
                            </Insignia>
                          )}
                          <p className="carta text-[17px]">{r.titulo}</p>
                          <Apunte>{fechaSuelta(r.ocurrioEl)}</Apunte>
                        </div>
                        <BotonBorrarRecuerdo id={r.id} titulo={r.titulo} />
                      </div>
                      {r.nota && (
                        <p className="carta text-[15.5px] leading-relaxed text-[var(--color-tinta-suave)]">
                          {r.nota}
                        </p>
                      )}
                    </Tarjeta>
                  </li>
                )
              })}
            </ul>
          )}
          <FormularioRecuerdo />
        </>
      )}

      {esDespues && (
        <>
          <section className="space-y-3">
            <Seccion Icono={RiHandHeartLine}>Lo que acordamos</Seccion>
            {acuerdos.length === 0 ? (
              <Vacio Icono={RiHandHeartLine}>
                Nada apuntado. Aquí van esas cosas que se dicen después y luego se olvidan.
              </Vacio>
            ) : (
              <ul className="space-y-2">
                {acuerdos.map((a) => (
                  <li key={a.id}>
                    <Tarjeta className="aparece flex items-start justify-between gap-3">
                      <p className="carta text-[16px] leading-relaxed">{a.texto}</p>
                      <BotonArchivarAcuerdo id={a.id} />
                    </Tarjeta>
                  </li>
                ))}
              </ul>
            )}
            <FormularioAcuerdo />
          </section>

          <section className="space-y-3">
            <Seccion Icono={RiChatHistoryLine}>Cuando algo pasó</Seccion>
            {relatos.length === 0 ? (
              <Apunte>
                Cuatro preguntas para ordenar una discusión: qué pasó, qué sentiste, qué necesitabas
                y qué harías distinto. Lo escribes para ti; compartirlo se decide después.
              </Apunte>
            ) : (
              <ul className="space-y-2">
                {relatos.map((r) => {
                  const esMio = r.autorId === sesion.usuarioId
                  return (
                    <li key={r.id}>
                      <Tarjeta className="aparece space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Apunte>
                            {esMio ? "Tú" : (sesion.pareja?.nombre ?? "Ella")} ·{" "}
                            {formatoLegible(r.creadoEn, sesion.zonaHoraria)}
                          </Apunte>
                          {esMio && (
                            <EstadoConflicto id={r.id} compartido={r.compartidoEn !== null} />
                          )}
                        </div>
                        <dl className="space-y-2">
                          {[
                            ["Qué pasó", r.quePaso],
                            ["Qué sentí", r.queSenti],
                            ["Qué necesitaba", r.queNecesitaba],
                            ["Qué haría distinto", r.queHariaDistinto],
                          ].map(([titulo, cuerpo]) => (
                            <div key={titulo}>
                              <dt className="text-[11.5px] font-medium uppercase tracking-[0.1em] text-[var(--color-tinta-tenue)]">
                                {titulo}
                              </dt>
                              <dd className="carta text-[15.5px] leading-relaxed">{cuerpo}</dd>
                            </div>
                          ))}
                        </dl>
                      </Tarjeta>
                    </li>
                  )
                })}
              </ul>
            )}
            <FormularioConflicto />
          </section>
        </>
      )}

      {!sesion.pareja && (
        <p className="flex items-center justify-center gap-2 pt-2 text-center text-[13px] text-[var(--color-tinta-tenue)]">
          <RiHeartsLine size={15} />
          Cuando entre la otra persona, esto se llena entre los dos.
        </p>
      )}
    </div>
  )
}

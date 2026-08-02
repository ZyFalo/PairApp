import {
  RiArchiveLine,
  RiChatQuoteLine,
  RiHistoryLine,
  RiLogoutBoxLine,
  RiNotification3Line,
  RiSeedlingLine,
  RiSettings3Line,
} from "@remixicon/react"
import Link from "next/link"
import { Apunte, Boton, Insignia, Seccion, Tarjeta, Titulo, Vacio } from "@/componentes/base"
import { COLOR_GRUPO, ESTILO_GRUPO, ICONO_EMOCION } from "@/componentes/iconos"
import {
  AccionesApunte,
  BotonDesarchivar,
  CambiarVisibilidadCiclo,
  FormularioCiclo,
  InterruptorCiclo,
  PanelPush,
} from "@/componentes/yo"
import { DestinoMensaje } from "@/generated/prisma/enums"
import { salir } from "@/lib/acciones/cuenta"
import { ETIQUETA_VISIBILIDAD, etiquetaDe, grupoDe } from "@/lib/motor/emociones"
import { formatoLegible } from "@/lib/motor/tiempo"
import { dbDeSesion } from "@/lib/sesion"

export const dynamic = "force-dynamic"

/** Mi espacio: historial, mis apuntes privados, mi ciclo y los ajustes (§8.1). */
export default async function PaginaYo({
  searchParams,
}: {
  searchParams: Promise<{ archivo?: string }>
}) {
  const { archivo } = await searchParams
  const verArchivo = archivo === "1"
  const { db, sesion } = await dbDeSesion()

  const [historial, apuntes, miCiclo] = await Promise.all([
    db.checkin.findMany({
      where: { autorId: sesion.usuarioId },
      orderBy: { creadoEn: "desc" },
      take: 14,
    }),
    db.mensaje.findMany({
      where: {
        autorId: sesion.usuarioId,
        destino: DestinoMensaje.SOLO_PARA_MI,
        archivadoEn: verArchivo ? { not: null } : null,
      },
      orderBy: { creadoEn: "desc" },
      take: 50,
    }),
    // Solo se consulta si lo llevas: quien no registra su ciclo no tiene por
    // qué ver aparecer la sección, ni siquiera vacía (RF-5.0).
    sesion.llevaCiclo
      ? db.ciclo.findFirst({
          where: { usuarioId: sesion.usuarioId },
          orderBy: { inicio: "desc" },
        })
      : Promise.resolve(null),
  ])

  return (
    <div className="space-y-8">
      <Titulo>{sesion.nombre}</Titulo>

      {/* Cosas por hablar: sin contador, que sería una deuda (RF-2.0.7) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Seccion Icono={verArchivo ? RiArchiveLine : RiChatQuoteLine}>
            {verArchivo ? "Archivadas" : "Cosas por hablar"}
          </Seccion>
          <Link
            href={verArchivo ? "/yo" : "/yo?archivo=1"}
            className="pulsable text-[12.5px] text-[var(--color-tinta-tenue)] hover:text-[var(--color-acento)]"
          >
            {verArchivo ? "Volver" : "Ver archivadas"}
          </Link>
        </div>

        {apuntes.length === 0 ? (
          <Vacio Icono={verArchivo ? RiArchiveLine : RiChatQuoteLine}>
            {verArchivo ? "No has archivado nada." : "Nada guardado para ti."}
          </Vacio>
        ) : (
          <ul className="space-y-2">
            {apuntes.map((a) => {
              const Icono = ICONO_EMOCION[a.emocion]
              return (
                <li key={a.id}>
                  <Tarjeta className="aparece space-y-3">
                    <div className="flex items-start gap-2.5">
                      <Icono
                        size={16}
                        className={`mt-1 shrink-0 ${COLOR_GRUPO[grupoDe(a.emocion)]}`}
                      />
                      <p className="carta text-[16px] leading-relaxed">{a.texto}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Apunte>{formatoLegible(a.creadoEn, sesion.zonaHoraria)}</Apunte>
                      {verArchivo ? (
                        <BotonDesarchivar mensajeId={a.id} />
                      ) : (
                        <AccionesApunte mensajeId={a.id} hayPareja={Boolean(sesion.pareja)} />
                      )}
                    </div>
                  </Tarjeta>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Historial propio. Solo mío por defecto (RF-1.5) */}
      <section className="space-y-3">
        <Seccion Icono={RiHistoryLine}>Cómo he estado</Seccion>
        {historial.length === 0 ? (
          <Vacio Icono={RiHistoryLine}>Aún no has registrado nada.</Vacio>
        ) : (
          <>
            {/* La forma de las últimas semanas de un vistazo. Sin números ni
                medias: aquí no se puntúa a nadie, y menos a uno mismo (§1.2). */}
            <div className="flex gap-1" aria-hidden>
              {[...historial].reverse().map((c) => (
                <span
                  key={c.id}
                  className={`h-8 flex-1 rounded-[3px] ${ESTILO_GRUPO[grupoDe(c.emocion)].punto} opacity-70`}
                />
              ))}
            </div>
            <ul className="space-y-1.5 pt-1">
              {historial.map((c) => {
                const Icono = ICONO_EMOCION[c.emocion]
                return (
                  <li key={c.id} className="flex items-center gap-3 text-[14px]">
                    <Icono size={17} className={COLOR_GRUPO[grupoDe(c.emocion)]} />
                    <span className="text-[var(--color-tinta)]">
                      {etiquetaDe(c.emocion, sesion.genero)}
                    </span>
                    {c.visibilidad !== "COMPLETO" && (
                      <span className="text-[12px] text-[var(--color-tinta-tenue)]">
                        {ETIQUETA_VISIBILIDAD[c.visibilidad].corta.toLowerCase()}
                      </span>
                    )}
                    <span className="ml-auto text-[12px] text-[var(--color-tinta-tenue)]">
                      {formatoLegible(c.creadoEn, sesion.zonaHoraria)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </section>

      {/* Ciclo: solo para quien lo lleva, y ella decide qué comparte (RF-5.3) */}
      {sesion.llevaCiclo && (
        <section className="space-y-3">
          <Seccion Icono={RiSeedlingLine}>Mi ciclo</Seccion>
          {miCiclo && (
            <Tarjeta className="space-y-2">
              <p className="text-[15px]">
                Último registro: {formatoLegible(miCiclo.inicio, sesion.zonaHoraria)}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Insignia>
                  {miCiclo.nivelVisibilidad === "NADA"
                    ? "No compartes nada"
                    : miCiclo.nivelVisibilidad === "SOLO_FECHAS"
                      ? "Compartes solo las fechas"
                      : "Compartes fechas y tu nota"}
                </Insignia>
                <CambiarVisibilidadCiclo
                  cicloId={miCiclo.id}
                  nivelActual={miCiclo.nivelVisibilidad}
                  notaActual={miCiclo.notaParaPareja}
                />
              </div>
            </Tarjeta>
          )}
          <FormularioCiclo />
        </section>
      )}

      <section className="space-y-3">
        <Seccion Icono={RiNotification3Line}>Avisos</Seccion>
        <PanelPush />
      </section>

      <section className="space-y-3">
        <Seccion Icono={RiSettings3Line}>Ajustes</Seccion>
        <Tarjeta>
          <InterruptorCiclo activo={sesion.llevaCiclo} />
        </Tarjeta>
      </section>

      <form action={salir}>
        <Boton variante="texto" type="submit" className="w-full">
          <span className="inline-flex items-center gap-2">
            <RiLogoutBoxLine size={16} />
            Cerrar sesión
          </span>
        </Boton>
      </form>
    </div>
  )
}

import {
  RiHistoryLine,
  RiLogoutBoxLine,
  RiNotification3Line,
  RiSeedlingLine,
  RiSettings3Line,
} from "@remixicon/react"
import { Apunte, Boton, Insignia, Seccion, Tarjeta, Titulo, Vacio } from "@/componentes/base"
import { COLOR_GRUPO, ESTILO_GRUPO, ICONO_EMOCION } from "@/componentes/iconos"
import {
  CambiarVisibilidadCiclo,
  ControlPausa,
  FormularioCiclo,
  InterruptorCiclo,
  PanelPush,
} from "@/componentes/yo"
import { salir } from "@/lib/acciones/cuenta"
import { CICLOS_PARA_ESTIMAR, estimarProximoCiclo } from "@/lib/motor/ciclo"
import { ETIQUETA_VISIBILIDAD, etiquetaDe, grupoDe } from "@/lib/motor/emociones"
import { diaRelativo, fechaSuelta, formatoLegible } from "@/lib/motor/tiempo"
import { dbDeSesion } from "@/lib/sesion"

export const dynamic = "force-dynamic"

/**
 * Mi espacio: cómo he estado, mi ciclo y los ajustes (§8.1).
 * Lo que escribí y aún no he dicho vive en su propia pestaña, no aquí.
 */
export default async function PaginaYo() {
  const { db, sesion } = await dbDeSesion()

  const [historial, ciclos] = await Promise.all([
    db.checkin.findMany({
      where: { autorId: sesion.usuarioId },
      orderBy: { creadoEn: "desc" },
      take: 14,
    }),
    // Solo se consulta si lo llevas: quien no registra su ciclo no tiene por
    // qué ver aparecer la sección, ni siquiera vacía (RF-5.0).
    sesion.llevaCiclo
      ? db.ciclo.findMany({
          where: { usuarioId: sesion.usuarioId },
          orderBy: { inicio: "desc" },
          take: CICLOS_PARA_ESTIMAR + 1,
        })
      : Promise.resolve([]),
  ])

  const miCiclo = ciclos[0] ?? null
  const estimacion = estimarProximoCiclo(ciclos.map((c) => c.inicio))

  return (
    <div className="space-y-8">
      <Titulo>{sesion.nombre}</Titulo>

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
              <p className="text-[15px]">Último registro: {fechaSuelta(miCiclo.inicio)}</p>
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

          {/* Siempre con la palabra "estimación" delante: un cuerpo no es un
              calendario, y dar el cálculo por hecho invita a deducir en vez de
              preguntar (RF-5.2). */}
          {estimacion && (
            <Tarjeta className="space-y-1">
              <p className="text-[15px]">
                Estimación del próximo:{" "}
                {diaRelativo(estimacion.proximoInicio, sesion.zonaHoraria, new Date()).split(
                  ",",
                )[0] ?? ""}
              </p>
              <Apunte>
                Sobre {estimacion.sobre} {estimacion.sobre === 1 ? "ciclo" : "ciclos"}, de{" "}
                {estimacion.duracionMedia} días de media. Es un cálculo, no una promesa.
              </Apunte>
            </Tarjeta>
          )}

          <FormularioCiclo />
        </section>
      )}

      <section className="space-y-3">
        <Seccion Icono={RiNotification3Line}>Avisos</Seccion>
        <PanelPush />
        <Tarjeta>
          <ControlPausa hasta={sesion.pausaHasta} zonaHoraria={sesion.zonaHoraria} />
        </Tarjeta>
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

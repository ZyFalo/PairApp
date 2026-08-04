import { RiChatHistoryLine, RiHandHeartLine } from "@remixicon/react"
import { Apunte, Seccion, Tarjeta, Vacio } from "@/componentes/base"
import {
  BotonArchivarAcuerdo,
  EstadoConflicto,
  FormularioAcuerdo,
  FormularioConflicto,
} from "@/componentes/conflicto"
import { formatoLegible } from "@/lib/motor/tiempo"
import { dbDeSesion } from "@/lib/sesion"

/**
 * La vista "Después" de Nosotros: acuerdos (§6.7) y relatos de conflicto (§6.6).
 *
 * Vive en su propio fichero porque es lo que menos se abre y lo que más pesa:
 * dejarla dentro de la página hacía que un día normal cargara con quinientas
 * líneas de algo que casi nunca se mira.
 *
 * Trae sus propios datos, como el resto de vistas. Recibirlos por parámetro
 * obligaba a la página a consultar acuerdos y conflictos para decidir después
 * que tocaba pintar el calendario.
 */
export async function DespuesDeUnaDiscusion() {
  const { db, sesion } = await dbDeSesion()

  const [acuerdos, relatos] = await Promise.all([
    db.acuerdo.findMany({ where: { archivadoEn: null }, orderBy: { creadoEn: "desc" }, take: 20 }),
    // Los míos, más los suyos que ella haya decidido compartir (RF-6.6.1).
    db.conflicto.findMany({
      where: { OR: [{ autorId: sesion.usuarioId }, { compartidoEn: { not: null } }] },
      orderBy: { creadoEn: "desc" },
      take: 10,
    }),
  ])

  const usuarioId = sesion.usuarioId
  const nombrePareja = sesion.pareja?.nombre ?? null
  const zonaHoraria = sesion.zonaHoraria

  return (
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
            Cuatro preguntas para ordenar una discusión: qué pasó, qué sentiste, qué necesitabas y
            qué harías distinto. Lo escribes para ti; compartirlo se decide después.
          </Apunte>
        ) : (
          <ul className="space-y-2">
            {relatos.map((r) => {
              const esMio = r.autorId === usuarioId
              return (
                <li key={r.id}>
                  <Tarjeta className="aparece space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Apunte>
                        {esMio ? "Tú" : (nombrePareja ?? "Ella")} ·{" "}
                        {formatoLegible(r.creadoEn, zonaHoraria)}
                      </Apunte>
                      {esMio && <EstadoConflicto id={r.id} compartido={r.compartidoEn !== null} />}
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
  )
}

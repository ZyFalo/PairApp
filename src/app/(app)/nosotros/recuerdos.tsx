import { RiImage2Line, RiSparkling2Line } from "@remixicon/react"
import { Apunte, Insignia, Tarjeta, Vacio } from "@/componentes/base"
import { BotonBorrarRecuerdo, FormularioRecuerdo } from "@/componentes/juntos"
import { anosDesde, cumpleAnosHoy, haceAnos } from "@/lib/motor/juntos"
import { fechaSuelta } from "@/lib/motor/tiempo"
import { dbDeSesion } from "@/lib/sesion"

/**
 * Recuerdos (M11): la línea de tiempo de lo que merece quedarse.
 *
 * Sigue siendo una lista aunque ahora cada recuerdo caiga también en su día del
 * calendario. Son dos preguntas distintas —"qué hubo el 14" y "qué guardamos"—
 * y la segunda se responde mal en una rejilla.
 */
export async function VistaRecuerdos() {
  const { db } = await dbDeSesion()
  const ahora = new Date()
  const recuerdos = await db.recuerdo.findMany({ orderBy: { ocurrioEl: "desc" }, take: 60 })

  return (
    <div className="space-y-3">
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
    </div>
  )
}

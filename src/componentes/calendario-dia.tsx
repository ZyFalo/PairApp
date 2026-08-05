import {
  RiCalendarCheckLine,
  RiCalendarEventLine,
  RiCloseLine,
  RiImage2Line,
  RiMailLine,
  RiRepeat2Line,
  RiSeedlingLine,
  RiSparkling2Line,
} from "@remixicon/react"
import Link from "next/link"
import { Apunte, Insignia, Seccion, Tarjeta } from "@/componentes/base"
import { BotonBorrarEvento, BotonGuardarComoRecuerdo } from "@/componentes/calendario-plan"
import { COLOR_GRUPO, ICONO_EMOCION } from "@/componentes/iconos"
import type { CapaAnimo, ElDia } from "@/lib/motor/calendario"
import { etiquetaDe } from "@/lib/motor/emociones"
import { fechaDeClave, fechaSuelta } from "@/lib/motor/tiempo"

/**
 * La hoja de un día (RF-7.4): lo que hubo, lo que hay y lo que se recordó.
 *
 * Se abre al tocar una casilla y se cierra sin recargar, con un enlace que
 * quita el día de la URL. Toda pantalla tiene salida.
 *
 * **Aquí tampoco salen los mensajes.** Ponerlos en una línea de tiempo
 * convierte el silencio en huecos visibles, y una semana en blanco pasa a
 * leerse como reproche (RF-2.0.7). El cofre ya responde qué se dijeron sin que
 * la fecha sea el eje.
 */
export function HojaDelDia({
  dia,
  mes,
  nombrePareja,
  horaDe,
}: {
  dia: ElDia
  mes: string
  nombrePareja: string | null
  /** Cómo se escribe la hora de un plan. La zona la sabe la página, no esto. */
  horaDe: (momento: Date) => string
}) {
  const vacio =
    dia.planes.length === 0 &&
    dia.recuerdos.length === 0 &&
    dia.deseos.length === 0 &&
    dia.miAnimo === null &&
    dia.suAnimo === null &&
    dia.suCiclo === null &&
    dia.miCiclo === null

  return (
    <Tarjeta alzada className="aparece space-y-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="carta text-[19px] leading-snug">{fechaDeClave(dia.dia)}</h2>
        <Link
          href={`/nosotros?mes=${mes}`}
          aria-label="Cerrar el día"
          className="pulsable shrink-0 rounded-full p-1 text-[var(--color-tinta-tenue)] hover:text-[var(--color-acento)]"
        >
          <RiCloseLine size={18} />
        </Link>
      </div>

      {/* Un día sin nada no es un día fallado: es un día. Se dice sin drama y
          sin invitar a rellenarlo (RF-2.0.7). */}
      {vacio && <Apunte>No hay nada apuntado en este día.</Apunte>}

      {dia.planes.length > 0 && (
        <section className="space-y-2">
          <Seccion Icono={RiCalendarEventLine}>Planes</Seccion>
          <ul className="space-y-2">
            {dia.planes.map((plan) => (
              <li key={plan.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-[15.5px]">{plan.titulo}</p>
                  <span className="flex flex-wrap items-center gap-2">
                    <Apunte>{horaDe(plan.inicio)}</Apunte>
                    {plan.anual && <Insignia Icono={RiRepeat2Line}>cada año</Insignia>}
                    {/* Solo lo ve quien la dejó (RF-7.6). Sin cuenta atrás:
                        un reloj corriendo hacia una sorpresa la estropea. */}
                    {plan.capsulaMia && <Insignia Icono={RiMailLine}>le llega ese día</Insignia>}
                  </span>
                  {plan.notas && (
                    <p className="pt-0.5 text-[13.5px] text-[var(--color-tinta-tenue)]">
                      {plan.notas}
                    </p>
                  )}
                  {/* Solo en lo que ya pasó (RF-7.7): el plan trae título y
                      fecha, así que guardarlo cuesta un toque. */}
                  {plan.pasado && (
                    <div className="pt-1">
                      <BotonGuardarComoRecuerdo eventoId={plan.id} />
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {/* Al calendario del teléfono sin OAuth ni permisos (D29) */}
                  <a
                    href={`/api/evento/${plan.id}/ics`}
                    aria-label={`Añadir ${plan.titulo} a tu calendario`}
                    className="pulsable rounded-full p-1.5 text-[var(--color-borde)] hover:text-[var(--color-acento)]"
                  >
                    <RiCalendarCheckLine size={16} />
                  </a>
                  <BotonBorrarEvento id={plan.id} titulo={plan.titulo} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {dia.recuerdos.length > 0 && (
        <section className="space-y-2">
          <Seccion Icono={RiImage2Line}>Recuerdos</Seccion>
          <ul className="space-y-2">
            {dia.recuerdos.map((recuerdo) => (
              <li key={recuerdo.id} className="space-y-0.5">
                <p className="carta text-[16px]">{recuerdo.titulo}</p>
                <Apunte>{fechaSuelta(recuerdo.ocurrioEl)}</Apunte>
                {recuerdo.nota && (
                  <p className="carta pt-0.5 text-[14.5px] leading-relaxed text-[var(--color-tinta-suave)]">
                    {recuerdo.nota}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {dia.deseos.length > 0 && (
        <section className="space-y-2">
          <Seccion Icono={RiSparkling2Line}>11:11</Seccion>
          <ul className="space-y-1.5">
            {dia.deseos.map((deseo) => (
              <li key={deseo.id}>
                <p className="carta text-[15.5px]">{deseo.texto}</p>
                <Apunte>{deseo.mio ? "Tú" : (nombrePareja ?? "Ella")}</Apunte>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Animos dia={dia} nombrePareja={nombrePareja} />

      {/* Lo que ella escribió que le sirve estos días (RF-5.4). Va con sus
          palabras: la app nunca lo traduce a una etiqueta de "sensible". */}
      {dia.suNota && (
        <section className="space-y-2">
          <Seccion Icono={RiSeedlingLine}>
            Lo que {nombrePareja ?? "ella"} necesita estos días
          </Seccion>
          <p className="carta text-[15.5px] leading-relaxed">{dia.suNota}</p>
        </section>
      )}
    </Tarjeta>
  )
}

/**
 * El ánimo de cada uno ese día.
 *
 * Si el día lleva su marca de periodo, el suyo no llega hasta aquí: la consulta
 * ya lo quitó (RF-5.6). Que la hoja enseñara lo que la casilla calla convertiría
 * esa regla en teatro.
 */
function Animos({ dia, nombrePareja }: { dia: ElDia; nombrePareja: string | null }) {
  if (!dia.miAnimo && !dia.suAnimo && !dia.miCiclo && !dia.suCiclo) return null

  return (
    <section className="space-y-2">
      <Seccion>Cómo fue el día</Seccion>
      <ul className="space-y-1.5">
        <FilaAnimo quien="Tú" animo={dia.miAnimo} ciclo={dia.miCiclo} />
        <FilaAnimo quien={nombrePareja ?? "Ella"} animo={dia.suAnimo} ciclo={dia.suCiclo} suyo />
      </ul>
    </section>
  )
}

/** Una línea con el ánimo de alguien, su marca de periodo, o las dos. */
function FilaAnimo({
  quien,
  animo,
  ciclo,
  suyo = false,
}: {
  quien: string
  animo: CapaAnimo | null
  ciclo: string | null
  suyo?: boolean
}) {
  if (!animo && !ciclo) return null

  // Sin nombre de emoción, solo el color de la familia: fue lo que su autora
  // eligió compartir, y la app no rellena lo que alguien decidió callar (RF-1.3).
  const Icono = animo?.emocion ? ICONO_EMOCION[animo.emocion] : null

  return (
    <li className="flex flex-wrap items-center gap-2 text-[14.5px]">
      <span className="text-[var(--color-tinta-tenue)]">{quien}</span>
      {animo &&
        (Icono ? (
          <span className="inline-flex items-center gap-1.5">
            <Icono size={16} className={COLOR_GRUPO[animo.grupo]} />
            {etiquetaDe(animo.emocion ?? "BIEN", "NEUTRO").toLowerCase()}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[var(--color-tinta-suave)]">
            <span className={`size-2.5 rounded-full ${COLOR_GRUPO[animo.grupo]} bg-current`} />
            {suyo ? "no dijo de qué" : "sin detalle"}
          </span>
        ))}
      {ciclo && (
        <Insignia Icono={RiSeedlingLine}>
          {ciclo === "REGISTRADO" ? "periodo" : "periodo estimado"}
        </Insignia>
      )}
    </li>
  )
}

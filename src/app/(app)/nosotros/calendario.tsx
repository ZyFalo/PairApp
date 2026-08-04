import { RiCalendarEventLine } from "@remixicon/react"
import { Apunte, Vacio } from "@/componentes/base"
import { Calendario } from "@/componentes/calendario"
import { HojaDelDia } from "@/componentes/calendario-dia"
import { FormularioEvento } from "@/componentes/calendario-plan"
import { elDia, loQuePasaEnElMes } from "@/lib/consultas/calendario"
import { mesDe } from "@/lib/motor/calendario"
import { diaRelativo } from "@/lib/motor/tiempo"
import { dbDeSesion } from "@/lib/sesion"

/** Un mes válido, tal y como viaja por la URL. */
const FORMATO_MES = /^\d{4}-(0[1-9]|1[0-2])$/
const FORMATO_DIA = /^\d{4}-\d{2}-\d{2}$/

/**
 * La vista de calendario: la rejilla del mes y, si hay un día tocado, su hoja.
 *
 * El mes y el día viajan en la URL y no en estado de cliente. Así el botón de
 * atrás del navegador deshace la navegación entre meses, y un día concreto se
 * puede volver a abrir tal cual.
 *
 * Debajo de la rejilla, "añadir un plan" — y nada más. La invitación a hacer
 * algo va **fuera** de las casillas: dentro se leería como una falta, y una
 * rejilla que señala los días vacíos es un contador de rachas con otro nombre
 * (RF-2.0.7).
 */
export async function VistaCalendario({ mes, dia }: { mes?: string; dia?: string }) {
  const { sesion } = await dbDeSesion()
  const ahora = new Date()

  // Un mes inventado en la URL no puede reventar la pantalla: se cae al actual.
  const mesPintado = mes && FORMATO_MES.test(mes) ? mes : mesDe(ahora, sesion.zonaHoraria)
  const diaAbierto = dia && FORMATO_DIA.test(dia) ? dia : null

  const [casillas, detalle] = await Promise.all([
    loQuePasaEnElMes(mesPintado),
    diaAbierto ? elDia(diaAbierto) : Promise.resolve(null),
  ])

  const proximos = casillas.filter((c) => c.esDelMes && c.hayPlan)

  return (
    <div className="space-y-6">
      <Calendario mes={mesPintado} casillas={casillas} diaAbierto={diaAbierto} />

      {detalle && (
        <HojaDelDia
          dia={detalle}
          mes={mesPintado}
          nombrePareja={sesion.pareja?.nombre ?? null}
          horaDe={(momento) => diaRelativo(momento, sesion.zonaHoraria, ahora)}
        />
      )}

      {/* Sugiere el día que hay abierto: quien toca el 14 y pulsa "añadir"
          quiere un plan el 14, no volver a teclear la fecha. */}
      <FormularioEvento fechaSugerida={diaAbierto ?? undefined} />

      {!detalle && proximos.length === 0 && (
        <Vacio Icono={RiCalendarEventLine}>Nada apuntado este mes.</Vacio>
      )}

      {!detalle && proximos.length > 0 && <Apunte>Toca un día para ver qué hay en él.</Apunte>}
    </div>
  )
}

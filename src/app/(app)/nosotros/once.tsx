import { RiSparkling2Line } from "@remixicon/react"
import { Apunte, Seccion, Tarjeta, Vacio } from "@/componentes/base"
import { diaLocal, fechaDeClave } from "@/lib/motor/tiempo"
import { dbDeSesion } from "@/lib/sesion"

/**
 * La colección de los 11:11 (RF-12.6): todos los deseos de los dos, en orden.
 *
 * Es "el archivo más ligero y más releíble de la app", y hasta ahora no
 * existía: los deseos se guardaban pero solo se veían el día en que se pedían.
 * Al día siguiente había que acertar la casilla exacta del calendario para
 * volver a leerlos, y ni siquiera está marcada. Se escribían para nada.
 *
 * **Sin contadores y sin rachas** (RF-12.7). Ni cuántos van, ni cuántas veces
 * coincidisteis, ni cuánto hace del último. En un ritual diario la tentación de
 * gamificarlo es máxima y es justo lo que lo estropea: un 11:11 perdido no
 * existe — no se cuenta, no se muestra, no se menciona.
 *
 * Por eso tampoco se dice nada de los días sin deseo. Se listan los que hay y
 * ya está; los huecos entre fechas no se nombran.
 *
 * **Aquí y solo aquí.** Los deseos del día estuvieron un tiempo delante en las
 * seis vistas de Nosotros, y empujaban hacia abajo el contenido de todas para
 * enseñar algo que ya se había leído. Lo que sigue saliendo en cualquier
 * pantalla es la ventana de cuatro minutos, que es lo único que caduca.
 */
export async function VistaOnce() {
  const { db, sesion } = await dbDeSesion()

  const deseos = await db.onceOnce.findMany({
    // El día más reciente arriba, y dentro de cada día la mañana antes que la
    // noche. Ordenar solo por `creadoEn` parecía bastar y no basta: los dos
    // deseos de una misma ventana se escriben con segundos de diferencia, y con
    // el empate el orden lo decide la base — que un día pone la noche primero.
    orderBy: [{ dia: "desc" }, { esNoche: "asc" }, { creadoEn: "asc" }],
    take: 200,
  })

  if (deseos.length === 0) {
    return (
      <Vacio Icono={RiSparkling2Line}>
        Todavía ninguno. A las 11:11 —de la mañana y de la noche— la app abre una ventana de cuatro
        minutos.
      </Vacio>
    )
  }

  // Agrupados por día: los dos deseos de una misma ventana se leen juntos, que
  // es la mitad de la gracia. El orden ya viene de la consulta.
  const porDia = new Map<string, typeof deseos>()
  for (const deseo of deseos) {
    const acumulado = porDia.get(deseo.dia)
    if (acumulado) acumulado.push(deseo)
    else porDia.set(deseo.dia, [deseo])
  }

  const hoy = diaLocal(sesion.zonaHoraria, new Date())

  return (
    <div className="space-y-6">
      {[...porDia].map(([dia, delDia]) => (
        <section key={dia} className="space-y-2">
          <Seccion Icono={RiSparkling2Line}>{fechaDeClave(dia)}</Seccion>
          {dia === hoy && coincidieron(delDia) && (
            <p className="carta text-center text-[17px] text-[var(--color-acento)]">
              Los dos pidieron a la vez.
            </p>
          )}
          <ul className="space-y-2">
            {delDia.map((deseo) => (
              <li key={deseo.id}>
                <Tarjeta className="aparece space-y-1">
                  <p className="carta text-[16px] leading-relaxed">{deseo.texto}</p>
                  <Apunte>
                    {deseo.autorId === sesion.usuarioId ? "Tú" : (sesion.pareja?.nombre ?? "Ella")}
                    {deseo.esNoche ? " · por la noche" : " · por la mañana"}
                  </Apunte>
                </Tarjeta>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

/**
 * Si los dos pidieron en la **misma** ventana.
 *
 * Por ventana y no por día: uno por la mañana y otro por la noche son dos
 * gestos separados por doce horas, y llamarlos coincidencia sería la app
 * interpretando (§1.2). Lo que tiene gracia es haber estado pensando en lo
 * mismo a la vez.
 */
function coincidieron(delDia: { autorId: string; esNoche: boolean }[]): boolean {
  return [false, true].some((esNoche) => {
    const enLaVentana = delDia.filter((d) => d.esNoche === esNoche)
    return new Set(enLaVentana.map((d) => d.autorId)).size === 2
  })
}

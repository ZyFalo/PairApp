import {
  RiCalendarEventLine,
  RiFilmLine,
  RiHandHeartLine,
  RiHeartsLine,
  RiImage2Line,
  RiMusic2Line,
  RiSparkling2Line,
} from "@remixicon/react"
import { Apunte, PastillaDeVista, Seccion, Tarjeta, Titulo } from "@/componentes/base"
import type { Icono } from "@/componentes/iconos"
import { VentanaOnceOnce } from "@/componentes/once"
import { CarrilDeVistas } from "@/componentes/vistas"
import { type ClaveModulo, soloElCalendario } from "@/lib/motor/modulos"
import { participaEnLaVentana, ventanaOnceOnce } from "@/lib/motor/once"
import { diaLocal } from "@/lib/motor/tiempo"
import { dbDeSesion } from "@/lib/sesion"
import { VistaCalendario } from "./calendario"
import { DespuesDeUnaDiscusion } from "./despues"
import { VistaMusica } from "./musica"
import { VistaOnce } from "./once"
import { VistaRecuerdos } from "./recuerdos"
import { VistaVerJuntos } from "./ver"

export const dynamic = "force-dynamic"

/**
 * Las vistas de Nosotros.
 *
 * `modulo` dice de cuál depende cada una. Las que no lo llevan no se apagan
 * nunca: el calendario es la pantalla de entrada, y «Después» son los acuerdos
 * y los relatos de conflicto — un freno, no un extra (P9).
 */
const VISTAS: { clave: string; texto: string; Icono: Icono; modulo: ClaveModulo | null }[] = [
  { clave: "", texto: "Calendario", Icono: RiCalendarEventLine, modulo: null },
  { clave: "once", texto: "11:11", Icono: RiSparkling2Line, modulo: "once" },
  { clave: "ver", texto: "Ver juntos", Icono: RiFilmLine, modulo: "titulos" },
  { clave: "musica", texto: "Música", Icono: RiMusic2Line, modulo: "musica" },
  { clave: "recuerdos", texto: "Recuerdos", Icono: RiImage2Line, modulo: "recuerdos" },
  { clave: "despues", texto: "Después", Icono: RiHandHeartLine, modulo: null },
]

/**
 * La vida en común (§8.1), y la pantalla por la que se entra a la app.
 *
 * El calendario manda porque **la mitad de lo que guarda la app son hechos con
 * fecha** —planes, periodos, recuerdos, check-ins, deseos— y hasta ahora vivían
 * en cuatro listas que no se hablaban entre sí. Un mes no añade una pantalla:
 * junta las que ya había.
 *
 * Esta página es solo el reparto: el título, las pestañas, la ventana de los
 * 11:11 y a qué vista le toca. Cada vista trae sus propios datos, que es lo que
 * permite que abrir el calendario no consulte las películas.
 */
export default async function PaginaNosotros({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; mes?: string; dia?: string }>
}) {
  const { vista, mes, dia } = await searchParams
  const { db, sesion } = await dbDeSesion()
  const ahora = new Date()
  const ventana = ventanaOnceOnce(sesion.zonaHoraria, ahora)
  const hoy = diaLocal(sesion.zonaHoraria, ahora)

  const onceHoy = sesion.modulos.once
    ? await db.onceOnce.findMany({ where: { dia: hoy }, orderBy: { creadoEn: "asc" } })
    : []
  // La ventana solo se abre para quien participa en ella (RF-12.1) y si la
  // pareja usa el ritual. Los deseos que ya hay se siguen leyendo aunque uno se
  // haya salido: son de los dos.
  const meToca =
    sesion.modulos.once &&
    ventana.abierta &&
    participaEnLaVentana(sesion.ventanasOnce, ventana.esNoche)
  const yaPedi = onceHoy.some(
    (o) => o.autorId === sesion.usuarioId && o.esNoche === ventana.esNoche,
  )
  const losDos = onceHoy.filter((o) => o.esNoche === ventana.esNoche).length === 2

  const visibles = VISTAS.filter((v) => v.modulo === null || sesion.modulos[v.modulo])
  // Una vista de un módulo apagado no se pinta aunque se escriba su URL a mano:
  // esconder la pastilla no cierra la puerta. Se cae al calendario.
  const vistaPintada = visibles.some((v) => v.clave === vista) ? (vista ?? "") : ""

  return (
    <div className="space-y-7">
      <Titulo>Nosotros</Titulo>

      {/* Con todo apagado no se dibuja: un carril de una sola pastilla es ruido
          que no lleva a ningún sitio. */}
      {!soloElCalendario(sesion.modulos) && (
        <CarrilDeVistas>
          {visibles.map((v) => (
            <PastillaDeVista
              key={v.clave}
              href={v.clave ? `/nosotros?vista=${v.clave}` : "/nosotros"}
              activa={vistaPintada === v.clave}
              texto={v.texto}
              Icono={v.Icono}
            />
          ))}
        </CarrilDeVistas>
      )}

      {/* Los 11:11 — la única función simultánea de la app (RF-12.9). Fuera de
          las vistas: cuatro minutos no esperan a que cambies de pestaña. */}
      {(meToca || onceHoy.length > 0) && (
        <section className="space-y-3">
          <Seccion Icono={RiSparkling2Line}>11:11</Seccion>
          {meToca && !yaPedi && <VentanaOnceOnce />}
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

      {vistaPintada === "once" ? (
        <VistaOnce />
      ) : vistaPintada === "ver" ? (
        <VistaVerJuntos />
      ) : vistaPintada === "musica" ? (
        <VistaMusica />
      ) : vistaPintada === "recuerdos" ? (
        <VistaRecuerdos />
      ) : vistaPintada === "despues" ? (
        <DespuesDeUnaDiscusion />
      ) : (
        <VistaCalendario mes={mes} dia={dia} />
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

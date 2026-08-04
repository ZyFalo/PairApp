import {
  RiHeart2Line,
  RiLogoutBoxLine,
  RiNotification3Line,
  RiSeedlingLine,
  RiSettings3Line,
} from "@remixicon/react"
import { InterruptorCiclo, InterruptorCompartirAnimo, VentanasDelOnce } from "@/componentes/ajustes"
import { ControlPausa, PanelPush } from "@/componentes/avisos"
import { Apunte, Boton, Insignia, Seccion, Tarjeta, Titulo } from "@/componentes/base"
import { CambiarVisibilidadCiclo, FormularioCiclo } from "@/componentes/ciclo"
import { EleccionDeModulos } from "@/componentes/modulos"
import { salir } from "@/lib/acciones/cuenta"
import { CICLOS_PARA_ESTIMAR } from "@/lib/motor/ciclo"
import { fechaSuelta, formatoLegible } from "@/lib/motor/tiempo"
import { dbDeSesion } from "@/lib/sesion"

export const dynamic = "force-dynamic"

/**
 * Mi espacio: mi ciclo y mis ajustes (§8.1).
 *
 * **Ya no vive aquí «cómo he estado».** Ese historial —la tira de colores y su
 * lista— era una línea de tiempo dentro de una pantalla de ajustes, y su sitio
 * es la línea de tiempo de verdad: el calendario. La estimación del próximo
 * periodo se fue con él, a los días punteados de la rejilla.
 *
 * Lo que queda es lo que solo puede estar aquí: registrar, decidir qué se
 * comparte y apagar cosas.
 */
export default async function PaginaYo() {
  const { db, sesion } = await dbDeSesion()

  // Solo se consulta si lo llevas: quien no registra su ciclo no tiene por qué
  // ver aparecer la sección, ni siquiera vacía (RF-5.0).
  const ciclos = sesion.llevaCiclo
    ? await db.ciclo.findMany({
        where: { usuarioId: sesion.usuarioId },
        orderBy: { inicio: "desc" },
        take: CICLOS_PARA_ESTIMAR + 1,
      })
    : []

  const miCiclo = ciclos[0] ?? null

  return (
    <div className="space-y-8">
      <Titulo>{sesion.nombre}</Titulo>

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

          <Apunte>
            Lo registrado y lo estimado salen en el calendario, y se dibujan distinto: el cálculo va
            punteado. Un cuerpo no es un calendario.
          </Apunte>

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

      {/* Lo mío: nadie más lo ve ni lo cambia (RF-5.0, RF-1.5, RF-12.8). */}
      <section className="space-y-3">
        <Seccion Icono={RiSettings3Line}>Solo tuyo</Seccion>
        <Tarjeta className="space-y-5">
          <InterruptorCiclo activo={sesion.llevaCiclo} />
          <InterruptorCompartirAnimo
            activo={sesion.compartoAnimo}
            nombrePareja={sesion.pareja?.nombre ?? null}
          />
          {sesion.modulos.once && <VentanasDelOnce actual={sesion.ventanasOnce} />}
        </Tarjeta>
      </section>

      {/* Lo de los dos, en su propia sección y con el aviso de que se comparte.
          Es **el mismo componente** que pinta la pantalla de «empezar»: el
          onboarding no es una copia de los ajustes, es la primera vez que se
          ven. Dos copias acaban divergiendo. */}
      {sesion.pareja && (
        <section className="space-y-3">
          <Seccion Icono={RiHeart2Line}>Lo que usáis los dos</Seccion>
          <Tarjeta>
            <EleccionDeModulos
              modulos={sesion.modulos}
              ultimoCambio={
                sesion.ultimoCambioDeModulos && {
                  nombre: sesion.ultimoCambioDeModulos.nombre,
                  mio: sesion.ultimoCambioDeModulos.mio,
                  // `formatoLegible` y no `haceEnPalabras`: esa cuenta días de
                  // calendario —perfecto para «escribiste esto ayer»— y aquí
                  // decía «hace unas horas» de algo cambiado hace dos minutos.
                  // Para un ajuste, la fecha exacta informa y no interpreta.
                  cuando: `el ${formatoLegible(sesion.ultimoCambioDeModulos.cuando, sesion.zonaHoraria)}`,
                }
              }
            />
          </Tarjeta>
          <Apunte>
            Esto lo ve y lo cambia {sesion.pareja.nombre} también. Apagar no borra nada.
          </Apunte>
        </section>
      )}

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

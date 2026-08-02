import { Apunte, Boton, Tarjeta, Titulo, Vacio } from "@/componentes/base"
import { AccionesApunte, FormularioCiclo, PanelPush } from "@/componentes/yo"
import { DestinoMensaje } from "@/generated/prisma/enums"
import { salir } from "@/lib/acciones/cuenta"
import { etiquetaDe, ficha } from "@/lib/motor/emociones"
import { formatoLegible } from "@/lib/motor/tiempo"
import { dbDeSesion } from "@/lib/sesion"

export const dynamic = "force-dynamic"

/** Mi espacio: historial, mis apuntes privados, mi ciclo y los ajustes (§8.1). */
export default async function PaginaYo() {
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
        archivadoEn: null,
      },
      orderBy: { creadoEn: "desc" },
    }),
    db.ciclo.findFirst({
      where: { usuarioId: sesion.usuarioId },
      orderBy: { inicio: "desc" },
    }),
  ])

  return (
    <div className="space-y-8">
      <Titulo>{sesion.nombre}</Titulo>

      {/* Cosas por hablar: sin contador, que sería una deuda (RF-2.0.7) */}
      <section className="space-y-3">
        <h2 className="text-[15px] text-[--color-tinta-suave]">Cosas por hablar</h2>
        {apuntes.length === 0 ? (
          <Vacio>Nada guardado para ti.</Vacio>
        ) : (
          <ul className="space-y-2">
            {apuntes.map((a) => (
              <li key={a.id}>
                <Tarjeta className="aparece space-y-3">
                  <p className="font-[family-name:--font-carta] text-[16px]">{a.texto}</p>
                  <div className="flex items-center justify-between">
                    <Apunte>{formatoLegible(a.creadoEn, sesion.zonaHoraria)}</Apunte>
                    <AccionesApunte mensajeId={a.id} hayPareja={Boolean(sesion.pareja)} />
                  </div>
                </Tarjeta>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Historial propio. Solo mío por defecto (RF-1.5) */}
      <section className="space-y-3">
        <h2 className="text-[15px] text-[--color-tinta-suave]">Cómo he estado</h2>
        {historial.length === 0 ? (
          <Vacio>Aún no has registrado nada.</Vacio>
        ) : (
          <ul className="space-y-1.5">
            {historial.map((c) => (
              <li key={c.id} className="flex items-center gap-3 text-[14px]">
                <span className="text-[17px]">{ficha(c.emocion).icono}</span>
                <span className="text-[--color-tinta]">{etiquetaDe(c.emocion, sesion.genero)}</span>
                <span className="ml-auto text-[12px] text-[--color-tinta-tenue]">
                  {formatoLegible(c.creadoEn, sesion.zonaHoraria)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Ciclo: ella decide qué comparte (RF-5.3) */}
      <section className="space-y-3">
        <h2 className="text-[15px] text-[--color-tinta-suave]">Mi ciclo</h2>
        {miCiclo && (
          <Tarjeta>
            <p className="text-[15px]">
              Último registro: {formatoLegible(miCiclo.inicio, sesion.zonaHoraria)}
            </p>
            <Apunte>
              {miCiclo.nivelVisibilidad === "NADA"
                ? "No compartes nada"
                : miCiclo.nivelVisibilidad === "SOLO_FECHAS"
                  ? "Compartes solo las fechas"
                  : "Compartes fechas y tu nota"}
            </Apunte>
          </Tarjeta>
        )}
        <FormularioCiclo />
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] text-[--color-tinta-suave]">Avisos</h2>
        <PanelPush />
      </section>

      <form action={salir}>
        <Boton variante="texto" type="submit" className="w-full">
          Cerrar sesión
        </Boton>
      </form>
    </div>
  )
}

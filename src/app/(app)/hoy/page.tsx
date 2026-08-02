import { Apunte, Tarjeta } from "@/componentes/base"
import { Checkin } from "@/componentes/checkin"
import { MensajeEntrante } from "@/componentes/mensaje-entrante"
import { ClaseMensaje } from "@/generated/prisma/enums"
import { loQueHayParaMi } from "@/lib/acciones/bucle"
import { etiquetaDe, ficha } from "@/lib/motor/emociones"
import { estadoVigente } from "@/lib/motor/entrega"
import { formatoLegible } from "@/lib/motor/tiempo"
import { dbDeSesion } from "@/lib/sesion"

export const dynamic = "force-dynamic"

/**
 * La pantalla que se abre el 90 % de las veces (§8.1): mi estado, el de ella,
 * y lo que hay para mí hoy.
 */
export default async function PaginaHoy() {
  const { db, sesion } = await dbDeSesion()
  const ahora = new Date()

  const [miUltimo, suUltimo, pendiente] = await Promise.all([
    db.checkin.findFirst({
      where: { autorId: sesion.usuarioId },
      orderBy: { creadoEn: "desc" },
    }),
    sesion.pareja
      ? db.checkin.findFirst({
          where: { autorId: sesion.pareja.id },
          orderBy: { creadoEn: "desc" },
        })
      : null,
    loQueHayParaMi(),
  ])

  // Un mensaje pendiente manda sobre todo lo demás.
  if (pendiente) {
    return (
      <MensajeEntrante
        entregaId={pendiente.entregaId}
        nombreAutor={sesion.pareja?.nombre ?? "Tu pareja"}
        emocion={pendiente.mensaje.emocion}
        texto={pendiente.mensaje.texto}
        necesidad={pendiente.mensaje.necesidad}
        tonoMarcado={pendiente.mensaje.tonoMarcado}
        esPresencia={pendiente.mensaje.clase === ClaseMensaje.PRESENCIA}
        amortiguador={
          pendiente.amortiguador
            ? {
                texto: pendiente.amortiguador.texto,
                creadoEn: formatoLegible(pendiente.amortiguador.creadoEn, sesion.zonaHoraria),
              }
            : null
        }
        ambosEnojados={miUltimo?.emocion === "ENOJADO" && pendiente.mensaje.emocion === "ENOJADO"}
      />
    )
  }

  const suEstadoVigente =
    suUltimo &&
    estadoVigente(
      { emocion: suUltimo.emocion, intensidad: suUltimo.intensidad, creadoEn: suUltimo.creadoEn },
      ahora,
    )

  return (
    <div className="space-y-7">
      {/* Cómo está ella. La ausencia nunca se enuncia (RF-3.0.2). */}
      {sesion.pareja && suEstadoVigente && suUltimo && suUltimo.visibilidad !== "PRIVADO" && (
        <Tarjeta className="aparece flex items-center gap-3">
          <span className="text-[26px]">
            {suUltimo.visibilidad === "SOLO_COLOR" ? "•" : ficha(suUltimo.emocion).icono}
          </span>
          <div>
            <p className="text-[15px]">
              {suUltimo.visibilidad === "SOLO_COLOR"
                ? `${sesion.pareja.nombre} no está bien`
                : `${sesion.pareja.nombre} está ${etiquetaDe(suUltimo.emocion, "NEUTRO").toLowerCase()}`}
            </p>
            <Apunte>{formatoLegible(suUltimo.creadoEn, sesion.zonaHoraria)}</Apunte>
          </div>
        </Tarjeta>
      )}

      <Checkin
        genero={sesion.genero}
        nombrePareja={sesion.pareja?.nombre ?? null}
        ultimaEmocion={miUltimo?.emocion ?? null}
      />
    </div>
  )
}

import { Apunte, Tarjeta } from "@/componentes/base"
import { Checkin } from "@/componentes/checkin"
import { Reparacion } from "@/componentes/conflicto"
import { RevisionEnFrio } from "@/componentes/en-frio"
import { COLOR_GRUPO, ICONO_EMOCION } from "@/componentes/iconos"
import { MensajeEntrante } from "@/componentes/mensaje-entrante"
import { VentanaOnceOnce } from "@/componentes/nosotros"
import { ClaseMensaje, Visibilidad } from "@/generated/prisma/enums"
import { loQueEsperaEnFrio, loQueHayParaMi } from "@/lib/acciones/bucle"
import { etiquetaDe, grupoDe } from "@/lib/motor/emociones"
import { estadoVigente } from "@/lib/motor/entrega"
import { tocaOfrecerReparacion } from "@/lib/motor/reparacion"
import { diaLocal, formatoLegible, haceEnPalabras, ventanaOnceOnce } from "@/lib/motor/tiempo"
import { dbDeSesion } from "@/lib/sesion"

export const dynamic = "force-dynamic"

/**
 * La pantalla que se abre el 90 % de las veces (§8.1): mi estado, el de ella,
 * y lo que hay para mí hoy.
 */
export default async function PaginaHoy() {
  const { db, sesion } = await dbDeSesion()
  const ahora = new Date()

  const [miUltimo, suUltimo, pendiente, enFrio] = await Promise.all([
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
    loQueEsperaEnFrio(),
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
        presentacion={pendiente.presentacion}
        adjunto={
          pendiente.mensaje.adjunto
            ? {
                tipo: pendiente.mensaje.adjunto.tipo,
                url: pendiente.mensaje.adjunto.url,
                segundos: pendiente.mensaje.adjunto.segundos,
              }
            : null
        }
        amortiguador={
          pendiente.amortiguador
            ? {
                texto: pendiente.amortiguador.texto,
                creadoEn: formatoLegible(pendiente.amortiguador.creadoEn, sesion.zonaHoraria),
              }
            : null
        }
      />
    )
  }

  // Después de lo que llega, lo que dejaste a medias: algo escrito en caliente
  // que lleva doce horas esperando decisión pesa más que un check-in nuevo (§6.3).
  if (enFrio[0]) {
    return (
      // `key` con el id: sin él, React reutiliza el componente entre dos
      // revisiones seguidas y el textarea conserva el texto del mensaje
      // anterior. Enviarías uno con las palabras de otro.
      <RevisionEnFrio
        key={enFrio[0].id}
        mensajeId={enFrio[0].id}
        texto={enFrio[0].texto}
        emocion={enFrio[0].emocion}
        cuandoLoEscribiste={haceEnPalabras(enFrio[0].creadoEn, ahora, sesion.zonaHoraria)}
        hayPareja={Boolean(sesion.pareja)}
      />
    )
  }

  // Los 11:11 también aquí: la ventana dura cuatro minutos y nadie va a
  // acordarse de cambiar de pestaña a tiempo (RF-12.2).
  const ventana = ventanaOnceOnce(sesion.zonaHoraria, ahora)
  const yaPedi =
    ventana.abierta &&
    (await db.onceOnce.findFirst({
      where: {
        autorId: sesion.usuarioId,
        dia: diaLocal(sesion.zonaHoraria, ahora),
        esNoche: ventana.esNoche,
      },
    })) !== null

  const suEstadoVigente =
    suUltimo &&
    estadoVigente(
      { emocion: suUltimo.emocion, intensidad: suUltimo.intensidad, creadoEn: suUltimo.creadoEn },
      ahora,
    )

  // Reparar solo se ofrece cuando los dos están en "algo pasó" (§6.8). En
  // cualquier otro momento la app estaría dando por hecho que hay una pelea.
  const hayQueReparar =
    sesion.pareja !== null &&
    tocaOfrecerReparacion(
      miUltimo && {
        emocion: miUltimo.emocion,
        intensidad: miUltimo.intensidad,
        creadoEn: miUltimo.creadoEn,
      },
      suUltimo && {
        emocion: suUltimo.emocion,
        intensidad: suUltimo.intensidad,
        creadoEn: suUltimo.creadoEn,
      },
      ahora,
    )

  return (
    <div className="space-y-7">
      {ventana.abierta && !yaPedi && <VentanaOnceOnce />}

      {hayQueReparar && sesion.pareja && <Reparacion nombrePareja={sesion.pareja.nombre} />}

      {/* Cómo está ella. La ausencia nunca se enuncia (RF-3.0.2). */}
      {sesion.pareja &&
        suEstadoVigente &&
        suUltimo &&
        suUltimo.visibilidad !== Visibilidad.PRIVADO && (
          <EstadoDeElla
            nombre={sesion.pareja.nombre}
            emocion={suUltimo.emocion}
            soloColor={suUltimo.visibilidad === Visibilidad.SOLO_COLOR}
            cuando={formatoLegible(suUltimo.creadoEn, sesion.zonaHoraria)}
          />
        )}

      <Checkin
        genero={sesion.genero}
        nombrePareja={sesion.pareja?.nombre ?? null}
        ultimaEmocion={miUltimo?.emocion ?? null}
      />
    </div>
  )
}

/**
 * Cómo está ella, en una línea. Si eligió compartir solo el color, se dice
 * eso y nada más: la app no rellena lo que ella decidió callar (RF-1.3).
 */
function EstadoDeElla({
  nombre,
  emocion,
  soloColor,
  cuando,
}: {
  nombre: string
  emocion: keyof typeof ICONO_EMOCION
  soloColor: boolean
  cuando: string
}) {
  const grupo = grupoDe(emocion)
  const Icono = ICONO_EMOCION[emocion]

  return (
    <Tarjeta className="aparece flex items-center gap-3.5">
      {soloColor ? (
        <span
          className={`size-4 shrink-0 rounded-full ${COLOR_GRUPO[grupo]} bg-current opacity-70`}
        />
      ) : (
        <Icono size={26} className={`shrink-0 ${COLOR_GRUPO[grupo]}`} />
      )}
      <div>
        <p className="text-[15px]">
          {soloColor
            ? `${nombre} no está bien`
            : `${nombre} está ${etiquetaDe(emocion, "NEUTRO").toLowerCase()}`}
        </p>
        <Apunte>{cuando}</Apunte>
      </div>
    </Tarjeta>
  )
}

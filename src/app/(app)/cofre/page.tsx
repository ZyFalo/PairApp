import { RiBookmarkLine, RiInboxLine, RiSendPlaneLine } from "@remixicon/react"
import Link from "next/link"
import { Apunte, Tarjeta, TextoDeCarta, Titulo, Vacio } from "@/componentes/base"
import { BotonGuardar, BotonRetirar } from "@/componentes/boton-guardar"
import { COLOR_GRUPO, ICONO_CIERRE, ICONO_EMOCION } from "@/componentes/iconos"
import { loQueLeMande } from "@/lib/acciones/bucle"
import { ETIQUETA_CIERRE, etiquetaDe, grupoDe } from "@/lib/motor/emociones"
import { formatoLegible } from "@/lib/motor/tiempo"
import { dbDeSesion } from "@/lib/sesion"
import { EstadoEnvio } from "./estado-envio"

export const dynamic = "force-dynamic"

const VISTAS = [
  { clave: "", texto: "Recibidos", Icono: RiInboxLine },
  { clave: "enviados", texto: "Enviados", Icono: RiSendPlaneLine },
  { clave: "guardados", texto: "Guardados", Icono: RiBookmarkLine },
] as const

/**
 * El cofre (§3.2.2): todo lo que ha pasado por el vínculo.
 *
 * "Enviados" no es un archivo: es la mitad del bucle. Sin saber si lo que
 * dejaste llegó, se vio o se contestó, escribir es hablarle a una pared —
 * y esa incertidumbre es justo lo que la app existe para quitar (§3.17).
 */
export default async function PaginaCofre({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>
}) {
  const { vista } = await searchParams
  const soloGuardados = vista === "guardados"
  const esEnviados = vista === "enviados"
  const { db, sesion } = await dbDeSesion()

  const guardados = await db.guardado.findMany({
    where: { usuarioId: sesion.usuarioId },
    select: { mensajeId: true },
  })
  const idsGuardados = new Set(guardados.map((g) => g.mensajeId))

  const [entregas, enviados] = await Promise.all([
    esEnviados
      ? Promise.resolve([])
      : db.entrega.findMany({
          where: {
            destinatarioId: sesion.usuarioId,
            ...(soloGuardados ? { mensajeId: { in: [...idsGuardados] } } : {}),
          },
          orderBy: { entregadaEn: "desc" },
          take: 100,
          include: { mensaje: true, respuesta: true },
        }),
    esEnviados ? loQueLeMande() : Promise.resolve([]),
  ])

  return (
    <div className="space-y-6">
      <Titulo>Cofre</Titulo>

      <div className="flex gap-1.5">
        {VISTAS.map((v) => (
          <Pestana
            key={v.clave}
            href={v.clave ? `/cofre?vista=${v.clave}` : "/cofre"}
            activa={(vista ?? "") === v.clave}
            texto={v.texto}
            Icono={v.Icono}
          />
        ))}
      </div>

      {esEnviados ? (
        enviados.length === 0 ? (
          <Vacio Icono={RiSendPlaneLine}>Todavía no le has dejado nada.</Vacio>
        ) : (
          <ul className="space-y-3">
            {enviados.map((m) => {
              const Icono = ICONO_EMOCION[m.emocion]
              const IconoCierre = m.respuesta?.cierre ? ICONO_CIERRE[m.respuesta.cierre] : null
              return (
                <li key={m.id}>
                  <Tarjeta className="aparece space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-tinta-suave)]">
                        <Icono size={15} className={COLOR_GRUPO[grupoDe(m.emocion)]} />
                        {etiquetaDe(m.emocion, "NEUTRO").toLowerCase()}
                      </span>
                      <span className="text-[12px] text-[var(--color-tinta-tenue)]">
                        {formatoLegible(m.creadoEn, sesion.zonaHoraria)}
                      </span>
                    </div>

                    <TextoDeCarta>{m.texto}</TextoDeCarta>

                    <div className="flex flex-wrap items-center gap-2">
                      <EstadoEnvio
                        esperando={m.esperando}
                        vista={m.vistaEn !== null}
                        necesitaRato={m.necesitaRatoEn !== null}
                        respondido={m.respuesta !== null}
                      />
                      {m.esperando && <BotonRetirar mensajeId={m.id} />}
                    </div>

                    {m.respuesta && (m.respuesta.texto || m.respuesta.cierre) && (
                      <div className="border-l-2 border-[var(--color-acento-suave)] pl-3">
                        <Apunte>Te respondió:</Apunte>
                        <p className="carta flex items-center gap-2 text-[15px] text-[var(--color-tinta)]">
                          {IconoCierre && (
                            <IconoCierre size={15} className="text-[var(--color-acento-suave)]" />
                          )}
                          {m.respuesta.texto ??
                            (m.respuesta.cierre ? ETIQUETA_CIERRE[m.respuesta.cierre] : "")}
                        </p>
                      </div>
                    )}
                  </Tarjeta>
                </li>
              )
            })}
          </ul>
        )
      ) : entregas.length === 0 ? (
        <Vacio Icono={soloGuardados ? RiBookmarkLine : RiInboxLine}>
          {soloGuardados
            ? "Todavía no has guardado nada."
            : "Aquí aparecerá lo que te vaya escribiendo."}
        </Vacio>
      ) : (
        <ul className="space-y-3">
          {entregas.map((e) => {
            const Icono = ICONO_EMOCION[e.mensaje.emocion]
            return (
              <li key={e.id}>
                <Tarjeta className="aparece space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-tinta-suave)]">
                      <Icono size={15} className={COLOR_GRUPO[grupoDe(e.mensaje.emocion)]} />
                      {etiquetaDe(e.mensaje.emocion, "NEUTRO").toLowerCase()}
                    </span>
                    <span className="text-[12px] text-[var(--color-tinta-tenue)]">
                      {formatoLegible(e.entregadaEn, sesion.zonaHoraria)}
                    </span>
                  </div>

                  <TextoDeCarta>{e.mensaje.texto}</TextoDeCarta>

                  {/* Una respuesta de un toque cuenta igual que una escrita: si
                      no dejara rastro, parecería que no contestaste (§3.3). */}
                  {(e.respuesta?.texto || e.respuesta?.cierre) && (
                    <div className="border-l-2 border-[var(--color-borde)] pl-3">
                      <Apunte>Le respondiste:</Apunte>
                      <p className="flex items-center gap-2 text-[15px] text-[var(--color-tinta-suave)]">
                        {!e.respuesta.texto && e.respuesta.cierre && (
                          <IconoDeCierre cierre={e.respuesta.cierre} />
                        )}
                        {e.respuesta.texto ??
                          (e.respuesta.cierre ? ETIQUETA_CIERRE[e.respuesta.cierre] : "")}
                      </p>
                    </div>
                  )}

                  <BotonGuardar
                    mensajeId={e.mensaje.id}
                    guardado={idsGuardados.has(e.mensaje.id)}
                  />
                </Tarjeta>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/** El icono de una respuesta de un toque, en el color del acento. */
function IconoDeCierre({ cierre }: { cierre: keyof typeof ICONO_CIERRE }) {
  const Icono = ICONO_CIERRE[cierre]
  return <Icono size={15} className="text-[var(--color-acento-suave)]" />
}

/** Selector entre las tres vistas del cofre. */
function Pestana({
  href,
  activa,
  texto,
  Icono,
}: {
  href: string
  activa: boolean
  texto: string
  Icono: typeof RiInboxLine
}) {
  return (
    <Link
      href={href}
      aria-current={activa ? "page" : undefined}
      className={`pulsable inline-flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-pildora)] px-3 py-2 text-[13px] font-medium ${
        activa
          ? "bg-[var(--color-acento)] text-[#fffcf7] shadow-[var(--sombra-tinta)]"
          : "border border-[var(--color-borde)] bg-[var(--color-papel)] text-[var(--color-tinta-suave)]"
      }`}
    >
      <Icono size={15} />
      {texto}
    </Link>
  )
}

import {
  RiArchiveLine,
  RiBookmarkLine,
  RiChatQuoteLine,
  RiInboxLine,
  RiSendPlaneLine,
} from "@remixicon/react"
import Link from "next/link"
import { Apunte, Seccion, Tarjeta, TextoDeCarta, Titulo, Vacio } from "@/componentes/base"
import { BotonGuardar, BotonRetirar } from "@/componentes/boton-guardar"
import { COLOR_GRUPO, ICONO_CIERRE, ICONO_EMOCION } from "@/componentes/iconos"
import { AccionesApunte, BotonDesarchivar } from "@/componentes/yo"
import type { Emocion } from "@/generated/prisma/enums"
import { DestinoMensaje } from "@/generated/prisma/enums"
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
  { clave: "por-hablar", texto: "Por hablar", Icono: RiChatQuoteLine },
] as const

/**
 * El cofre (§3.2.2): todo lo escrito dentro del vínculo, dicho o no.
 *
 * "Enviados" no es un archivo: es la mitad del bucle. Sin saber si lo que
 * dejaste llegó, se vio o se contestó, escribir es hablarle a una pared —
 * y esa incertidumbre es justo lo que la app existe para quitar (§3.17).
 *
 * "Por hablar" es la otra mitad, la callada: lo que escribiste para ti y
 * todavía no has contado. Vive aquí y no en "Yo" porque pertenece al mismo
 * gesto que el resto —abrir el cofre y ver qué hay— y no a los ajustes.
 */
export default async function PaginaCofre({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; archivo?: string }>
}) {
  const { vista, archivo } = await searchParams
  const soloGuardados = vista === "guardados"
  const esEnviados = vista === "enviados"
  const esPorHablar = vista === "por-hablar"
  const verArchivo = archivo === "1"
  const { db, sesion } = await dbDeSesion()

  const guardados = await db.guardado.findMany({
    where: { usuarioId: sesion.usuarioId },
    select: { mensajeId: true },
  })
  const idsGuardados = new Set(guardados.map((g) => g.mensajeId))

  const [entregas, enviados, apuntes] = await Promise.all([
    esEnviados || esPorHablar
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
    esPorHablar
      ? db.mensaje.findMany({
          where: {
            autorId: sesion.usuarioId,
            destino: DestinoMensaje.SOLO_PARA_MI,
            archivadoEn: verArchivo ? { not: null } : null,
          },
          orderBy: { creadoEn: "desc" },
          take: 50,
        })
      : Promise.resolve([]),
  ])

  return (
    <div className="space-y-6">
      <Titulo>Cofre</Titulo>

      {/* Se desplaza en horizontal: cuatro vistas no caben a la vez en un
          teléfono estrecho, y apretarlas las haría ilegibles. */}
      <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

      {esPorHablar ? (
        <PorHablar
          apuntes={apuntes}
          verArchivo={verArchivo}
          hayPareja={Boolean(sesion.pareja)}
          zonaHoraria={sesion.zonaHoraria}
        />
      ) : esEnviados ? (
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

/**
 * Lo que escribiste para ti y todavía no has dicho (§2.0).
 *
 * Sin contador ni insistencia: una lista de cosas calladas con un número al
 * lado deja de ser una lista y se convierte en una deuda (RF-2.0.7).
 */
function PorHablar({
  apuntes,
  verArchivo,
  hayPareja,
  zonaHoraria,
}: {
  apuntes: { id: string; texto: string; emocion: Emocion; creadoEn: Date }[]
  verArchivo: boolean
  hayPareja: boolean
  zonaHoraria: string
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Seccion Icono={verArchivo ? RiArchiveLine : RiChatQuoteLine}>
          {verArchivo ? "Ya no están en la lista" : "Escrito solo para ti"}
        </Seccion>
        <Link
          href={verArchivo ? "/cofre?vista=por-hablar" : "/cofre?vista=por-hablar&archivo=1"}
          className="pulsable text-[12.5px] text-[var(--color-tinta-tenue)] hover:text-[var(--color-acento)]"
        >
          {verArchivo ? "Volver" : "Ver archivadas"}
        </Link>
      </div>

      {apuntes.length === 0 ? (
        <Vacio Icono={verArchivo ? RiArchiveLine : RiChatQuoteLine}>
          {verArchivo ? "No has archivado nada." : "Lo que escribas «solo para mí» aparecerá aquí."}
        </Vacio>
      ) : (
        <>
          <ul className="space-y-2">
            {apuntes.map((a) => {
              const Icono = ICONO_EMOCION[a.emocion]
              return (
                <li key={a.id}>
                  <Tarjeta className="aparece space-y-3">
                    <div className="flex items-start gap-2.5">
                      <Icono
                        size={16}
                        className={`mt-1 shrink-0 ${COLOR_GRUPO[grupoDe(a.emocion)]}`}
                      />
                      <p className="carta text-[16px] leading-relaxed">{a.texto}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Apunte>{formatoLegible(a.creadoEn, zonaHoraria)}</Apunte>
                      {verArchivo ? (
                        <BotonDesarchivar mensajeId={a.id} />
                      ) : (
                        <AccionesApunte mensajeId={a.id} hayPareja={hayPareja} />
                      )}
                    </div>
                  </Tarjeta>
                </li>
              )
            })}
          </ul>
          {!verArchivo && (
            <Apunte>
              «Decirlo ahora» se lo manda tal cual está escrito. No hay que empezar de cero.
            </Apunte>
          )}
        </>
      )}
    </div>
  )
}

/** Selector entre las vistas del cofre. */
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
      className={`pulsable inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[var(--radius-pildora)] px-3.5 py-2 text-[13px] font-medium ${
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

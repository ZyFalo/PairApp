/**
 * Qué ofrecer en un mal día cuando no hay nada nuevo esperando (RF-3.6).
 *
 * Sin `"use server"`: solo lee.
 */

import { DestinoMensaje } from "@/generated/prisma/enums"
import { type Consuelo, elegirConsuelo } from "@/lib/motor/consuelo"
import { estadoVigente, leVendriaBienAlgoGuardado } from "@/lib/motor/entrega"
import { dbDeSesion } from "@/lib/sesion"

/**
 * Lo que la app puede ofrecerme ahora mismo, o `null`.
 *
 * Devuelve `null` en tres casos distintos, y los tres son correctos:
 *
 * 1. **No estoy en carencia.** Nada que consolar; la app no se mete.
 * 2. **Estoy enojado.** El motor no empuja nada en «algo pasó» (RF-3.4): un
 *    mensaje de amor en el pico de una discusión se lee como invalidación.
 *    `leVendriaBienAlgoGuardado` ya solo mira la familia «me falta algo».
 * 3. **No hay nada que dar.** El quinto peldaño de la escalera, y el frecuente.
 *
 * Se busca **poco a propósito**: un guardado, una reserva y un recuerdo. Traer
 * listas largas para enseñar una cosa es trabajo tirado.
 */
export async function algoParaUnDiaFlojo(): Promise<Consuelo | null> {
  const { db, sesion } = await dbDeSesion()
  const ahora = new Date()

  const ultimo = await db.checkin.findFirst({
    where: { autorId: sesion.usuarioId },
    orderBy: { creadoEn: "desc" },
  })

  const estado = ultimo
    ? { emocion: ultimo.emocion, intensidad: ultimo.intensidad, creadoEn: ultimo.creadoEn }
    : null

  // Un estado de hace nueve horas no gobierna nada (RF-3.0.7.7), y fuera de
  // «me falta algo» esto no se ofrece — ni en un buen día ni en un enojo.
  if (!estadoVigente(estado, ahora) || !leVendriaBienAlgoGuardado(estado, ahora)) return null

  const [guardados, reservas, recuerdos] = await Promise.all([
    // Lo que **yo** guardé del cofre: por definición, lo que me importó.
    // Se ordena por el guardado más reciente, no por el mensaje más nuevo.
    db.guardado.findMany({
      where: { usuarioId: sesion.usuarioId },
      orderBy: { creadoEn: "desc" },
      take: 1,
      include: { mensaje: true },
    }),
    // Un mensaje suyo «para cuando le sirva» que sigue sin entregar. El cron ya
    // habría mandado los que casan con este estado, así que lo que quede aquí
    // es lo que no casaba: el mensaje de reserva de RF-2.7, que existe justo
    // para cuando no hay nada más.
    db.mensaje.findMany({
      where: {
        autorId: { not: sesion.usuarioId },
        destino: DestinoMensaje.CUANDO_LE_SIRVA,
        entrega: null,
        eliminadoEn: null,
      },
      orderBy: { creadoEn: "asc" },
      take: 1,
    }),
    // Un recuerdo. El más antiguo primero: «hace un año» dice más que «hace
    // dos semanas», que además probablemente todavía se recuerda solo.
    sesion.modulos.recuerdos
      ? db.recuerdo.findMany({ orderBy: { ocurrioEl: "asc" }, take: 1 })
      : Promise.resolve([]),
  ])

  return elegirConsuelo({
    guardadosSuyos: guardados.map((g) => ({
      mensajeId: g.mensajeId,
      texto: g.mensaje.texto,
      cuando: g.creadoEn,
    })),
    reservas: reservas.map((m) => ({ mensajeId: m.id })),
    recuerdos: recuerdos.map((r) => ({
      recuerdoId: r.id,
      titulo: r.titulo,
      ocurrioEl: r.ocurrioEl,
    })),
  })
}

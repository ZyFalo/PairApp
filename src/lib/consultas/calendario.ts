/**
 * Lo que cae en cada día del mes (M7), compuesto para pintarlo de una vez.
 *
 * Aquí se decide **qué se puede enseñar**, que es distinto de qué hay guardado:
 * cada capa pasa por el permiso de su dueña antes de llegar a la pantalla. La
 * regla que las une está en `motor/calendario.ts`; esto solo la aplica sobre
 * datos reales.
 *
 * Sin `"use server"`: solo lee.
 */

import type { Emocion } from "@/generated/prisma/enums"
import { Visibilidad } from "@/generated/prisma/enums"
import {
  animoDelDia,
  aniversarioEnLaRejilla,
  type CapaAnimo,
  type CasillaLlena,
  type Dia,
  diasDeCiclo,
  type ElDia,
  limitesDeLaRejilla,
  limitesDelDia,
  loQueSeVeDeElla,
  type Mes,
  rejillaDelMes,
} from "@/lib/motor/calendario"
import { DIAS_DE_PERIODO, estimarProximoCiclo } from "@/lib/motor/ciclo"
import { grupoDe } from "@/lib/motor/emociones"
import { diaLocal, diaSuelto, UN_DIA } from "@/lib/motor/tiempo"
import { dbDeSesion } from "@/lib/sesion"

/**
 * Cuántos periodos se traen al pintar un mes.
 *
 * Sirven para dos cosas a la vez: marcar los días de esta rejilla y estimar el
 * siguiente. Al navegar a un mes de hace dos años, los que se traen son los que
 * había entonces, así que las marcas salen igual — que era el fallo de pedir
 * solo los seis últimos y quedarse sin nada al mirar atrás.
 */
const ULTIMOS_CICLOS = { orderBy: { inicio: "desc" }, take: 24 } as const

/** Los periodos de alguien hasta una fecha, sin mirar más allá del mes pintado. */
function cicloHasta(usuarioId: string, hasta: Date) {
  return { usuarioId, inicio: { lte: hasta } }
}

/**
 * El mes entero, listo para la rejilla.
 *
 * Se traen las cinco capas de una vez y se cuelgan del día. La alternativa
 * —una consulta por casilla— serían cuarenta y dos viajes a la base para pintar
 * una pantalla.
 *
 * **Todo se sitúa en la zona de quien mira.** Un check-in suyo de las once de
 * la noche pertenece a su día en esta rejilla, no en la de ella: dos fronteras
 * de día distintas en una misma columna no se podrían leer.
 */
export async function loQuePasaEnElMes(mes: Mes): Promise<CasillaLlena[]> {
  const { db, sesion } = await dbDeSesion()
  const ahora = new Date()
  const zona = sesion.zonaHoraria
  const { desde, hasta } = limitesDeLaRejilla(mes, zona)

  const [misCheckins, susCheckins, misCiclos, susCiclos, planes, anuales, recuerdos] =
    await Promise.all([
      db.checkin.findMany({
        where: { autorId: sesion.usuarioId, creadoEn: { gte: desde, lte: hasta } },
        orderBy: { creadoEn: "asc" },
      }),
      // Su ánimo solo si ella lo encendió, y aun así sin lo que marcó privado:
      // el interruptor abre el historial, no anula lo que decidió cada día.
      sesion.pareja?.compartoAnimo
        ? db.checkin.findMany({
            where: {
              autorId: sesion.pareja.id,
              visibilidad: { not: Visibilidad.PRIVADO },
              creadoEn: { gte: desde, lte: hasta },
            },
            orderBy: { creadoEn: "asc" },
          })
        : Promise.resolve([]),
      sesion.llevaCiclo
        ? db.ciclo.findMany({ where: cicloHasta(sesion.usuarioId, hasta), ...ULTIMOS_CICLOS })
        : Promise.resolve([]),
      // De ella, solo lo que autorizó a ver (RF-5.3). La estimación se calcula
      // sobre esos mismos registros: sacarla de los que escondió sería enseñar
      // por la puerta de atrás lo que cerró por delante.
      sesion.pareja?.llevaCiclo
        ? db.ciclo.findMany({
            where: { ...cicloHasta(sesion.pareja.id, hasta), nivelVisibilidad: { not: "NADA" } },
            ...ULTIMOS_CICLOS,
          })
        : Promise.resolve([]),
      db.evento.findMany({ where: { anual: false, inicio: { gte: desde, lte: hasta } } }),
      // Los anuales no caben en una ventana: un cumpleaños de 1998 tiene que
      // salir en 2026. Son pocos, se traen todos y se calcula su ocurrencia.
      db.evento.findMany({ where: { anual: true } }),
      // Apagar un módulo lo apaga en todas partes, no solo en su pestaña: un
      // recuerdo no puede seguir marcando su casilla si los recuerdos no se usan.
      sesion.modulos.recuerdos
        ? db.recuerdo.findMany({ orderBy: { ocurrioEl: "desc" }, take: 200 })
        : Promise.resolve([]),
    ])

  const mios = porDia(misCheckins, zona)
  const suyos = porDia(susCheckins, zona)
  const cicloMio = diasDeCiclo(misCiclos, proximoInicioDe(misCiclos))
  const cicloSuyo = diasDeCiclo(susCiclos, proximoInicioDe(susCiclos))

  const conPlan = new Set<Dia>(planes.map((p) => diaLocal(zona, p.inicio)))
  for (const evento of anuales) {
    const cuando = aniversarioEnLaRejilla(evento.inicio, mes, zona)
    if (cuando) conPlan.add(cuando)
  }

  // Un recuerdo marca su día y también el aniversario que cae en esta rejilla.
  // La fecha se lee en UTC porque se guarda sin hora: el 14 de febrero es el 14
  // de febrero en todas partes.
  const conRecuerdo = new Set<Dia>()
  for (const recuerdo of recuerdos) {
    conRecuerdo.add(diaSuelto(recuerdo.ocurrioEl))
    const aniversario = aniversarioEnLaRejilla(recuerdo.ocurrioEl, mes, "utc")
    if (aniversario) conRecuerdo.add(aniversario)
  }

  const hoy = diaLocal(zona, ahora)

  return rejillaDelMes(mes).map((casilla) => {
    // La regla de RF-5.6 se aplica aquí y una sola vez: su ciclo y su ánimo
    // nunca salen juntos de esta función, así que ninguna pantalla puede
    // dibujarlos juntos por descuido.
    const suyo = loQueSeVeDeElla(
      animoVisible(suyos.get(casilla.dia) ?? []),
      cicloSuyo.get(casilla.dia) ?? null,
    )

    return {
      ...casilla,
      esHoy: casilla.dia === hoy,
      miAnimo: animoVisible(mios.get(casilla.dia) ?? []),
      suAnimo: suyo.animo,
      miCiclo: cicloMio.get(casilla.dia) ?? null,
      suCiclo: suyo.ciclo,
      hayPlan: conPlan.has(casilla.dia),
      hayRecuerdo: conRecuerdo.has(casilla.dia),
    }
  })
}

/**
 * El detalle de un día.
 *
 * Repite consultas que el mes ya hizo, y es a propósito: pintar la rejilla
 * completa con el detalle de cuarenta y dos días sería traerse el mes entero
 * para enseñar uno. Se paga una consulta más solo cuando alguien toca.
 *
 * **Los mensajes no salen aquí.** Ponerlos en una línea de tiempo convierte el
 * silencio en huecos visibles, y una semana en blanco pasa a leerse como
 * reproche (RF-2.0.7). El cofre ya responde qué se dijeron sin que la fecha
 * sea el eje.
 */
export async function elDia(dia: Dia): Promise<ElDia> {
  const { db, sesion } = await dbDeSesion()
  const zona = sesion.zonaHoraria
  const { desde, hasta } = limitesDelDia(dia, zona)
  const desdeCiclos = new Date(desde.getTime() - DIAS_DE_PERIODO * UN_DIA)

  const [misCheckins, susCheckins, planes, anuales, recuerdos, deseos, misCiclos, susCiclos] =
    await Promise.all([
      db.checkin.findMany({
        where: { autorId: sesion.usuarioId, creadoEn: { gte: desde, lte: hasta } },
        orderBy: { creadoEn: "asc" },
      }),
      sesion.pareja?.compartoAnimo
        ? db.checkin.findMany({
            where: {
              autorId: sesion.pareja.id,
              visibilidad: { not: Visibilidad.PRIVADO },
              creadoEn: { gte: desde, lte: hasta },
            },
            orderBy: { creadoEn: "asc" },
          })
        : Promise.resolve([]),
      db.evento.findMany({
        where: { anual: false, inicio: { gte: desde, lte: hasta } },
        orderBy: { inicio: "asc" },
      }),
      db.evento.findMany({ where: { anual: true } }),
      sesion.modulos.recuerdos
        ? db.recuerdo.findMany({ orderBy: { ocurrioEl: "desc" }, take: 200 })
        : Promise.resolve([]),
      sesion.modulos.once
        ? db.onceOnce.findMany({ where: { dia }, orderBy: { creadoEn: "asc" } })
        : Promise.resolve([]),
      sesion.llevaCiclo
        ? db.ciclo.findMany({ where: cicloHasta(sesion.usuarioId, hasta), ...ULTIMOS_CICLOS })
        : Promise.resolve([]),
      sesion.pareja?.llevaCiclo
        ? db.ciclo.findMany({
            where: { ...cicloHasta(sesion.pareja.id, hasta), nivelVisibilidad: { not: "NADA" } },
            ...ULTIMOS_CICLOS,
          })
        : Promise.resolve([]),
    ])

  const mes = dia.slice(0, 7)
  const anualesDeHoy = anuales.filter((e) => aniversarioEnLaRejilla(e.inicio, mes, zona) === dia)
  const recuerdosDeHoy = recuerdos.filter(
    (r) =>
      diaSuelto(r.ocurrioEl) === dia || aniversarioEnLaRejilla(r.ocurrioEl, mes, "utc") === dia,
  )

  const cicloSuyo = diasDeCiclo(susCiclos, proximoInicioDe(susCiclos)).get(dia) ?? null
  const suyo = loQueSeVeDeElla(animoVisible(susCheckins), cicloSuyo)

  // La nota solo acompaña a un día que de verdad es suyo, y solo si eligió el
  // nivel que la incluye (RF-5.3). El registrado manda sobre el estimado: no se
  // le pone voz a un cálculo.
  const cicloConNota = susCiclos.find(
    (c) => c.nivelVisibilidad === "FECHAS_Y_NOTA" && c.inicio >= desdeCiclos && c.inicio <= hasta,
  )

  return {
    dia,
    planes: [...planes, ...anualesDeHoy].map((p) => ({
      id: p.id,
      titulo: p.titulo,
      inicio: p.inicio,
      notas: p.notas,
      anual: p.anual,
    })),
    recuerdos: recuerdosDeHoy.map((r) => ({
      id: r.id,
      titulo: r.titulo,
      nota: r.nota,
      ocurrioEl: r.ocurrioEl,
    })),
    deseos: deseos.map((d) => ({
      id: d.id,
      texto: d.texto,
      mio: d.autorId === sesion.usuarioId,
    })),
    miAnimo: animoVisible(misCheckins),
    suAnimo: suyo.animo,
    miCiclo: diasDeCiclo(misCiclos, proximoInicioDe(misCiclos)).get(dia) ?? null,
    suCiclo: suyo.ciclo,
    suNota: suyo.ciclo === "REGISTRADO" ? (cicloConNota?.notaParaPareja ?? null) : null,
  }
}

/** Check-ins agrupados por el día al que pertenecen en la zona de quien mira. */
function porDia<T extends { creadoEn: Date }>(registros: T[], zona: string): Map<Dia, T[]> {
  const agrupados = new Map<Dia, T[]>()
  for (const registro of registros) {
    const dia = diaLocal(zona, registro.creadoEn)
    const acumulado = agrupados.get(dia)
    if (acumulado) acumulado.push(registro)
    else agrupados.set(dia, [registro])
  }
  return agrupados
}

/**
 * El ánimo de un día reducido a lo que se puede pintar.
 *
 * Un check-in de "solo el color" cuenta para elegir cuál representa el día
 * —callar el detalle no es no haber estado así— pero llega sin nombre.
 */
function animoVisible(
  delDia: { emocion: Emocion; intensidad: number; visibilidad: Visibilidad }[],
): CapaAnimo | null {
  const elegido = animoDelDia(delDia)
  if (!elegido) return null

  return {
    grupo: grupoDe(elegido.emocion),
    emocion: elegido.visibilidad === Visibilidad.SOLO_COLOR ? null : elegido.emocion,
  }
}

/** Cuándo se estima el próximo periodo, o null si no hay historial para decirlo. */
function proximoInicioDe(ciclos: { inicio: Date }[]): Date | null {
  return estimarProximoCiclo(ciclos.map((c) => c.inicio))?.proximoInicio ?? null
}

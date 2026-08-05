import { DestinoMensaje, TipoNovedad } from "@/generated/prisma/enums"
import { prismaCrudo } from "@/lib/db"
import { HORA_DE_LA_CAPSULA, textoDeSuAnimo, tocaAvisarDeSuAnimo } from "@/lib/motor/avisos"
import { limitesDelDia } from "@/lib/motor/calendario"
import { etiquetaDe } from "@/lib/motor/emociones"
import { estadoVigente, leVendriaBienAlgoGuardado } from "@/lib/motor/entrega"
import { participaEnLaVentana, ventanaOnceOnce } from "@/lib/motor/once"
import { diaLocal, franjaActual, tocaPreguntaPeriodica } from "@/lib/motor/tiempo"
import { avisar } from "@/lib/push"

export const dynamic = "force-dynamic"

/**
 * El único cron de la app (PLAN.md §0.2). Corre cada 15 minutos y pregunta
 * "¿a quién le toca algo ahora?".
 *
 * Las horas viven en la base de datos, no en la configuración del cron: cambiar
 * un horario es un UPDATE, no un despliegue. Y así seis preguntas diarias en dos
 * zonas horarias distintas no necesitan seis tareas programadas.
 */
export async function GET(peticion: Request) {
  const secreto = process.env.CRON_SECRET
  const cabecera = peticion.headers.get("authorization")
  if (secreto && cabecera !== `Bearer ${secreto}`) {
    return Response.json({ error: "no autorizado" }, { status: 401 })
  }

  const ahora = new Date()
  const hecho = {
    preguntas: 0,
    animos: 0,
    onceOnce: 0,
    guardados: 0,
    capsulas: 0,
    dedicatorias: 0,
    eventos: 0,
  }

  const usuarios = await prismaCrudo.usuario.findMany({ include: { membresia: true } })

  for (const usuario of usuarios) {
    if (!usuario.membresia) continue
    const vinculoId = usuario.membresia.vinculoId

    // 1. La pregunta periódica, si toca y no se registró nada hace poco (RF-1.0.2)
    if (tocaPreguntaPeriodica(usuario.horasPregunta, usuario.zonaHoraria, ahora)) {
      const reciente = await prismaCrudo.checkin.findFirst({
        where: {
          autorId: usuario.id,
          creadoEn: { gte: new Date(ahora.getTime() - 3 * 3_600_000) },
        },
      })
      if (!reciente) {
        await avisar(usuario.id, "¿Cómo estás?", undefined, "/hoy")
        hecho.preguntas++
      }
    }

    // 1.5 El aviso de que la otra persona registró cómo está (RF-3.0.1).
    //
    // **Es el aviso que convierte la app en presencia en lugar de un diario**, y
    // el que faltaba: hasta ahora nadie se enteraba de nada hasta abrir la app.
    //
    // Sale desde el cron y no al registrar, a propósito: así da tiempo a que se
    // escriba el mensaje y sale **uno** —«está triste, te dejó algo»— en vez de
    // dos seguidos por el mismo gesto.
    const suyos = await prismaCrudo.checkin.findMany({
      where: {
        vinculoId,
        autorId: { not: usuario.id },
        avisadoEn: null,
        creadoEn: { gte: new Date(ahora.getTime() - 2 * 3_600_000) },
      },
      orderBy: { creadoEn: "desc" },
      include: { mensajes: { where: { destino: { not: DestinoMensaje.SOLO_PARA_MI } } } },
    })

    for (const registro of suyos) {
      // Se marca siempre, aunque no llegue a sonar. Y eso incluye el horario de
      // silencio: un registro de las 23:30 **no se guarda para las ocho**.
      //
      // No es un descuido, es la caducidad. Un estado deja de gobernar nada a
      // las ocho horas (RF-3.0.7.7), y el silencio dura nueve: lo que se
      // anunciara por la mañana ya no sería verdad. «Cata está triste» sobre un
      // registro de anoche es peor que no decir nada — y al abrir la app lo ve
      // igual, que es donde vive el estado de verdad.
      await prismaCrudo.checkin.update({
        where: { id: registro.id },
        data: { avisadoEn: ahora },
      })

      if (
        !tocaAvisarDeSuAnimo(usuario.frecuenciaAnimo, registro.visibilidad, registro.intensidad)
      ) {
        continue
      }

      // Solo el más reciente se anuncia: si registró tres veces en dos horas,
      // el aviso es de cómo está ahora, no de cómo estuvo.
      if (registro.id !== suyos[0].id) continue

      const autor = await prismaCrudo.usuario.findUnique({
        where: { id: registro.autorId },
        select: { nombre: true, genero: true },
      })
      const mio = await prismaCrudo.checkin.findFirst({
        where: { autorId: usuario.id },
        orderBy: { creadoEn: "desc" },
      })

      await avisar(
        usuario.id,
        textoDeSuAnimo({
          nombre: autor?.nombre ?? "Tu pareja",
          emocion: registro.emocion,
          visibilidad: registro.visibilidad,
          etiqueta: etiquetaDe(registro.emocion, autor?.genero ?? "NEUTRO"),
          dejoMensaje: registro.mensajes.length > 0,
          // Atenuar según cómo está quien lo lee, y solo si su estado sigue
          // vigente: el de hace nueve horas ya no gobierna nada (RF-3.0.7.7).
          grupoDeQuienLee:
            mio &&
            estadoVigente(
              { emocion: mio.emocion, intensidad: mio.intensidad, creadoEn: mio.creadoEn },
              ahora,
            )
              ? mio.grupo
              : null,
        }),
        undefined,
        "/hoy",
        "de_ella",
      )
      hecho.animos++
    }

    // 2. El aviso de los 11:11, solo a quien participa en esa ventana (RF-12.1).
    //    Quien se salió no recibe nada, y la otra persona no puede notarlo: no
    //    pedir ya era indistinguible de haberse olvidado (RF-12.5, RF-12.8).
    const ventana = ventanaOnceOnce(usuario.zonaHoraria, ahora)
    if (ventana.abierta && participaEnLaVentana(usuario.ventanasOnce, ventana.esNoche)) {
      await avisar(usuario.id, "11:11", "Pide un deseo", "/nosotros")
      hecho.onceOnce++
    }

    // 3. Mensajes guardados cuya persona destino está en carencia (RF-2.2)
    const ultimo = await prismaCrudo.checkin.findFirst({
      where: { autorId: usuario.id },
      orderBy: { creadoEn: "desc" },
    })
    const enCarencia = leVendriaBienAlgoGuardado(
      ultimo
        ? {
            emocion: ultimo.emocion,
            intensidad: ultimo.intensidad,
            creadoEn: ultimo.creadoEn,
          }
        : null,
      ahora,
    )

    if (enCarencia && ultimo) {
      const yaHoy = await prismaCrudo.entrega.findFirst({
        where: {
          destinatarioId: usuario.id,
          entregadaEn: { gte: new Date(ahora.getTime() - 24 * 3_600_000) },
          mensaje: { destino: DestinoMensaje.CUANDO_LE_SIRVA },
        },
      })
      // Máximo uno al día: la escasez preserva el valor (RF-3.2)
      if (!yaHoy) {
        const guardado = await prismaCrudo.mensaje.findFirst({
          where: {
            vinculoId,
            destino: DestinoMensaje.CUANDO_LE_SIRVA,
            autorId: { not: usuario.id },
            entrega: null,
            disparadorEmociones: { has: ultimo.emocion },
          },
          orderBy: { creadoEn: "asc" },
        })
        if (guardado) {
          await prismaCrudo.entrega.create({
            data: {
              vinculoId,
              mensajeId: guardado.id,
              destinatarioId: usuario.id,
              llegadaEn: ahora,
            },
          })
          await avisar(usuario.id, "Hay algo que te dejó", undefined, "/hoy", "de_ella")
          hecho.guardados++
        }
      }
    }

    // 3.5 Cápsulas de un plan que es hoy (RF-7.6).
    //
    // Se busca por el día de quien la recibe, no por el del servidor: un plan
    // de las once de la noche pertenece a su día, no al que diga UTC. Y llega
    // sin haber avisado nunca de que existía — un reloj corriendo hacia una
    // sorpresa la estropea (RF-3.0.13.1).
    const { desde: arrancaHoy, hasta: acabaHoy } = limitesDelDia(
      diaLocal(usuario.zonaHoraria, ahora),
      usuario.zonaHoraria,
    )
    // A partir de las nueve de su mañana, no en la primera pasada tras la
    // medianoche: una cápsula escrita para una cena llegaba a las 00:07.
    const horaLocal = Number(
      new Intl.DateTimeFormat("es", {
        hour: "numeric",
        hour12: false,
        timeZone: usuario.zonaHoraria,
      }).format(ahora),
    )
    const conCapsula =
      horaLocal < HORA_DE_LA_CAPSULA
        ? []
        : await prismaCrudo.evento.findMany({
            where: {
              vinculoId,
              inicio: { gte: arrancaHoy, lte: acabaHoy },
              capsula: { is: { autorId: { not: usuario.id }, entrega: null, eliminadoEn: null } },
            },
            include: { capsula: true },
          })

    for (const plan of conCapsula) {
      if (!plan.capsula) continue
      await prismaCrudo.entrega.create({
        data: {
          vinculoId,
          mensajeId: plan.capsula.id,
          destinatarioId: usuario.id,
          llegadaEn: ahora,
        },
      })
      await avisar(usuario.id, "Hay algo que te dejó", plan.titulo, "/hoy", "de_ella")
      hecho.capsulas++
    }

    // 4. Dedicatorias de la franja actual (RF-8.3)
    const franja = franjaActual(usuario.zonaHoraria, ahora)
    const dedicatoria = await prismaCrudo.dedicatoria.findFirst({
      where: { vinculoId, franja, entregadaEn: null, autorId: { not: usuario.id } },
      orderBy: { creadoEn: "asc" },
    })
    if (dedicatoria) {
      await prismaCrudo.dedicatoria.update({
        where: { id: dedicatoria.id },
        data: { entregadaEn: ahora },
      })
      await avisar(
        usuario.id,
        "Te dedicaron una canción",
        dedicatoria.titulo ?? undefined,
        "/nosotros?vista=musica",
      )
      /**
       * La novedad se anota **al entregar** y no al dedicar (RF-7.10).
       *
       * Es la única de las cinco que no nace en su acción, y no es un descuido:
       * una dedicatoria se escribe para una franja del día y hasta que llega su
       * hora no ha pasado nada que contar. Anotarla al dedicarla adelantaría la
       * canción de la noche a las once de la mañana.
       *
       * Con `prismaCrudo` porque aquí no hay sesión de nadie: el cron no es una
       * persona usando la app. El vínculo sale de la propia dedicatoria.
       */
      await prismaCrudo.novedad.create({
        data: {
          vinculoId,
          autorId: dedicatoria.autorId,
          tipo: TipoNovedad.CANCION,
          titulo: dedicatoria.titulo ?? "Una canción",
          enlace: "/nosotros?vista=musica",
        },
      })
      hecho.dedicatorias++
    }
  }

  // 5. Recordatorios de calendario (RF-7.2)
  const eventos = await prismaCrudo.evento.findMany({
    where: { avisoHoras: { not: null }, avisadoEn: null, inicio: { gte: ahora } },
    take: 50,
  })
  for (const evento of eventos) {
    const avisarEn = evento.inicio.getTime() - (evento.avisoHoras ?? 0) * 3_600_000
    if (avisarEn <= ahora.getTime()) {
      const miembros = await prismaCrudo.membresia.findMany({
        where: { vinculoId: evento.vinculoId },
      })
      for (const m of miembros) await avisar(m.usuarioId, evento.titulo, undefined, "/nosotros")
      await prismaCrudo.evento.update({ where: { id: evento.id }, data: { avisadoEn: ahora } })
      hecho.eventos++
    }
  }

  return Response.json({ ok: true, ...hecho })
}

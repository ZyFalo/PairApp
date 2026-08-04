import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { DateTime } from "luxon"
import { PrismaClient } from "../src/generated/prisma/client"

/**
 * Pone la app en un estado concreto para poder probarla sin esperar al reloj.
 *
 * Media app depende del tiempo: la revisión en frío tarda doce horas, la
 * ventana de los 11:11 dura cuatro minutos al día, retirar un envío son dos
 * minutos y un check-in caduca a las ocho horas. Sin esto, probarla entera
 * significa esperar o escribir SQL a mano — y lo que cuesta probar, no se
 * prueba.
 *
 *   pnpm db:escenario <caso>
 *   pnpm db:escenario            (lista los casos)
 *
 * Cada caso deja dicho qué mirar y desde qué cuenta. Todos son idempotentes:
 * limpian lo suyo antes de montarlo, así que se pueden repetir.
 */
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const HORA = 3_600_000
const DIA = 24 * HORA

/** La zona en la que viven las dos personas de la semilla. */
const ZONA_SEMILLA = "America/Bogota"

/** Las dos personas del vínculo, tal como las deja `pnpm db:sembrar`. */
async function personas() {
  const will = await prisma.usuario.findUnique({
    where: { correo: "will@pairapp.local" },
    include: { membresia: true },
  })
  const ana = await prisma.usuario.findUnique({
    where: { correo: "ana@pairapp.local" },
    include: { membresia: true },
  })

  if (!will?.membresia || !ana?.membresia) {
    throw new Error("Falta la semilla. Ejecuta antes: pnpm db:sembrar")
  }
  return { will, ana, vinculoId: will.membresia.vinculoId }
}

/** Borra lo que un escenario anterior haya dejado puesto. */
async function limpiarMarcados(vinculoId: string) {
  await prisma.mensaje.deleteMany({ where: { vinculoId, texto: { startsWith: "[escenario]" } } })
  await prisma.checkin.deleteMany({ where: { vinculoId, id: { startsWith: "esc-" } } })
  await prisma.recuerdo.deleteMany({ where: { vinculoId, titulo: { startsWith: "[escenario]" } } })
  await prisma.evento.deleteMany({ where: { vinculoId, titulo: { startsWith: "[escenario]" } } })
  // Los ciclos no tienen texto donde dejar la marca, así que se borran los que
  // caen en la ventana que usa el escenario del calendario: los tres meses
  // alrededor de hoy. Lo de más atrás, si lo hubiera, se queda.
  await prisma.ciclo.deleteMany({
    where: {
      vinculoId,
      inicio: {
        gte: DateTime.utc().minus({ months: 3 }).toJSDate(),
        lte: DateTime.utc().plus({ months: 1 }).toJSDate(),
      },
    },
  })
}

/** Registra cómo está alguien, hace `haceHoras` horas. */
async function checkin(
  vinculoId: string,
  autorId: string,
  emocion: "BIEN" | "AGRADECIDO" | "TRISTE" | "ME_SIENTO_SOLO" | "INCOMODO" | "ENOJADO",
  grupo: "ESTOY_CONTIGO" | "ME_FALTA_ALGO" | "ALGO_PASO",
  intensidad = 3,
  haceHoras = 0,
) {
  return prisma.checkin.create({
    data: {
      id: `esc-${autorId.slice(-6)}-${Date.now()}-${Math.round(intensidad * 97)}`,
      vinculoId,
      autorId,
      emocion,
      grupo,
      intensidad,
      creadoEn: new Date(Date.now() - haceHoras * HORA),
    },
  })
}

/** Un mensaje de escenario, marcado para poder limpiarlo después. */
async function mensaje(datos: {
  vinculoId: string
  autorId: string
  emocion: "BIEN" | "AGRADECIDO" | "TRISTE" | "INCOMODO" | "ENOJADO"
  clase: "PRESENCIA" | "CONVERSACION"
  destino: "AHORA" | "CUANDO_LE_SIRVA" | "SOLO_PARA_MI"
  texto: string
  haceHoras?: number
  enFrioHasta?: Date | null
  disparadores?: ("TRISTE" | "ME_SIENTO_SOLO" | "PREOCUPADO")[]
}) {
  return prisma.mensaje.create({
    data: {
      vinculoId: datos.vinculoId,
      autorId: datos.autorId,
      emocion: datos.emocion,
      clase: datos.clase,
      destino: datos.destino,
      texto: `[escenario] ${datos.texto}`,
      creadoEn: new Date(Date.now() - (datos.haceHoras ?? 0) * HORA),
      enFrioHasta: datos.enFrioHasta ?? null,
      disparadorEmociones: datos.disparadores ?? [],
    },
  })
}

/** Entrega un mensaje, opcionalmente fechada hacia atrás. */
async function entregar(
  vinculoId: string,
  mensajeId: string,
  destinatarioId: string,
  haceMinutos = 0,
) {
  const cuando = new Date(Date.now() - haceMinutos * 60_000)
  return prisma.entrega.create({
    data: { vinculoId, mensajeId, destinatarioId, entregadaEn: cuando, llegadaEn: cuando },
  })
}

type Caso = { descripcion: string; montar: () => Promise<string[]> }

const CASOS: Record<string, Caso> = {
  // -------------------------------------------------------------------------
  frio: {
    descripcion: "Un mensaje escrito enojado que lleva 13 h esperando en frío",
    async montar() {
      const { will, vinculoId } = await personas()
      await limpiarMarcados(vinculoId)
      await mensaje({
        vinculoId,
        autorId: will.id,
        emocion: "ENOJADO",
        clase: "CONVERSACION",
        destino: "SOLO_PARA_MI",
        texto: "Llevo semanas esperando que saques el tema y no lo haces.",
        haceHoras: 13,
        enFrioHasta: new Date(Date.now() - HORA),
      })
      return [
        "Entra como Will y abre Hoy.",
        'Debe salir "Escribiste esto ayer" con Enviarlo · Editarlo · Dejarlo ir.',
        "Las tres opciones pesan lo mismo a propósito (RF-6.3.3).",
      ]
    },
  },

  // -------------------------------------------------------------------------
  reparar: {
    descripcion: "Los dos en «algo pasó»: aparece el botón de reparación",
    async montar() {
      const { will, ana, vinculoId } = await personas()
      await limpiarMarcados(vinculoId)
      await checkin(vinculoId, will.id, "ENOJADO", "ALGO_PASO", 4)
      await checkin(vinculoId, ana.id, "INCOMODO", "ALGO_PASO", 3)
      return [
        "Entra como Will y abre Hoy.",
        'Arriba debe salir "Los dos están en un mal momento" con cuatro frases.',
        "Al tocar una, le llega como mensaje normal (§6.8).",
      ]
    },
  },

  // -------------------------------------------------------------------------
  nombrar: {
    descripcion: "Los dos enojados y ella te escribe: la tercera celda de la matriz",
    async montar() {
      const { will, ana, vinculoId } = await personas()
      await limpiarMarcados(vinculoId)
      await prisma.entrega.deleteMany({ where: { vinculoId, destinatarioId: will.id, vistaEn: null } })
      await checkin(vinculoId, will.id, "ENOJADO", "ALGO_PASO", 4)
      const m = await mensaje({
        vinculoId,
        autorId: ana.id,
        emocion: "ENOJADO",
        clase: "CONVERSACION",
        destino: "AHORA",
        texto: "No me gustó cómo terminó la conversación de ayer.",
      })
      await entregar(vinculoId, m.id, will.id)
      return [
        "Entra como Will y abre Hoy.",
        'Debe salir "Los dos están enojados" con Leerlo ahora · Mañana por la mañana.',
        'Si eliges esperar, el mensaje sigue SIN LEER y vuelve mañana (D43).',
      ]
    },
  },

  // -------------------------------------------------------------------------
  amortiguador: {
    descripcion: "Estás en carencia y te llega algo difícil: entra el amortiguador",
    async montar() {
      const { will, ana, vinculoId } = await personas()
      await limpiarMarcados(vinculoId)
      await prisma.entrega.deleteMany({ where: { vinculoId, destinatarioId: will.id, vistaEn: null } })
      await checkin(vinculoId, will.id, "TRISTE", "ME_FALTA_ALGO", 4)
      // Algo cálido suyo que ya salió hacia mí: es lo que se pone delante
      const calido = await mensaje({
        vinculoId,
        autorId: ana.id,
        emocion: "AGRADECIDO",
        clase: "PRESENCIA",
        destino: "AHORA",
        texto: "Me acordé de lo bien que lo pasamos el sábado.",
        haceHoras: 48,
      })
      // Ya leído: es material del pasado del que tirar, no algo pendiente.
      // Si quedara sin ver, sería él quien saliera primero —Hoy muestra la
      // entrega más antigua— y nunca se llegaría a ver el amortiguador.
      const entregaCalida = await entregar(vinculoId, calido.id, will.id, 2880)
      await prisma.entrega.update({
        where: { id: entregaCalida.id },
        data: { vistaEn: new Date(Date.now() - 2 * DIA) },
      })
      const dificil = await mensaje({
        vinculoId,
        autorId: ana.id,
        emocion: "INCOMODO",
        clase: "CONVERSACION",
        destino: "AHORA",
        texto: "Me quedé pensando en lo del martes.",
      })
      await entregar(vinculoId, dificil.id, will.id)
      return [
        "Entra como Will y abre Hoy.",
        "Antes del mensaje difícil debe aparecer algo cálido de Ana (RF-3.0.7).",
        '"Un rato más" debe aplazarlo de verdad, no devolverte al mismo sitio.',
      ]
    },
  },

  // -------------------------------------------------------------------------
  retirar: {
    descripcion: "Un mensaje recién enviado y sin abrir: todavía se puede retirar",
    async montar() {
      const { will, ana, vinculoId } = await personas()
      await limpiarMarcados(vinculoId)
      const m = await mensaje({
        vinculoId,
        autorId: will.id,
        emocion: "ENOJADO",
        clase: "CONVERSACION",
        destino: "AHORA",
        texto: "Esto lo mandé sin pensarlo dos veces.",
      })
      await entregar(vinculoId, m.id, ana.id)
      return [
        "Entra como Will y ve a Cofre → Enviados.",
        'Debe salir "Retirarlo" en acento (§6.4.1). Tienes DOS MINUTOS.',
        'Pasados los dos minutos se convierte en "Eliminar", que deja rastro.',
      ]
    },
  },

  // -------------------------------------------------------------------------
  guardado: {
    descripcion: "Ella está en carencia y hay algo guardado para ese momento",
    async montar() {
      const { will, ana, vinculoId } = await personas()
      await limpiarMarcados(vinculoId)
      await checkin(vinculoId, ana.id, "ME_SIENTO_SOLO", "ME_FALTA_ALGO", 4)
      await mensaje({
        vinculoId,
        autorId: will.id,
        emocion: "BIEN",
        clase: "PRESENCIA",
        destino: "CUANDO_LE_SIRVA",
        texto: "Si estás leyendo esto es porque hoy pesó. Aquí estoy.",
        disparadores: ["TRISTE", "ME_SIENTO_SOLO", "PREOCUPADO"],
      })
      return [
        "Lanza el cron:",
        '  curl -H "Authorization: Bearer $(grep ^CRON_SECRET= .env | cut -d= -f2-)" \\',
        "       http://localhost:3000/api/cron/despachar",
        "Entra como Ana: debe tener el mensaje guardado esperándola (RF-2.2).",
      ]
    },
  },

  // -------------------------------------------------------------------------
  once: {
    descripcion: "Abre la ventana de los 11:11 moviendo la zona horaria de los dos",
    async montar() {
      const { will, ana, vinculoId } = await personas()
      const ahora = DateTime.utc()

      /**
       * Mover la zona horaria desplaza la **hora**, nunca el minuto: en todas
       * las zonas de desfase entero son y siempre serán los mismos minutos. Y
       * la ventana de los 11:11 depende justo del minuto (11 a 15).
       *
       * Así que esto solo puede funcionar cuando el reloj real está en esos
       * minutos de cualquier hora. Lo demás sería fingir que funciona.
       */
      if (ahora.minute < 11 || ahora.minute > 15) {
        const faltan = (11 - ahora.minute + 60) % 60
        throw new Error(
          [
            "Los 11:11 no se pueden falsear desde la base de datos.",
            "",
            "Cambiar la zona horaria mueve la hora pero no el minuto, y la",
            `ventana va del minuto 11 al 15. Ahora es el minuto ${ahora.minute}.`,
            "",
            `Vuelve a lanzarlo dentro de ${faltan} minuto${faltan === 1 ? "" : "s"},`,
            `sobre las XX:11. Tendrás cuatro minutos para probarlo.`,
          ].join("\n  "),
        )
      }

      // Con el minuto ya dentro, basta con llevar la hora local hasta las 11.
      let desfase = 11 - ahora.hour
      if (desfase > 14) desfase -= 24
      if (desfase < -12) desfase += 24
      const zona = `UTC${desfase >= 0 ? "+" : ""}${desfase}`

      await prisma.usuario.updateMany({
        where: { id: { in: [will.id, ana.id] } },
        data: { zonaHoraria: zona },
      })
      await prisma.onceOnce.deleteMany({ where: { vinculoId } })

      // Un mensaje sin leer manda sobre todo lo demás en Hoy, así que taparía
      // la tarjeta. Se dan por vistos: aquí lo que se prueba es el ritual.
      await prisma.entrega.updateMany({
        where: { vinculoId, vistaEn: null },
        data: { vistaEn: new Date() },
      })

      return [
        `Zona horaria de los dos puesta a ${zona}: ahí son las 11:${ahora.minute}.`,
        `Te quedan unos ${16 - ahora.minute} minutos de ventana.`,
        "Entra como Will y abre Hoy: debe salir la tarjeta de los 11:11.",
        "Pide un deseo, entra como Ana y pide otro: sale «Los dos pidieron a la vez».",
        "",
        "Para devolverlo a la normalidad:  pnpm db:escenario zona-normal",
      ]
    },
  },

  "zona-normal": {
    descripcion: "Devuelve a los dos a America/Bogota",
    async montar() {
      const { will, ana } = await personas()
      await prisma.usuario.updateMany({
        where: { id: { in: [will.id, ana.id] } },
        data: { zonaHoraria: "America/Bogota" },
      })
      return ["Los dos vuelven a America/Bogota."]
    },
  },

  // -------------------------------------------------------------------------
  caducado: {
    descripcion: "Tu último check-in tiene 9 h: el motor deja de tenerlo en cuenta",
    async montar() {
      const { will, ana, vinculoId } = await personas()
      await limpiarMarcados(vinculoId)
      await prisma.entrega.deleteMany({ where: { vinculoId, destinatarioId: will.id, vistaEn: null } })
      await checkin(vinculoId, will.id, "TRISTE", "ME_FALTA_ALGO", 5, 9)
      const m = await mensaje({
        vinculoId,
        autorId: ana.id,
        emocion: "INCOMODO",
        clase: "CONVERSACION",
        destino: "AHORA",
        texto: "Quería contarte una cosa.",
      })
      await entregar(vinculoId, m.id, will.id)
      return [
        "Entra como Will y abre Hoy.",
        "Aunque registraste tristeza, el mensaje llega DIRECTO y sin amortiguador:",
        "pasadas 8 h el estado ya no gobierna nada (RF-3.0.7.7).",
      ]
    },
  },

  // -------------------------------------------------------------------------
  aniversario: {
    descripcion: "Un recuerdo de hace justo un año, para ver el «hace un año»",
    async montar() {
      const { will, vinculoId } = await personas()
      await limpiarMarcados(vinculoId)
      const haceUnAno = DateTime.utc().minus({ years: 1 }).startOf("day")
      await prisma.recuerdo.create({
        data: {
          vinculoId,
          autorId: will.id,
          titulo: "[escenario] La playa a la que llegamos sin plan",
          nota: "Nos quedamos hasta que se fue la luz.",
          ocurrioEl: haceUnAno.toJSDate(),
        },
      })
      return [
        "Abre Nosotros → Recuerdos.",
        'El recuerdo debe llevar la marca "Hace un año" (RF-11.2).',
        `Su fecha debe leerse como ${haceUnAno.setLocale("es").toFormat("d 'de' LLLL 'de' yyyy")},`,
        "sin hora y sin desplazarse un día por la zona horaria.",
      ]
    },
  },

  // -------------------------------------------------------------------------
  // -------------------------------------------------------------------------
  calendario: {
    descripcion: "Un mes con periodos, ánimo de los dos, planes y un aniversario",
    async montar() {
      const { will, ana, vinculoId } = await personas()
      await limpiarMarcados(vinculoId)

      // Ella lleva su ciclo y deja ver su ánimo: es el único estado en que se
      // pueden comprobar las dos capas suyas a la vez — y que nunca coinciden.
      await prisma.usuario.update({
        where: { id: ana.id },
        data: { llevaCiclo: true, compartoAnimo: true },
      })
      await prisma.usuario.update({ where: { id: will.id }, data: { compartoAnimo: true } })

      // Dos relojes a propósito, y confundirlos coloca las cosas en el día de
      // al lado: los periodos y los recuerdos son **días sueltos** y se guardan
      // a medianoche UTC, mientras que un plan es un **instante** y pertenece
      // al día que sea en la zona de quien lo mira. Un cumpleaños creado a las
      // 00:00 UTC salía en la casilla del día anterior desde Bogotá.
      const hoy = DateTime.utc().startOf("day")
      const hoyLocal = DateTime.now().setZone(ZONA_SEMILLA).startOf("day")

      // Dos periodos seguidos, para que haya con qué estimar el siguiente. El
      // más reciente empieza hace ocho días: cae dentro del mes que se abre.
      for (const haceDias of [8, 36]) {
        await prisma.ciclo.create({
          data: {
            vinculoId,
            usuarioId: ana.id,
            inicio: hoy.minus({ days: haceDias }).toJSDate(),
            fin: hoy.minus({ days: haceDias - 4 }).toJSDate(),
            nivelVisibilidad: "FECHAS_Y_NOTA",
            notaParaPareja: "Estos días no me preguntes si estoy bien. Trae té y pon una peli.",
          },
        })
      }

      // Ánimo de los dos repartido por el mes. A ella se le pone uno en pleno
      // periodo a propósito: ese día su punto **no** puede salir (RF-5.6).
      const dias: [number, "BIEN" | "AGRADECIDO" | "TRISTE" | "INCOMODO" | "ENOJADO", string, number][] = [
        [1, "BIEN", "ESTOY_CONTIGO", 3],
        [2, "TRISTE", "ME_FALTA_ALGO", 4],
        [4, "AGRADECIDO", "ESTOY_CONTIGO", 5],
        [7, "INCOMODO", "ALGO_PASO", 2],
        [9, "BIEN", "ESTOY_CONTIGO", 3],
      ]
      for (const [haceDias, emocion, grupo, intensidad] of dias) {
        await checkin(vinculoId, will.id, emocion, grupo as never, intensidad, haceDias * 24)
        await checkin(vinculoId, ana.id, emocion, grupo as never, intensidad, haceDias * 24 - 2)
      }

      // Un día con dos registros de distinta fuerza: el calendario tiene que
      // quedarse con el intenso, no con el último ni con el más repetido.
      await checkin(vinculoId, will.id, "BIEN", "ESTOY_CONTIGO", 2, 3 * 24)
      await checkin(vinculoId, will.id, "BIEN", "ESTOY_CONTIGO", 2, 3 * 24 - 1)
      await checkin(vinculoId, will.id, "ENOJADO", "ALGO_PASO", 5, 3 * 24 - 3)

      await prisma.evento.createMany({
        data: [
          {
            vinculoId,
            creadorId: will.id,
            titulo: "[escenario] Cena en el sitio de siempre",
            inicio: hoyLocal.plus({ days: 3, hours: 21 }).toJSDate(),
            notas: "Reservar antes de las siete.",
          },
          {
            vinculoId,
            creadorId: ana.id,
            titulo: "[escenario] Su cumpleaños",
            inicio: hoyLocal.plus({ days: 5, hours: 12 }).minus({ years: 27 }).toJSDate(),
            anual: true,
          },
        ],
      })

      // Deseos de varios días, para que la colección tenga qué enseñar (RF-12.6).
      // Uno de los días con los dos: es la única forma de ver cómo se leen juntos.
      await prisma.onceOnce.createMany({
        data: [
          { vinculoId, autorId: will.id, texto: "Que te vaya bien mañana.", dia: hoy.minus({ days: 1 }).toFormat("yyyy-MM-dd"), esNoche: false },
          { vinculoId, autorId: ana.id, texto: "Que se nos pase rápido la semana.", dia: hoy.minus({ days: 1 }).toFormat("yyyy-MM-dd"), esNoche: false },
          { vinculoId, autorId: ana.id, texto: "Dormir bien de una vez.", dia: hoy.minus({ days: 1 }).toFormat("yyyy-MM-dd"), esNoche: true },
          { vinculoId, autorId: will.id, texto: "Que el viaje salga.", dia: hoy.minus({ days: 6 }).toFormat("yyyy-MM-dd"), esNoche: true },
        ],
      })

      await prisma.recuerdo.create({
        data: {
          vinculoId,
          autorId: will.id,
          titulo: "[escenario] El día que nos perdimos volviendo",
          nota: "Acabamos cenando en una gasolinera y fue de las mejores noches.",
          ocurrioEl: hoy.minus({ years: 2 }).plus({ days: 2 }).toJSDate(),
        },
      })

      return [
        "Abre la app: debe entrar directamente en el calendario del mes.",
        "En la rejilla: puntos de ánimo, marcas de plan y recuerdo, y franjas de periodo.",
        "La franja sólida son los días registrados; la punteada, la estimación (RF-5.2).",
        `Hace 3 días registraste "bien" dos veces y un enojo del 5: el punto debe ser`,
        "el del enojo — gana el más intenso, nunca el más repetido.",
        `Los días de su periodo (desde hace 8) no pueden llevar su punto de ánimo:`,
        "es la correlación que RF-5.6 prohíbe. El tuyo sí sale.",
        "Toca uno de esos días: sale su nota, y su ánimo tampoco aparece dentro.",
        "En 5 días hay un cumpleaños anual: debe salir aunque se apuntara hace 27 años.",
        "Pasa al mes anterior y al siguiente: las franjas y los planes deben seguir cuadrando.",
        "En la vista 11:11 hay deseos de dos días; los de ayer se leen juntos (RF-12.6).",
        "En Yo → Ajustes, pon «No participar»: la ventana deja de abrirse, pero la",
        "colección sigue entera. Salirse del ritual no quema el archivo.",
        "Y lo que NO puede pasar: ningún día vacío marcado como fallado, ni contadores.",
      ]
    },
  },

  // -------------------------------------------------------------------------
  limpio: {
    descripcion: "Quita todo lo que hayan dejado los escenarios",
    async montar() {
      const { vinculoId } = await personas()
      await limpiarMarcados(vinculoId)
      await prisma.usuario.updateMany({ data: { zonaHoraria: "America/Bogota" } })
      return ["Limpio. La semilla original sigue intacta."]
    },
  },
}

async function principal() {
  const caso = process.argv[2]

  if (!caso || !CASOS[caso]) {
    if (caso) console.log(`\n  No existe el escenario "${caso}".`)
    console.log("\n  Escenarios disponibles:\n")
    for (const [nombre, { descripcion }] of Object.entries(CASOS)) {
      console.log(`    ${nombre.padEnd(14)} ${descripcion}`)
    }
    console.log("\n  Uso:  pnpm db:escenario <caso>\n")
    return
  }

  const pasos = await CASOS[caso].montar()
  console.log(`\n  ${CASOS[caso].descripcion}\n`)
  for (const paso of pasos) console.log(`  ${paso}`)
  console.log("\n  Recuerda: si cambiaste de escenario, recarga la página.\n")
}

principal()
  .catch((error) => {
    console.error(`\n  ${error instanceof Error ? error.message : error}\n`)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())

import "dotenv/config"
import { hash } from "@node-rs/argon2"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

/**
 * Deja el vínculo listo para probar sin registrar dos cuentas a mano.
 *
 * Crea dos personas con datos de ejemplo repartidos por las siete funciones
 * del MVP. Es idempotente: borra lo anterior y vuelve a sembrar.
 *
 *   pnpm db:sembrar
 */
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const CORREO_A = "will@pairapp.local"
const CORREO_B = "ana@pairapp.local"
const CONTRASENA = "pairapp123"

async function main() {
  // Limpieza: borrar el vínculo arrastra todo lo suyo por cascada.
  const previos = await prisma.usuario.findMany({
    where: { correo: { in: [CORREO_A, CORREO_B] } },
    include: { membresia: true },
  })
  for (const u of previos) {
    if (u.membresia) {
      await prisma.vinculo.delete({ where: { id: u.membresia.vinculoId } }).catch(() => {})
    }
  }
  await prisma.usuario.deleteMany({ where: { correo: { in: [CORREO_A, CORREO_B] } } })

  const contrasenaHash = await hash(CONTRASENA)
  const vinculo = await prisma.vinculo.create({ data: {} })

  const will = await prisma.usuario.create({
    data: {
      correo: CORREO_A,
      contrasenaHash,
      nombre: "Will",
      genero: "MASCULINO",
      zonaHoraria: "America/Bogota",
      horasPregunta: [9, 14, 19],
    },
  })
  const ana = await prisma.usuario.create({
    data: {
      correo: CORREO_B,
      contrasenaHash,
      nombre: "Ana",
      genero: "FEMENINO",
      zonaHoraria: "America/Bogota",
      // Desfasadas una hora exacta respecto a las de Will (RF-1.0.3)
      horasPregunta: [10, 15, 20],
    },
  })

  await prisma.membresia.createMany({
    data: [
      { usuarioId: will.id, vinculoId: vinculo.id },
      { usuarioId: ana.id, vinculoId: vinculo.id },
    ],
  })

  const hace = (horas: number) => new Date(Date.now() - horas * 3_600_000)

  // Un mensaje cálido de Ana, que sirve de amortiguador cuando Will esté mal.
  const calido = await prisma.mensaje.create({
    data: {
      vinculoId: vinculo.id,
      autorId: ana.id,
      emocion: "AGRADECIDO",
      clase: "PRESENCIA",
      destino: "AHORA",
      texto:
        "Me acordé de cuando nos quedamos sin gasolina y terminamos riéndonos en la carretera. Te amo.",
      creadoEn: hace(72),
    },
  })
  await prisma.entrega.create({
    data: {
      vinculoId: vinculo.id,
      mensajeId: calido.id,
      destinatarioId: will.id,
      entregadaEn: hace(72),
      llegadaEn: hace(72),
      vistaEn: hace(71),
    },
  })
  await prisma.guardado.create({
    data: { vinculoId: vinculo.id, mensajeId: calido.id, usuarioId: will.id },
  })

  // Un mensaje sin leer, para que al entrar como Will haya algo esperando.
  const incomodo = await prisma.mensaje.create({
    data: {
      vinculoId: vinculo.id,
      autorId: ana.id,
      emocion: "INCOMODO",
      clase: "CONVERSACION",
      destino: "AHORA",
      texto:
        "Ayer viendo la peli sentí que estabas más en el celular que conmigo. No es grave, pero me quedó dando vueltas.",
      necesidad: "ESCUCHA",
      creadoEn: hace(2),
    },
  })
  await prisma.entrega.create({
    data: {
      vinculoId: vinculo.id,
      mensajeId: incomodo.id,
      destinatarioId: will.id,
      entregadaEn: hace(2),
      llegadaEn: hace(2),
    },
  })

  // Un mensaje guardado de Will, esperando a que Ana lo necesite.
  await prisma.mensaje.create({
    data: {
      vinculoId: vinculo.id,
      autorId: will.id,
      emocion: "BIEN",
      clase: "PRESENCIA",
      destino: "CUANDO_LE_SIRVA",
      texto:
        "Si estás leyendo esto es porque hoy no fue un buen día. No tienes que estar bien ahora. Aquí estoy.",
      disparadorEmociones: ["TRISTE", "ME_SIENTO_SOLO", "PREOCUPADO"],
      creadoEn: hace(48),
    },
  })

  // Un apunte privado de Will, para probar "decirlo ahora" (RF-2.0.6).
  await prisma.mensaje.create({
    data: {
      vinculoId: vinculo.id,
      autorId: will.id,
      emocion: "INCOMODO",
      clase: "CONVERSACION",
      destino: "SOLO_PARA_MI",
      texto: "Me quedé con ganas de decirle que me molestó cómo terminó la conversación del martes.",
      creadoEn: hace(24),
    },
  })

  await prisma.checkin.createMany({
    data: [
      {
        vinculoId: vinculo.id,
        autorId: ana.id,
        emocion: "INCOMODO",
        grupo: "ALGO_PASO",
        intensidad: 3,
        necesidad: "ESCUCHA",
        creadoEn: hace(2),
      },
      {
        vinculoId: vinculo.id,
        autorId: will.id,
        emocion: "BIEN",
        grupo: "ESTOY_CONTIGO",
        intensidad: 4,
        creadoEn: hace(20),
      },
    ],
  })

  await prisma.evento.create({
    data: {
      vinculoId: vinculo.id,
      creadorId: will.id,
      titulo: "Cena en el italiano",
      tipo: "cita",
      inicio: new Date(Date.now() + 3 * 24 * 3_600_000),
      avisoHoras: 24,
    },
  })

  await prisma.dedicatoria.create({
    data: {
      vinculoId: vinculo.id,
      autorId: ana.id,
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      titulo: "Nuestra canción",
      mensaje: "Para cuando te levantes.",
      franja: "MANANA",
    },
  })

  await prisma.ciclo.create({
    data: {
      vinculoId: vinculo.id,
      usuarioId: ana.id,
      inicio: new Date(Date.now() - 5 * 24 * 3_600_000),
      nivelVisibilidad: "FECHAS_Y_NOTA",
      notaParaPareja:
        "Estos días agradezco que no me preguntes si estoy bien. Un té y una peli valen más.",
    },
  })

  console.log(`
  ✓ Datos de prueba listos

    Will  ${CORREO_A}   ${CONTRASENA}
    Ana   ${CORREO_B}   ${CONTRASENA}

  Entra como Will: hay un mensaje de Ana sin leer esperándote.
  `)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

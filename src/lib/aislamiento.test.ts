import { beforeAll, describe, expect, it } from "vitest"
import { dbDelVinculo, prismaCrudo } from "./db"

/**
 * La prueba que sostiene RNF-4: nadie puede leer datos de otro vínculo.
 *
 * Se montan dos parejas distintas con datos propios y se comprueba que el
 * cliente acotado de una nunca ve nada de la otra. Es el test que hay que
 * mirar antes que ningún otro si alguna vez se toca `src/lib/db.ts`.
 */
describe("aislamiento entre vínculos", () => {
  let vinculoA = ""
  let vinculoB = ""

  beforeAll(async () => {
    const marca = `test-${Date.now()}`

    const a = await prismaCrudo.vinculo.create({ data: {} })
    const b = await prismaCrudo.vinculo.create({ data: {} })
    vinculoA = a.id
    vinculoB = b.id

    const usuarioA = await prismaCrudo.usuario.create({
      data: { correo: `a-${marca}@test.local`, contrasenaHash: "x", nombre: "A" },
    })
    const usuarioB = await prismaCrudo.usuario.create({
      data: { correo: `b-${marca}@test.local`, contrasenaHash: "x", nombre: "B" },
    })
    await prismaCrudo.membresia.create({ data: { usuarioId: usuarioA.id, vinculoId: vinculoA } })
    await prismaCrudo.membresia.create({ data: { usuarioId: usuarioB.id, vinculoId: vinculoB } })

    await prismaCrudo.checkin.create({
      data: {
        vinculoId: vinculoA,
        autorId: usuarioA.id,
        emocion: "TRISTE",
        grupo: "ME_FALTA_ALGO",
      },
    })
    await prismaCrudo.checkin.create({
      data: {
        vinculoId: vinculoB,
        autorId: usuarioB.id,
        emocion: "ENOJADO",
        grupo: "ALGO_PASO",
      },
    })
    await prismaCrudo.mensaje.create({
      data: {
        vinculoId: vinculoB,
        autorId: usuarioB.id,
        emocion: "ENOJADO",
        clase: "CONVERSACION",
        destino: "AHORA",
        texto: "secreto de la pareja B",
      },
    })
  })

  it("un findMany sin filtro solo devuelve lo del propio vínculo", async () => {
    const db = dbDelVinculo(vinculoA)
    const checkins = await db.checkin.findMany()
    expect(checkins.length).toBeGreaterThan(0)
    expect(checkins.every((c) => c.vinculoId === vinculoA)).toBe(true)
  })

  it("no se ve ni un mensaje de la otra pareja", async () => {
    const db = dbDelVinculo(vinculoA)
    const mensajes = await db.mensaje.findMany()
    expect(mensajes.some((m) => m.texto === "secreto de la pareja B")).toBe(false)
  })

  it("buscar por id ajeno no lo encuentra", async () => {
    const ajeno = await prismaCrudo.mensaje.findFirst({ where: { vinculoId: vinculoB } })
    const db = dbDelVinculo(vinculoA)
    const encontrado = await db.mensaje.findFirst({ where: { id: ajeno?.id } })
    expect(encontrado).toBeNull()
  })

  it("contar no cuenta lo ajeno", async () => {
    const db = dbDelVinculo(vinculoA)
    const total = await db.checkin.count()
    const todos = await prismaCrudo.checkin.count()
    expect(total).toBeLessThan(todos)
  })

  it("updateMany no toca filas de la otra pareja", async () => {
    const db = dbDelVinculo(vinculoA)
    const tocadas = await db.mensaje.updateMany({ data: { tonoMarcado: true } })
    const ajeno = await prismaCrudo.mensaje.findFirst({ where: { vinculoId: vinculoB } })
    expect(ajeno?.tonoMarcado).toBe(false)
    expect(tocadas.count).toBe(0) // el vínculo A no tiene mensajes
  })

  /**
   * Las operaciones de identificador único no llevan el filtro inyectado
   * (ver `dbDelVinculo`). Esta prueba fija ese contrato: si alguien lo cambiara
   * para inyectarlo también aquí, Prisma rechazaría el `where` y esto fallaría.
   */
  it("upsert funciona: su where único no lleva el filtro inyectado", async () => {
    const db = dbDelVinculo(vinculoA)
    const mensaje = await prismaCrudo.mensaje.create({
      data: {
        vinculoId: vinculoA,
        autorId: "x",
        emocion: "BIEN",
        clase: "PRESENCIA",
        destino: "AHORA",
        texto: "prueba de upsert",
      },
    })
    const entrega = await prismaCrudo.entrega.create({
      data: { vinculoId: vinculoA, mensajeId: mensaje.id, destinatarioId: "y" },
    })

    await expect(
      db.respuesta.upsert({
        where: { entregaId: entrega.id },
        create: { vinculoId: vinculoA, entregaId: entrega.id, autorId: "y", texto: "ok" },
        update: { texto: "ok" },
      }),
    ).resolves.toBeTruthy()
  })
})

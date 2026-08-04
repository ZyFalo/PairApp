import { describe, expect, it } from "vitest"
import { Emocion } from "@/generated/prisma/enums"
import { decidirPresentacion, estadoVigente, topeDePosponer } from "./entrega"

/**
 * El motor de entrega: la matriz de seis celdas de §3.0.15.
 *
 * Un caso que no esté aquí cae igualmente en una celda existente; si alguna vez
 * falla, se corrige la celda y se arregla su familia entera.
 */

const ahora = new Date("2026-08-02T15:00:00Z")
const haceUnaHora = new Date("2026-08-02T14:00:00Z")
const haceNueveHoras = new Date("2026-08-02T06:00:00Z")

describe("caducidad de estados", () => {
  it("un check-in de hace una hora sigue vigente", () => {
    expect(
      estadoVigente({ emocion: Emocion.TRISTE, intensidad: 4, creadoEn: haceUnaHora }, ahora),
    ).toBe(true)
  })

  it("uno de hace nueve horas ya no gobierna nada", () => {
    expect(
      estadoVigente({ emocion: Emocion.TRISTE, intensidad: 4, creadoEn: haceNueveHoras }, ahora),
    ).toBe(false)
  })

  it("sin check-in no hay estado vigente", () => {
    expect(estadoVigente(null, ahora)).toBe(false)
  })
})

describe("la matriz de entrega", () => {
  const receptor = (emocion: Emocion, intensidad = 4) => ({
    emocion,
    intensidad,
    creadoEn: haceUnaHora,
  })

  it("lo bueno llega siempre directo, esté como esté quien lo recibe", () => {
    expect(decidirPresentacion(Emocion.BIEN, receptor(Emocion.ENOJADO), ahora).tipo).toBe("directo")
    expect(decidirPresentacion(Emocion.TE_EXTRANO, receptor(Emocion.TRISTE), ahora).tipo).toBe(
      "directo",
    )
  })

  it("amortigua cuando quien recibe está en carencia", () => {
    expect(decidirPresentacion(Emocion.ENOJADO, receptor(Emocion.TRISTE), ahora).tipo).toBe(
      "amortiguado",
    )
    expect(
      decidirPresentacion(Emocion.INCOMODO, receptor(Emocion.ME_SIENTO_SOLO), ahora).tipo,
    ).toBe("amortiguado")
  })

  it("no amortigua en apenado: el cariño ahí aumenta la culpa", () => {
    expect(decidirPresentacion(Emocion.ENOJADO, receptor(Emocion.APENADO), ahora).tipo).toBe(
      "nombrar_y_elegir",
    )
  })

  it("no amortigua en enojo: el cariño ahí invalida", () => {
    const p = decidirPresentacion(Emocion.ENOJADO, receptor(Emocion.ENOJADO), ahora)
    expect(p.tipo).toBe("nombrar_y_elegir")
    expect(p.tipo === "nombrar_y_elegir" && p.ambosEnojados).toBe(true)
  })

  it("un caso que nunca simulamos cae en una celda existente", () => {
    // ella preocupada, yo triste → carencia × conversación → amortigua
    expect(decidirPresentacion(Emocion.PREOCUPADO, receptor(Emocion.TRISTE), ahora).tipo).toBe(
      "amortiguado",
    )
  })

  it("con el estado caducado se muestra directo, y la app volverá a preguntar", () => {
    const viejo = { emocion: Emocion.TRISTE, intensidad: 5, creadoEn: haceNueveHoras }
    expect(decidirPresentacion(Emocion.ENOJADO, viejo, ahora).tipo).toBe("directo")
  })

  it("la carencia leve no amortigua: sería inflar algo pequeño", () => {
    expect(decidirPresentacion(Emocion.ENOJADO, receptor(Emocion.TRISTE, 2), ahora).tipo).toBe(
      "directo",
    )
  })
})

describe("posponer la lectura", () => {
  it("tres horas en general", () => {
    const tope = topeDePosponer({ tipo: "nombrar_y_elegir", ambosEnojados: false }, ahora)
    expect(tope.getTime() - ahora.getTime()).toBe(3 * 3_600_000)
  })

  it("hasta la mañana siguiente si ambos están enojados", () => {
    const tope = topeDePosponer({ tipo: "nombrar_y_elegir", ambosEnojados: true }, ahora)
    expect(tope.getTime() - ahora.getTime()).toBe(12 * 3_600_000)
  })
})

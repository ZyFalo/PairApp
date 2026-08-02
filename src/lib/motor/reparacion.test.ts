import { describe, expect, it } from "vitest"
import type { Emocion } from "@/generated/prisma/enums"
import { GESTOS, gestoDe, tocaOfrecerReparacion } from "./reparacion"

const AHORA = new Date("2026-08-02T15:00:00Z")
const estado = (emocion: Emocion, horas = 0) => ({
  emocion,
  intensidad: 3,
  creadoEn: new Date(AHORA.getTime() - horas * 3_600_000),
})

describe("los cuatro gestos de reparación (RF-6.8.1)", () => {
  it("son cuatro y ninguno se repite", () => {
    expect(GESTOS).toHaveLength(4)
    expect(new Set(GESTOS.map((g) => g.clave)).size).toBe(4)
  })

  /**
   * Lo que le llega tiene que estar en primera persona. "No me hablas así" es
   * un reproche disfrazado de reparación, y empeoraría justo el momento en el
   * que se usa.
   */
  it("todos hablan de uno mismo, sin reproche", () => {
    for (const gesto of GESTOS) {
      expect(gesto.mensaje.length).toBeGreaterThan(0)
      expect(gesto.mensaje.toLowerCase()).not.toContain("tú ")
      expect(gesto.mensaje.toLowerCase()).not.toContain("siempre")
      expect(gesto.mensaje.toLowerCase()).not.toContain("nunca")
    }
  })

  it("una clave desconocida no devuelve nada en vez de reventar", () => {
    expect(gestoDe("INVENTADO")).toBeNull()
    expect(gestoDe("LO_SIENTO")?.texto).toBe("Lo siento")
  })
})

describe("cuándo se ofrece reparar (§6.8)", () => {
  it("con los dos en «algo pasó», sí", () => {
    expect(tocaOfrecerReparacion(estado("ENOJADO"), estado("INCOMODO"), AHORA)).toBe(true)
  })

  /**
   * Si solo uno está mal no hay pelea que reparar, y ofrecerlo sería la app
   * dando por hecho algo que nadie le ha dicho (§1.2).
   */
  it("si solo uno está en «algo pasó», no", () => {
    expect(tocaOfrecerReparacion(estado("ENOJADO"), estado("BIEN"), AHORA)).toBe(false)
    expect(tocaOfrecerReparacion(estado("TRISTE"), estado("ENOJADO"), AHORA)).toBe(false)
  })

  it("sin registro de alguno de los dos, no", () => {
    expect(tocaOfrecerReparacion(null, estado("ENOJADO"), AHORA)).toBe(false)
    expect(tocaOfrecerReparacion(estado("ENOJADO"), null, AHORA)).toBe(false)
  })

  /** Un enfado de anteayer no es una pelea de ahora (RF-3.0.7.7). */
  it("con un estado caducado, tampoco", () => {
    expect(tocaOfrecerReparacion(estado("ENOJADO", 9), estado("ENOJADO"), AHORA)).toBe(false)
  })
})

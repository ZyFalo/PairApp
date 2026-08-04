import { describe, expect, it } from "vitest"
import { participaEnLaVentana, ventanaOnceOnce } from "./once"

const BOGOTA = "America/Bogota"

describe("la ventana de los 11:11", () => {
  it("abre a las 11:11 locales", () => {
    // 11:11 en Bogotá son las 16:11 UTC
    expect(ventanaOnceOnce(BOGOTA, new Date("2026-08-02T16:11:00Z")).abierta).toBe(true)
  })

  it("hay cuatro minutos de gracia", () => {
    expect(ventanaOnceOnce(BOGOTA, new Date("2026-08-02T16:15:00Z")).abierta).toBe(true)
    expect(ventanaOnceOnce(BOGOTA, new Date("2026-08-02T16:16:00Z")).abierta).toBe(false)
  })

  it("también abre a las 23:11", () => {
    const v = ventanaOnceOnce(BOGOTA, new Date("2026-08-03T04:11:00Z"))
    expect(v.abierta).toBe(true)
    expect(v.esNoche).toBe(true)
  })
})

/**
 * Quién participa y cuándo (RF-12.1, RF-12.8).
 *
 * La regla gobierna cuatro puertas —el cron, la ventana en Hoy, la de Nosotros
 * y la acción de pedir—, así que se prueba una vez y las cuatro la heredan.
 */
describe("participar en una ventana", () => {
  it("por defecto se participa en las dos", () => {
    expect(participaEnLaVentana("AMBAS", false)).toBe(true)
    expect(participaEnLaVentana("AMBAS", true)).toBe(true)
  })

  it("quien elige una sola ventana no aparece en la otra", () => {
    expect(participaEnLaVentana("MANANA", false)).toBe(true)
    expect(participaEnLaVentana("MANANA", true)).toBe(false)

    expect(participaEnLaVentana("NOCHE", true)).toBe(true)
    expect(participaEnLaVentana("NOCHE", false)).toBe(false)
  })

  /**
   * `NINGUNA` no es "sin aviso": es no participar. Un interruptor que apagara
   * el aviso pero dejara la ventana abierta no desactivaría nada — solo lo
   * haría más silencioso, que es peor porque parece que sí funciona.
   */
  it("quien se sale no participa en ninguna", () => {
    expect(participaEnLaVentana("NINGUNA", false)).toBe(false)
    expect(participaEnLaVentana("NINGUNA", true)).toBe(false)
  })
})

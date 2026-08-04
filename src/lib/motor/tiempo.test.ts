import { describe, expect, it } from "vitest"
import { horasDesfasadas, tocaPreguntaPeriodica, ventanaOnceOnce } from "./tiempo"

/**
 * Horarios y ventanas (RF-1.0, RF-12.2).
 *
 * Todo lo de aquí recibe la hora por parámetro, así que se puede probar la
 * medianoche y el minuto exacto de los 11:11 sin tocar el reloj del sistema.
 */

describe("las seis preguntas diarias", () => {
  it("dispara a la hora local de la persona, no a la del servidor", () => {
    // 14:00 en Bogotá son las 19:00 UTC
    const utc = new Date("2026-08-02T19:05:00Z")
    expect(tocaPreguntaPeriodica([9, 14, 19], "America/Bogota", utc)).toBe(true)
  })

  it("no dispara fuera de la ventana de 15 minutos", () => {
    const utc = new Date("2026-08-02T19:40:00Z")
    expect(tocaPreguntaPeriodica([9, 14, 19], "America/Bogota", utc)).toBe(false)
  })

  it("las de la pareja van desfasadas una hora exacta", () => {
    expect(horasDesfasadas([9, 14, 19])).toEqual([10, 15, 20])
  })

  it("el desfase no se sale del día", () => {
    expect(horasDesfasadas([23])).toEqual([0])
  })
})

describe("los 11:11", () => {
  it("la ventana abre a las 11:11 locales", () => {
    // 11:11 en Bogotá son las 16:11 UTC
    expect(ventanaOnceOnce("America/Bogota", new Date("2026-08-02T16:11:00Z")).abierta).toBe(true)
  })

  it("hay cuatro minutos de gracia", () => {
    expect(ventanaOnceOnce("America/Bogota", new Date("2026-08-02T16:15:00Z")).abierta).toBe(true)
    expect(ventanaOnceOnce("America/Bogota", new Date("2026-08-02T16:16:00Z")).abierta).toBe(false)
  })

  it("también abre a las 23:11", () => {
    const v = ventanaOnceOnce("America/Bogota", new Date("2026-08-03T04:11:00Z"))
    expect(v.abierta).toBe(true)
    expect(v.esNoche).toBe(true)
  })
})

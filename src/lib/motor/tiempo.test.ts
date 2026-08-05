import { describe, expect, it } from "vitest"
import { cuandoFue, horasDesfasadas, tocaPreguntaPeriodica } from "./tiempo"

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

/**
 * Sin techo, al contrario que `haceEnPalabras`. RF-3.11.2 pide literalmente
 * «Esto lo guardaste en marzo», y esa frase es media función.
 */
describe("cuándo fue algo, sin techo", () => {
  const BOGOTA = "America/Bogota"
  const AHORA = new Date("2026-08-04T16:00:00Z")

  it("lo reciente se dice como lo diría alguien", () => {
    expect(cuandoFue(new Date("2026-08-03T16:00:00Z"), AHORA, BOGOTA)).toBe("ayer")
    expect(cuandoFue(new Date("2026-08-01T16:00:00Z"), AHORA, BOGOTA)).toBe("hace 3 días")
  })

  it("más atrás se nombra el mes, y no «hace más de una semana»", () => {
    expect(cuandoFue(new Date("2026-03-14T16:00:00Z"), AHORA, BOGOTA)).toBe("en marzo")
  })

  /** «En marzo de 2026» estando en 2026 delata a una máquina. */
  it("el año solo si no es este", () => {
    expect(cuandoFue(new Date("2025-03-14T16:00:00Z"), AHORA, BOGOTA)).toBe("en marzo de 2025")
  })
})

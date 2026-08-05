import { describe, expect, it } from "vitest"
import { CUANTAS_CABEN, DIAS_QUE_DURA, desdeCuandoCuenta, queHizo } from "./novedades"

describe("cuánto dura una novedad", () => {
  const ahora = new Date("2026-08-04T15:00:00Z")

  it("la ventana empieza una semana atrás, al minuto", () => {
    expect(desdeCuandoCuenta(ahora).toISOString()).toBe("2026-07-28T15:00:00.000Z")
  })

  /**
   * Lo que impide que esto sea una bandeja de entrada no es que la gente la
   * atienda: es que se vacía sola. Si el corte desapareciera, una pareja que
   * pasa una semana sin abrir la app se encontraría treinta líneas esperando.
   */
  it("hay corte, y no es simbólico", () => {
    expect(DIAS_QUE_DURA).toBeLessThanOrEqual(14)
    expect(CUANTAS_CABEN).toBeLessThanOrEqual(6)
  })
})

describe("qué se lee de cada novedad", () => {
  it("cuenta un hecho en pasado, con el nombre delante", () => {
    expect(queHizo("PLAN", "Cata")).toBe("Cata apuntó un plan")
    expect(queHizo("CANCION", "Cata")).toBe("Cata te dedicó una canción")
    expect(queHizo("RECUERDO", "Will")).toBe("Will guardó un recuerdo")
  })

  /**
   * Nunca en forma de encargo. «Tienes un plan pendiente» convierte lo que hizo
   * la otra persona en algo que le debes, y eso es lo contrario de para qué
   * está esta lista (RF-2.0.7).
   */
  it("nunca pide nada ni llama a nada pendiente", () => {
    const todas = (["PLAN", "CANCION", "TITULO", "RECUERDO", "ACUERDO"] as const).map((t) =>
      queHizo(t, "Cata"),
    )

    for (const texto of todas) {
      expect(texto).not.toMatch(/pendiente|tienes que|debes|recuerda/i)
      expect(texto.startsWith("Cata ")).toBe(true)
    }
  })
})

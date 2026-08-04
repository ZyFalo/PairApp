import { describe, expect, it } from "vitest"
import { type ClaveModulo, MODULOS, MODULOS_POR_DEFECTO, soloElCalendario } from "./modulos"

describe("los módulos de una pareja", () => {
  /**
   * Encendido por defecto y no apagado: apagado significa que nadie los
   * descubre. La app llega completa y se poda.
   */
  it("un vínculo nuevo los trae todos puestos", () => {
    expect(Object.values(MODULOS_POR_DEFECTO).every(Boolean)).toBe(true)
  })

  /** Si una ficha se queda sin su valor por defecto, la pantalla la pinta vacía. */
  it("cada módulo preguntable tiene su valor por defecto", () => {
    for (const modulo of MODULOS) {
      expect(MODULOS_POR_DEFECTO[modulo.clave]).toBe(true)
    }
  })

  /**
   * Se pregunta por ellos, no por funciones. Una pregunta que no acaba en
   * interrogación es una etiqueta de ajuste disfrazada.
   */
  it("todas las preguntas están escritas como preguntas", () => {
    for (const modulo of MODULOS) {
      expect(modulo.pregunta.startsWith("¿")).toBe(true)
      expect(modulo.pregunta.endsWith("?")).toBe(true)
      expect(modulo.explica.length).toBeGreaterThan(0)
    }
  })

  /**
   * Los frenos no se preguntan (P9). Si alguien añade aquí el umbral o el
   * buzón en frío, esta prueba lo para: un interruptor para los frenos es un
   * interruptor que se toca justo el peor día.
   */
  it("los guardarraíles no son módulos apagables", () => {
    const claves = MODULOS.map((m) => m.clave)

    for (const freno of ["umbral", "frio", "retirada", "amortiguador", "conflicto"]) {
      expect(claves).not.toContain(freno as ClaveModulo)
    }
  })

  it("con todo apagado, Nosotros se queda solo con el calendario", () => {
    expect(soloElCalendario({ once: false, musica: false, titulos: false, recuerdos: false })).toBe(
      true,
    )
    expect(soloElCalendario(MODULOS_POR_DEFECTO)).toBe(false)
    expect(soloElCalendario({ ...MODULOS_POR_DEFECTO, once: false })).toBe(false)
  })
})

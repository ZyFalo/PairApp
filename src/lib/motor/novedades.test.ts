import { describe, expect, it } from "vitest"
import type { ModulosDelVinculo } from "./modulos"
import {
  CUANTAS_CABEN,
  DIAS_QUE_DURA,
  desdeCuandoCuenta,
  queHizo,
  sigueLlevandoAAlgunSitio,
} from "./novedades"

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

describe("un aviso que ya no lleva a ningún sitio", () => {
  const todos: ModulosDelVinculo = { musica: true, titulos: true, recuerdos: true, once: true }

  /**
   * Apagar un módulo esconde su pestaña, y su vista **no se pinta aunque se
   * escriba la URL a mano**: se cae al calendario. Así que el aviso de una
   * canción con la música apagada dejaba a quien lo pulsara en el mes, sin
   * explicación y sin que pareciera que hubiera tocado nada.
   */
  it("desaparece cuando su módulo se apaga", () => {
    expect(sigueLlevandoAAlgunSitio("CANCION", todos)).toBe(true)
    expect(sigueLlevandoAAlgunSitio("CANCION", { ...todos, musica: false })).toBe(false)
    expect(sigueLlevandoAAlgunSitio("TITULO", { ...todos, titulos: false })).toBe(false)
    expect(sigueLlevandoAAlgunSitio("RECUERDO", { ...todos, recuerdos: false })).toBe(false)
  })

  /**
   * El calendario es la pantalla de entrada y los acuerdos son un freno, no un
   * extra (P9). Ninguno de los dos se puede apagar, así que sus avisos no
   * dependen de nada.
   */
  it("el plan y el acuerdo no dependen de ningún módulo", () => {
    const nada: ModulosDelVinculo = {
      musica: false,
      titulos: false,
      recuerdos: false,
      once: false,
    }
    expect(sigueLlevandoAAlgunSitio("PLAN", nada)).toBe(true)
    expect(sigueLlevandoAAlgunSitio("ACUERDO", nada)).toBe(true)
  })

  /** Se esconde, no se aparta: si el módulo vuelve, el aviso reciente vuelve. */
  it("apagar no es apartar", () => {
    expect(sigueLlevandoAAlgunSitio("CANCION", { ...todos, musica: false })).toBe(false)
    expect(sigueLlevandoAAlgunSitio("CANCION", todos)).toBe(true)
  })
})

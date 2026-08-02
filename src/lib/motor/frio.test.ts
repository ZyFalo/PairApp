import { describe, expect, it } from "vitest"
import {
  finDelFrio,
  HORAS_EN_FRIO,
  HORAS_EN_FRIO_MAXIMO,
  HORAS_EN_FRIO_MINIMO,
  MINUTOS_PARA_RETIRAR,
  opcionSobreEnviado,
  sePuedeRetirar,
  tocaRevisarEnFrio,
} from "./frio"

import { haceEnPalabras } from "./tiempo"

const AHORA = new Date("2026-08-02T15:00:00Z")
const haceMinutos = (m: number) => new Date(AHORA.getTime() - m * 60_000)

/**
 * Bogotá va a UTC-5, así que las 15:00 UTC son las 10:00 de la mañana allí.
 * Todas las fechas de abajo están pensadas sobre ese día local.
 */
const BOGOTA = "America/Bogota"

describe("cuánto hace de algo, en palabras", () => {
  it("lo de esta misma mañana es de hace unas horas", () => {
    // 12:00 UTC = 07:00 en Bogotá, el mismo día
    expect(haceEnPalabras(new Date("2026-08-02T12:00:00Z"), AHORA, BOGOTA)).toBe("hace unas horas")
  })

  /**
   * El caso que importa: once horas atrás pero del día anterior. Contando
   * horas diría "hace unas horas" y sonaría a que acabas de escribirlo.
   */
  it("lo de anoche es de ayer, aunque hayan pasado once horas", () => {
    // 04:00 UTC = 23:00 del día 1 en Bogotá
    expect(haceEnPalabras(new Date("2026-08-02T04:00:00Z"), AHORA, BOGOTA)).toBe("ayer")
  })

  /** Y el contrario: trece horas dentro del mismo día siguen siendo hoy. */
  it("trece horas dentro del mismo día no son ayer", () => {
    // 02:00 UTC = 21:00 del día 1... usamos el día 2 a las 06:00 UTC = 01:00 local
    expect(haceEnPalabras(new Date("2026-08-02T06:00:00Z"), AHORA, BOGOTA)).toBe("hace unas horas")
  })

  it("cuenta los días sueltos y agrupa a partir de la semana", () => {
    expect(haceEnPalabras(new Date("2026-07-31T15:00:00Z"), AHORA, BOGOTA)).toBe("hace 2 días")
    expect(haceEnPalabras(new Date("2026-07-20T15:00:00Z"), AHORA, BOGOTA)).toBe(
      "hace más de una semana",
    )
  })
})

describe("buzón en frío (§6.3)", () => {
  it("la espera por defecto son doce horas", () => {
    expect(finDelFrio(HORAS_EN_FRIO, AHORA).toISOString()).toBe("2026-08-03T03:00:00.000Z")
  })

  it("acota la espera a la horquilla configurable", () => {
    expect(finDelFrio(0, AHORA).getTime()).toBe(finDelFrio(HORAS_EN_FRIO_MINIMO, AHORA).getTime())
    expect(finDelFrio(999, AHORA).getTime()).toBe(finDelFrio(HORAS_EN_FRIO_MAXIMO, AHORA).getTime())
  })

  it("un mensaje que no está en frío no pide revisión", () => {
    expect(tocaRevisarEnFrio(null, AHORA)).toBe(false)
  })

  it("mientras no venza el plazo, no se pregunta nada", () => {
    expect(tocaRevisarEnFrio(new Date("2026-08-03T03:00:00Z"), AHORA)).toBe(false)
  })

  it("vencido el plazo, toca decidir", () => {
    expect(tocaRevisarEnFrio(new Date("2026-08-02T14:59:00Z"), AHORA)).toBe(true)
  })
})

describe("retirada (§6.4)", () => {
  it("recién enviado y sin abrir, se puede retirar", () => {
    expect(sePuedeRetirar(haceMinutos(1), null, AHORA)).toBe(true)
  })

  it("pasada la ventana ya no", () => {
    expect(sePuedeRetirar(haceMinutos(MINUTOS_PARA_RETIRAR + 1), null, AHORA)).toBe(false)
  })

  /**
   * Lo decisivo no es el reloj sino el hecho de que lo haya leído: quitarle
   * algo que ya vio sería borrarle un recuerdo, no deshacer un envío.
   */
  it("si ya lo abrió, no se puede retirar aunque acabe de enviarse", () => {
    expect(sePuedeRetirar(haceMinutos(0.1), haceMinutos(0.05), AHORA)).toBe(false)
  })

  it("dentro de la ventana la salida es retirar; fuera, eliminar con rastro", () => {
    expect(opcionSobreEnviado(haceMinutos(1), null, AHORA)).toBe("retirar")
    expect(opcionSobreEnviado(haceMinutos(30), null, AHORA)).toBe("eliminar")
    expect(opcionSobreEnviado(haceMinutos(1), haceMinutos(0.5), AHORA)).toBe("eliminar")
  })
})

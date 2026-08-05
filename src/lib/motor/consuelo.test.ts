import { describe, expect, it } from "vitest"
import { type Candidatos, elegirConsuelo } from "./consuelo"

const VACIO: Candidatos = { guardadosSuyos: [], reservas: [], recuerdos: [] }

const GUARDADO = {
  mensajeId: "m1",
  texto: "Me encantó lo de ayer.",
  cuando: new Date("2026-03-04"),
}
const RESERVA = { mensajeId: "m2" }
const RECUERDO = {
  recuerdoId: "r1",
  titulo: "La playa sin plan",
  ocurrioEl: new Date("2025-08-04"),
}

describe("qué ofrecer cuando no hay nada guardado que entregar", () => {
  /**
   * El peldaño que importa, y el que se olvida al construir estas escaleras.
   * No se rellena con contenido genérico: si no hay nada, la app calla — y eso
   * es frecuente, no excepcional.
   */
  it("sin nada que dar, no dice nada", () => {
    expect(elegirConsuelo(VACIO)).toBeNull()
  })

  /**
   * Lo que ella guardó gana siempre: son por definición los que le importaron.
   * Ninguna inferencia — ella misma marcó que le importaba (RF-3.11.2).
   */
  it("un mensaje que ella guardó gana a todo lo demás", () => {
    const elegido = elegirConsuelo({
      guardadosSuyos: [GUARDADO],
      reservas: [RESERVA],
      recuerdos: [RECUERDO],
    })

    expect(elegido).toEqual({ tipo: "guardado_suyo", ...GUARDADO })
  })

  it("sin guardados suyos, va el mensaje de reserva", () => {
    const elegido = elegirConsuelo({ ...VACIO, reservas: [RESERVA], recuerdos: [RECUERDO] })

    expect(elegido).toEqual({ tipo: "reserva", ...RESERVA })
  })

  it("y si no hay ningún mensaje, un recuerdo", () => {
    const elegido = elegirConsuelo({ ...VACIO, recuerdos: [RECUERDO] })

    expect(elegido).toEqual({ tipo: "recuerdo", ...RECUERDO })
  })

  /** El orden dentro de cada peldaño lo decide quien construye la lista. */
  it("de cada peldaño se coge el primero", () => {
    const otro = { ...GUARDADO, mensajeId: "m9" }
    const elegido = elegirConsuelo({ ...VACIO, guardadosSuyos: [GUARDADO, otro] })

    expect(elegido).toMatchObject({ mensajeId: "m1" })
  })
})

import { describe, expect, it } from "vitest"
import { anosDesde, cumpleAnosHoy, elegirParaEstaNoche, haceAnos } from "./juntos"
import { fechaSuelta } from "./tiempo"

describe("fechas sueltas", () => {
  /**
   * El fallo que tenía: un recuerdo del 2 de agosto se guarda a medianoche UTC,
   * y al pasarlo por Bogotá (UTC-5) se leía como el 1 de agosto a las 19:00.
   * Una fecha sin hora no puede cambiar de día según dónde estés.
   */
  it("no retrocede un día al leerse desde una zona con desfase negativo", () => {
    expect(fechaSuelta(new Date("2025-08-02T00:00:00Z"))).toBe("2 de agosto de 2025")
  })

  it("no inventa una hora que no existe", () => {
    expect(fechaSuelta(new Date("2026-01-01T00:00:00Z"))).not.toContain(":")
  })
})

const titulo = (id: string, estado: "POR_VER" | "VIENDO" | "VISTA", minutos: number | null = 100) =>
  ({ id, estado, minutos }) as const

describe("elegir una para esta noche (RF-9.7)", () => {
  it("sin nada por ver, no elige nada", () => {
    expect(elegirParaEstaNoche([titulo("a", "VISTA")], 0.5)).toBeNull()
    expect(elegirParaEstaNoche([], 0.5)).toBeNull()
  })

  it("solo mira las que están por ver", () => {
    const lista = [titulo("vista", "VISTA"), titulo("viendo", "VIENDO"), titulo("libre", "POR_VER")]
    expect(elegirParaEstaNoche(lista, 0.9)?.id).toBe("libre")
  })

  /**
   * El azar entra por parámetro justo para poder comprobar esto: si el reparto
   * estuviera sesgado, "elige al azar" sería en realidad "elige la primera" y
   * nadie se enteraría nunca.
   */
  it("reparte por todo el rango del azar", () => {
    const lista = [titulo("a", "POR_VER"), titulo("b", "POR_VER"), titulo("c", "POR_VER")]
    expect(elegirParaEstaNoche(lista, 0)?.id).toBe("a")
    expect(elegirParaEstaNoche(lista, 0.5)?.id).toBe("b")
    expect(elegirParaEstaNoche(lista, 0.99)?.id).toBe("c")
  })

  /** Un azar de exactamente 1 no puede salirse de la lista. */
  it("el extremo del rango no se sale de la lista", () => {
    const lista = [titulo("a", "POR_VER"), titulo("b", "POR_VER")]
    expect(elegirParaEstaNoche(lista, 1)?.id).toBe("b")
  })

  it("respeta el tope de duración", () => {
    const lista = [titulo("larga", "POR_VER", 180), titulo("corta", "POR_VER", 90)]
    expect(elegirParaEstaNoche(lista, 0, 100)?.id).toBe("corta")
    expect(elegirParaEstaNoche([titulo("larga", "POR_VER", 180)], 0, 100)).toBeNull()
  })

  /** Descartar por no tener el dato castigaría a las escritas a mano. */
  it("una sin duración conocida entra igual", () => {
    expect(elegirParaEstaNoche([titulo("sin dato", "POR_VER", null)], 0, 90)?.id).toBe("sin dato")
  })
})

describe("hace un año (RF-11.2)", () => {
  const hoy = new Date("2026-08-02T12:00:00Z")

  it("reconoce el mismo día de otro año", () => {
    expect(cumpleAnosHoy({ ocurrioEl: new Date("2025-08-02T00:00:00Z") }, hoy)).toBe(true)
    expect(cumpleAnosHoy({ ocurrioEl: new Date("2019-08-02T00:00:00Z") }, hoy)).toBe(true)
  })

  it("otro día no cumple años", () => {
    expect(cumpleAnosHoy({ ocurrioEl: new Date("2025-08-03T00:00:00Z") }, hoy)).toBe(false)
    expect(cumpleAnosHoy({ ocurrioEl: new Date("2025-07-02T00:00:00Z") }, hoy)).toBe(false)
  })

  /** Un recuerdo de hoy no cumple años hoy. */
  it("lo de este mismo año no cuenta", () => {
    expect(cumpleAnosHoy({ ocurrioEl: new Date("2026-08-02T00:00:00Z") }, hoy)).toBe(false)
  })

  it("cuenta los años y los dice como se dicen", () => {
    expect(anosDesde({ ocurrioEl: new Date("2025-08-02T00:00:00Z") }, hoy)).toBe(1)
    expect(haceAnos(1)).toBe("Hace un año")
    expect(haceAnos(3)).toBe("Hace 3 años")
  })
})

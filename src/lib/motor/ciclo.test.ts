import { describe, expect, it } from "vitest"
import { CICLOS_PARA_ESTIMAR, estimarProximoCiclo } from "./ciclo"
import { enPausa, finDePausa } from "./tiempo"

/** Fechas de inicio separadas por los días que se indiquen, de la más nueva a la más vieja. */
function iniciosCada(dias: number[], desde = new Date("2026-08-01T00:00:00Z")): Date[] {
  const fechas = [desde]
  for (const d of dias) {
    fechas.push(new Date(fechas[fechas.length - 1].getTime() - d * 86_400_000))
  }
  return fechas
}

describe("estimación del próximo periodo (RF-5.2)", () => {
  it("sin historial no estima nada", () => {
    expect(estimarProximoCiclo([])).toBeNull()
  })

  it("con un solo registro tampoco: hacen falta dos para medir una separación", () => {
    expect(estimarProximoCiclo([new Date("2026-08-01T00:00:00Z")])).toBeNull()
  })

  it("con dos registros estima sobre esa única separación", () => {
    const estimacion = estimarProximoCiclo(iniciosCada([28]))
    expect(estimacion?.duracionMedia).toBe(28)
    expect(estimacion?.sobre).toBe(1)
    expect(estimacion?.proximoInicio.toISOString()).toBe("2026-08-29T00:00:00.000Z")
  })

  it("promedia varias separaciones", () => {
    const estimacion = estimarProximoCiclo(iniciosCada([26, 30, 28]))
    expect(estimacion?.duracionMedia).toBe(28)
    expect(estimacion?.sobre).toBe(3)
  })

  /**
   * Una fecha mal escrita no puede arrastrar toda la media. Es el fallo más
   * probable de todos: teclear el mes anterior sin darse cuenta.
   */
  it("descarta separaciones imposibles en vez de contaminar la media", () => {
    const estimacion = estimarProximoCiclo(iniciosCada([28, 400, 28]))
    expect(estimacion?.duracionMedia).toBe(28)
    expect(estimacion?.sobre).toBe(2)
  })

  it("si ninguna separación es plausible, prefiere no decir nada", () => {
    expect(estimarProximoCiclo(iniciosCada([3, 2]))).toBeNull()
  })

  it("no mira más allá del tope de ciclos", () => {
    const estimacion = estimarProximoCiclo(iniciosCada(Array(20).fill(28)))
    expect(estimacion?.sobre).toBe(CICLOS_PARA_ESTIMAR)
  })
})

describe("modo pausa (§12.2)", () => {
  const ahora = new Date("2026-08-02T15:00:00Z")

  it("sin pausa puesta, la app habla", () => {
    expect(enPausa(null, ahora)).toBe(false)
  })

  it("una pausa vencida ya no silencia nada", () => {
    expect(enPausa(new Date("2026-08-01T00:00:00Z"), ahora)).toBe(false)
  })

  it("una pausa en curso silencia", () => {
    expect(enPausa(new Date("2026-08-05T00:00:00Z"), ahora)).toBe(true)
  })

  /** "Un día" es hasta que acabe hoy, no hasta la misma hora de mañana. */
  it("una pausa de un día acaba al terminar el día de quien la pide", () => {
    const fin = finDePausa(1, "America/Bogota", ahora)
    expect(fin.toISOString()).toBe("2026-08-03T04:59:59.999Z")
    expect(enPausa(fin, ahora)).toBe(true)
  })

  it("una pausa de tres días acaba al terminar el tercero", () => {
    const fin = finDePausa(3, "America/Bogota", ahora)
    expect(fin.toISOString()).toBe("2026-08-05T04:59:59.999Z")
  })
})

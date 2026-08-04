import { describe, expect, it } from "vitest"
import { comoIcs, nombreDeArchivo } from "./ics"

const AHORA = new Date("2026-08-02T14:00:00Z")

const PLAN = {
  id: "abc123",
  titulo: "Cena en el italiano",
  inicio: new Date("2026-08-05T21:00:00Z"),
  notas: null,
}

describe("exportar un plan al calendario (§12.2)", () => {
  it("genera un archivo que empieza y acaba donde debe", () => {
    const ics = comoIcs(PLAN, AHORA)
    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true)
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true)
  })

  it("pone las fechas en UTC con el formato del estándar", () => {
    const ics = comoIcs(PLAN, AHORA)
    expect(ics).toContain("DTSTART:20260805T210000Z")
    expect(ics).toContain("DTSTAMP:20260802T140000Z")
  })

  /** Sin hora de fin en el modelo, se asume una hora. */
  it("cierra el plan una hora después si no hay fin", () => {
    expect(comoIcs(PLAN, AHORA)).toContain("DTEND:20260805T220000Z")
  })

  it("omite la descripción cuando no hay notas", () => {
    expect(comoIcs(PLAN, AHORA)).not.toContain("DESCRIPTION")
  })

  /**
   * La coma y el punto y coma separan campos en el estándar: sin escapar,
   * un título con coma parte el archivo y el plan llega roto al calendario.
   */
  it("escapa comas, puntos y coma y saltos de línea", () => {
    const ics = comoIcs(
      { ...PLAN, titulo: "Cena, cine; y paseo", notas: "Llevar\nla cámara" },
      AHORA,
    )
    expect(ics).toContain("SUMMARY:Cena\\, cine\\; y paseo")
    expect(ics).toContain("DESCRIPTION:Llevar\\nla cámara")
  })

  it("parte las líneas largas como pide el estándar", () => {
    const ics = comoIcs({ ...PLAN, titulo: "a".repeat(200) }, AHORA)
    for (const linea of ics.split("\r\n")) expect(linea.length).toBeLessThanOrEqual(75)
  })

  it("usa un nombre de archivo sin acentos ni signos raros", () => {
    expect(nombreDeArchivo("Cena en el italiano")).toBe("cena-en-el-italiano.ics")
    expect(nombreDeArchivo("¿Café? ¡Sí!")).toBe("cafe-si.ics")
    expect(nombreDeArchivo("···")).toBe("plan.ics")
  })
})

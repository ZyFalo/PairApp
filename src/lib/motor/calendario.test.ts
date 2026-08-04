import { describe, expect, it } from "vitest"
import {
  animoDelDia,
  aniversarioEnLaRejilla,
  diasDeCiclo,
  limitesDeLaRejilla,
  limitesDelDia,
  loQueSeVeDeElla,
  mesDe,
  mesVecino,
  nombreDelMes,
  rejillaDelMes,
} from "./calendario"

const BOGOTA = "America/Bogota"

/** Un día suelto, como los guarda Postgres: medianoche UTC, sin hora. */
function dia(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`)
}

describe("la rejilla del mes", () => {
  it("empieza en lunes y trae seis semanas completas", () => {
    const casillas = rejillaDelMes("2026-08")

    expect(casillas).toHaveLength(42)
    // El 1 de agosto de 2026 cae en sábado: la rejilla arranca el lunes 27.
    expect(casillas[0].dia).toBe("2026-07-27")
    expect(casillas[41].dia).toBe("2026-09-06")
  })

  /**
   * Seis semanas siempre, aunque sobren. Si la rejilla cambiara de alto entre
   * meses, todo lo que va debajo saltaría al pasar de página.
   */
  it("son seis semanas hasta en un febrero que cabe en cuatro", () => {
    // Febrero de 2027 empieza en lunes y tiene 28 días: cabe justo en cuatro.
    const casillas = rejillaDelMes("2027-02")

    expect(casillas).toHaveLength(42)
    expect(casillas[0].dia).toBe("2027-02-01")
  })

  it("distingue los días del mes de los prestados de los vecinos", () => {
    const casillas = rejillaDelMes("2026-08")

    expect(casillas[0].esDelMes).toBe(false)
    expect(casillas.filter((c) => c.esDelMes)).toHaveLength(31)
  })

  it("cruza el año al cambiar de mes", () => {
    expect(mesVecino("2026-01", -1)).toBe("2025-12")
    expect(mesVecino("2026-12", 1)).toBe("2027-01")
  })

  it("nombra el mes con su año, para no perderse al navegar", () => {
    expect(nombreDelMes("2026-08")).toBe("agosto de 2026")
  })

  /**
   * La medianoche del día 1 en Bogotá es todavía el último día del mes anterior
   * en UTC. Sin la zona, el calendario se abriría en el mes equivocado durante
   * cinco horas cada mes.
   */
  it("sitúa un instante en el mes de quien mira, no en el del servidor", () => {
    expect(mesDe(new Date("2026-08-01T03:00:00Z"), BOGOTA)).toBe("2026-07")
    expect(mesDe(new Date("2026-08-01T06:00:00Z"), BOGOTA)).toBe("2026-08")
  })

  /**
   * Con Luxon y no sumando milisegundos: hay días de 23 y de 25 horas, y la
   * aritmética a pelo movería la casilla dos veces al año en un país con
   * cambio de horario.
   */
  it("un día empieza y acaba en la zona de quien mira", () => {
    const { desde, hasta } = limitesDelDia("2026-08-04", BOGOTA)

    expect(desde.toISOString()).toBe("2026-08-04T05:00:00.000Z")
    expect(hasta.toISOString()).toBe("2026-08-05T04:59:59.999Z")
  })

  it("respeta un cambio de horario en las zonas que lo tienen", () => {
    // El 29 de marzo de 2026 Madrid adelanta el reloj: ese día dura 23 horas.
    const { desde, hasta } = limitesDelDia("2026-03-29", "Europe/Madrid")

    expect(hasta.getTime() - desde.getTime()).toBe(23 * 3_600_000 - 1)
  })

  it("los límites cubren la rejilla entera, no solo el mes", () => {
    const { desde, hasta } = limitesDeLaRejilla("2026-08", BOGOTA)

    // Arranca el 27 de julio a las 00:00 en Bogotá, que son las 05:00 UTC.
    expect(desde.toISOString()).toBe("2026-07-27T05:00:00.000Z")
    expect(hasta.toISOString()).toBe("2026-09-07T04:59:59.999Z")
  })
})

describe("los aniversarios anuales", () => {
  it("caen en su día del año que se está mirando", () => {
    const cumple = new Date("1998-03-14T15:00:00Z")

    expect(aniversarioEnLaRejilla(cumple, "2026-03", BOGOTA)).toBe("2026-03-14")
  })

  it("no salen en un mes que no es el suyo", () => {
    const cumple = new Date("1998-03-14T15:00:00Z")

    expect(aniversarioEnLaRejilla(cumple, "2026-06", BOGOTA)).toBeNull()
  })

  /** Enero enseña días de diciembre: un evento del 31 tiene que aparecer ahí. */
  it("aparece aunque su día sea prestado del mes vecino", () => {
    const nochevieja = new Date("2020-12-31T18:00:00Z")

    expect(aniversarioEnLaRejilla(nochevieja, "2027-01", BOGOTA)).toBe("2026-12-31")
  })

  /**
   * Quien nació un 29 de febrero también cumple los años que no son bisiestos.
   * Dejar de dibujarlo tres de cada cuatro años sería peor que recogerlo al 28.
   */
  it("recoge el 29 de febrero al 28 cuando el año no es bisiesto", () => {
    const bisiesto = new Date("2024-02-29T12:00:00Z")

    expect(aniversarioEnLaRejilla(bisiesto, "2026-02", BOGOTA)).toBe("2026-02-28")
    expect(aniversarioEnLaRejilla(bisiesto, "2028-02", BOGOTA)).toBe("2028-02-29")
  })
})

describe("el ánimo que representa un día", () => {
  it("no dice nada de un día sin registros", () => {
    expect(animoDelDia([])).toBeNull()
  })

  /**
   * La regla que importa: dos «bien» de paso no pueden tapar un enojo del cinco.
   * Contar cuál se repite más dibujaría un día tranquilo encima de uno que no lo
   * fue, y silenciar lo difícil es justo lo que esta app existe para no hacer.
   */
  it("gana el más intenso, aunque sea el único de su clase", () => {
    const elegido = animoDelDia([
      { emocion: "BIEN", intensidad: 2 },
      { emocion: "BIEN", intensidad: 3 },
      { emocion: "ENOJADO", intensidad: 5 },
    ])

    expect(elegido?.emocion).toBe("ENOJADO")
  })

  /** Entre dos lecturas igual de fuertes, la de después se hizo sabiendo más. */
  it("a igual intensidad se queda con la última", () => {
    const elegido = animoDelDia([
      { emocion: "TRISTE", intensidad: 4 },
      { emocion: "AGRADECIDO", intensidad: 4 },
    ])

    expect(elegido?.emocion).toBe("AGRADECIDO")
  })
})

describe("los días de ciclo", () => {
  it("marca los días registrados, contando entero el último", () => {
    const marcas = diasDeCiclo([{ inicio: dia("2026-08-03"), fin: dia("2026-08-06") }], null)

    expect([...marcas.keys()]).toEqual(["2026-08-03", "2026-08-04", "2026-08-05", "2026-08-06"])
    expect(marcas.get("2026-08-06")).toBe("REGISTRADO")
    expect(marcas.has("2026-08-07")).toBe(false)
  })

  it("sin último día marcado, dura lo que dura uno cualquiera", () => {
    const marcas = diasDeCiclo([{ inicio: dia("2026-08-03"), fin: null }], null)

    expect(marcas.size).toBe(5)
    expect(marcas.has("2026-08-07")).toBe(true)
    expect(marcas.has("2026-08-08")).toBe(false)
  })

  /**
   * Un cálculo y un hecho no se dibujan con la misma tinta: presentarlos igual
   * convierte una media aritmética en una certeza (RF-5.2).
   */
  it("separa lo estimado de lo registrado", () => {
    const marcas = diasDeCiclo(
      [{ inicio: dia("2026-08-03"), fin: dia("2026-08-05") }],
      dia("2026-08-31"),
    )

    expect(marcas.get("2026-08-04")).toBe("REGISTRADO")
    expect(marcas.get("2026-08-31")).toBe("ESTIMADO")
  })

  it("el dato real pisa a la estimación cuando coinciden", () => {
    const marcas = diasDeCiclo([{ inicio: dia("2026-08-30"), fin: null }], dia("2026-08-30"))

    expect(marcas.get("2026-08-30")).toBe("REGISTRADO")
  })
})

/**
 * La promesa de RF-5.6, comprobada y no solo escrita.
 *
 * Su periodo y su ánimo en la misma casilla **son** la correlación que el
 * módulo del ciclo existe para no hacer. Que la calcule un ojo en vez de una
 * función no lo mejora: lo empeora, porque nadie la revisó.
 */
describe("lo que se ve de ella nunca es una correlación", () => {
  it("un día con marca de ciclo no enseña su ánimo", () => {
    const visto = loQueSeVeDeElla({ emocion: "TRISTE" }, "REGISTRADO")

    expect(visto.animo).toBeNull()
    expect(visto.ciclo).toBe("REGISTRADO")
  })

  it("tampoco lo enseña si la marca es solo una estimación", () => {
    expect(loQueSeVeDeElla({ emocion: "ENOJADO" }, "ESTIMADO").animo).toBeNull()
  })

  it("fuera de esos días su ánimo se ve entero", () => {
    const visto = loQueSeVeDeElla({ emocion: "BIEN" }, null)

    expect(visto.animo).toEqual({ emocion: "BIEN" })
  })
})

import { describe, expect, it } from "vitest"
import { GrupoEmocion, Visibilidad } from "@/generated/prisma/enums"
import {
  enSilencio,
  MINUTOS_ENTRE_RUTINAS,
  puedeAvisar,
  textoDeSuAnimo,
  tocaAvisarDeSuAnimo,
} from "./avisos"

const BOGOTA = "America/Bogota"

/** Una hora local de Bogotá (UTC-5) como instante UTC. */
function aLas(hora: number, minuto = 0): Date {
  return new Date(Date.UTC(2026, 7, 4, hora + 5, minuto))
}

describe("el horario de silencio", () => {
  it("calla de once de la noche a ocho de la mañana", () => {
    expect(enSilencio(BOGOTA, aLas(23))).toBe(true)
    expect(enSilencio(BOGOTA, aLas(3))).toBe(true)
    expect(enSilencio(BOGOTA, aLas(7, 59))).toBe(true)
  })

  it("y deja pasar el resto del día", () => {
    expect(enSilencio(BOGOTA, aLas(8))).toBe(false)
    expect(enSilencio(BOGOTA, aLas(14))).toBe(false)
    expect(enSilencio(BOGOTA, aLas(22, 59))).toBe(false)
  })

  /** Va por la hora de quien recibe, no por la del servidor. */
  it("es la hora de quien lo va a recibir", () => {
    // Las 02:00 UTC son las 21:00 en Bogotá y las 03:00 en Madrid.
    const momento = new Date("2026-08-05T02:00:00Z")
    expect(enSilencio(BOGOTA, momento)).toBe(false)
    expect(enSilencio("Europe/Madrid", momento)).toBe(true)
  })
})

describe("cuánto puede molestar cada aviso", () => {
  it("de noche no sale nada, venga de donde venga", () => {
    expect(puedeAvisar("de_ella", BOGOTA, aLas(2), null)).toBe(false)
    expect(puedeAvisar("rutina", BOGOTA, aLas(2), null)).toBe(false)
  })

  /**
   * Enterarte de que te escribió no puede depender de cuántas veces vibró el
   * teléfono antes. Lo de la otra persona no espera turno.
   */
  it("lo que hace ella no espera al espaciado", () => {
    const haceUnMinuto = aLas(13, 59)
    expect(puedeAvisar("de_ella", BOGOTA, aLas(14), haceUnMinuto)).toBe(true)
  })

  it("lo que decide la app sí espera", () => {
    const recien = new Date(aLas(14).getTime() - 10 * 60_000)
    expect(puedeAvisar("rutina", BOGOTA, aLas(14), recien)).toBe(false)

    const hace2h = new Date(aLas(14).getTime() - (MINUTOS_ENTRE_RUTINAS + 1) * 60_000)
    expect(puedeAvisar("rutina", BOGOTA, aLas(14), hace2h)).toBe(true)
  })

  it("sin avisos previos, la rutina pasa", () => {
    expect(puedeAvisar("rutina", BOGOTA, aLas(14), null)).toBe(true)
  })
})

describe("cuándo avisar de su ánimo", () => {
  /**
   * Manda quien registra, no quien recibe: lo privado no llega ni pidiéndolo
   * (RF-1.3).
   */
  it("lo privado no llega nunca, ni con «siempre»", () => {
    expect(tocaAvisarDeSuAnimo("SIEMPRE", Visibilidad.PRIVADO, 5)).toBe(false)
  })

  it("«nunca» es nunca", () => {
    expect(tocaAvisarDeSuAnimo("NUNCA", Visibilidad.COMPLETO, 5)).toBe(false)
  })

  /**
   * Por defecto solo lo intenso: si vibra cada vez que la otra persona toca un
   * botón, en una semana se silencia la app y entonces no llega ni lo que importa.
   */
  it("por defecto pasa lo intenso y se calla lo de paso", () => {
    expect(tocaAvisarDeSuAnimo("SOLO_INTENSO", Visibilidad.COMPLETO, 4)).toBe(true)
    expect(tocaAvisarDeSuAnimo("SOLO_INTENSO", Visibilidad.COMPLETO, 3)).toBe(false)
  })

  it("con «siempre» pasa hasta lo flojo", () => {
    expect(tocaAvisarDeSuAnimo("SIEMPRE", Visibilidad.COMPLETO, 1)).toBe(true)
  })
})

describe("qué dice el aviso de su ánimo", () => {
  const base = {
    nombre: "Cata",
    emocion: "TRISTE" as const,
    visibilidad: Visibilidad.COMPLETO,
    etiqueta: "Triste",
    dejoMensaje: false,
    grupoDeQuienLee: null,
  }

  it("dice cómo está, y si dejó algo", () => {
    expect(textoDeSuAnimo(base)).toBe("Cata está triste.")
    expect(textoDeSuAnimo({ ...base, dejoMensaje: true })).toBe("Cata está triste. Te dejó algo.")
  })

  /** Nunca «no te dejó nada»: eso convierte un silencio en un reproche. */
  it("la ausencia no se enuncia", () => {
    expect(textoDeSuAnimo(base)).not.toMatch(/no te dej/i)
  })

  it("en «solo el color» no se nombra la emoción", () => {
    const texto = textoDeSuAnimo({ ...base, visibilidad: Visibilidad.SOLO_COLOR })
    expect(texto).toBe("Cata no está bien.")
    expect(texto).not.toMatch(/triste/i)
  })

  it("y si está bien, tampoco dice cuál de las tres", () => {
    expect(
      textoDeSuAnimo({
        ...base,
        emocion: "AGRADECIDO",
        etiqueta: "Agradecida",
        visibilidad: Visibilidad.SOLO_COLOR,
      }),
    ).toBe("Cata está bien.")
  })

  /**
   * Un «Cata está enojada» en la pantalla de bloqueo a las 23:00 es una bomba
   * si quien lo lee también está mal (RF-4.1.1). El detalle espera a la app.
   */
  it("se atenúa si quien lo lee está en «algo pasó»", () => {
    const texto = textoDeSuAnimo({
      ...base,
      emocion: "ENOJADO",
      etiqueta: "Enojada",
      dejoMensaje: true,
      grupoDeQuienLee: GrupoEmocion.ALGO_PASO,
    })

    expect(texto).toBe("Cata registró cómo está. Te dejó algo.")
    expect(texto).not.toMatch(/enojad/i)
  })

  it("nunca lleva el texto del mensaje", () => {
    const texto = textoDeSuAnimo({ ...base, dejoMensaje: true })
    expect(texto).toMatch(/Te dejó algo/)
  })
})

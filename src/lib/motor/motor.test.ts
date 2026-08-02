import { describe, expect, it } from "vitest"
import { ClaseMensaje, Emocion, GrupoEmocion } from "@/generated/prisma/enums"
import {
  claseDe,
  esDificilDeResponder,
  grupoDe,
  necesidadPorDefecto,
  pasaPorUmbral,
  puedeGuardarseParaDespues,
} from "./emociones"
import { decidirPresentacion, estadoVigente, topeDePosponer } from "./entrega"
import { horasDesfasadas, tocaPreguntaPeriodica, ventanaOnceOnce } from "./tiempo"

const ahora = new Date("2026-08-02T15:00:00Z")
const haceUnaHora = new Date("2026-08-02T14:00:00Z")
const haceNueveHoras = new Date("2026-08-02T06:00:00Z")

describe("los tres grupos", () => {
  it("agrupa las nueve emociones en tres familias", () => {
    expect(grupoDe(Emocion.BIEN)).toBe(GrupoEmocion.ESTOY_CONTIGO)
    expect(grupoDe(Emocion.TE_EXTRANO)).toBe(GrupoEmocion.ESTOY_CONTIGO)
    expect(grupoDe(Emocion.ME_SIENTO_SOLO)).toBe(GrupoEmocion.ME_FALTA_ALGO)
    expect(grupoDe(Emocion.INCOMODO)).toBe(GrupoEmocion.ALGO_PASO)
  })
})

describe("presencia y conversación", () => {
  it("los mensajes de 'estoy contigo' no esperan respuesta", () => {
    expect(claseDe(Emocion.BIEN)).toBe(ClaseMensaje.PRESENCIA)
    expect(claseDe(Emocion.AGRADECIDO)).toBe(ClaseMensaje.PRESENCIA)
    expect(claseDe(Emocion.TE_EXTRANO)).toBe(ClaseMensaje.PRESENCIA)
  })

  it("el incómodo abre conversación aunque sea barato de enviar", () => {
    expect(claseDe(Emocion.INCOMODO)).toBe(ClaseMensaje.CONVERSACION)
  })

  it("'me siento solo' abre conversación y 'te extraño' no", () => {
    expect(claseDe(Emocion.ME_SIENTO_SOLO)).toBe(ClaseMensaje.CONVERSACION)
    expect(claseDe(Emocion.TE_EXTRANO)).toBe(ClaseMensaje.PRESENCIA)
  })
})

describe("el umbral aparece solo en enojo", () => {
  it("no aparece en incómodo, ni siquiera con intensidad alta", () => {
    expect(pasaPorUmbral(Emocion.INCOMODO, 5)).toBe(false)
  })

  it("no aparece en apenado ni en triste", () => {
    expect(pasaPorUmbral(Emocion.APENADO, 5)).toBe(false)
    expect(pasaPorUmbral(Emocion.TRISTE, 5)).toBe(false)
  })

  it("aparece en enojo intenso y no en enojo leve", () => {
    expect(pasaPorUmbral(Emocion.ENOJADO, 4)).toBe(true)
    expect(pasaPorUmbral(Emocion.ENOJADO, 2)).toBe(false)
  })
})

describe("guardar para después", () => {
  it("solo se puede desde las tres emociones cálidas", () => {
    expect(puedeGuardarseParaDespues(Emocion.BIEN)).toBe(true)
    expect(puedeGuardarseParaDespues(Emocion.AGRADECIDO)).toBe(true)
    expect(puedeGuardarseParaDespues(Emocion.TE_EXTRANO)).toBe(true)
  })

  it("no se puede desde la tristeza: duplicaría la tristeza en vez de consolar", () => {
    expect(puedeGuardarseParaDespues(Emocion.TRISTE)).toBe(false)
  })

  it("no se puede desde el enojo: sería una emboscada", () => {
    expect(puedeGuardarseParaDespues(Emocion.ENOJADO)).toBe(false)
  })
})

describe("difíciles de responder", () => {
  it("son enojo, tristeza, soledad y pena", () => {
    expect(esDificilDeResponder(Emocion.ENOJADO)).toBe(true)
    expect(esDificilDeResponder(Emocion.TRISTE)).toBe(true)
    expect(esDificilDeResponder(Emocion.ME_SIENTO_SOLO)).toBe(true)
    expect(esDificilDeResponder(Emocion.APENADO)).toBe(true)
  })

  it("el incómodo no lo es: 'tienes razón, ¿qué pasó?' no tiene dificultad", () => {
    expect(esDificilDeResponder(Emocion.INCOMODO)).toBe(false)
  })
})

describe("necesidad por defecto", () => {
  it("no se muestra en las emociones cálidas", () => {
    expect(necesidadPorDefecto(Emocion.BIEN)).toBeNull()
  })

  it("el apenado no trae ninguna preseleccionada", () => {
    expect(necesidadPorDefecto(Emocion.APENADO)).toBeNull()
  })

  it("los demás traen escucha", () => {
    expect(necesidadPorDefecto(Emocion.TRISTE)).toBe("ESCUCHA")
    expect(necesidadPorDefecto(Emocion.ENOJADO)).toBe("ESCUCHA")
  })
})

describe("caducidad de estados", () => {
  it("un check-in de hace una hora sigue vigente", () => {
    expect(
      estadoVigente({ emocion: Emocion.TRISTE, intensidad: 4, creadoEn: haceUnaHora }, ahora),
    ).toBe(true)
  })

  it("uno de hace nueve horas ya no gobierna nada", () => {
    expect(
      estadoVigente({ emocion: Emocion.TRISTE, intensidad: 4, creadoEn: haceNueveHoras }, ahora),
    ).toBe(false)
  })

  it("sin check-in no hay estado vigente", () => {
    expect(estadoVigente(null, ahora)).toBe(false)
  })
})

describe("la matriz de entrega", () => {
  const receptor = (emocion: Emocion, intensidad = 4) => ({
    emocion,
    intensidad,
    creadoEn: haceUnaHora,
  })

  it("lo bueno llega siempre directo, esté como esté quien lo recibe", () => {
    expect(decidirPresentacion(Emocion.BIEN, receptor(Emocion.ENOJADO), ahora).tipo).toBe("directo")
    expect(decidirPresentacion(Emocion.TE_EXTRANO, receptor(Emocion.TRISTE), ahora).tipo).toBe(
      "directo",
    )
  })

  it("amortigua cuando quien recibe está en carencia", () => {
    expect(decidirPresentacion(Emocion.ENOJADO, receptor(Emocion.TRISTE), ahora).tipo).toBe(
      "amortiguado",
    )
    expect(
      decidirPresentacion(Emocion.INCOMODO, receptor(Emocion.ME_SIENTO_SOLO), ahora).tipo,
    ).toBe("amortiguado")
  })

  it("no amortigua en apenado: el cariño ahí aumenta la culpa", () => {
    expect(decidirPresentacion(Emocion.ENOJADO, receptor(Emocion.APENADO), ahora).tipo).toBe(
      "nombrar_y_elegir",
    )
  })

  it("no amortigua en enojo: el cariño ahí invalida", () => {
    const p = decidirPresentacion(Emocion.ENOJADO, receptor(Emocion.ENOJADO), ahora)
    expect(p.tipo).toBe("nombrar_y_elegir")
    expect(p.tipo === "nombrar_y_elegir" && p.ambosEnojados).toBe(true)
  })

  it("un caso que nunca simulamos cae en una celda existente", () => {
    // ella preocupada, yo triste → carencia × conversación → amortigua
    expect(decidirPresentacion(Emocion.PREOCUPADO, receptor(Emocion.TRISTE), ahora).tipo).toBe(
      "amortiguado",
    )
  })

  it("con el estado caducado se muestra directo, y la app volverá a preguntar", () => {
    const viejo = { emocion: Emocion.TRISTE, intensidad: 5, creadoEn: haceNueveHoras }
    expect(decidirPresentacion(Emocion.ENOJADO, viejo, ahora).tipo).toBe("directo")
  })

  it("la carencia leve no amortigua: sería inflar algo pequeño", () => {
    expect(decidirPresentacion(Emocion.ENOJADO, receptor(Emocion.TRISTE, 2), ahora).tipo).toBe(
      "directo",
    )
  })
})

describe("posponer la lectura", () => {
  it("tres horas en general", () => {
    const tope = topeDePosponer({ tipo: "nombrar_y_elegir", ambosEnojados: false }, ahora)
    expect(tope.getTime() - ahora.getTime()).toBe(3 * 3_600_000)
  })

  it("hasta la mañana siguiente si ambos están enojados", () => {
    const tope = topeDePosponer({ tipo: "nombrar_y_elegir", ambosEnojados: true }, ahora)
    expect(tope.getTime() - ahora.getTime()).toBe(12 * 3_600_000)
  })
})

describe("las seis preguntas diarias", () => {
  it("dispara a la hora local de la persona, no a la del servidor", () => {
    // 14:00 en Bogotá son las 19:00 UTC
    const utc = new Date("2026-08-02T19:05:00Z")
    expect(tocaPreguntaPeriodica([9, 14, 19], "America/Bogota", utc)).toBe(true)
  })

  it("no dispara fuera de la ventana de 15 minutos", () => {
    const utc = new Date("2026-08-02T19:40:00Z")
    expect(tocaPreguntaPeriodica([9, 14, 19], "America/Bogota", utc)).toBe(false)
  })

  it("las de la pareja van desfasadas una hora exacta", () => {
    expect(horasDesfasadas([9, 14, 19])).toEqual([10, 15, 20])
  })

  it("el desfase no se sale del día", () => {
    expect(horasDesfasadas([23])).toEqual([0])
  })
})

describe("los 11:11", () => {
  it("la ventana abre a las 11:11 locales", () => {
    // 11:11 en Bogotá son las 16:11 UTC
    expect(ventanaOnceOnce("America/Bogota", new Date("2026-08-02T16:11:00Z")).abierta).toBe(true)
  })

  it("hay cuatro minutos de gracia", () => {
    expect(ventanaOnceOnce("America/Bogota", new Date("2026-08-02T16:15:00Z")).abierta).toBe(true)
    expect(ventanaOnceOnce("America/Bogota", new Date("2026-08-02T16:16:00Z")).abierta).toBe(false)
  })

  it("también abre a las 23:11", () => {
    const v = ventanaOnceOnce("America/Bogota", new Date("2026-08-03T04:11:00Z"))
    expect(v.abierta).toBe(true)
    expect(v.esNoche).toBe(true)
  })
})

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

/**
 * Las nueve emociones y lo que implica cada una (§M1.1.2).
 *
 * Cada prueba lleva el nombre de la regla del documento que fija, no el de la
 * función: si cambia la implementación pero la regla sigue siendo la misma, la
 * prueba debe seguir valiendo.
 */

const _ahora = new Date("2026-08-02T15:00:00Z")
const _haceUnaHora = new Date("2026-08-02T14:00:00Z")
const _haceNueveHoras = new Date("2026-08-02T06:00:00Z")

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

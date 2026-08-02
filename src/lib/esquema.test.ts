import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * Invariante del esquema: **todo modelo de dominio tiene `vinculoId`**.
 *
 * El cliente acotado de RNF-4 inyecta ese campo en el `where` de toda consulta,
 * así que un modelo sin él lanza un error de validación en cuanto se usa. Pasó
 * de verdad con `Respuesta`, que colgaba solo de `Entrega`: compilaba, pasaba
 * los tests de aislamiento, y reventaba al responder un mensaje.
 *
 * Esta prueba lee el esquema en crudo, así que cubre también los modelos que
 * aún no tienen código que los use.
 */

/** Modelos que legítimamente no cuelgan de un vínculo. */
const SIN_VINCULO = new Set([
  "Usuario", // existe antes de pertenecer a ningún vínculo
  "Vinculo", // es el vínculo
])

describe("invariante del esquema", () => {
  const esquema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8")

  const modelos = [...esquema.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)].map((m) => ({
    nombre: m[1],
    cuerpo: m[2],
  }))

  it("encuentra los modelos del esquema", () => {
    expect(modelos.length).toBeGreaterThan(10)
  })

  it.each(modelos.filter((m) => !SIN_VINCULO.has(m.nombre)).map((m) => [m.nombre, m.cuerpo]))(
    "%s tiene vinculoId, o el cliente acotado fallaría al usarlo",
    (_nombre, cuerpo) => {
      expect(cuerpo).toMatch(/^\s*vinculoId\s+String/m)
    },
  )
})

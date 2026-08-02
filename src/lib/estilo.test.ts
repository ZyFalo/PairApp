import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * Convenciones de la interfaz que se comprueban solas.
 *
 * Son reglas fáciles de romper sin darse cuenta —un emoji pegado desde otro
 * sitio no rompe nada, compila y pasa el resto de pruebas— y por eso merecen
 * una prueba en vez de una nota en el documento.
 */

/** Todos los archivos de código bajo `src`, saltando lo generado por Prisma. */
function archivosDeCodigo(desde: string): string[] {
  return readdirSync(desde).flatMap((nombre) => {
    const ruta = join(desde, nombre)
    if (nombre === "generated" || nombre === "node_modules") return []
    if (statSync(ruta).isDirectory()) return archivosDeCodigo(ruta)
    return /\.tsx?$/.test(nombre) ? [ruta] : []
  })
}

/**
 * Emojis de color: pictogramas, emoticonos, banderas, y los símbolos del bloque
 * de dingbats —donde viven los corazones ♥♡ y las estrellas que se usan como
 * iconos de pobre—.
 *
 * Deja pasar a propósito los signos tipográficos (·, —, ¿, →): son puntuación
 * de un castellano bien escrito, no decoración.
 */
const EMOJI =
  /[\u{1F300}-\u{1FAFF}]|[\u{1F000}-\u{1F2FF}]|[\u{2600}-\u{27BF}]|[\u{2B00}-\u{2BFF}]|\u{FE0F}/u

describe("convenciones de la interfaz", () => {
  /**
   * La app no usa emojis: cada sistema los dibuja distinto, no se pueden
   * colorear y su registro gráfico choca con el papel y la tinta de §8.2.
   * Todo icono sale de `componentes/iconos.tsx`.
   */
  it("ningún archivo de código contiene emojis", () => {
    const culpables = archivosDeCodigo("src")
      .filter((ruta) => !ruta.endsWith("estilo.test.ts"))
      .flatMap((ruta) =>
        readFileSync(ruta, "utf8")
          .split("\n")
          .map((linea, i) => ({ ruta, linea: i + 1, texto: linea }))
          .filter((l) => EMOJI.test(l.texto)),
      )
      .map((l) => `${l.ruta}:${l.linea} → ${l.texto.trim()}`)

    expect(culpables).toEqual([])
  })
})

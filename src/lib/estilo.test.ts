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

/**
 * Reglas de las esperas.
 *
 * Las tres nacieron de bugs que compilaban, pasaban el lint y pasaban todos los
 * tests. Se vieron usando la app, que es el peor sitio para encontrarlas, y por
 * eso se comprueban aquí: la próxima vez avisa el `pnpm test`.
 */
describe("cómo se dice que algo va", () => {
  const componentes = archivosDeCodigo("src").filter((r) => !r.includes(".test."))

  /**
   * Los comentarios de este proyecto **explican** las reglas, así que citan lo
   * que prohíben: el porqué de `useEnfoqueQuieto` menciona `autoFocus`, y el de
   * `diaRelativo` menciona «faltan 3 días» para decir que eso no se escribe.
   * Sin esto, la prueba se dispararía justo con la documentación de la regla.
   */
  const esComentario = (texto: string) => /^\s*(\*|\/\/|\/\*)/.test(texto)

  /**
   * `autoFocus` pone el cursor **y arrastra el documento hasta él**, y no deja
   * separarlo. Como los formularios de esta app se montan ya abiertos cuando hay
   * borrador, entrar en una pantalla con algo empezado te dejaba de golpe al
   * final de la lista, sin haber pedido ir ahí. Va `useEnfoqueQuieto`, que
   * enfoca con `preventScroll`.
   */
  it("ningún campo usa autoFocus", () => {
    const culpables = componentes
      .flatMap((ruta) =>
        readFileSync(ruta, "utf8")
          .split("\n")
          .map((texto, i) => ({ ruta, linea: i + 1, texto }))
          .filter((l) => !esComentario(l.texto) && /\bautoFocus\b/.test(l.texto)),
      )
      .map((l) => `${l.ruta}:${l.linea}`)

    expect(culpables).toEqual([])
  })

  /**
   * `empezar(() => void accion())` **suelta la promesa**: React da la transición
   * por terminada en el acto, el botón se apaga y revive antes de que pase nada,
   * y quien lo mira vuelve a pulsar. Se ve como un parpadeo y manda la acción
   * dos veces. La forma correcta es `empezar(async () => { await accion() })`.
   */
  it("ninguna transición suelta su promesa", () => {
    const culpables = componentes
      .flatMap((ruta) =>
        readFileSync(ruta, "utf8")
          .split("\n")
          .map((texto, i) => ({ ruta, linea: i + 1, texto }))
          // `empezar(() => void algo(` — el `void` delante de una llamada dentro
          // de una transición es siempre este error.
          .filter((l) => /empezar\(\(\)\s*=>\s*void\s+\w+\(/.test(l.texto)),
      )
      .map((l) => `${l.ruta}:${l.linea} → ${l.texto.trim()}`)

    expect(culpables).toEqual([])
  })

  /**
   * Ningún indicador de espera lleva número, porcentaje ni segundos que faltan
   * (RF-2.0.7, RF-3.0.13.1). «Casi listo» tampoco: la app no sabe eso y decirlo
   * sería inferir (§1.2).
   */
  it("ninguna espera cuenta ni promete", () => {
    const prohibido = /(\d+\s*%)|(faltan?\s+\d)|casi listo|un momento más|quedan?\s+\d/i

    const culpables = componentes
      .flatMap((ruta) =>
        readFileSync(ruta, "utf8")
          .split("\n")
          .map((texto, i) => ({ ruta, linea: i + 1, texto }))
          // Solo el texto entre comillas: un `w-[50%]` de Tailwind no cuenta.
          .filter((l) => {
            if (esComentario(l.texto)) return false
            const literales = l.texto.match(/"[^"]*"|'[^']*'|`[^`]*`/g) ?? []
            return literales.some((t) => prohibido.test(t) && !/className|w-\[|h-\[/.test(l.texto))
          }),
      )
      .map((l) => `${l.ruta}:${l.linea} → ${l.texto.trim()}`)

    expect(culpables).toEqual([])
  })

  /**
   * **`base.tsx` no puede llevar hooks**, porque eso lo obligaría a declararse
   * `"use client"` — y `Seccion`, `Vacio` y `PastillaDeVista` reciben `Icono`
   * como función desde páginas de servidor. Una función no cruza esa frontera y
   * revienta con «Functions cannot be passed directly to Client Components»
   * (§7). Lo que necesite estado va a `espera.tsx` o al fichero de su módulo.
   */
  it("base.tsx sigue siendo de servidor", () => {
    const texto = readFileSync("src/componentes/base.tsx", "utf8")

    expect(texto).not.toMatch(/^\s*"use client"/)
    expect(texto).not.toMatch(/\buse(State|Effect|Transition|ActionState|Optimistic|Ref)\(/)
  })
})

import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * Las capas del proyecto, comprobadas y no solo documentadas.
 *
 * `docs/ARQUITECTURA.md` describe cinco capas y dice que cada una solo puede
 * depender de las de dentro. Una regla así escrita en prosa dura hasta el
 * primer día con prisa — ya pasó con D41, que se enunciaba como absoluta
 * mientras cinco módulos la incumplían sin que nada avisara.
 *
 * Si una de estas pruebas falla, la pregunta no es cómo silenciarla: es si esa
 * dependencia debería existir. Casi siempre significa que algo está en la capa
 * equivocada.
 */

/** De dentro hacia fuera. Cada capa solo puede importar de las anteriores. */
const CAPAS = [
  { nombre: "motor", carpeta: "src/lib/motor" },
  { nombre: "datos", carpeta: "src/lib" },
  { nombre: "consultas", carpeta: "src/lib/consultas" },
  { nombre: "acciones", carpeta: "src/lib/acciones" },
  { nombre: "componentes", carpeta: "src/componentes" },
  { nombre: "páginas", carpeta: "src/app" },
]

/** Archivos de código de una carpeta, sin bajar a subcarpetas ni contar pruebas. */
function ficheros(carpeta: string, recursivo = true): string[] {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre)
    if (nombre === "generated") return []
    if (statSync(ruta).isDirectory()) return recursivo ? ficheros(ruta) : []
    return /\.tsx?$/.test(nombre) && !nombre.includes(".test.") ? [ruta] : []
  })
}

/** Los `from "..."` de un archivo. */
function importaDe(ruta: string): string[] {
  return [...readFileSync(ruta, "utf8").matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1])
}

describe("las capas de la arquitectura", () => {
  /**
   * El motor es la razón de que 121 pruebas corran en 300 ms. En cuanto una
   * regla necesite la base de datos o React, deja de poder probarse barato —
   * y lo que cuesta probar, se deja sin probar.
   */
  it("el motor no sabe de React, ni de la base, ni del entorno", () => {
    const prohibido =
      /^(react|next|@prisma|@\/generated\/prisma\/client|@\/lib\/(db|sesion|acciones|consultas))/

    const culpables = ficheros("src/lib/motor")
      .flatMap((ruta) => importaDe(ruta).map((imp) => ({ ruta, imp })))
      .filter(({ imp }) => prohibido.test(imp))
      .map(({ ruta, imp }) => `${ruta} → ${imp}`)

    expect(culpables).toEqual([])
  })

  /**
   * El motor tampoco puede leer el reloj por su cuenta: la hora entra como
   * parámetro. Es lo que permite probar la medianoche, el cambio de año y el
   * minuto exacto de los 11:11 sin tocar el reloj del sistema.
   */
  it("el motor recibe la hora, no la consulta", () => {
    const culpables = ficheros("src/lib/motor").filter((ruta) =>
      /\bnew Date\(\s*\)|Date\.now\(\)/.test(readFileSync(ruta, "utf8")),
    )

    expect(culpables).toEqual([])
  })

  /**
   * `acciones/` escribe; `consultas/` lee. Sin esa frontera, un módulo
   * `"use server"` acaba publicando consultas como puntos de entrada remotos
   * sin que nadie lo haya decidido.
   */
  it("las consultas no escriben ni se publican como acciones", () => {
    const escrituras = /\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\(/

    const culpables = ficheros("src/lib/consultas")
      .map((ruta) => ({ ruta, texto: readFileSync(ruta, "utf8") }))
      .filter(({ texto }) => /^\s*"use server"/.test(texto) || escrituras.test(texto))
      .map(({ ruta }) => ruta)

    expect(culpables).toEqual([])
  })

  /** Y al revés: una acción que no escribe nada no debería ser una acción. */
  it("toda acción declara «use server»", () => {
    const culpables = ficheros("src/lib/acciones").filter(
      (ruta) => !readFileSync(ruta, "utf8").includes('"use server"'),
    )

    expect(culpables).toEqual([])
  })

  /**
   * Los componentes no consultan la base. Si uno necesita datos, se los pasa
   * la página que lo usa: así se ve de un vistazo qué carga cada pantalla.
   */
  it("los componentes no tocan la base de datos", () => {
    const culpables = ficheros("src/componentes")
      .flatMap((ruta) => importaDe(ruta).map((imp) => ({ ruta, imp })))
      .filter(({ imp }) => /@\/lib\/(db|sesion|consultas)/.test(imp))
      .map(({ ruta, imp }) => `${ruta} → ${imp}`)

    expect(culpables).toEqual([])
  })

  /**
   * Un componente de un módulo no puede importar de otro: si dos lo necesitan,
   * es que era común y su sitio es `base.tsx`. Sin esta regla, un desplegable
   * genérico acaba viviendo en el fichero de una funcionalidad y arrastrando
   * a media app detrás.
   */
  it("los componentes de un módulo no dependen de los de otro", () => {
    // Los que existen para ser compartidos. Cualquier otro cruce entre módulos
    // significa que algo debería estar aquí dentro.
    const comunes = new Set(["base", "iconos", "adjunto"])

    const culpables = ficheros("src/componentes", false)
      .flatMap((ruta) => importaDe(ruta).map((imp) => ({ ruta, imp })))
      .filter(({ ruta, imp }) => {
        const m = imp.match(/^@\/componentes\/([\w-]+)$/)
        if (!m || comunes.has(m[1])) return false
        return !ruta.endsWith(`${m[1]}.tsx`)
      })
      .map(({ ruta, imp }) => `${ruta} → ${imp}`)

    expect(culpables).toEqual([])
  })

  /** Nadie salta capas hacia dentro sin pasar por la de al lado. */
  it("las páginas no contienen lógica de dominio", () => {
    const dominio = /\b(GrupoEmocion|ClaseMensaje)\.[A-Z_]+\s*===|\bgrupoDe\([^)]*\)\s*===/

    const culpables = ficheros("src/app").filter((ruta) => dominio.test(readFileSync(ruta, "utf8")))

    expect(culpables).toEqual([])
  })
})

/** Las capas declaradas existen. Si alguien renombra una carpeta, se entera aquí. */
describe("el mapa de capas está al día", () => {
  it("todas las carpetas de ARQUITECTURA.md existen", () => {
    const faltan = CAPAS.filter(({ carpeta }) => {
      try {
        return !statSync(carpeta).isDirectory()
      } catch {
        return true
      }
    }).map((c) => c.carpeta)

    expect(faltan).toEqual([])
  })
})

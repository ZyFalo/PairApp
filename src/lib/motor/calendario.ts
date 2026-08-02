/**
 * Exportar un plan al calendario del teléfono (§12.2).
 *
 * Se generó un `.ics` en vez de sincronizar con Google (D29): un archivo que
 * el sistema abre solo, sin OAuth, sin permisos que conceder y sin que ninguna
 * empresa se entere de con quién cenas.
 */

/** Cuánto dura un plan sin hora de fin. El modelo no la guarda; una hora es lo normal. */
export const HORAS_POR_DEFECTO = 1

export type PlanExportable = {
  id: string
  titulo: string
  inicio: Date
  notas: string | null
}

/**
 * Fecha en el formato del estándar: `20260805T210000Z`, siempre en UTC.
 * El teléfono la traduce a la zona de quien la abre.
 */
function comoMarcaDeTiempo(fecha: Date): string {
  return `${fecha.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`
}

/**
 * Escapa un texto para el estándar: la coma, el punto y coma y la barra tienen
 * significado propio, y un salto de línea partiría el archivo por la mitad.
 */
function escapar(texto: string): string {
  return texto
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n")
}

/**
 * Parte una línea larga en trozos de 75 caracteres, como pide el estándar.
 * Las continuaciones empiezan por un espacio.
 */
function plegar(linea: string): string {
  if (linea.length <= 75) return linea
  const trozos = [linea.slice(0, 75)]
  for (let i = 75; i < linea.length; i += 74) trozos.push(` ${linea.slice(i, i + 74)}`)
  return trozos.join("\r\n")
}

/** Un plan como archivo de calendario, listo para descargar. */
export function comoIcs(plan: PlanExportable, ahora: Date): string {
  const fin = new Date(plan.inicio.getTime() + HORAS_POR_DEFECTO * 3_600_000)

  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PairApp//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${plan.id}@pairapp`,
    `DTSTAMP:${comoMarcaDeTiempo(ahora)}`,
    `DTSTART:${comoMarcaDeTiempo(plan.inicio)}`,
    `DTEND:${comoMarcaDeTiempo(fin)}`,
    `SUMMARY:${escapar(plan.titulo)}`,
    ...(plan.notas ? [`DESCRIPTION:${escapar(plan.notas)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ]

  // Terminado en salto: hay lectores que descartan la última línea sin él.
  return `${lineas.map(plegar).join("\r\n")}\r\n`
}

/** Nombre de archivo sin caracteres que molesten a ningún sistema. */
export function nombreDeArchivo(titulo: string): string {
  const limpio = titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
  return `${limpio || "plan"}.ics`
}

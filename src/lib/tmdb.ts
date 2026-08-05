/**
 * Búsqueda de series y películas en TMDB (RF-9.6).
 *
 * Se eligió TMDB y no otra por lo mismo que YouTube para las canciones: **API
 * gratuita y sin OAuth**. Una clave que se pega en el entorno y ya — nada de
 * registrar una aplicación, gestionar tokens ni renovarlos.
 *
 * **Sin clave, la app funciona entera**: la búsqueda no aparece y los títulos
 * se escriben a mano, exactamente como hasta ahora. Es el mismo trato que con
 * Cloudinary — una integración opcional no puede tumbar una pantalla.
 *
 * Nada de esto toca la base de datos ni la sesión: es un cliente de un servicio
 * externo, y por eso vive en `lib/` y no en el motor.
 */

const BASE = "https://api.themoviedb.org/3"

/** De dónde salen los pósters. El tamaño va en la ruta, no en un parámetro. */
const IMAGENES = "https://image.tmdb.org/t/p/w342"

/** Cuánto se espera a TMDB antes de rendirse. Una búsqueda lenta no vale nada. */
const ESPERA_MS = 5000

/** Lo que se enseña de un resultado antes de elegirlo. */
export type Candidato = {
  /** El identificador de TMDB, para pedir el detalle si se elige. */
  tmdbId: number
  tipo: "SERIE" | "PELICULA"
  nombre: string
  anio: number | null
  posterUrl: string | null
  sinopsis: string | null
}

/** Lo que se guarda al elegirlo, ya con la duración. */
export type Ficha = Omit<Candidato, "tmdbId"> & { minutos: number | null }

/**
 * La clave, o `null` si no está puesta.
 *
 * Gemela de `credencialesDelEntorno` en `nube.ts`, y por el mismo motivo: que
 * la ausencia de una integración sea un caso normal y no una excepción.
 */
export function claveDelEntorno(): string | null {
  return process.env.TMDB_API_KEY || null
}

/** Si esta instalación puede buscar. Lo pregunta la pantalla para no ofrecerlo. */
export function hayBusqueda(): boolean {
  return claveDelEntorno() !== null
}

/** Una llamada a TMDB, en español y con tope de espera. Devuelve `null` si falla. */
async function pedir(ruta: string, parametros: Record<string, string> = {}) {
  const clave = claveDelEntorno()
  if (!clave) return null

  const url = new URL(`${BASE}${ruta}`)
  url.searchParams.set("api_key", clave)
  // Español si lo tienen; TMDB cae al inglés solo cuando falta la traducción.
  url.searchParams.set("language", "es-ES")
  for (const [k, v] of Object.entries(parametros)) url.searchParams.set(k, v)

  try {
    const respuesta = await fetch(url, { signal: AbortSignal.timeout(ESPERA_MS) })
    if (!respuesta.ok) return null
    return (await respuesta.json()) as Record<string, unknown>
  } catch {
    // Un fallo de TMDB no puede tumbar la pantalla: se escribe a mano y ya.
    return null
  }
}

/** Los años salen de fechas completas que a veces vienen vacías. */
function anioDe(fecha: unknown): number | null {
  const texto = typeof fecha === "string" ? fecha.slice(0, 4) : ""
  const anio = Number(texto)
  return Number.isInteger(anio) && anio > 1800 ? anio : null
}

/**
 * Busca series y películas a la vez (RF-9.6).
 *
 * `search/multi` en vez de dos llamadas porque nadie piensa «voy a buscar una
 * serie»: piensa el nombre. Las personas que devuelve el mismo endpoint se
 * descartan aquí.
 */
export async function buscar(consulta: string): Promise<Candidato[]> {
  const texto = consulta.trim()
  if (texto.length < 2) return []

  const datos = await pedir("/search/multi", { query: texto, include_adult: "false" })
  const resultados = Array.isArray(datos?.results) ? datos.results : []

  return resultados
    .filter((r): r is Record<string, unknown> => {
      if (typeof r !== "object" || r === null) return false
      const tipo = (r as Record<string, unknown>).media_type
      return tipo === "movie" || tipo === "tv"
    })
    .slice(0, 8)
    .map((r) => {
      const esSerie = r.media_type === "tv"
      const poster = typeof r.poster_path === "string" ? r.poster_path : null
      return {
        tmdbId: Number(r.id),
        tipo: esSerie ? ("SERIE" as const) : ("PELICULA" as const),
        nombre: String((esSerie ? r.name : r.title) ?? ""),
        anio: anioDe(esSerie ? r.first_air_date : r.release_date),
        posterUrl: poster ? `${IMAGENES}${poster}` : null,
        sinopsis: typeof r.overview === "string" && r.overview ? r.overview : null,
      }
    })
    .filter((c) => c.nombre.length > 0)
}

/**
 * El detalle de uno, con su duración.
 *
 * Va aparte porque la búsqueda no trae los minutos, y pedirlos para los ocho
 * resultados serían ocho llamadas para enseñar una lista. Se piden solo al
 * elegir — que es cuando hacen falta, para el sorteo por duración (RF-9.7).
 *
 * De una serie se guarda la duración de un capítulo, no la de la temporada:
 * «tengo hora y media» se responde con capítulos, no con temporadas.
 */
export async function ficha(tmdbId: number, tipo: "SERIE" | "PELICULA"): Promise<Ficha | null> {
  const datos = await pedir(`/${tipo === "SERIE" ? "tv" : "movie"}/${tmdbId}`)
  if (!datos) return null

  const esSerie = tipo === "SERIE"
  const duraciones = datos.episode_run_time
  const minutos = esSerie
    ? Array.isArray(duraciones) && typeof duraciones[0] === "number"
      ? duraciones[0]
      : null
    : typeof datos.runtime === "number" && datos.runtime > 0
      ? datos.runtime
      : null

  const poster = typeof datos.poster_path === "string" ? datos.poster_path : null

  return {
    tipo,
    nombre: String((esSerie ? datos.name : datos.title) ?? ""),
    anio: anioDe(esSerie ? datos.first_air_date : datos.release_date),
    posterUrl: poster ? `${IMAGENES}${poster}` : null,
    sinopsis: typeof datos.overview === "string" && datos.overview ? datos.overview : null,
    minutos,
  }
}

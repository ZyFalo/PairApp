import { createHash } from "node:crypto"

/**
 * Subida de fotos y notas de voz a Cloudinary (fase 2).
 *
 * **Los archivos no pasan por nuestro servidor.** El navegador los manda
 * directo a Cloudinary con una firma que le damos nosotros. Así una foto de
 * ocho megas no se come la memoria del contenedor ni ocupa una petición
 * entera, y la app sigue siendo un solo servicio pequeño.
 *
 * Se firma en vez de usar un preset abierto: con un preset sin firmar,
 * cualquiera que mire el código del navegador puede subir lo que quiera a
 * nuestra cuenta. La firma caduca y va atada a la carpeta del vínculo.
 */

/** Segundos que vale una firma. Lo justo para elegir un archivo y soltarlo. */
export const VALIDEZ_FIRMA_SEG = 600

export type Credenciales = {
  cloudName: string
  apiKey: string
  apiSecret: string
}

/** Lo que el navegador necesita para subir sin conocer el secreto. */
export type PermisoDeSubida = {
  url: string
  apiKey: string
  timestamp: number
  folder: string
  signature: string
}

/**
 * Firma los parámetros como pide Cloudinary: se ordenan alfabéticamente, se
 * unen con `&` y se les pega el secreto detrás antes de aplicar SHA-1.
 *
 * El secreto no entra en la cadena firmada como un parámetro más: va al final
 * y sin nombre. Es una peculiaridad de su formato, y equivocarse aquí da un
 * error genérico de "firma inválida" que no dice dónde está el fallo.
 */
export function firmar(parametros: Record<string, string | number>, apiSecret: string): string {
  const cadena = Object.keys(parametros)
    .sort()
    .map((clave) => `${clave}=${parametros[clave]}`)
    .join("&")

  return createHash("sha1").update(`${cadena}${apiSecret}`).digest("hex")
}

/**
 * Carpeta de un vínculo. Cada pareja tiene la suya, de modo que el aislamiento
 * de RNF-4 llega también a los archivos y no solo a la base de datos.
 */
export function carpetaDeVinculo(vinculoId: string): string {
  return `pairapp/${vinculoId}`
}

/** Permiso de subida para un vínculo, listo para mandárselo al navegador. */
export function permisoDeSubida(
  credenciales: Credenciales,
  vinculoId: string,
  ahora: Date,
): PermisoDeSubida {
  const timestamp = Math.floor(ahora.getTime() / 1000)
  const folder = carpetaDeVinculo(vinculoId)

  return {
    // `auto` deja que Cloudinary distinga imagen de audio por el archivo
    url: `https://api.cloudinary.com/v1_1/${credenciales.cloudName}/auto/upload`,
    apiKey: credenciales.apiKey,
    timestamp,
    folder,
    signature: firmar({ folder, timestamp }, credenciales.apiSecret),
  }
}

/**
 * Lee las credenciales del entorno. Devuelve `null` si falta alguna, para que
 * la app funcione entera sin Cloudinary: sin credenciales no se pueden
 * adjuntar archivos, y ya está — no se cae ninguna pantalla.
 */
export function credencialesDelEntorno(): Credenciales | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) return null
  return { cloudName, apiKey, apiSecret }
}

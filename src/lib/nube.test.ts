import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { carpetaDeVinculo, firmar, permisoDeSubida } from "./nube"

const CREDENCIALES = { cloudName: "pareja", apiKey: "123456789", apiSecret: "secreto-de-prueba" }
const AHORA = new Date("2026-08-02T15:00:00Z")

describe("firma de subida a Cloudinary", () => {
  /**
   * El formato exacto lo dicta Cloudinary: parámetros ordenados, unidos con
   * `&`, y el secreto pegado al final **sin nombre**. Equivocarse aquí solo
   * da un "firma inválida" que no dice dónde está el fallo, así que la prueba
   * reproduce el cálculo a mano.
   */
  it("ordena los parámetros y pega el secreto al final", () => {
    const esperada = createHash("sha1")
      .update("folder=carpeta&timestamp=1000secreto-de-prueba")
      .digest("hex")

    expect(firmar({ timestamp: 1000, folder: "carpeta" }, "secreto-de-prueba")).toBe(esperada)
  })

  it("el orden en que se pasan los parámetros no cambia la firma", () => {
    const a = firmar({ timestamp: 1000, folder: "carpeta" }, "s")
    const b = firmar({ folder: "carpeta", timestamp: 1000 }, "s")
    expect(a).toBe(b)
  })

  it("cambiar un parámetro cambia la firma", () => {
    expect(firmar({ timestamp: 1000 }, "s")).not.toBe(firmar({ timestamp: 1001 }, "s"))
  })

  it("el secreto nunca aparece en la firma", () => {
    expect(firmar({ timestamp: 1000 }, "secreto-de-prueba")).not.toContain("secreto")
  })
})

describe("permiso de subida", () => {
  /** El aislamiento de RNF-4 llega también a los archivos, no solo a la base. */
  it("cada vínculo sube a su propia carpeta", () => {
    expect(carpetaDeVinculo("abc")).toBe("pairapp/abc")
    expect(permisoDeSubida(CREDENCIALES, "abc", AHORA).folder).toBe("pairapp/abc")
    expect(permisoDeSubida(CREDENCIALES, "xyz", AHORA).folder).toBe("pairapp/xyz")
  })

  it("dos vínculos distintos no comparten firma", () => {
    const uno = permisoDeSubida(CREDENCIALES, "abc", AHORA)
    const otro = permisoDeSubida(CREDENCIALES, "xyz", AHORA)
    expect(uno.signature).not.toBe(otro.signature)
  })

  it("apunta al endpoint automático, que distingue imagen de audio", () => {
    expect(permisoDeSubida(CREDENCIALES, "abc", AHORA).url).toBe(
      "https://api.cloudinary.com/v1_1/pareja/auto/upload",
    )
  })

  it("el permiso nunca lleva el secreto dentro", () => {
    const permiso = permisoDeSubida(CREDENCIALES, "abc", AHORA)
    expect(JSON.stringify(permiso)).not.toContain(CREDENCIALES.apiSecret)
  })

  it("marca la hora en segundos, como espera Cloudinary", () => {
    expect(permisoDeSubida(CREDENCIALES, "abc", AHORA).timestamp).toBe(1785682800)
  })
})

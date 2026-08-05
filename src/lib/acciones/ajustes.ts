"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { ClaveModulo } from "@/lib/motor/modulos"
import { dbDeSesion } from "@/lib/sesion"

/**
 * Todo lo que enciende y apaga cosas, en un sitio.
 *
 * Estaba repartido: los tres interruptores personales vivían en
 * `acciones/nosotros.ts`, que ya hacía cinco cosas —11:11, calendario, música,
 * ciclo y ajustes— y crecía por acumulación. Aquí están juntos porque son la
 * misma pregunta hecha a distinta gente.
 *
 * **Dos clases, y no se mezclan:**
 *
 * - Los **míos** (`Usuario`): el ciclo, compartir el ánimo, mis ventanas del
 *   11:11. Los cambio yo y la otra persona no puede verlos ni tocarlos
 *   (RF-5.0, RF-1.5, RF-12.8).
 * - Los **de los dos** (`Vinculo`): qué módulos usa la pareja. Cualquiera los
 *   cambia y los dos lo ven — por eso queda escrito quién fue.
 *
 * Todos usan `update` y no `updateMany` a propósito: ni `Usuario` ni `Vinculo`
 * llevan `vinculoId`, así que el cliente acotado reventaría al inyectarlo (ver
 * `lib/db.ts`). El identificador sale de la sesión, de modo que la pertenencia
 * ya está comprobada por quien haya iniciado sesión.
 */

export type Resultado = { error?: string; ok?: boolean }

// ---------------------------------------------------------------------------
// Míos
// ---------------------------------------------------------------------------

/**
 * Enciende o apaga el registro de ciclo para quien lo pide (RF-5.0).
 *
 * Nunca se deduce del género gramatical: ese campo dice cómo conjugar las
 * etiquetas, no qué le pasa a nadie en el cuerpo. Apagarlo no borra lo ya
 * registrado —volver a encenderlo lo devuelve intacto—, pero mientras esté
 * apagado la pareja no ve nada.
 *
 * Usa `update` y no `updateMany` a propósito: `Usuario` no tiene `vinculoId`,
 * así que el cliente acotado reventaría al inyectarlo (ver `lib/db.ts`). Aquí
 * el identificador sale de la sesión, de modo que la pertenencia ya está
 * comprobada por quien haya iniciado sesión.
 */
export async function cambiarRegistroCiclo(activo: boolean): Promise<Resultado> {
  const { db, sesion } = await dbDeSesion()
  await db.usuario.update({
    where: { id: sesion.usuarioId },
    data: { llevaCiclo: activo },
  })

  revalidatePath("/yo")
  revalidatePath("/nosotros")
  return { ok: true }
}

/**
 * Enciende o apaga que mi ánimo se vea en el calendario del mes (RF-1.5).
 *
 * Es una decisión distinta de la visibilidad de cada check-in, y por eso hay
 * dos mecanismos y no uno: aquella dice *qué se ve hoy*, esta dice *si existe
 * un historial que mirar*. Compartir cómo estás esta tarde no es lo mismo que
 * abrir tus últimos seis meses, y dar lo segundo por dicho al decir lo primero
 * sería inferir — justo lo que §1.2 prohíbe.
 *
 * Los dos controles se multiplican, nunca se anulan: con esto encendido, un día
 * marcado privado sigue sin aparecer.
 *
 * `update` y no `updateMany` por lo mismo que en `cambiarRegistroCiclo`:
 * `Usuario` no lleva `vinculoId` y el cliente acotado reventaría al inyectarlo.
 * El identificador sale de la sesión, así que la pertenencia ya está probada.
 */
export async function cambiarCompartirAnimo(activo: boolean): Promise<Resultado> {
  const { db, sesion } = await dbDeSesion()
  await db.usuario.update({
    where: { id: sesion.usuarioId },
    data: { compartoAnimo: activo },
  })

  revalidatePath("/yo")
  revalidatePath("/nosotros")
  return { ok: true }
}

/**
 * En qué ventanas de los 11:11 participo (RF-12.1), incluida la de salirse
 * del todo (RF-12.8).
 *
 * Un solo ajuste para las dos cosas, porque son la misma pregunta. No se avisa
 * a nadie ni queda rastro: el documento pide expresamente que la otra persona
 * no pueda enterarse, y no hace falta esconder nada — dejar de pedir ya era
 * indistinguible de haberse olvidado (RF-12.5).
 */
export async function cambiarVentanasOnce(_previo: Resultado, datos: FormData): Promise<Resultado> {
  const analizado = z
    .object({ ventanasOnce: z.enum(["AMBAS", "MANANA", "NOCHE", "NINGUNA"]) })
    .safeParse(Object.fromEntries(datos))
  if (!analizado.success) return { error: "No se pudo cambiar" }

  const { db, sesion } = await dbDeSesion()
  await db.usuario.update({
    where: { id: sesion.usuarioId },
    data: { ventanasOnce: analizado.data.ventanasOnce },
  })

  revalidatePath("/yo")
  revalidatePath("/nosotros")
  revalidatePath("/hoy")
  return { ok: true }
}

/**
 * Cuándo quiero enterarme de cómo está la otra persona (RF-1.4, RF-3.0.4).
 *
 * Es preferencia de quien **recibe**, y no puede abrir nada que quien registra
 * haya cerrado: lo privado no llega ni con «siempre» (RF-1.3).
 */
export async function cambiarFrecuenciaAnimo(
  _previo: Resultado,
  datos: FormData,
): Promise<Resultado> {
  const analizado = z
    .object({ frecuenciaAnimo: z.enum(["SIEMPRE", "SOLO_INTENSO", "NUNCA"]) })
    .safeParse(Object.fromEntries(datos))
  if (!analizado.success) return { error: "No se pudo cambiar" }

  const { db, sesion } = await dbDeSesion()
  await db.usuario.update({
    where: { id: sesion.usuarioId },
    data: { frecuenciaAnimo: analizado.data.frecuenciaAnimo },
  })

  revalidatePath("/yo")
  return { ok: true }
}

// ---------------------------------------------------------------------------
// De los dos
// ---------------------------------------------------------------------------

/** Qué columna del vínculo guarda cada módulo. */
const COLUMNA: Record<ClaveModulo, "usaOnce" | "usaMusica" | "usaTitulos" | "usaRecuerdos"> = {
  once: "usaOnce",
  musica: "usaMusica",
  titulos: "usaTitulos",
  recuerdos: "usaRecuerdos",
}

/**
 * Enciende o apaga un módulo para los dos.
 *
 * **Apagar no borra nada.** Las canciones dedicadas, los títulos y los
 * recuerdos siguen guardados y vuelven intactos al encenderlo, igual que el
 * ciclo (RF-5.0). Lo que desaparece es la vista, no lo escrito.
 *
 * Queda anotado quién lo hizo y cuándo. No se avisa a nadie —esta app no manda
 * notificaciones por un ajuste— pero una pestaña que desaparece sin explicación
 * es la clase de cambio silencioso que se evita en todo lo demás (RF-6.4.2), y
 * la propia pantalla de ajustes lo dice.
 */
export async function cambiarModulo(clave: ClaveModulo, activo: boolean): Promise<Resultado> {
  const { db, sesion } = await dbDeSesion()

  await db.vinculo.update({
    where: { id: sesion.vinculoId },
    data: {
      [COLUMNA[clave]]: activo,
      modulosPorId: sesion.usuarioId,
      modulosEn: new Date(),
    },
  })

  revalidatePath("/nosotros")
  revalidatePath("/hoy")
  revalidatePath("/yo")
  return { ok: true }
}

/**
 * Cierra la configuración inicial y deja entrar a la app.
 *
 * **Marca dos cosas, porque son dos.** A la persona siempre: cada quien elige
 * lo suyo —el ciclo, su ánimo, sus ventanas— y eso no lo puede hacer nadie por
 * ella. Al vínculo solo la primera vez: los módulos se eligen una vez para los
 * dos, y quien llega segundo se los encuentra hechos.
 *
 * Marcar solo el vínculo era lo que había, y dejaba a la segunda persona sin
 * ver nunca la pantalla: con los valores por defecto puestos y sin habérselos
 * enseñado.
 */
export async function terminarConfiguracion(): Promise<Resultado> {
  const { db, sesion } = await dbDeSesion()

  await db.usuario.update({
    where: { id: sesion.usuarioId },
    data: { empezoEn: new Date() },
  })

  if (!sesion.configuradoEn) {
    await db.vinculo.update({
      where: { id: sesion.vinculoId },
      data: { configuradoEn: new Date() },
    })
  }

  revalidatePath("/", "layout")
  return { ok: true }
}

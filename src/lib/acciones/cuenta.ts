"use server"

import { hash } from "@node-rs/argon2"
import { redirect } from "next/navigation"
import { z } from "zod"
import { auth, signIn, signOut } from "@/auth"
import { prismaCrudo } from "@/lib/db"

const esquemaRegistro = z.object({
  nombre: z.string().trim().min(1, "Falta tu nombre").max(60),
  correo: z.string().trim().toLowerCase().email("Ese correo no parece válido"),
  contrasena: z.string().min(8, "Al menos 8 caracteres"),
  genero: z.enum(["MASCULINO", "FEMENINO", "NEUTRO"]),
  zonaHoraria: z.string().default("America/Bogota"),
  /** Si viene, la persona se une a un vínculo existente en vez de crear uno. */
  invitacion: z.string().trim().optional(),
})

export type ResultadoAccion = { error?: string }

/** Genera un código de invitación corto y legible, sin caracteres ambiguos. */
function generarCodigo(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let codigo = ""
  for (let i = 0; i < 8; i++) {
    codigo += alfabeto[Math.floor(Math.random() * alfabeto.length)]
  }
  return codigo
}

/**
 * Crea la cuenta y, o bien abre un vínculo nuevo, o bien canjea una invitación
 * para unirse al de la pareja (RF-0.2). No hay alta pública: sin invitación,
 * la persona queda sola en su propio vínculo esperando a la otra.
 */
export async function registrar(
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  const analizado = esquemaRegistro.safeParse(Object.fromEntries(datos))
  if (!analizado.success) {
    return { error: analizado.error.issues[0]?.message ?? "Revisa los datos" }
  }
  const { nombre, correo, contrasena, genero, zonaHoraria, invitacion } = analizado.data

  const yaExiste = await prismaCrudo.usuario.findUnique({ where: { correo } })
  if (yaExiste) return { error: "Ya hay una cuenta con ese correo" }

  const contrasenaHash = await hash(contrasena)

  if (invitacion) {
    const codigo = invitacion.toUpperCase()
    const inv = await prismaCrudo.invitacion.findUnique({ where: { codigo } })
    if (!inv) return { error: "Ese código no existe" }
    if (inv.usadoEn) return { error: "Ese código ya se usó" }
    if (inv.expiraEn < new Date()) return { error: "Ese código ya caducó" }

    const cuantos = await prismaCrudo.membresia.count({ where: { vinculoId: inv.vinculoId } })
    if (cuantos >= 2) return { error: "Ese vínculo ya tiene dos personas" }

    // La pareja escribe a horas desfasadas una hora exacta (RF-1.0.3).
    const otra = await prismaCrudo.membresia.findFirst({
      where: { vinculoId: inv.vinculoId },
      include: { usuario: true },
    })
    const horas = (otra?.usuario.horasPregunta ?? [9, 14, 19]).map((h) => (h + 1) % 24)

    await prismaCrudo.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: { nombre, correo, contrasenaHash, genero, zonaHoraria, horasPregunta: horas },
      })
      await tx.membresia.create({ data: { usuarioId: usuario.id, vinculoId: inv.vinculoId } })
      await tx.invitacion.update({ where: { id: inv.id }, data: { usadoEn: new Date() } })
    })
  } else {
    await prismaCrudo.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: { nombre, correo, contrasenaHash, genero, zonaHoraria },
      })
      const vinculo = await tx.vinculo.create({ data: {} })
      await tx.membresia.create({ data: { usuarioId: usuario.id, vinculoId: vinculo.id } })
    })
  }

  await signIn("credentials", { correo, contrasena, redirectTo: "/hoy" })
  return {}
}

/** Inicia sesión con correo y contraseña. */
export async function entrar(_previo: ResultadoAccion, datos: FormData): Promise<ResultadoAccion> {
  const correo = String(datos.get("correo") ?? "")
    .trim()
    .toLowerCase()
  const contrasena = String(datos.get("contrasena") ?? "")
  if (!correo || !contrasena) return { error: "Faltan datos" }

  try {
    await signIn("credentials", { correo, contrasena, redirectTo: "/hoy" })
  } catch (error) {
    // signIn lanza una redirección en el camino feliz; hay que dejarla pasar.
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error
    return { error: "Correo o contraseña incorrectos" }
  }
  return {}
}

/** Cierra la sesión y vuelve a la pantalla de entrada. */
export async function salir() {
  await signOut({ redirectTo: "/entrar" })
}

/**
 * Crea el código con el que la otra persona entra al vínculo (RF-0.2).
 * Caduca a las 72 horas y solo sirve una vez.
 */
export async function crearInvitacion(): Promise<{ codigo: string } | { error: string }> {
  const sesion = await auth()
  if (!sesion?.user?.id || !sesion.user.vinculoId) return { error: "No hay sesión" }

  const cuantos = await prismaCrudo.membresia.count({ where: { vinculoId: sesion.user.vinculoId } })
  if (cuantos >= 2) return { error: "Este vínculo ya tiene dos personas" }

  const codigo = generarCodigo()
  await prismaCrudo.invitacion.create({
    data: {
      codigo,
      vinculoId: sesion.user.vinculoId,
      creadorId: sesion.user.id,
      expiraEn: new Date(Date.now() + 72 * 3_600_000),
    },
  })
  return { codigo }
}

/** Manda a la pantalla principal si ya hay sesión con vínculo. */
export async function siYaEntroIrAHoy() {
  const sesion = await auth()
  if (sesion?.user?.vinculoId) redirect("/hoy")
}

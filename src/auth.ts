import { verify } from "@node-rs/argon2"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prismaCrudo } from "@/lib/db"

/**
 * Autenticación por contraseña (PLAN.md §0.1.2). Sin correo transaccional:
 * son dos personas que se registran una vez y quedan con la sesión abierta.
 *
 * Es el único sitio, junto a `src/lib/db.ts`, donde se usa el cliente de Prisma
 * sin acotar: aquí todavía no se sabe a qué vínculo pertenece nadie (D41).
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
    // 90 días, renovados en cada uso: en la práctica no se vuelve a pedir.
    maxAge: 60 * 60 * 24 * 90,
  },
  pages: {
    signIn: "/entrar",
  },
  providers: [
    Credentials({
      credentials: {
        correo: { label: "Correo", type: "email" },
        contrasena: { label: "Contraseña", type: "password" },
      },
      /** Comprueba las credenciales contra el hash Argon2id guardado. */
      async authorize(datos) {
        const correo = String(datos?.correo ?? "")
          .trim()
          .toLowerCase()
        const contrasena = String(datos?.contrasena ?? "")
        if (!correo || !contrasena) return null

        const usuario = await prismaCrudo.usuario.findUnique({
          where: { correo },
          include: { membresia: true },
        })
        if (!usuario) return null

        const correcta = await verify(usuario.contrasenaHash, contrasena)
        if (!correcta) return null

        return {
          id: usuario.id,
          name: usuario.nombre,
          email: usuario.correo,
          vinculoId: usuario.membresia?.vinculoId ?? null,
        }
      },
    }),
  ],
  callbacks: {
    /** Guarda el vínculo en el token para no consultarlo en cada petición. */
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string
        token.vinculoId = (user as { vinculoId: string | null }).vinculoId
      }
      // Al unirse a un vínculo el token se queda viejo: se refresca a demanda.
      if (trigger === "update" && token.id) {
        const membresia = await prismaCrudo.membresia.findUnique({
          where: { usuarioId: token.id as string },
        })
        token.vinculoId = membresia?.vinculoId ?? null
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.vinculoId = (token.vinculoId as string | null) ?? null
      return session
    },
  },
})

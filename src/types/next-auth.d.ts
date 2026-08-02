import type { DefaultSession } from "next-auth"

/** Añade a la sesión el vínculo de la persona, que la app necesita en todas partes. */
declare module "next-auth" {
  interface Session {
    user: { id: string; vinculoId: string | null } & DefaultSession["user"]
  }
  interface User {
    vinculoId?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    vinculoId?: string | null
  }
}

import { redirect } from "next/navigation"
import { auth } from "@/auth"

/** La raíz solo decide a dónde mandar: no tiene contenido propio. */
export default async function Inicio() {
  const sesion = await auth()
  if (sesion?.user?.vinculoId) redirect("/hoy")
  if (sesion?.user?.id) redirect("/vincular")
  redirect("/entrar")
}

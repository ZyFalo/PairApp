import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { loQueEsperaEnFrio, loQueHayParaMi } from "@/lib/consultas/bucle"

export const dynamic = "force-dynamic"

/**
 * La raíz solo decide a dónde mandar: no tiene contenido propio.
 *
 * De partida, al calendario. **Salvo que haya algo esperando**, y entonces a
 * Hoy: un mensaje que acaba de llegar, o algo escrito en caliente que lleva
 * doce horas pidiendo decisión, no puede quedarse detrás de una rejilla de días.
 *
 * Sin esta comprobación, mover la pantalla de entrada habría degradado en
 * silencio el flujo más protegido de la app —que alguien escriba, llegue y se
 * lea—. Es la única razón por la que la raíz consulta antes de redirigir.
 */
export default async function Inicio() {
  const sesion = await auth()
  if (!sesion?.user?.vinculoId) redirect(sesion?.user?.id ? "/vincular" : "/entrar")

  const [pendiente, enFrio] = await Promise.all([loQueHayParaMi(), loQueEsperaEnFrio()])
  redirect(pendiente || enFrio.length > 0 ? "/hoy" : "/nosotros")
}

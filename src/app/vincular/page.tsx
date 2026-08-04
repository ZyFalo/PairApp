import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { Apunte, Titulo } from "@/componentes/base"
import { prismaCrudo } from "@/lib/db"
import { PanelInvitacion } from "./panel"

/**
 * Espera a que la pareja entre. Se ve solo mientras el vínculo tiene una
 * sola persona: en cuanto la otra canjea el código, la app arranca.
 */
export default async function PaginaVincular() {
  const sesion = await auth()
  if (!sesion?.user?.id) redirect("/entrar")
  if (!sesion.user.vinculoId) redirect("/entrar")

  const cuantos = await prismaCrudo.membresia.count({
    where: { vinculoId: sesion.user.vinculoId },
  })
  if (cuantos >= 2) redirect("/")

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-6 py-12">
      <div className="aparece space-y-3">
        <Titulo>Falta ella</Titulo>
        <Apunte>
          PairApp es para dos personas. Comparte este código para que entre; caduca en tres días y
          solo sirve una vez.
        </Apunte>
      </div>

      <PanelInvitacion />
    </main>
  )
}

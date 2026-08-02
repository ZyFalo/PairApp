import { Pestanas } from "@/componentes/pestanas"
import { exigirSesion } from "@/lib/sesion"

/** Envoltorio de la app con sesión: cuatro pestañas y nada más (§8.1). */
export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  await exigirSesion()

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <main className="flex-1 px-5 pb-28 pt-8">{children}</main>
      <Pestanas />
    </div>
  )
}

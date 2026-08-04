import { redirect } from "next/navigation"
import { Pestanas } from "@/componentes/pestanas"
import { exigirSesion } from "@/lib/sesion"

/**
 * Envoltorio de la app con sesión: cuatro pestañas y nada más (§8.1).
 *
 * Aquí está la puerta de la configuración inicial, y no en la raíz, porque la
 * raíz solo se pisa al abrir: quien escriba `/cofre` a mano tiene que pasar por
 * el mismo sitio. Una puerta que se rodea escribiendo una URL no es una puerta.
 *
 * **Solo se exige cuando ya hay dos.** Mientras se está sola, la app se usa sin
 * configurar nada: elegir «lo nuestro» antes de que exista la otra persona es
 * elegir por ella.
 *
 * Se miran **las dos mitades**: que los módulos estén elegidos —una vez para
 * los dos— y que esta persona haya pasado por su parte. Mirar solo la primera
 * dejaba a quien llegaba segundo sin elegir nada suyo.
 */
export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const sesion = await exigirSesion()
  if (sesion.pareja && (!sesion.configuradoEn || !sesion.empezoEn)) redirect("/empezar")

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <main className="flex-1 px-5 pb-28 pt-8">{children}</main>
      <Pestanas />
    </div>
  )
}

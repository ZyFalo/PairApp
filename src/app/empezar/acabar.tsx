"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Boton } from "@/componentes/base"
import { terminarConfiguracion } from "@/lib/acciones/ajustes"

/**
 * Cierra la configuración y entra.
 *
 * Es un componente de cliente y no un `<form action>` porque después de
 * guardar hay que **navegar**, y quien decide adónde es la raíz —que mira si
 * hay algo esperando antes de elegir entre el calendario y Hoy—. Un `redirect`
 * dentro de la acción se saltaría esa decisión.
 */
export function Acabar() {
  const router = useRouter()
  const [ocupado, empezar] = useTransition()

  return (
    <Boton
      className="w-full"
      disabled={ocupado}
      onClick={() =>
        empezar(async () => {
          await terminarConfiguracion()
          router.replace("/")
        })
      }
    >
      {ocupado ? "Entrando…" : "Entrar"}
    </Boton>
  )
}

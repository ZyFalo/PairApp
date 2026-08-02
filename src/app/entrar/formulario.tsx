"use client"

import { useActionState } from "react"
import { Aviso, Boton, Campo, Tarjeta } from "@/componentes/base"
import { entrar } from "@/lib/acciones/cuenta"

/** Formulario de acceso con correo y contraseña. */
export function FormularioEntrar() {
  const [estado, accion, pendiente] = useActionState(entrar, {})

  return (
    <Tarjeta alzada className="aparece">
      <form action={accion} className="space-y-4">
        <Campo etiqueta="Correo" name="correo" type="email" autoComplete="email" required />
        <Campo
          etiqueta="Contraseña"
          name="contrasena"
          type="password"
          autoComplete="current-password"
          required
        />
        <Aviso>{estado.error}</Aviso>
        <Boton type="submit" disabled={pendiente} className="w-full">
          {pendiente ? "Entrando…" : "Entrar"}
        </Boton>
      </form>
    </Tarjeta>
  )
}

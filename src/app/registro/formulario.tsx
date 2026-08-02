"use client"

import { useActionState } from "react"
import { Aviso, Boton, Campo } from "@/componentes/base"
import { registrar } from "@/lib/acciones/cuenta"

/** Alta de cuenta. El género gramatical concuerda las etiquetas de emoción (RF-1.1.9). */
export function FormularioRegistro({ codigoInicial }: { codigoInicial: string }) {
  const [estado, accion, pendiente] = useActionState(registrar, {})
  const zona = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Bogota"

  return (
    <form action={accion} className="aparece space-y-4">
      <input type="hidden" name="zonaHoraria" value={zona} />

      <Campo etiqueta="Tu nombre" name="nombre" autoComplete="name" required maxLength={60} />
      <Campo etiqueta="Correo" name="correo" type="email" autoComplete="email" required />
      <Campo
        etiqueta="Contraseña"
        name="contrasena"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
      />

      <label className="block">
        <span className="mb-1.5 block text-[13px] text-[--color-tinta-suave]">
          ¿Cómo te nombramos?
        </span>
        <select
          name="genero"
          defaultValue="NEUTRO"
          className="w-full rounded-[--radius-suave] border border-[--color-borde] bg-[--color-papel] px-4 py-3 text-[16px] text-[--color-tinta] outline-none"
        >
          <option value="FEMENINO">En femenino — agradecida, sola</option>
          <option value="MASCULINO">En masculino — agradecido, solo</option>
          <option value="NEUTRO">Sin marca de género</option>
        </select>
      </label>

      <Campo
        etiqueta="Código de invitación (si tienes uno)"
        name="invitacion"
        defaultValue={codigoInicial}
        maxLength={8}
        placeholder="Opcional"
        style={{ textTransform: "uppercase" }}
      />

      <Aviso>{estado.error}</Aviso>
      <Boton type="submit" disabled={pendiente} className="w-full">
        {pendiente ? "Creando…" : "Crear cuenta"}
      </Boton>
    </form>
  )
}

import Link from "next/link"
import { siYaEntroIrAlInicio } from "@/lib/acciones/cuenta"
import { FormularioEntrar } from "./formulario"

/** Pantalla de acceso. */
export default async function PaginaEntrar() {
  await siYaEntroIrAlInicio()

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-9 px-6 py-12">
      <div className="escalonado space-y-3">
        <div className="flex items-baseline gap-2.5">
          <span className="size-2.5 rounded-full bg-[var(--color-acento)] shadow-[var(--sombra-tinta)]" />
          <h1 className="carta text-[34px] leading-none">PairApp</h1>
        </div>
        <p className="max-w-[24ch] text-[15.5px] leading-relaxed text-[var(--color-tinta-suave)]">
          Para decir lo que normalmente se calla.
        </p>
      </div>

      <FormularioEntrar />

      <p className="text-center text-[14px] text-[var(--color-tinta-suave)]">
        ¿Primera vez?{" "}
        <Link
          href="/registro"
          className="font-medium text-[var(--color-acento)] underline decoration-[var(--color-acento-suave)] underline-offset-4"
        >
          Crear cuenta
        </Link>
      </p>
    </main>
  )
}

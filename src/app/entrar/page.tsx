import Link from "next/link"
import { siYaEntroIrAHoy } from "@/lib/acciones/cuenta"
import { FormularioEntrar } from "./formulario"

/** Pantalla de acceso. */
export default async function PaginaEntrar() {
  await siYaEntroIrAHoy()

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-6 py-12">
      <div className="aparece space-y-2">
        <h1 className="font-[family-name:--font-carta] text-[30px]">PairApp</h1>
        <p className="text-[15px] text-[--color-tinta-suave]">
          Para decir lo que normalmente se calla.
        </p>
      </div>

      <FormularioEntrar />

      <p className="text-center text-[14px] text-[--color-tinta-suave]">
        ¿Primera vez?{" "}
        <Link href="/registro" className="text-[--color-acento] underline underline-offset-4">
          Crear cuenta
        </Link>
      </p>
    </main>
  )
}

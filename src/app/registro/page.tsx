import Link from "next/link"
import { siYaEntroIrAHoy } from "@/lib/acciones/cuenta"
import { FormularioRegistro } from "./formulario"

/** Alta de cuenta. Con código de invitación se entra al vínculo de la pareja. */
export default async function PaginaRegistro({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>
}) {
  await siYaEntroIrAHoy()
  const { codigo } = await searchParams

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-6 py-12">
      <div className="aparece space-y-2">
        <h1 className="font-[family-name:--font-carta] text-[28px]">Crear cuenta</h1>
        <p className="text-[15px] text-[--color-tinta-suave]">
          {codigo
            ? "Te estás uniendo al espacio de tu pareja."
            : "Después podrás invitar a tu pareja."}
        </p>
      </div>

      <FormularioRegistro codigoInicial={codigo ?? ""} />

      <p className="text-center text-[14px] text-[--color-tinta-suave]">
        ¿Ya tienes cuenta?{" "}
        <Link href="/entrar" className="text-[--color-acento] underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </main>
  )
}

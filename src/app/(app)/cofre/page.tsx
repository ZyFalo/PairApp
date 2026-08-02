import Link from "next/link"
import { Apunte, Tarjeta, TextoDeCarta, Titulo, Vacio } from "@/componentes/base"
import { BotonGuardar } from "@/componentes/boton-guardar"
import { etiquetaDe, ficha } from "@/lib/motor/emociones"
import { formatoLegible } from "@/lib/motor/tiempo"
import { dbDeSesion } from "@/lib/sesion"

export const dynamic = "force-dynamic"

/**
 * El cofre (§3.2.2): todo lo recibido, con los guardados aparte.
 * Es la colección de mensajes lindos: los que se releen cuando hacen falta.
 */
export default async function PaginaCofre({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>
}) {
  const { vista } = await searchParams
  const soloGuardados = vista === "guardados"
  const { db, sesion } = await dbDeSesion()

  const guardados = await db.guardado.findMany({
    where: { usuarioId: sesion.usuarioId },
    select: { mensajeId: true },
  })
  const idsGuardados = new Set(guardados.map((g) => g.mensajeId))

  const entregas = await db.entrega.findMany({
    where: {
      destinatarioId: sesion.usuarioId,
      ...(soloGuardados ? { mensajeId: { in: [...idsGuardados] } } : {}),
    },
    orderBy: { entregadaEn: "desc" },
    take: 100,
    include: { mensaje: true, respuesta: true },
  })

  return (
    <div className="space-y-6">
      <Titulo>Cofre</Titulo>

      <div className="flex gap-2">
        <Pestana href="/cofre" activa={!soloGuardados} texto="Todos" />
        <Pestana href="/cofre?vista=guardados" activa={soloGuardados} texto="Guardados" />
      </div>

      {entregas.length === 0 ? (
        <Vacio>
          {soloGuardados
            ? "Todavía no has guardado nada."
            : "Aquí aparecerá lo que te vaya escribiendo."}
        </Vacio>
      ) : (
        <ul className="space-y-3">
          {entregas.map((e) => (
            <li key={e.id}>
              <Tarjeta className="aparece space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[--color-tinta-suave]">
                    {ficha(e.mensaje.emocion).icono}{" "}
                    {etiquetaDe(e.mensaje.emocion, "NEUTRO").toLowerCase()}
                  </span>
                  <span className="text-[12px] text-[--color-tinta-tenue]">
                    {formatoLegible(e.entregadaEn, sesion.zonaHoraria)}
                  </span>
                </div>

                <TextoDeCarta>{e.mensaje.texto}</TextoDeCarta>

                {e.respuesta?.texto && (
                  <div className="border-l-2 border-[--color-borde] pl-3">
                    <Apunte>Le respondiste:</Apunte>
                    <p className="text-[15px] text-[--color-tinta-suave]">{e.respuesta.texto}</p>
                  </div>
                )}

                <BotonGuardar mensajeId={e.mensaje.id} guardado={idsGuardados.has(e.mensaje.id)} />
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Selector entre "todos" y "guardados". */
function Pestana({ href, activa, texto }: { href: string; activa: boolean; texto: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-[13px] ${
        activa
          ? "bg-[--color-acento] text-[#fffdfa]"
          : "border border-[--color-borde] bg-[--color-papel] text-[--color-tinta-suave]"
      }`}
    >
      {texto}
    </Link>
  )
}

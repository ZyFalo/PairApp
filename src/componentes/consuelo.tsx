import { RiBookmarkFill, RiImage2Line } from "@remixicon/react"
import { Apunte, Tarjeta, TextoDeCarta } from "@/componentes/base"
import { BotonDeReserva } from "@/componentes/consuelo-abrir"
import type { Consuelo } from "@/lib/motor/consuelo"

/**
 * Lo que la app ofrece en un mal día cuando no hay nada nuevo (RF-3.6).
 *
 * **Se ofrece, no se empuja.** Todo lo que aparece aquí ya estaba en la app; lo
 * único que hace esta tarjeta es acercarlo el día que puede servir. No llega
 * por notificación, no interrumpe, y se puede ignorar sin que pase nada.
 *
 * Sin ceremonia, que es lo que pide RF-3.11.2: «Esto lo guardaste en marzo.» y
 * el mensaje. Ni un «pensamos que te vendría bien», ni una frase de aliento
 * escrita por la app. Lo que hay es de ellos dos.
 *
 * **Sin `"use client"` a propósito.** Recibe `cuando` —una función— desde la
 * página, y una función no cruza a un componente de cliente. Lo único que
 * necesita cliente es el botón, y por eso vive aparte.
 */
export function AlgoParaHoy({
  consuelo,
  nombrePareja,
  cuando,
}: {
  consuelo: Consuelo
  nombrePareja: string | null
  /** Cómo se dice una fecha. La zona la sabe la página, no esto. */
  cuando: (fecha: Date) => string
}) {
  if (consuelo.tipo === "guardado_suyo") {
    return (
      <Tarjeta className="aparece space-y-2.5">
        <Apunte>
          <span className="inline-flex items-center gap-1.5">
            <RiBookmarkFill size={14} className="text-[var(--color-acento)]" />
            Esto lo guardaste {cuando(consuelo.cuando)}.
          </span>
        </Apunte>
        <TextoDeCarta>{consuelo.texto}</TextoDeCarta>
      </Tarjeta>
    )
  }

  if (consuelo.tipo === "recuerdo") {
    return (
      <Tarjeta className="aparece space-y-1.5">
        <Apunte>
          <span className="inline-flex items-center gap-1.5">
            <RiImage2Line size={14} className="text-[var(--color-acento)]" />
            {cuando(consuelo.ocurrioEl)}
          </span>
        </Apunte>
        <p className="carta text-[17px]">{consuelo.titulo}</p>
      </Tarjeta>
    )
  }

  return <BotonDeReserva mensajeId={consuelo.mensajeId} nombrePareja={nombrePareja} />
}

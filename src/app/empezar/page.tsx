import { RiArrowRightLine, RiLockLine } from "@remixicon/react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { InterruptorCiclo, InterruptorCompartirAnimo, VentanasDelOnce } from "@/componentes/ajustes"
import { Apunte, BotonEnlace, Tarjeta, Titulo } from "@/componentes/base"
import { EleccionDeModulos } from "@/componentes/modulos"
import { exigirSesion } from "@/lib/sesion"
import { Acabar } from "./acabar"

export const dynamic = "force-dynamic"

/**
 * La única vez que la app pregunta algo (RF-0.7).
 *
 * **La dispara el enlace al completarse, no el primer arranque.** Configurar
 * «lo nuestro» antes de que exista la otra persona es elegir por ella, así que
 * mientras se está sola la app se usa sin pasar por aquí — escribir «solo para
 * mí» ya funciona en solitario.
 *
 * Dos pasos y ni uno más. Preguntar seis cosas antes de dejar entrar contradice
 * un principio que la app ya sigue —la maquinaria es invisible hasta que hace
 * falta (RF-1.1.5)— y además se responde con la peor información posible: la de
 * quien todavía no ha usado nada. Por eso todo lo de aquí se puede cambiar
 * luego, en la misma pantalla y con los mismos componentes.
 *
 * Vive fuera del grupo `(app)`: durante la configuración no hay pestañas
 * abajo, porque todavía no hay adónde ir.
 */
export default async function PaginaEmpezar({
  searchParams,
}: {
  searchParams: Promise<{ paso?: string }>
}) {
  const { paso } = await searchParams
  const sesion = await exigirSesion()

  // Sin la otra persona no hay nada que decidir entre dos.
  if (!sesion.pareja) redirect("/vincular")

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 px-6 py-14">
      {paso === "tu" ? (
        <PasoPersonal sesion={sesion} />
      ) : (
        <PasoDeLosDos nombrePareja={sesion.pareja.nombre} sesion={sesion} />
      )}
    </main>
  )
}

/**
 * Lo que se decide entre dos. Todo puesto; se quita lo que sobre.
 *
 * **Cambia el encabezado según quién llegue.** Si el vínculo ya está
 * configurado es que la otra persona pasó por aquí primero, y entonces esto no
 * es una pregunta sino un resumen de lo que eligió — con los mismos
 * interruptores, porque puede cambiarlo todo.
 *
 * Quién eligió no hace falta guardarlo: si yo soy quien no ha pasado y la
 * elección ya existe, fue la otra. El nombre sale de ahí.
 */
function PasoDeLosDos({
  nombrePareja,
  sesion,
}: {
  nombrePareja: string
  sesion: Awaited<ReturnType<typeof exigirSesion>>
}) {
  const yaEligio = sesion.configuradoEn !== null

  return (
    <>
      <div className="aparece space-y-3">
        <Titulo>{yaEligio ? `${nombrePareja} ya eligió esto` : "Ya estáis los dos"}</Titulo>
        <Apunte>
          {yaEligio
            ? `Lo dejó así al entrar. Cambia lo que quieras: esto lo toca cualquiera de los dos,
               ahora o dentro de un mes.`
            : `Antes de entrar, dinos qué hacéis ${nombrePareja} y tú. Está todo puesto: quita lo
               que no os pegue. No se borra nada, y se cambia cuando queráis.`}
        </Apunte>
      </div>

      <Tarjeta className="aparece">
        <EleccionDeModulos modulos={sesion.modulos} ultimoCambio={null} />
      </Tarjeta>

      {/* `BotonEnlace` y no un `Boton` dentro de un `Link`: un `<button>` dentro
          de un `<a>` es un nido inválido, el navegador reestructura el DOM al
          leerlo y la hidratación de toda la pantalla se rompe — los
          interruptores de arriba dejaban de responder. Compilaba, pasaba el
          lint y pasaba las 161 pruebas. */}
      <BotonEnlace href="/empezar?paso=tu" variante="solido">
        <span className="inline-flex items-center gap-2">
          Seguir
          <RiArrowRightLine size={17} />
        </span>
      </BotonEnlace>
    </>
  )
}

/**
 * Lo que solo decide uno.
 *
 * Va aparte y después a propósito: el ciclo y el ánimo son míos, la otra
 * persona no los ve ni los cambia (RF-5.0, RF-1.5). Ponerlos en la pantalla
 * anterior los habría convertido en una negociación — «¿por qué no quieres que
 * vea tu ánimo?»—, que es exactamente lo que M5 evita.
 *
 * Y se puede saltar entero: son ajustes que ya viven en «Yo».
 */
function PasoPersonal({ sesion }: { sesion: Awaited<ReturnType<typeof exigirSesion>> }) {
  return (
    <>
      <div className="aparece space-y-3">
        <Titulo>Y esto es solo tuyo</Titulo>
        <Apunte className="flex items-start gap-2">
          <RiLockLine size={15} className="mt-1 shrink-0" />
          <span>
            {sesion.pareja?.nombre} no ve nada de esta pantalla, ni sabe que existe. Puedes
            saltártela.
          </span>
        </Apunte>
      </div>

      <Tarjeta className="aparece space-y-5">
        <InterruptorCiclo activo={sesion.llevaCiclo} />
        <InterruptorCompartirAnimo
          activo={sesion.compartoAnimo}
          nombrePareja={sesion.pareja?.nombre ?? null}
        />
        {/* Solo si el ritual está encendido para los dos: preguntar en cuáles
            ventanas participas de algo que no usáis no tiene sentido. */}
        {sesion.modulos.once && <VentanasDelOnce actual={sesion.ventanasOnce} />}
      </Tarjeta>

      <Acabar />

      <Link
        href="/empezar"
        className="pulsable text-center text-[13px] text-[var(--color-tinta-tenue)] hover:text-[var(--color-acento)]"
      >
        Volver atrás
      </Link>
    </>
  )
}

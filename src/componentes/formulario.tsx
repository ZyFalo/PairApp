"use client"

import type { ReactNode } from "react"
import { Boton, Tarjeta } from "@/componentes/base"

/**
 * Las dos piezas que cierran un formulario: su pie y su acuse.
 *
 * Estaban escritas cinco veces —los títulos, los recuerdos, las canciones, los
 * conflictos y los acuerdos— palabra por palabra, y las cinco con el mismo
 * defecto. Es el caso de libro de la pregunta 4 de la regla 1: si se repite en
 * dos pantallas, tiene sitio propio.
 *
 * Fichero aparte y no `base.tsx` por dos razones que se suman: `base.tsx` está
 * al borde de las 420 líneas, y sobre todo estas dos reciben **callbacks**
 * (`alCancelar`, `accion`), lo que solo es legal porque quien las pinta es
 * siempre un componente de cliente (§7). En `base.tsx`, rodeadas de piezas que
 * sí pintan páginas de servidor, esa condición sería fácil de olvidar.
 */

/**
 * Confirmar y cancelar.
 *
 * **Los dos se apagan mientras la escritura va.** Ese era el defecto repetido:
 * «Cancelar» seguía vivo durante el vuelo, y tocarlo borraba el borrador de
 * `sessionStorage` mientras la acción ya iba de camino — se perdía lo escrito y
 * se guardaba igual. Apagarlo dice la verdad: ya no hay nada que cancelar.
 *
 * `pendiente` entra como prop y no se lee con `useFormStatus` porque tres de
 * los cinco sitios no tienen `<form>` alrededor: llevan el estado con
 * `useActionState` o con `useTransition`.
 */
export function PieDeFormulario({
  pendiente,
  texto,
  textoOcupado,
  alCancelar,
}: {
  pendiente: boolean
  texto: string
  textoOcupado: string
  alCancelar?: () => void
}) {
  return (
    <div className="flex gap-2">
      <Boton type="submit" ocupado={pendiente} textoOcupado={textoOcupado} className="flex-1">
        {texto}
      </Boton>
      {alCancelar && (
        <Boton type="button" variante="texto" onClick={alCancelar} disabled={pendiente}>
          Cancelar
        </Boton>
      )}
    </div>
  )
}

/**
 * Un final: lo que se ve cuando algo salió y ya no queda nada que hacer ahí.
 *
 * Estaba escrito dos veces con distinta letra —«Listo.» al dejar un mensaje,
 * «Enviado.» al responder— y en un tercer sitio faltaba y hacía falta: entre
 * que la acción vuelve y aterriza el refresco se veía el mismo formulario, en
 * blanco y vivo, y la lectura obvia era «se borró y no se envió».
 *
 * `accion` es la salida, porque toda pantalla tiene una (§6).
 */
export function Acuse({ children, accion }: { children: ReactNode; accion?: ReactNode }) {
  return (
    <Tarjeta className="aparece space-y-3 text-center">
      <p className="carta text-[18px] text-[var(--color-tinta)]">{children}</p>
      {accion}
    </Tarjeta>
  )
}

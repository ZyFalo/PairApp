"use client"

import { useCallback } from "react"

/**
 * Poner el cursor en un campo **sin arrastrar la página hasta él**.
 *
 * Sustituye a `autoFocus`, que hace dos cosas a la vez y no deja separarlas: el
 * navegador desplaza el documento hasta lo que acaba de enfocar. Da igual en un
 * formulario que se abre a la vista, y no da igual aquí, porque los formularios
 * de esta app recuerdan lo que dejaste a medias (`lib/borrador.ts`) y se montan
 * **ya abiertos** al volver a la pantalla.
 *
 * El efecto era desconcertante: entrabas en «Ver juntos» con algo empezado y la
 * pantalla aparecía al final de la lista, en un campo de texto, sin que nadie
 * hubiera pedido ir ahí. Lo que se recuerda es el borrador, no dónde estabas
 * mirando.
 *
 * Se usa como `ref` y no dentro de un efecto: React llama a la función en
 * cuanto el nodo existe, que es justo el momento en que `autoFocus` habría
 * actuado.
 */
export function useEnfoqueQuieto<T extends HTMLElement>() {
  return useCallback((nodo: T | null) => {
    nodo?.focus({ preventScroll: true })
  }, [])
}

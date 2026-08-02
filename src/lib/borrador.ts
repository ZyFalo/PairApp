"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"

/**
 * Memoria de lo que estabas haciendo en una pantalla.
 *
 * Cambiar de pestaña desmonta el componente y se pierde todo: la emoción a
 * medio elegir, el mensaje a medio escribir. Eso convierte una interrupción de
 * diez segundos en volver a empezar, y es la clase de fricción que hace que la
 * gente no vuelva (P9: la fricción es temporal, nunca editorial).
 *
 * Vive en `sessionStorage` a propósito, no en `localStorage`: dura mientras la
 * app siga abierta y desaparece al cerrarla. Un borrador de "estoy enojado" que
 * te recibiera tres días después sería peor que perderlo.
 */
const PREFIJO = "pairapp:borrador:"

/** En el servidor no hay nada que pintar todavía; el aviso de React sobra. */
const useEfectoDePintado = typeof window === "undefined" ? useEffect : useLayoutEffect

/**
 * Un borrador con nombre. Devuelve lo guardado, cómo cambiarlo y cómo olvidarlo.
 *
 * La lectura va antes del primer pintado para que no se vea un parpadeo entre
 * la pantalla vacía y la pantalla con lo tuyo.
 */
export function useBorrador<T extends Record<string, unknown>>(clave: string, inicial: T) {
  const porDefecto = useRef(inicial)
  const [valor, setValor] = useState<T>(inicial)

  useEfectoDePintado(() => {
    try {
      const guardado = sessionStorage.getItem(PREFIJO + clave)
      setValor(guardado ? { ...porDefecto.current, ...JSON.parse(guardado) } : porDefecto.current)
    } catch {
      // Un borrador ilegible no es motivo para romper la pantalla.
      setValor(porDefecto.current)
    }
  }, [clave])

  const actualizar = useCallback(
    (parcial: Partial<T>) => {
      setValor((previo) => {
        const siguiente = { ...previo, ...parcial }
        try {
          sessionStorage.setItem(PREFIJO + clave, JSON.stringify(siguiente))
        } catch {
          // Sin espacio o en modo privado: se sigue trabajando en memoria.
        }
        return siguiente
      })
    },
    [clave],
  )

  const olvidar = useCallback(() => {
    try {
      sessionStorage.removeItem(PREFIJO + clave)
    } catch {
      // Igual que arriba: olvidar en memoria basta.
    }
    setValor(porDefecto.current)
  }, [clave])

  return [valor, actualizar, olvidar] as const
}

const EVENTO_REINICIO = "pairapp:reiniciar"

/**
 * Pedir a la pantalla que ya estás viendo que vuelva a su vista de partida.
 * Es lo que hace tocar la pestaña en la que ya estás — el segundo toque.
 */
export function pedirReinicio(ruta: string) {
  window.dispatchEvent(new CustomEvent(EVENTO_REINICIO, { detail: ruta }))
}

/** Escucha ese segundo toque. Solo responde el módulo de la ruta que se tocó. */
export function useReinicio(ruta: string, alReiniciar: () => void) {
  const ultimo = useRef(alReiniciar)

  useEffect(() => {
    ultimo.current = alReiniciar
  })

  useEffect(() => {
    function manejar(evento: Event) {
      if ((evento as CustomEvent<string>).detail === ruta) ultimo.current()
    }
    window.addEventListener(EVENTO_REINICIO, manejar)
    return () => window.removeEventListener(EVENTO_REINICIO, manejar)
  }, [ruta])
}

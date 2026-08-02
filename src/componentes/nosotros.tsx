"use client"

import { useActionState, useState } from "react"
import { Apunte, Aviso, Boton, Campo, Tarjeta } from "@/componentes/base"
import { crearEvento, dedicarCancion, pedirOnceOnce } from "@/lib/acciones/nosotros"

/**
 * Los 11:11 (M12). Cuatro minutos de gracia; si se pasa, el aviso desaparece
 * sin dejar rastro ni mención. Sin rachas ni contadores (RF-12.7).
 */
export function VentanaOnceOnce() {
  const [estado, accion, pendiente] = useActionState(pedirOnceOnce, {})
  const [texto, setTexto] = useState("")

  if (estado.ok) return null

  return (
    <Tarjeta className="aparece space-y-3">
      <p className="text-center font-[family-name:--font-carta] text-[19px]">11:11</p>
      <form action={accion} className="space-y-3">
        <textarea
          name="texto"
          value={texto}
          onChange={(e) => setTexto(e.target.value.slice(0, 140))}
          rows={2}
          placeholder="Pide un deseo…"
          className="w-full resize-none rounded-[--radius-suave] border border-[--color-borde] bg-[--color-lienzo] p-3 font-[family-name:--font-carta] text-[16px] outline-none"
        />
        <div className="flex items-center justify-between">
          <Apunte>{140 - texto.length} caracteres</Apunte>
          <Boton type="submit" disabled={pendiente || !texto.trim()}>
            Pedir
          </Boton>
        </div>
        <Aviso>{estado.error}</Aviso>
      </form>
    </Tarjeta>
  )
}

/** Añadir un plan al calendario compartido (RF-7.1). */
export function FormularioEvento() {
  const [estado, accion, pendiente] = useActionState(crearEvento, {})
  const [abierto, setAbierto] = useState(false)

  if (!abierto) {
    return (
      <Boton variante="suave" onClick={() => setAbierto(true)} className="w-full">
        Añadir un plan
      </Boton>
    )
  }

  return (
    <Tarjeta className="aparece">
      <form action={accion} className="space-y-3">
        <Campo etiqueta="Qué" name="titulo" required maxLength={120} />
        <Campo etiqueta="Cuándo" name="inicio" type="datetime-local" required />
        <label className="flex items-center gap-2 text-[14px] text-[--color-tinta-suave]">
          <input
            type="checkbox"
            name="esDePareja"
            value="true"
            defaultChecked
            className="accent-[--color-acento]"
          />
          Es un plan de los dos
        </label>
        <Aviso>{estado.error}</Aviso>
        <div className="flex gap-2">
          <Boton type="submit" disabled={pendiente} className="flex-1">
            Guardar
          </Boton>
          <Boton variante="texto" type="button" onClick={() => setAbierto(false)}>
            Cancelar
          </Boton>
        </div>
      </form>
    </Tarjeta>
  )
}

/** Dedicar una canción por enlace pegado (RF-8.2). Sin API ni OAuth. */
export function FormularioCancion() {
  const [estado, accion, pendiente] = useActionState(dedicarCancion, {})
  const [abierto, setAbierto] = useState(false)

  if (!abierto) {
    return (
      <Boton variante="suave" onClick={() => setAbierto(true)} className="w-full">
        Dedicar una canción
      </Boton>
    )
  }

  return (
    <Tarjeta className="aparece">
      <form action={accion} className="space-y-3">
        <Campo
          etiqueta="Enlace (YouTube, Spotify…)"
          name="url"
          type="url"
          required
          placeholder="https://"
        />
        <Campo etiqueta="Dedicatoria (opcional)" name="mensaje" maxLength={500} />
        <label className="block">
          <span className="mb-1.5 block text-[13px] text-[--color-tinta-suave]">
            ¿Cuándo le llega?
          </span>
          <select
            name="franja"
            defaultValue="TARDE"
            className="w-full rounded-[--radius-suave] border border-[--color-borde] bg-[--color-papel] px-4 py-3 text-[16px] outline-none"
          >
            <option value="MANANA">Por la mañana</option>
            <option value="TARDE">Media tarde</option>
            <option value="NOCHE">Por la noche</option>
          </select>
        </label>
        <Aviso>{estado.error}</Aviso>
        <div className="flex gap-2">
          <Boton type="submit" disabled={pendiente} className="flex-1">
            Dedicar
          </Boton>
          <Boton variante="texto" type="button" onClick={() => setAbierto(false)}>
            Cancelar
          </Boton>
        </div>
      </form>
    </Tarjeta>
  )
}

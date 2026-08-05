"use client"

import { RiCloseLine, RiDeleteBin6Line, RiImage2Line } from "@remixicon/react"
import { useActionState, useEffect, useState, useTransition } from "react"
import { Apunte, Aviso, Boton, Campo, Insignia, Seleccion, Tarjeta } from "@/componentes/base"
import { guardarPlanComoRecuerdo } from "@/lib/acciones/juntos"
import { borrarEvento, crearEvento } from "@/lib/acciones/nosotros"
import { useBorrador } from "@/lib/borrador"

/**
 * Añadir y quitar planes del calendario compartido (M7).
 *
 * Vivía en `nosotros.tsx` junto a los 11:11 y las dedicatorias, tres cosas cuyo
 * único parecido era salir en la misma pestaña. Al convertirse el calendario en
 * la pantalla de entrada, el formulario del plan pasó a usarse desde dos sitios
 * —el mes y la hoja de un día— y el fichero se partió por donde tocaba.
 */

/** Cuánto antes avisar de un plan (RF-7.2). "Sin aviso" es una opción legítima. */
const AVISOS = [
  { valor: "", texto: "Sin aviso" },
  { valor: "1", texto: "1 hora antes" },
  { valor: "3", texto: "3 horas antes" },
  { valor: "24", texto: "El día antes" },
]

/**
 * Añadir un plan (RF-7.1).
 * Lo escrito sobrevive a cambiar de pestaña, igual que en Hoy.
 *
 * `fechaSugerida` llega cuando se abre desde un día concreto: quien toca el 14
 * y pulsa "añadir" quiere un plan el 14, no volver a teclear la fecha.
 */
export function FormularioEvento({ fechaSugerida }: { fechaSugerida?: string }) {
  const [estado, accion, pendiente] = useActionState(crearEvento, {})
  const [borrador, actualizar, olvidar] = useBorrador("nosotros:plan", {
    abierto: false,
    titulo: "",
    inicio: "",
    avisoHoras: "",
    notas: "",
    esDePareja: true,
    anual: false,
    capsula: "",
  })

  // Al guardar se cierra y se olvida: dejarlo abierto invita a repetir sin querer.
  useEffect(() => {
    if (estado.ok) olvidar()
  }, [estado.ok, olvidar])

  if (!borrador.abierto) {
    return (
      <Boton
        variante="suave"
        onClick={() =>
          actualizar({
            abierto: true,
            // Solo se rellena si no había nada escrito: sugerir no puede pisar
            // un borrador a medias que alguien dejó al cambiar de pestaña.
            inicio: borrador.inicio || (fechaSugerida ? `${fechaSugerida}T20:00` : ""),
          })
        }
        className="w-full"
      >
        Añadir un plan
      </Boton>
    )
  }

  return (
    <Tarjeta className="aparece">
      <form action={accion} className="space-y-3">
        <Campo
          etiqueta="Qué"
          name="titulo"
          required
          maxLength={120}
          autoFocus
          value={borrador.titulo}
          onChange={(e) => actualizar({ titulo: e.target.value })}
        />
        <Campo
          etiqueta="Cuándo"
          name="inicio"
          type="datetime-local"
          required
          value={borrador.inicio}
          onChange={(e) => actualizar({ inicio: e.target.value })}
        />

        <Seleccion
          etiqueta="Avisarme"
          name="avisoHoras"
          opciones={AVISOS}
          valor={borrador.avisoHoras}
          onCambio={(v) => actualizar({ avisoHoras: v })}
        />

        <label className="block">
          <span className="mb-2 block text-[12.5px] font-medium uppercase tracking-[0.08em] text-[var(--color-tinta-tenue)]">
            Nota (opcional)
          </span>
          <textarea
            name="notas"
            rows={2}
            maxLength={2000}
            placeholder="Dónde, con quién, qué llevar…"
            value={borrador.notas}
            onChange={(e) => actualizar({ notas: e.target.value })}
            className="w-full resize-none rounded-[var(--radius-suave)] border border-[var(--color-borde)] bg-[var(--color-papel)] p-3 text-[15px] outline-none transition-colors focus:border-[var(--color-acento-suave)]"
          />
        </label>

        <label className="flex items-center gap-2 text-[14px] text-[var(--color-tinta-suave)]">
          <input
            type="checkbox"
            name="esDePareja"
            value="true"
            checked={borrador.esDePareja}
            onChange={(e) => actualizar({ esDePareja: e.target.checked })}
            className="accent-[var(--color-acento)]"
          />
          Es un plan de los dos
        </label>

        {/* La cápsula (RF-7.6): algo escrito hoy que llega el día del plan.
            Quien la recibe no sabe que existe — ni marca en el calendario ni
            cuenta atrás (RF-3.0.13.1): un reloj corriendo hacia una sorpresa
            la estropea. */}
        <label className="block">
          <span className="mb-2 block text-[12.5px] font-medium uppercase tracking-[0.08em] text-[var(--color-tinta-tenue)]">
            Algo para ese día (opcional)
          </span>
          <textarea
            name="capsula"
            rows={3}
            maxLength={4000}
            placeholder="Le llegará ese día, sin avisar antes…"
            value={borrador.capsula}
            onChange={(e) => actualizar({ capsula: e.target.value })}
            className="carta w-full resize-none rounded-[var(--radius-suave)] border border-[var(--color-borde)] bg-[var(--color-papel)] p-3 text-[16px] outline-none transition-colors focus:border-[var(--color-acento-suave)]"
          />
        </label>

        {/* Los aniversarios se repiten solos (RF-7.3): sin esto, un cumpleaños
            solo existiría en el año en que se apuntó. */}
        <label className="flex items-center gap-2 text-[14px] text-[var(--color-tinta-suave)]">
          <input
            type="checkbox"
            name="anual"
            value="true"
            checked={borrador.anual}
            onChange={(e) => actualizar({ anual: e.target.checked })}
            className="accent-[var(--color-acento)]"
          />
          Se repite cada año
        </label>

        <Aviso>{estado.error}</Aviso>
        <div className="flex gap-2">
          <Boton type="submit" disabled={pendiente} className="flex-1">
            {pendiente ? "Guardando…" : "Guardar"}
          </Boton>
          <Boton variante="texto" type="button" onClick={olvidar}>
            Cancelar
          </Boton>
        </div>
      </form>
    </Tarjeta>
  )
}

/**
 * Quitar un plan. Pide confirmación en la propia fila en vez de abrir un
 * diálogo: un modal para borrar una cena es desproporcionado.
 */
export function BotonBorrarEvento({ id, titulo }: { id: string; titulo: string }) {
  const [confirmando, setConfirmando] = useState(false)
  const [, empezar] = useTransition()

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        aria-label={`Quitar ${titulo}`}
        className="pulsable shrink-0 rounded-full p-1.5 text-[var(--color-borde)] hover:text-[var(--color-acento)]"
      >
        <RiDeleteBin6Line size={16} />
      </button>
    )
  }

  return (
    <span className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={() => empezar(() => void borrarEvento(id))}
        className="pulsable rounded-[var(--radius-pildora)] bg-[var(--color-acento-tenue)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-acento-hondo)]"
      >
        Quitar
      </button>
      <button
        type="button"
        onClick={() => setConfirmando(false)}
        aria-label="Cancelar"
        className="pulsable rounded-full p-1 text-[var(--color-tinta-tenue)]"
      >
        <RiCloseLine size={15} />
      </button>
    </span>
  )
}

/**
 * Guardar un plan que ya pasó como recuerdo (RF-7.7).
 *
 * Solo aparece en los planes pasados, y ahí es donde el gesto tiene sentido: el
 * plan ya tiene título y fecha, así que guardarlo cuesta un toque. Si costara
 * abrir un formulario, no se haría nunca — y estos son justo los recuerdos que
 * se pierden, los de un viernes cualquiera.
 *
 * El plan no se borra: sigue en su día. Pasó, y el calendario cuenta lo que pasó.
 */
export function BotonGuardarComoRecuerdo({ eventoId }: { eventoId: string }) {
  const [estado, setEstado] = useState<"listo" | "guardado" | string>("listo")
  const [ocupado, empezar] = useTransition()

  if (estado === "guardado") {
    return <Insignia Icono={RiImage2Line}>Guardado en recuerdos</Insignia>
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={ocupado}
        onClick={() =>
          empezar(async () => {
            const resultado = await guardarPlanComoRecuerdo(eventoId)
            setEstado(resultado.error ?? "guardado")
          })
        }
        className="pulsable inline-flex items-center gap-1.5 text-[13px] text-[var(--color-tinta-tenue)] hover:text-[var(--color-acento)]"
      >
        <RiImage2Line size={15} />
        {ocupado ? "Guardando…" : "Guardar como recuerdo"}
      </button>
      {estado !== "listo" && <Apunte>{estado}</Apunte>}
    </span>
  )
}

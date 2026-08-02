"use client"

import { RiPauseFill, RiPlayFill } from "@remixicon/react"
import { useRef, useState } from "react"
import type { TipoAdjunto } from "@/generated/prisma/enums"

export type DatosAdjunto = {
  tipo: TipoAdjunto
  url: string
  segundos: number | null
}

/**
 * Una foto o una nota de voz dentro de un mensaje (fase 2).
 *
 * Se pinta **debajo** del texto y nunca en su lugar: lo que se dice sigue
 * siendo lo principal, y un adjunto que empujara las palabras fuera de la
 * pantalla convertiría una carta en una galería.
 */
export function VistaAdjunto({ adjunto, alt }: { adjunto: DatosAdjunto; alt: string }) {
  if (adjunto.tipo === "AUDIO") return <NotaDeVoz url={adjunto.url} segundos={adjunto.segundos} />
  return <Foto url={adjunto.url} alt={alt} />
}

/** La foto, con el mismo grosor de papel que el resto de superficies. */
function Foto({ url, alt }: { url: string; alt: string }) {
  return (
    // biome-ignore lint/performance/noImgElement: imagen externa, ya optimizada en la nube
    <img
      src={url}
      alt={alt}
      loading="lazy"
      className="w-full rounded-[var(--radius-suave)] border border-[var(--color-borde-suave)] object-cover shadow-[var(--sombra-papel)]"
    />
  )
}

/** Segundos en `m:ss`, que es como se lee la duración de una nota de voz. */
function comoReloj(segundos: number): string {
  const minutos = Math.floor(segundos / 60)
  return `${minutos}:${String(Math.floor(segundos % 60)).padStart(2, "0")}`
}

/**
 * Nota de voz con un reproductor propio.
 *
 * El de serie del navegador trae su barra gris de sistema, que rompe la
 * paleta entera; y en una app donde la voz de alguien es lo más íntimo que
 * puede llegar, un control de vídeo genérico desentona más de lo que parece.
 */
function NotaDeVoz({ url, segundos }: { url: string; segundos: number | null }) {
  const audio = useRef<HTMLAudioElement>(null)
  const [sonando, setSonando] = useState(false)
  const [avance, setAvance] = useState(0)
  const [duracion, setDuracion] = useState(segundos ?? 0)

  function alternar() {
    if (!audio.current) return
    if (sonando) audio.current.pause()
    else void audio.current.play()
  }

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-pildora)] border border-[var(--color-borde-suave)] bg-[var(--color-lienzo)] py-2.5 pr-4 pl-2.5">
      <button
        type="button"
        onClick={alternar}
        aria-label={sonando ? "Pausar la nota de voz" : "Escuchar la nota de voz"}
        className="pulsable flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-acento)] text-[var(--color-sobre-acento)] shadow-[var(--sombra-tinta)]"
      >
        {sonando ? <RiPauseFill size={18} /> : <RiPlayFill size={18} />}
      </button>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-1 overflow-hidden rounded-full bg-[var(--color-borde)]">
          <div
            className="h-full rounded-full bg-[var(--color-acento)] transition-[width] duration-200"
            style={{ width: `${duracion > 0 ? (avance / duracion) * 100 : 0}%` }}
          />
        </div>
        <span className="block text-[12px] tabular-nums text-[var(--color-tinta-tenue)]">
          {comoReloj(sonando || avance > 0 ? avance : duracion)}
        </span>
      </div>

      {/* biome-ignore lint/a11y/useMediaCaption: es la voz de tu pareja, no un vídeo */}
      <audio
        ref={audio}
        src={url}
        preload="metadata"
        onPlay={() => setSonando(true)}
        onPause={() => setSonando(false)}
        onEnded={() => {
          setSonando(false)
          setAvance(0)
        }}
        onTimeUpdate={(e) => setAvance(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          // Algunos navegadores dan `Infinity` hasta que el audio se mueve;
          // en ese caso vale la duración que guardamos al subirlo.
          const leida = e.currentTarget.duration
          if (Number.isFinite(leida) && leida > 0) setDuracion(leida)
        }}
      />
    </div>
  )
}

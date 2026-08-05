import { Tarjeta } from "@/componentes/base"

/**
 * Los huecos que se dibujan mientras llega lo que va a ocupar ese sitio.
 *
 * **Solo cuando la forma se conoce de antemano.** Un esqueleto sirve para que
 * nada salte al llegar; si hay que inventarse el alto, salta igual y encima
 * después de haber prometido lo contrario. Por eso la rejilla del mes lleva uno
 * —siempre son seis semanas— y la hoja de un día no: puede traer tres planes o
 * un «no hay nada apuntado».
 *
 * Sin hooks, para que lo puedan pintar los `loading.tsx`, que son de servidor:
 * meterlo en un fichero `"use client"` mandaría al navegador el JavaScript de
 * dibujar rectángulos.
 *
 * Las **formas concretas** no viven aquí sino junto al marcado que imitan
 * —`EsqueletoDeMes` en `calendario.tsx`—, para que si una cambia y la otra no,
 * se vea en el mismo diff.
 */

/**
 * Un hueco. Las medidas van siempre por `className`: es lo único que cambia de
 * un sitio a otro, y tenerlas fuera evita quince variantes con nombre.
 */
export function Esqueleto({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`respira block rounded-[var(--radius-suave)] bg-[var(--color-lienzo-hondo)] ${className}`}
    />
  )
}

/**
 * Una tarjeta con renglones dentro, para las listas de texto.
 *
 * Anchos desiguales —90 %, 70 %, 40 %— porque un párrafo real tampoco llena la
 * última línea, y tres barras idénticas se leen como una tabla.
 */
export function HojaFantasma({ lineas = 3 }: { lineas?: number }) {
  const anchos = ["w-[90%]", "w-[70%]", "w-[40%]", "w-[80%]", "w-[55%]"]

  return (
    <Tarjeta className="space-y-2.5">
      {Array.from({ length: lineas }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: son barras sin identidad
        <Esqueleto key={i} className={`h-3 ${anchos[i % anchos.length]}`} />
      ))}
    </Tarjeta>
  )
}

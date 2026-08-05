import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react"
import Link from "next/link"
import { Apunte } from "@/componentes/base"
import { EnCamino } from "@/componentes/espera"
import { Esqueleto } from "@/componentes/esqueleto"
import { ESTILO_GRUPO } from "@/componentes/iconos"
import type { CasillaLlena } from "@/lib/motor/calendario"
import { DIAS_SEMANA, type Mes, mesVecino, nombreDelMes } from "@/lib/motor/calendario"

/**
 * La rejilla del mes (M7, RF-7.4): la primera pantalla de la app.
 *
 * Junta en un sitio lo que ya estaba disperso —planes, periodos, ánimo,
 * recuerdos—, porque todo eso son hechos con fecha y estaban repartidos en
 * cuatro listas que no se hablaban entre sí.
 *
 * **La regla que gobierna este componente: un día sin registro se dibuja igual
 * que un día futuro — vacío.** Nunca en gris de "fallado", nunca con una cuenta
 * al lado. Una rejilla con un punto por día está a un paso de ser un cuadro de
 * rachas, y una racha convierte un gesto en una deuda (RF-2.0.7, RF-12.7). La
 * invitación a registrarse va debajo, como oferta; jamás dentro de la casilla,
 * como ausencia.
 *
 * Tres capas y ni una más. Una casilla mide poco más de un dedo: con la cuarta
 * señal deja de ser un calendario y pasa a ser un panel de control.
 */
export function Calendario({
  mes,
  casillas,
  diaAbierto,
}: {
  mes: Mes
  casillas: CasillaLlena[]
  /** El día cuya hoja está abierta, para marcarlo mientras se lee. */
  diaAbierto: string | null
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <PasoDeMes mes={mesVecino(mes, -1)} atras />
        {/* `first-letter` y no `capitalize`: este último pone en mayúscula
         **cada** palabra, y "agosto de 2026" salía como "Agosto De 2026". */}
        <h2 className="carta text-[19px] text-[var(--color-tinta)] first-letter:uppercase">
          {nombreDelMes(mes)}
        </h2>
        <PasoDeMes mes={mesVecino(mes, 1)} />
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DIAS_SEMANA.map((d) => (
          <abbr
            key={d.nombre}
            title={d.nombre}
            className="text-center text-[11px] font-medium text-[var(--color-tinta-tenue)] no-underline"
          >
            {d.inicial}
          </abbr>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {casillas.map((casilla) => (
          <Casilla key={casilla.dia} casilla={casilla} abierta={casilla.dia === diaAbierto} />
        ))}
      </div>

      <Leyenda />
    </section>
  )
}

/** Mes anterior o siguiente. Enlaces de verdad: se puede volver con el navegador. */
function PasoDeMes({ mes, atras = false }: { mes: Mes; atras?: boolean }) {
  const Icono = atras ? RiArrowLeftSLine : RiArrowRightSLine

  return (
    <Link
      href={`/nosotros?mes=${mes}`}
      scroll={false}
      aria-label={atras ? "Mes anterior" : "Mes siguiente"}
      className="pulsable rounded-full p-2 text-[var(--color-tinta-tenue)] hover:text-[var(--color-acento)]"
    >
      {/* La flecha se queda encendida hasta que llega el mes. El prefetch no
          sirve aquí: la ruta es dinámica y el mes viaja en la URL, así que hay
          viaje al servidor sí o sí. */}
      <EnCamino modo="enciende">
        <Icono size={20} />
      </EnCamino>
    </Link>
  )
}

/**
 * Un día.
 *
 * El orden vertical no es casual: el número arriba y sus marcas justo debajo,
 * apretadas. Lo que se busca al mirar un calendario es la fecha; lo demás se
 * lee después, sin competir con ella.
 *
 * Apretadas y no repartidas por el alto de la casilla: con las marcas pegadas
 * al borde de abajo, una franja de periodo quedaba a medio camino entre su
 * semana y la siguiente y no se sabía de cuál era.
 *
 * `scroll={false}` porque el día se abre **debajo** de la rejilla y sin él la
 * navegación te devuelve al principio de la página: tocabas el 14 y perdías de
 * vista el propio calendario. Aquí no se cambia de pantalla, se despliega un
 * detalle de la que ya estás mirando, y eso no mueve a nadie de sitio.
 *
 * Y por eso mismo hace falta `EnCamino`: al conservar el desplazamiento, la
 * pantalla se queda **literalmente idéntica** a como estaba mientras el
 * servidor busca los datos del día. Se marca la casilla con el mismo dibujo que
 * tendrá cuando esté abierta, así que al llegar no cambia nada de sitio.
 */
function Casilla({ casilla, abierta }: { casilla: CasillaLlena; abierta: boolean }) {
  const { dia, numero, esDelMes, esHoy } = casilla

  return (
    <Link
      href={`/nosotros?mes=${dia.slice(0, 7)}&dia=${dia}`}
      scroll={false}
      aria-current={esHoy ? "date" : undefined}
      className={`pulsable relative flex aspect-square flex-col items-center gap-[3px] rounded-[var(--radius-suave)] px-0.5 pb-1 pt-1.5 transition-colors ${
        abierta
          ? "bg-[var(--color-acento-tenue)] ring-1 ring-[var(--color-acento-suave)]"
          : esHoy
            ? "bg-[var(--color-papel-alto)] shadow-[var(--sombra-papel)]"
            : "hover:bg-[var(--color-lienzo-hondo)]"
      }`}
    >
      <EnCamino modo="marca" />

      <span
        className={`text-[12.5px] tabular-nums ${
          esHoy
            ? "font-semibold text-[var(--color-acento)]"
            : esDelMes
              ? "text-[var(--color-tinta)]"
              : // Los días prestados del mes vecino se quedan, apagados: quitarlos
                // dejaría huecos y la semana dejaría de leerse como una fila.
                "text-[var(--color-tinta-tenue)] opacity-45"
        }`}
      >
        {numero}
      </span>

      <Animos casilla={casilla} />

      <span className="flex h-[7px] items-center gap-[3px]">
        {casilla.hayPlan && <span className="size-[3px] rounded-full bg-[var(--color-tinta)]" />}
        {casilla.hayRecuerdo && (
          <span className="size-[3px] rounded-full bg-[var(--color-acento)]" />
        )}
      </span>

      <BandasDeCiclo mia={casilla.miCiclo} suya={casilla.suCiclo} />
    </Link>
  )
}

/**
 * Los puntos de ánimo del día: el mío y, si ella lo encendió, el suyo.
 *
 * Del color de la familia y no de la emoción concreta, porque a este tamaño un
 * icono de clima no se distingue de otro. El detalle está a un toque.
 */
function Animos({ casilla }: { casilla: CasillaLlena }) {
  // Un hueco del alto de un punto aunque no haya ninguno: sin él, las casillas
  // vacías encogen y la rejilla queda dentada.
  return (
    <span className="flex h-2 items-center gap-[3px]">
      {[
        { de: "mio", animo: casilla.miAnimo },
        { de: "suyo", animo: casilla.suAnimo },
      ].map(({ de, animo }) =>
        animo ? (
          <span key={de} className={`size-[5px] rounded-full ${ESTILO_GRUPO[animo.grupo].punto}`} />
        ) : null,
      )}
    </span>
  )
}

/**
 * Las franjas de periodo, bajo el día (RF-5.5: "una marca discreta").
 *
 * **Lo registrado va sólido y lo estimado, partido.** Un cálculo y un hecho no
 * pueden dibujarse con la misma tinta: presentar una media aritmética como una
 * certeza es lo que invita a deducir cómo está alguien en vez de preguntárselo
 * (RF-5.2).
 *
 * Si aquí aparece la franja de ella, su punto de ánimo no está — de eso se
 * encarga `loQueSeVeDeElla` antes de llegar hasta aquí (RF-5.6).
 *
 * El color es propio y no el de ninguna familia de emociones. Pintar el periodo
 * del mismo tono que "me falta algo" sugeriría un parentesco entre las dos
 * cosas, que es justo la lectura que este módulo evita.
 */
function BandasDeCiclo({ mia, suya }: { mia: string | null; suya: string | null }) {
  return (
    <span className="flex w-full flex-col gap-[2px] px-1">
      {[
        { de: "mia", marca: mia },
        { de: "suya", marca: suya },
      ].map(({ de, marca }) =>
        marca ? (
          <span
            key={de}
            className={`h-[2px] w-full rounded-full ${
              marca === "REGISTRADO"
                ? "bg-[var(--color-periodo)]"
                : // Punteado con un degradado repetido: un `border-dashed` de dos
                  // píxeles de alto no se ve en pantallas normales.
                  "bg-[repeating-linear-gradient(90deg,var(--color-periodo)_0_3px,transparent_3px_6px)] opacity-75"
            }`}
          />
        ) : null,
      )}
    </span>
  )
}

/**
 * El hueco del mes mientras llegan sus datos.
 *
 * Vive aquí, pegado al marcado que imita, y no en `esqueleto.tsx`: si una de
 * las dos rejillas cambia y la otra no, se ve en el mismo diff.
 *
 * Puede existir porque **la forma se conoce de antemano**: `rejillaDelMes`
 * siempre devuelve seis semanas, así que nada salta al llegar. Las iniciales de
 * los días son las de verdad —son constantes—, y el nombre del mes no: ese
 * depende de cuál se esté pidiendo.
 *
 * Las casillas van **vacías, con solo una barrita donde iría el número**.
 * Cuarenta y dos cuadrados rellenos se leerían como cuarenta y dos días
 * marcados, que es justo lo que la rejilla no puede decir nunca (§6).
 */
export function EsqueletoDeMes() {
  return (
    <section aria-busy className="space-y-3">
      <div className="flex items-center justify-center py-2">
        <Esqueleto className="h-5 w-36" />
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DIAS_SEMANA.map((d) => (
          <span
            key={d.nombre}
            className="text-center text-[11px] font-medium text-[var(--color-tinta-tenue)]"
          >
            {d.inicial}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 42 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: casillas sin identidad
          <span key={i} className="flex aspect-square justify-center pt-1.5">
            <Esqueleto className="h-3 w-4 rounded-sm" />
          </span>
        ))}
      </div>
    </section>
  )
}

/** Qué significa cada marca. Sin ella la rejilla es un cuadro de puntos de colores. */
function Leyenda() {
  return (
    <Apunte>
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]">
        <Marca clase="size-[5px] rounded-full bg-[var(--color-contigo)]">ánimo</Marca>
        <Marca clase="size-[3px] rounded-full bg-[var(--color-tinta)]">plan</Marca>
        <Marca clase="size-[3px] rounded-full bg-[var(--color-acento)]">recuerdo</Marca>
        <Marca clase="h-[2px] w-3 rounded-full bg-[var(--color-periodo)]">periodo</Marca>
        <Marca clase="h-[2px] w-3 rounded-full bg-[repeating-linear-gradient(90deg,var(--color-periodo)_0_3px,transparent_3px_6px)]">
          estimado
        </Marca>
      </span>
    </Apunte>
  )
}

function Marca({ clase, children }: { clase: string; children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={clase} />
      {children}
    </span>
  )
}

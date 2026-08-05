import { Titulo } from "@/componentes/base"
import { EsqueletoDeMes } from "@/componentes/calendario"

/**
 * Lo que se ve al entrar en Nosotros desde otra pestaña, mientras el servidor
 * arma el mes.
 *
 * El título va **de verdad** y no como barra gris: es texto que no depende de
 * ningún dato, y fingirlo sería inventar una espera que no existe. Del carril
 * de vistas solo se reserva el alto, porque cuáles hay depende de los módulos
 * que use la pareja y adivinarlo sería peor que dejar el hueco.
 *
 * `LoUltimo` no se dibuja. Devuelve `null` cuando no hay nada, que es lo normal,
 * y reservarle sitio dejaría un hueco que casi nunca se llena. Es el precio
 * asumido: al llegar, el mes baja un poco si había novedades.
 *
 * No hay `loading.tsx` en `/hoy` a propósito — allí la pantalla depende del
 * estado y un esqueleto apostaría por uno de tres.
 */
export default function Cargando() {
  return (
    <div className="space-y-7">
      <Titulo>Nosotros</Titulo>
      <div className="h-9" />
      <EsqueletoDeMes />
    </div>
  )
}

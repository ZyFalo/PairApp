import { RiFilmLine } from "@remixicon/react"
import { Vacio } from "@/componentes/base"
import { EligeTu, FilaTitulo, FormularioTitulo } from "@/componentes/juntos"
import { dbDeSesion } from "@/lib/sesion"

/**
 * Series y películas (M9): la lista compartida y el sorteo de la noche.
 *
 * Consulta solo cuando se abre. Antes se traía con el resto de la página, así
 * que mirar el calendario cargaba sesenta títulos que nadie iba a leer.
 */
export async function VistaVerJuntos() {
  const { db, sesion } = await dbDeSesion()
  const titulos = await db.titulo.findMany({
    orderBy: { creadoEn: "desc" },
    take: 60,
    include: { votos: true },
  })

  return (
    <div className="space-y-3">
      <EligeTu candidatas={titulos} />

      {titulos.length === 0 ? (
        <Vacio Icono={RiFilmLine}>
          Nada en la lista. Aquí van las que os vais diciendo y luego nadie recuerda.
        </Vacio>
      ) : (
        <ul className="space-y-3">
          {titulos.map((t) => (
            <li key={t.id}>
              <FilaTitulo
                id={t.id}
                nombre={t.nombre}
                estado={t.estado}
                tipo={t.tipo}
                soloJuntos={t.soloJuntos}
                loPropuseYo={t.propuestoPorId === sesion.usuarioId}
                nombrePareja={sesion.pareja?.nombre ?? null}
                miVoto={t.votos.find((v) => v.usuarioId === sesion.usuarioId) ?? null}
                suVoto={t.votos.find((v) => v.usuarioId !== sesion.usuarioId) ?? null}
              />
            </li>
          ))}
        </ul>
      )}

      <FormularioTitulo />
    </div>
  )
}

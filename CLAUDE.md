# Reglas de este proyecto

> Esto no son sugerencias. Son las reglas que se siguen **siempre** que se
> escribe código aquí, las escriba una persona o una IA. Varias están
> comprobadas por pruebas: si las rompes, el proyecto falla antes de arrancar.
>
> Contexto de producto en `docs/REQUISITOS.md`. Cómo está montado, en
> `docs/ARQUITECTURA.md`. Este archivo es solo lo que hay que respetar.

---

## 1. Antes de escribir nada: mira qué ya existe

**La regla que más veces se rompe.** Antes de añadir algo:

1. ¿Existe ya una función que hace esto? → úsala.
2. ¿Existe algo *parecido*? → **reacomódalo** para que sirva a los dos casos, no lo dupliques.
3. ¿Es una regla del dominio? → va en `src/lib/motor/`, no en la pantalla.
4. ¿Se repite en dos pantallas? → va en `src/componentes/base.tsx`.

Un desplegable genérico vivió meses dentro del fichero de una funcionalidad
porque nadie hizo la pregunta 4. Acabó importado por otros dos módulos y
arrastrando media app detrás.

---

## 2. Toda función se explica, y explica **por qué**

Lo que hace ya se lee en el código. Lo que no se lee es la razón.

```ts
/**
 * Si al enviar hace falta pasar por el umbral (§6.1).
 * Solo el enojo: es la única emoción cuyo mensaje puede herir a quien lo lee.
 *
 * El incómodo queda fuera a propósito (RF-1.2.1): si cuesta decirlo, nadie lo
 * dice, y la incomodidad callada es la materia prima del enojo grande de
 * dentro de tres semanas. Barato lo pequeño para evitar lo caro.
 */
```

- **Mal:** `/** Devuelve true si pasa por el umbral. */`
- **Bien:** por qué solo el enojo, y por qué el incómodo queda fuera.

Las referencias `(RF-x.y)` y `(§x)` apuntan a `docs/REQUISITOS.md`.
**Compruébalas antes de escribirlas**: una cita a una sección que no dice eso
es peor que ninguna cita.

Si cambias el comportamiento, **actualiza el comentario en el mismo commit**.
Un comentario que miente hace más daño que uno que falta.

---

## 3. Las capas, en orden

Cada capa **solo** puede depender de las de dentro. Lo comprueba
`src/lib/capas.test.ts`.

| Capa | Carpeta | Qué es | Prohibido |
|---|---|---|---|
| 1 · Motor | `src/lib/motor/` | Reglas puras del dominio | React, base de datos, `new Date()` |
| 2 · Datos | `src/lib/db.ts`, `sesion.ts` | Acceso ya acotado al vínculo | Lógica de negocio |
| 3 · Consultas | `src/lib/consultas/` | Lecturas para páginas | Escribir, `"use server"` |
| 4 · Acciones | `src/lib/acciones/` | Escrituras. Validan y orquestan | Reglas que van en el motor |
| 5 · Componentes | `src/componentes/` | Interfaz | Tocar la base |
| 6 · Páginas | `src/app/` | Rutas y composición | Lógica de dominio |

**Si escribe en la base va en `acciones/`. Si solo lee, en `consultas/`.**
Un módulo `"use server"` publica *todos* sus exports como puntos de entrada
remotos; meter ahí una consulta la convierte en un endpoint sin decidirlo.

**El motor recibe la hora, nunca la consulta.** Es lo que permite probar la
medianoche, el cambio de año y el minuto exacto de los 11:11 sin tocar el
reloj del sistema.

---

## 4. Aislamiento por vínculo (RNF-4)

Lo más crítico. Son dos personas y los datos de una pareja **jamás** pueden
aparecer en la pantalla de otra.

- **Todo modelo de dominio lleva `vinculoId`.** Lo exige `esquema.test.ts`.
- **Nadie usa Prisma sin acotar.** `dbDelVinculo(vinculoId)` inyecta el filtro.
  La lista de módulos que pueden saltárselo está en `aislamiento.test.ts`, y
  una prueba falla si alguien se añade.
- **Ojo con las operaciones de identificador único.** `update`, `upsert`,
  `delete` y `findUnique` **no** llevan el filtro inyectado. Antes de usarlas,
  comprueba la pertenencia:

```ts
const entrega = await db.entrega.findFirst({ where: { id } })  // acotada
if (!entrega) return { error: "No encontramos ese mensaje" }
await db.respuesta.upsert({ where: { entregaId: entrega.id }, ... })
```

Esto ya costó dos bugs reales.

---

## 5. Idioma

**Dominio en español, infraestructura en inglés.** `Mensaje`, `Entrega`,
`Vinculo`, `dbDelVinculo`; pero `page.tsx`, `useState`, `searchParams`.

Comentarios, mensajes de error de cara al usuario y commits: en español.
El documento de requisitos está en español; traducir el vocabulario obliga a
un salto mental en cada lectura, y ahí es donde se pierden los matices.

---

## 6. Interfaz

- **Cero emojis.** Todos los iconos salen de `src/componentes/iconos.tsx`.
  Lo comprueba `estilo.test.ts`.
- **Cero colores fijos.** Variables de `globals.css`, y **toda variable nueva
  necesita su versión oscura**.
- **Sin contadores, sin insignias de pendientes, sin cuentas atrás.** Un número
  al lado de una lista convierte una conversación en una deuda (RF-2.0.7).
- **Toda pantalla tiene salida.** Si algo se abre, se cierra sin recargar.
- **Lo irreversible se avisa antes**, con la consecuencia dicha: «verá que lo
  borraste», no «¿estás seguro?».

---

## 7. Formularios

Dos patrones, y elegir mal cuesta bugs:

- **`<form action={accion}>`** cuando el botón no cambia el estado de la
  pantalla. Es lo normal.
- **Datos armados a mano y despachados** cuando el botón cambia el estado al
  pulsarlo. El envío nativo leería el formulario a medio actualizar, o no
  llegaría a dispararse.

Lo segundo no es preferencia: costó un bug que impedía enviar mensajes
enojados, la función más importante de la app.

---

## 8. Antes de dar algo por terminado

```bash
pnpm exec biome check src prisma
pnpm exec tsc --noEmit
pnpm exec vitest run
pnpm build
```

**Los cuatro en verde, sin excepciones.** Y además:

- **Pruébalo en el navegador.** Los bugs más graves de este proyecto
  compilaban, pasaban el lint y pasaban todos los tests. Se encontraron
  usando la app.
- `pnpm db:escenario` pone la app en el estado que necesites sin esperar al
  reloj.
- Si añadiste una regla al motor, **añade su prueba al lado**. Si tocaste el
  esquema, **migración en el mismo commit**.
- Variable de entorno nueva → a `.env` y a `.env.example` en el mismo commit.

---

## 9. Cuando una prueba de arquitectura falle

`capas.test.ts`, `esquema.test.ts`, `estilo.test.ts` y `aislamiento.test.ts`
no prueban funciones: protegen invariantes.

**La pregunta nunca es cómo silenciarlas.** Es si eso que quieres hacer
debería poder hacerse. Casi siempre significa que algo está en la capa
equivocada.

Si de verdad hace falta una excepción, se añade **nombrada y justificada** en
la propia prueba. Una regla con excepciones escritas sigue sirviendo; una
regla que se enuncia mal y no se comprueba, no. Eso ya pasó con D41.

---

## 10. Lo que este proyecto no hace, a propósito

No lo reinventes:

| No hay | Por qué |
|---|---|
| Cifrado de contenido | D34. Solo la contraseña, con Argon2id |
| Sincronización de calendarios | D29. Se exporta `.ics` |
| API de música | D28. Enlace pegado y oEmbed público |
| Contadores ni rachas | RF-2.0.7, RF-12.7 |
| Cuentas atrás | RF-3.0.13.1 |
| Interruptor de tema | RF-8.2.4. Sigue al sistema |
| Kit de componentes externo | §8.2. Identidad visual propia |

Y una que atraviesa todo: **la app no juzga, no interpreta y no infiere.**
Si algo no lo ha dicho la persona, la app no lo sabe (§1.2).

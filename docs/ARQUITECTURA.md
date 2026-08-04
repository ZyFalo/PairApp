# Arquitectura de PairApp

> **Las reglas obligatorias están en `CLAUDE.md`, en la raíz.** Ahí va lo que
> hay que respetar; aquí, cómo está montado y por qué.
>
> Para qué sirve este documento: que quien llegue sepa **dónde poner una cosa
> nueva** sin preguntar, y qué reglas no puede romper aunque el código se lo
> permita. No explica qué hace la app —eso está en `REQUISITOS.md`— sino cómo
> está montada.

---

## 1. La idea en una frase

Un solo servicio Next.js que habla con un Postgres. Sin backend aparte, sin
microservicios, sin cola de mensajes. Para dos personas, todo eso sería
maquinaria que mantener a cambio de nada.

```
Navegador  ──►  Next.js (App Router)  ──►  Postgres
                 · páginas (RSC)
                 · server actions          Cloudinary (archivos)
                 · 4 rutas API             Web Push (avisos)
```

---

## 2. Las seis capas, de dentro a fuera

El orden importa: **cada capa solo puede depender de las de dentro**. Si una
función del motor necesita algo de una acción, está en el sitio equivocado.

| Capa | Dónde | Qué es | Qué NO puede hacer |
|---|---|---|---|
| **1. Motor** | `src/lib/motor/` | Reglas del dominio. Funciones puras: entran datos, salen datos | Tocar la base, importar React, leer `process.env`, llamar a `Date.now()` sin recibirlo |
| **2. Datos** | `src/lib/db.ts`, `sesion.ts` | Acceso a Postgres, ya acotado al vínculo | Contener reglas de negocio |
| **3. Consultas** | `src/lib/consultas/` | Lecturas para las páginas. Sin `"use server"` | Escribir en la base |
| **4. Acciones** | `src/lib/acciones/` | Server actions. Validan, orquestan, escriben | Contener reglas que deberían estar en el motor |
| **5. Componentes** | `src/componentes/` | Interfaz reutilizable | Consultar la base directamente |
| **6. Páginas** | `src/app/` | Rutas, composición, carga de datos | Contener lógica de dominio |

### Por qué el motor es puro

Porque es lo que hay que poder probar sin levantar nada. Las 129 pruebas del
proyecto son casi todas de esta capa, y corren en 300 ms porque no tocan la red
ni la base. Cuando una regla se puede probar barato, se prueba; cuando cuesta
levantar medio sistema, se deja sin probar y acaba rota.

**Regla práctica:** si una función necesita saber la hora, se la pasas como
parámetro. Así se puede probar la medianoche, el cambio de año y el minuto justo
de los 11:11 sin tocar el reloj del sistema.

---

## 3. El invariante que no se toca: aislamiento por vínculo

Es lo más importante del proyecto. Son dos personas y los datos de una pareja
**jamás** pueden aparecer en la pantalla de otra.

### Cómo se garantiza

1. **Estructural:** todo modelo de dominio tiene `vinculoId`. Lo verifica
   `src/lib/esquema.test.ts`, que lee el `schema.prisma` en crudo. Si añades un
   modelo sin ese campo, el test falla antes que nada.

2. **En el acceso:** nadie usa Prisma directamente. `dbDelVinculo(vinculoId)`
   devuelve un cliente que inyecta el filtro en toda consulta filtrable.

3. **Comprobado, no prometido:** `prismaCrudo` solo pueden importarlo los
   módulos que trabajan antes o por encima de un vínculo. La lista está
   nombrada y justificada en `aislamiento.test.ts`, y una prueba falla si
   alguien se añade a ella (D41).

### El matiz que ya nos mordió una vez

El cliente acotado **solo** inyecta el filtro en operaciones cuyo `where` admite
cualquier campo:

```
Sí lo lleva:  findMany · findFirst · findFirstOrThrow · count
              aggregate · groupBy · updateMany · deleteMany

No lo lleva:  findUnique · update · upsert · delete
              (su where tiene que ser un identificador único; añadirle un
               campo suelto lo invalida y Prisma lo rechaza)
```

Antes de usar una de las segundas hay que **comprobar la pertenencia a mano**:

```ts
const entrega = await db.entrega.findFirst({ where: { id } })  // esta sí va acotada
if (!entrega) return { error: "No encontramos ese mensaje" }
await db.respuesta.upsert({ where: { entregaId: entrega.id }, ... })
```

Esto costó dos bugs reales. Está documentado también dentro de `dbDelVinculo`,
que es donde se mira cuando algo falla.

---

## 4. Dónde va cada cosa nueva

| Si vas a añadir… | Va en… |
|---|---|
| Una regla que decide algo (cuándo, cuánto, cuál) | `src/lib/motor/<tema>.ts` + su `.test.ts` al lado |
| Algo que escribe en la base | `src/lib/acciones/<tema>.ts` |
| Una consulta para una pantalla | `src/lib/consultas/<tema>.ts` |
| Una pantalla | `src/app/(app)/<ruta>/page.tsx` |
| Un trozo de interfaz que se repite | `src/componentes/base.tsx` |
| Un trozo de interfaz de un módulo concreto | `src/componentes/<modulo>.tsx` |
| Un icono | `src/componentes/iconos.tsx`, nunca suelto |
| Un color | `src/app/globals.css`, como variable, con su versión oscura |
| Un modelo | `prisma/schema.prisma`, **con `vinculoId`**, y migración |

### Los ficheros del motor, por tema

```
emociones.ts    Las nueve emociones, sus familias y qué implica cada una
entrega.ts      La matriz de §3.0.15: cómo se presenta un mensaje entrante
tiempo.ts       Zonas horarias, ventanas, formatos. Todo lo que toca Luxon
frio.ts         Buzón en frío y ventana de retirada (§6.3, §6.4)
ciclo.ts        Estimación del próximo periodo (RF-5.2)
reparacion.ts   Los cuatro gestos y cuándo se ofrecen (§6.8)
calendario.ts   Generación de archivos .ics
juntos.ts       Selector al azar de títulos y aniversarios de recuerdos
```

---

## 5. Convenciones de código

### Idioma

**Dominio en español, infraestructura en inglés.** `Mensaje`, `Entrega`,
`Vinculo`, `dbDelVinculo`; pero `page.tsx`, `useState`, `searchParams`.

La razón es trazabilidad: el documento de requisitos está en español y habla de
*mensajes*, *entregas* y *vínculos*. Traducir el vocabulario obliga a un salto
mental en cada lectura, y ese salto es donde se pierden los matices.

Los comentarios, en español.

### Cada función se explica

Toda función lleva una explicación breve. **Dice por qué, no qué**: lo que hace
ya se lee en el código.

```ts
/**
 * Si al enviar hace falta pasar por el umbral (§6.1).
 * Solo el enojo: es la única emoción cuyo mensaje puede herir a quien lo lee.
 *
 * El incómodo queda fuera a propósito (RF-1.2.1): si cuesta decirlo, nadie lo
 * dice, y la incomodidad callada es la materia prima del enojo grande de dentro
 * de tres semanas. Barato lo pequeño para evitar lo caro.
 */
```

Las referencias `(RF-x.y)` y `(§x)` apuntan a `REQUISITOS.md`. Sirven para que,
cuando alguien quiera cambiar una regla, encuentre primero por qué es así.

### Formularios

Dos maneras, y hay que elegir bien:

- **`<form action={accion}>`** cuando el envío es un botón que no cambia el
  estado de la pantalla. Es lo simple y lo normal.
- **Datos armados a mano y despachados** cuando el botón cambia el estado al
  pulsarlo —por ejemplo abriendo el umbral—. El envío nativo leería el
  formulario a medio actualizar, o no llegaría a dispararse.

Lo segundo no es preferencia: costó un bug que impedía enviar mensajes enojados,
que es la función más importante de la app. Está explicado en `compositor.tsx`.

### Borradores

`useBorrador` guarda lo que estás haciendo en `sessionStorage`: dura mientras la
app siga abierta y desaparece al cerrarla. Cambiar de pestaña no puede borrar un
mensaje a medio escribir.

Se sale con el **segundo toque** en la pestaña en la que ya estás.

---

## 6. Qué NO hace este proyecto, a propósito

Saberlo evita reinventar decisiones ya tomadas.

| No hay | Por qué |
|---|---|
| Cifrado de contenido | Decisión D34. Solo la contraseña, con Argon2id |
| Sincronización con calendarios | D29. Se exporta `.ics`, que no pide OAuth ni permisos |
| API de música | D28. Enlace pegado y oEmbed público de YouTube |
| Contadores ni insignias de pendientes | RF-2.0.7. Un número al lado es una deuda |
| Cuentas atrás | RF-3.0.13.1. Un reloj corriendo mete prisa |
| Emojis | RF-8.2.2. Iconos de trazo, coloreados por familia |
| Interruptor de tema | RF-8.2.4. Sigue al sistema; un ajuste más sería maquinaria a la vista |
| IA | D31. Fuera del MVP. Fases 3 en adelante |

---

## 7. Las pruebas

```
lib/motor/*.test.ts   Reglas del dominio. Puras, rápidas, sin base de datos
lib/aislamiento.test.ts  Monta dos parejas de verdad y comprueba que no se ven
lib/esquema.test.ts   Lee schema.prisma y exige vinculoId en todo modelo
lib/estilo.test.ts    Falla si se cuela un emoji en cualquier .ts o .tsx
lib/capas.test.ts     Hace cumplir las capas, y que ningún fichero crezca sin freno
```

Las tres últimas son **invariantes**, no pruebas de una función: existen porque
son reglas fáciles de romper sin darse cuenta y difíciles de ver en una revisión.

### Probar a mano lo que depende del reloj

Media app depende del tiempo: la revisión en frío tarda doce horas, retirar un
envío son dos minutos, un check-in caduca a las ocho. Sin ayuda, probarla entera
significa esperar o escribir SQL — y lo que cuesta probar, no se prueba.

```bash
pnpm db:escenario              # lista los casos
pnpm db:escenario frio         # monta uno y dice qué mirar
pnpm db:escenario limpio       # deja la semilla como estaba
```

Cada caso limpia lo suyo antes de montarse, así que se pueden encadenar. El de
los 11:11 **se niega a funcionar** fuera de los minutos :11 a :15 de cualquier
hora, y explica por qué: cambiar la zona horaria mueve la hora pero nunca el
minuto. Fingir que funciona habría sido peor que no tenerlo.

**Antes de dar algo por terminado:**

```bash
pnpm exec biome check src prisma
pnpm exec tsc --noEmit
pnpm exec vitest run
pnpm build
```

---

## 8. Entorno

`.env` es el real y no se versiona. `.env.example` sí, con los nombres y sin
valores. **Toda variable nueva se añade a los dos en el mismo commit.**

Las integraciones opcionales degradan en silencio: sin claves de Cloudinary la
app funciona entera, simplemente no deja adjuntar. Nada se cae por una variable
que falte.

---

## 9. Dónde falta trabajo

Honestidad sobre el estado, para que nadie descubra esto por su cuenta:

- **Sin cobertura de las server actions.** Toda la comprobación de pertenencia
  se ha verificado a mano en el navegador; convendría un test de integración
  como el de aislamiento.
- **`componentes/juntos.tsx` y `cofre/page.tsx` rondan las 400 líneas.** Están
  por debajo del límite, pero cerca: el próximo añadido pedirá partirlos.
- **Las cuatro vistas de Nosotros** podrían ser cuatro componentes; solo se ha
  extraído la de "Después", que era la que hacía pasar el límite.

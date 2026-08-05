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
| Un ajuste **mío** | columna en `Usuario` + acción en `acciones/ajustes.ts` + control en `componentes/ajustes.tsx` |
| Un módulo **de los dos** | columna en `Vinculo` + su ficha en `motor/modulos.ts`, y aparece solo en las dos pantallas |

### Los ficheros del motor, por tema

```
emociones.ts    Las nueve emociones, sus familias y qué implica cada una
entrega.ts      La matriz de §3.0.15: cómo se presenta un mensaje entrante
tiempo.ts       Zonas horarias, ventanas, formatos. Todo lo que toca Luxon
frio.ts         Buzón en frío y ventana de retirada (§6.3, §6.4)
ciclo.ts        Duración de un periodo y estimación del siguiente (RF-5.1, RF-5.2)
reparacion.ts   Los cuatro gestos y cuándo se ofrecen (§6.8)
calendario.ts   La rejilla del mes: qué días se pintan y qué cae en cada uno (M7)
ics.ts          Generación de archivos .ics para el calendario del teléfono
once.ts         La ventana de los 11:11 y quién participa en ella (M12)
avisos.ts       Cuándo puede la app tocar el hombro, y con qué palabras (M4)
modulos.ts      Qué módulos usa una pareja, y cómo se le pregunta (RF-0.7)
novedades.ts    Cuánto dura «lo último» y cómo se cuenta (RF-7.10)
juntos.ts       Selector al azar de títulos y aniversarios de recuerdos
```

### «Lo último»: lo que hizo la otra persona, junto

La app tiene once módulos y lo que se añade en uno no se ve desde los demás. El
calendario juntó los hechos **con fecha**; `Novedad` junta los **recientes**.

**Cada acción anota la suya**, en la misma llamada que crea la cosa: no hay un
observador que mire la base y deduzca qué ha cambiado. Si alguien añade una
función nueva y no la anota, no sale en la lista — y eso es preferible a una
lista que adivina (§1.2).

| Quién anota | Cuándo |
|---|---|
| `acciones/nosotros.ts` → `crearEvento` | al crear el plan |
| `acciones/juntos.ts` → `anadirTitulo`, `anadirDesdeTmdb` | al añadirlo |
| `acciones/juntos.ts` → `crearRecuerdo`, `guardarPlanComoRecuerdo` | al guardarlo |
| `acciones/conflicto.ts` → `crearAcuerdo` | al escribirlo |
| `api/cron/despachar` | al **entregar** la dedicatoria, no al dedicarla |

La canción es la única que no nace en su acción, y no es un descuido: se dedica
para una franja del día y hasta su hora no ha pasado nada que contar.

**Lo que no entra nunca**: el bucle emocional. Ni cómo está alguien, ni lo que te
escribió, ni los relatos de un conflicto. Un mensaje suyo con un botón de
«apartar» al lado sería el peor gesto de la app.

Lo que impide que sea una bandeja de entrada no es la buena voluntad de nadie:
**caduca sola** a los siete días y solo se ven cuatro a la vez. Sin contador y
sin insignia (RF-2.0.7); lo que sobra no se anuncia.

### Cuándo avisa la app

Todo aviso sale por `lib/push.ts → avisar()`, y **es la única puerta**. Ahí se
aplican los tres frenos, y estar en un solo sitio es lo que impide que un aviso
nuevo se salte alguno por descuido.

| Freno | Qué hace |
|---|---|
| Modo pausa | Alguien pidió que la app se calle (§12.2) |
| Horario de silencio | De 23:00 a 08:00 no suena nada (RF-4.3) |
| Espaciado | 90 minutos entre avisos **de rutina** (M4) |

Hay **dos clases de aviso** y no molestan igual. Lo que hace la otra persona
—registró, te escribió, llegó su cápsula— respeta el silencio y nada más:
enterarte de que te escribió no puede depender de cuántas veces vibró antes el
teléfono. Lo que decide la app —la pregunta del día, una dedicatoria, un
recordatorio— respeta además el espaciado.

**Los tres silencian el aviso, nunca la entrega.** Lo que te manden llega igual
y te espera al abrir: retenerlo haría que el cofre de quien escribió dijera «le
llegó» cuando no es verdad (RF-3.17.4).

### Los dos tipos de ajuste, y por qué están separados

| | Dónde vive | Quién lo cambia | Quién lo ve |
|---|---|---|---|
| **Míos** | `Usuario` | solo yo | **nadie más** (RF-5.0, RF-1.5, RF-12.8) |
| **De los dos** | `Vinculo` | cualquiera | los dos, y queda escrito quién fue |

Los dos grupos se editan con los mismos componentes en dos sitios —la pantalla
de `empezar` y la de `Yo`—, y eso **no es duplicación, es lo contrario**: el
onboarding no tiene su propia copia de los ajustes, así que no pueden divergir.

La puerta está en `(app)/layout.tsx` y no en la raíz: quien escriba `/cofre` a
mano tiene que pasar por el mismo sitio. Y mira **dos marcadores**, porque la
configuración tiene dos mitades que no se reparten igual:

```
Vinculo.configuradoEn   los módulos, una vez para los dos
Usuario.empezoEn        lo personal, cada quien el suyo
```

Con solo el primero, quien llegaba segundo no veía nunca la pantalla y se
quedaba con los valores por defecto sin habérselos enseñado. Quién eligió los
módulos no se guarda: si yo no he pasado y la elección ya existe, fue la otra
persona.

### Dos relojes, y confundirlos coloca las cosas en el día de al lado

Es el error de calendario más difícil de ver, así que conviene tenerlo escrito:

| Qué | Cómo se guarda | Con qué se lee |
|---|---|---|
| Periodos, recuerdos | Día suelto, a medianoche **UTC** | `diaSuelto()` — en UTC |
| Planes, check-ins | Un **instante** real | `diaLocal()` — en la zona de quien mira |

Un recuerdo del 14 de febrero es del 14 de febrero en todas partes. Una cena a
las once de la noche pertenece al día de quien cena, no al que diga UTC.
Leerlos con la función equivocada los mueve una casilla y nada avisa.

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

### Qué puede cruzar de servidor a cliente

**Una función, no.** Los iconos de este proyecto son componentes —o sea,
funciones—, así que pasar `Icono={RiFilmLine}` desde una página a un componente
`"use client"` revienta en tiempo de ejecución:

```
Functions cannot be passed directly to Client Components
```

Lo que sí cruza es **JSX ya dibujado**. El patrón, en `vistas.tsx`: el
componente de cliente recibe `children` y solo se ocupa del comportamiento —el
carril que se desplaza—, mientras las pastillas se pintan en el servidor, que es
donde el icono se resuelve.

Esto compilaba, pasaba el lint y pasaba las 153 pruebas. Se vio abriendo la app.

### Borradores

`useBorrador` guarda lo que estás haciendo en `sessionStorage`: dura mientras la
app siga abierta y desaparece al cerrarla. Cambiar de pestaña no puede borrar un
mensaje a medio escribir.

Se sale con el **segundo toque** en la pestaña en la que ya estás.

**Ningún campo lleva `autoFocus`.** Va `ref={enfocar}` con `useEnfoqueQuieto`
(`lib/enfoque.ts`), que enfoca con `preventScroll`. `autoFocus` hace dos cosas a
la vez —poner el cursor y desplazar el documento hasta él— y no deja separarlas:
como estos formularios se montan **ya abiertos** cuando hay borrador, entrar en
«Ver juntos» con algo empezado te dejaba de golpe al final de la lista, sin
haber pedido ir ahí. Lo que se recuerda es el borrador, no dónde estabas
mirando.

### Navegar sin perder el sitio

Los `<Link>` que solo **despliegan un detalle** de la pantalla que ya estás
mirando llevan `scroll={false}`: abrir un día del calendario o pasar de mes no
es cambiar de pantalla, y devolver a nadie al principio de la página por eso
hace perder de vista el propio calendario. Los que sí cambian de pantalla —las
pastillas de vista— no lo llevan.

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
pnpm db:escenario calendario   # un mes con periodos, ánimo, planes y aniversario
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
- **`componentes/juntos.tsx` ronda las 400 líneas.** Está por debajo del
  límite, pero cerca: el próximo añadido pedirá partirlo.
- **La rejilla trae dos consultas al abrir un día**, una para el mes y otra para
  el día. Se repiten datos a propósito —traer el detalle de cuarenta y dos
  casillas sería peor—, pero si el mes se vuelve más pesado habrá que mirarlo.
- **Un evento anual enseña su hora.** Para un cumpleaños sobra. El modelo tiene
  `todoElDia` y el formulario todavía no lo usa.
- **La ventana de los 11:11 no se puede probar en el navegador fuera de los
  minutos :11 a :15.** `participaEnLaVentana` sí tiene pruebas del motor, pero
  el camino completo —abrir la app en la ventana con el ajuste puesto— solo se
  comprueba a la hora buena. Cambiar la zona horaria mueve la hora y nunca el
  minuto, así que no hay forma de fingirlo.

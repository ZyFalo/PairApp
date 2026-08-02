# PairApp — Plan de trabajo

> **Versión:** v0.1 — 1 de agosto de 2026
> **Depende de:** `REQUISITOS.md` v0.3 (D1–D38)
> **Alcance:** Fase 1 (MVP de siete funciones, §9.1 de requisitos)

---

## 0. Tech stack

✅ **Cerrado.** Criterio: **la menor cantidad de piezas que resuelva el problema.** Cada dependencia es algo que puede romperse, quedar sin mantenimiento o exigir una migración. Con dos usuarios, la robustez viene de tener poco, no de tener lo mejor.

### 0.1 Núcleo — TypeScript de punta a punta

**Un solo servicio, un solo lenguaje, un solo despliegue.**

| Capa | Elección | Papel en la app |
|---|---|---|
| Runtime | **Node 22 LTS** | |
| Framework | **Next.js (App Router) + TypeScript** | Sirve las cuatro pestañas **y** ejecuta la lógica de servidor. Las Server Actions evitan escribir una API REST entera |
| Interfaz | **React** (dentro de Next.js) | Componentes: check-in, umbral, cofre, calendario |
| Paquetes | **pnpm** | Rápido y estricto con dependencias fantasma |
| Base de datos | **Postgres** en Railway | Gestionado, con respaldos |
| ORM | **Prisma** | `schema.prisma` es la fuente de verdad; el cliente se genera con tipos |
| Migraciones | **Prisma Migrate** | Versionadas en el repo |
| Inspección de datos | **Prisma Studio** | Ver §0.5 |
| Autenticación | **Auth.js** con credenciales + **Argon2id** | Ver §0.1.2 — sin correo, sin dominio, sin proveedor externo |
| Validación | **Zod** | Misma validación en formulario y servidor |
| Estilos | **Tailwind CSS** | La paleta cálida de §8.2 |
| Componentes | **shadcn/ui** | Ver §0.4 |
| Iconos | **Lucide** | Viene con shadcn |
| Fechas y zonas | **Luxon** | Ver §0.3 — es donde más bugs va a haber |
| Push | **web-push** (VAPID) | Sin Firebase ni servicios de terceros |
| PWA | **Service worker propio** | Ver §0.4 |
| Contenedor | **Dockerfile multi-stage** | Reproducible en local y en Railway |
| Cron | **Railway cron** | Ver §0.2 |
| Pruebas | **Vitest** (motor) + **Playwright** (bucle completo) | |
| Formato y lint | **Biome** | Una herramienta en vez de ESLint + Prettier |

**Estado en cliente: ninguno.** Ni Redux, ni Zustand, ni React Query. Server Components y Server Actions cubren doce pantallas sin capa de estado. Añadirla es complejidad que hay que mantener.

#### 0.1.2 Autenticación: contraseña, no enlace mágico

El plan anterior usaba enlace mágico por correo. **Sin dominio propio, eso se cae**: los proveedores de correo transaccional solo permiten enviar a la dirección del dueño de la cuenta hasta que se verifica un dominio. Tu pareja nunca recibiría su enlace.

Las tres salidas eran: comprar un dominio, usar SMTP de Gmail con contraseña de aplicación, o **quitar el correo de la ecuación**. La tercera es la buena, y no es un apaño:

| Lo que se elimina | |
|---|---|
| Resend | Una cuenta y una dependencia externa |
| `RESEND_API_KEY`, `EMAIL_FROM` | Dos secretos menos |
| Un dominio | Un coste y un trámite menos |
| Plantillas de correo | Trabajo de interfaz que nadie ve |
| El correo como punto de fallo | Si el proveedor falla, nadie entra a la app |

**El enlace mágico existe para no gestionar contraseñas.** Pero aquí son **dos personas que se registran una vez y quedan con la sesión abierta para siempre** en su teléfono. La comodidad que aporta el enlace mágico es casi nula, y su coste de infraestructura es real. Por D35 —usabilidad sobre sofisticación— gana la contraseña.

**Implementación:**
- Contraseña con **Argon2id** (`@node-rs/argon2`). Nunca cifrado reversible (D34).
- Sesión larga: 90 días, renovada en cada uso. En la práctica, no se vuelve a pedir.
- Recuperación: **no hay flujo automatizado.** Son dos personas; si alguien olvida la suya, se restablece a mano. Montar recuperación por correo reintroduce justo lo que acabamos de quitar.
- Registro cerrado: solo se crea cuenta con un código de invitación válido (RF-0.2). No hay alta pública.

> Si algún día hay dominio, volver al enlace mágico es cambiar el proveedor de Auth.js. La decisión no es irreversible.

#### 0.1.1 Prisma y el aislamiento entre vínculos

Aquí hay que tener cuidado. RNF-4 exige que **ninguna consulta pueda leer datos de otro vínculo**, y Prisma facilita justo lo contrario: `prisma.mensaje.findMany()` sin filtro compila, se ejecuta y devuelve todo.

**Solución obligatoria: un cliente extendido, y nunca el crudo.**

```ts
/** Cliente de Prisma acotado a un vínculo: toda consulta lleva el filtro puesto (RNF-4). */
export function prismaDelVinculo(vinculoId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          args.where = { ...args.where, vinculoId }
          return query(args)
        },
      },
    },
  })
}
```

**Regla del proyecto:** el cliente `prisma` crudo solo se importa en dos sitios — en el propio `prismaDelVinculo` y en la autenticación (que aún no sabe de vínculos). Cualquier otro import del cliente crudo es un fallo de revisión, y **R4 lo comprueba con un test que intenta leer datos de otro vínculo y debe fallar.**

### 0.2 Un solo cron, no seis

Hay que disparar **seis preguntas diarias** (RF-1.0) en **dos zonas horarias distintas** (RF-0.4), más las entregas programadas y las dedicatorias por franja.

**La forma frágil:** seis tareas cron con horas fijas. Se rompen al cambiar una hora, al viajar, y con el horario de verano.

**La forma correcta:** **un solo cron cada 15 minutos** que pregunta *"¿a quién le toca algo ahora mismo?"* y actúa. Las horas viven en la base de datos, no en la configuración del cron. Cambiar un horario es un `UPDATE`, no un despliegue.

Se implementa como una **ruta protegida** (`/api/cron/despachar`) que Railway llama cada 15 minutos enviando `CRON_SECRET` en una cabecera. La misma función se expone además como script de pnpm (`pnpm despachar`) para poder ejecutarla a mano al depurar, sin esperar al cron.

Ese mismo despacho se encarga de: preguntas periódicas, aviso de los 11:11, entrega de mensajes de *"cuando le sirva"*, dedicatorias por franja, recordatorios de calendario y recordatorio único a las 24 h (RF-3.16).

### 0.3 Fechas: donde van a estar los bugs

Es la parte con más trampas del proyecto: seis horarios, dos zonas horarias, desfase de una hora, ventana de gracia de cuatro minutos en los 11:11, caducidad de estados a las 8 h, cambios de horario de verano.

**Reglas obligatorias:**
1. **Todo se guarda en UTC.** Sin excepciones. El contenedor corre con `TZ=UTC`.
2. **Se convierte a la zona del usuario solo al mostrar y al decidir si toca una pregunta.**
3. **Nunca se usa la fecha del servidor para lógica de negocio** sin convertirla antes a la zona de la persona afectada.
4. **Luxon en toda comparación con zonas.** Un `new Date()` a pelo en lógica de negocio es un error, no un descuido — Biome debe marcarlo.

```ts
/** Comprueba si a esta persona le toca su pregunta periódica ahora (RF-1.0). */
function tocaPregunta(usuario: Usuario, ahoraUtc: DateTime): boolean {
  const local = ahoraUtc.setZone(usuario.zonaHoraria)
  return usuario.horasPregunta.includes(local.hour) && local.minute < 15
}
```

### 0.4 shadcn/ui, personalizado desde el primer día

shadcn **no es una librería que se instala**: es código que se copia al repositorio. Los componentes acaban en `components/ui/` como archivos propios, editables. Esa es la diferencia que lo hace compatible con §8.2, y también lo que hay que aprovechar deliberadamente.

**Lo que aporta:** accesibilidad seria (foco, teclado, lectores de pantalla), comportamiento de diálogos y menús ya resuelto, y componentes de formulario que funcionan. Eso es trabajo real que no hay que rehacer.

**El riesgo:** shadcn por defecto tiene un aspecto muy reconocible — grises neutros, esquinas medianas, tipografía de sistema. Usado tal cual, PairApp se vería como cualquier panel de control de 2025, y §8.2 pide lo contrario: serif para el contenido íntimo, paleta cálida donde ningún estado se vea "mal", nada de semáforos.

**Regla del proyecto: antes de construir la primera pantalla, se personalizan los *tokens*.** Se hace una vez, en `globals.css` y `tailwind.config`, y afecta a todo:

| Token | Qué cambiar |
|---|---|
| Colores | Paleta tierra/atardecer completa. **Fuera los grises neutros por defecto** |
| Tipografía | Serif para mensajes y cartas; sans limpia para la interfaz |
| Radios | Elegidos a propósito, no el valor por defecto |
| Sombras | Suaves o inexistentes. Nada de elevaciones marcadas |
| Animación | Transiciones lentas y sin rebote. Respetar `prefers-reduced-motion` |

**No se instala ningún componente que no se use.** shadcn permite añadirlos de uno en uno; cada componente sin usar es código muerto en el repositorio.

**Los componentes con carga emocional se escriben a mano**, no se derivan de shadcn: la rueda de emociones, la pantalla del umbral, la revelación de un mensaje. Son el corazón visual de la app y no se parecen a nada de un kit genérico.

### 0.4.1 Service worker propio

Sin envoltorio de PWA. Lo que hace falta es concreto y pequeño: manifest, instalación en pantalla de inicio (obligatorio en iOS para el push, RF-4.4), recepción de push y caché básica de lectura. Son unas cien líneas, y evita depender de un paquete intermediario cuyo mantenimiento no controlamos.

### 0.5 Código autoexplicativo, con una línea por función

Dos reglas que trabajan juntas:

#### Regla 1 — Nombres que no necesitan traducción

El nombre dice qué hace. Si hace falta leer el cuerpo para entenderlo, el problema es el nombre o el tamaño de la función.

```ts
// ✗
function check(e: string): boolean { ... }

// ✓
function puedeGuardarseParaDespues(emocion: Emocion): boolean { ... }
```

#### Regla 2 — Toda función lleva su línea

**Sin excepciones:** cada función, componente, hook y ruta abre con una línea breve que explica **para qué existe**. No qué hace paso a paso — eso ya lo dice el código — sino su propósito y, cuando aplique, la regla que la motiva.

```ts
/** Decide si una emoción permite escribir un mensaje para entregar más adelante. */
export function puedeGuardarseParaDespues(emocion: Emocion): boolean { ... }

/** Elige cómo presentar un mensaje entrante según el estado de quien lo recibe (§3.0.15). */
export function decidirPresentacion(entrante: Mensaje, receptor: Checkin | null): Presentacion { ... }

/** Marca un mensaje como leído y, si procede, ofrece avisar que se necesita un rato (RF-3.17). */
export async function marcarVisto(mensajeId: string, vinculoId: string) { ... }
```

**Una línea. Dos si la regla lo exige.** Si necesitas un párrafo, la función hace demasiado.

**Referencia al requisito** (`RF-x.y`, `§n`) siempre que la función implemente una regla del documento. Es lo que permite ir del código al porqué en un salto, y lo que impide que alguien "corrija" una decisión deliberada.

**Sigue prohibido:** comentarios *dentro* del cuerpo que repiten la línea siguiente (`// suma 1 al contador`), bloques comentados "por si acaso" — para eso está git —, y `// TODO` sin dueño ni fecha.

> La distinción, en corto: **arriba de la función, siempre una línea.** **Dentro del cuerpo, solo cuando el porqué no sea evidente.**

#### El caso que hace esto obligatorio: el porqué contraintuitivo

Este proyecto tiene una peculiaridad. **Varias reglas parecen errores cuando se leen sin contexto:**

- El *incómodo* no pasa por el umbral, aunque va dirigido a la pareja.
- El amortiguador **no** se activa en *apenado*, aunque es una emoción desagradable.
- No existe "marcar como resuelto" en ningún hilo.
- La ausencia nunca se enuncia: no hay *"no te dejó nada"* en ningún sitio.

Sin una línea de contexto, cualquiera —persona o agente— las lee como huecos y las "arregla". Y arreglarlas rompe el producto.

En estos casos, la línea explica el **porqué**, no el qué:

```ts
/** Sin umbral a propósito (RF-1.2.1): si cuesta decirlo, nadie lo dice, y la
 *  incomodidad callada es la materia prima del enojo grande. */
function friccionAlEnviar(emocion: Emocion): Friccion { ... }
```

El código dice **qué**. La línea dice **para qué** y, cuando sorprende, **por qué**. Nunca las dos lo mismo.

#### Los tests son la otra documentación

Los nombres de las pruebas describen las reglas en lenguaje del documento. Leer el archivo de tests del motor debe equivaler a leer §3.0.15:

```
el umbral aparece solo en enojo
el amortiguador no se activa en apenado
un mensaje de presencia nunca genera recordatorio
"te extraño" puede guardarse; "me siento solo" no
```

#### Idioma: el dominio en español

Los términos que existen en `REQUISITOS.md` se escriben **igual** en el código: `emocion`, `destino`, `umbral`, `amortiguador`, `cofre`, `presencia`, `conversacion`. Todo lo demás —infraestructura, utilidades, librerías— en inglés.

Traducir el dominio (`buffer`, `threshold`, `vault`) rompe la trazabilidad entre documento y código, que es justo lo que sostiene un proyecto con 38 decisiones escritas. Sin tildes en identificadores, para no pelearse con las herramientas.

### 0.6 Repositorio

**`https://github.com/ZyFalo/PairApp.git`**

Rama principal `main`. Cada hito se trabaja en su propia rama (`h0-esqueleto`, `h1-vinculo`, …) y se integra cuando el orquestador lo da por cerrado. Nunca se trabaja directamente sobre `main`.

### 0.7 Variables de entorno

**Dos archivos, y la distinción es innegociable:**

| Archivo | Qué contiene | ¿En git? |
|---|---|---|
| **`.env`** | Los valores reales | **Nunca.** Va en `.gitignore` |
| **`.env.example`** | Las mismas claves, sin valores, con un comentario de dónde se obtiene cada una | **Sí**, versionado |

`.env.example` es la documentación viva de qué necesita el proyecto para arrancar. **Toda variable nueva se añade a los dos archivos en el mismo commit**: si aparece en `.env` y no en `.env.example`, el siguiente que clone el repo no podrá levantar la app y no sabrá por qué.

```bash
# .env.example

# Postgres — la da Railway en la pestaña Variables del servicio de base de datos.
# En local: postgresql://pairapp:pairapp@localhost:5432/pairapp
DATABASE_URL=

# Auth.js — generar con: openssl rand -base64 32
AUTH_SECRET=
AUTH_URL=http://localhost:3000

# Web Push — generar el par con: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:tu@correo.com

# Protege la ruta que dispara el cron (§0.2) — openssl rand -hex 32
CRON_SECRET=

# El servidor siempre en UTC (§0.3). No cambiar
TZ=UTC
```

Seis variables. Sin correo, sin dominio, sin proveedores externos.

**En `.gitignore`, desde el primer commit:** `.env`, `.env.local`, `.env*.local`, `node_modules`, `.next`, `coverage`, `*.log`, `.DS_Store`.

> Si una clave real llega a git, **no basta con borrarla en un commit posterior**: queda en el historial. Hay que rotarla en el proveedor. Por eso el `.gitignore` va en el primer commit, antes que nada.

### 0.8 Qué va en git y qué va en la imagen

Son dos filtros distintos y conviene no confundirlos.

**En git va todo el proyecto**, incluido lo de desarrollo: código fuente, tests, `prisma/schema.prisma` y sus migraciones, configuración (`tsconfig`, `biome`, `tailwind`), `Dockerfile`, `docker-compose.yml` para el Postgres local, `.env.example` y `docs/`.

> Los tests y las configuraciones de desarrollo **sí se versionan**. "Solo lo necesario para producción" aplica a la **imagen**, no al repositorio: un repo sin tests no es un repo más limpio, es un repo sin tests.

**Fuera de git:** `.env`, `node_modules`, `.next`, `coverage`, artefactos de compilación, archivos del sistema operativo.

**Fuera de la imagen** (vía `.dockerignore`): `.git`, `node_modules` local, `.next` local, `docs/`, tests, `docker-compose.yml`, `.env*`, `README`.

**El `Dockerfile` es multi-stage**, y esa es la pieza que hace el filtrado real:

| Etapa | Qué hace | Qué deja |
|---|---|---|
| `deps` | `pnpm install` completo | Todas las dependencias |
| `build` | `prisma generate` + `next build` | La aplicación compilada |
| `runner` | Copia solo el resultado | Node + `standalone` + estáticos + cliente de Prisma |

La imagen final **no lleva** devDependencies, ni código fuente, ni tests, ni el compilador de Tailwind. Se usa `output: "standalone"` de Next.js, que produce un servidor autocontenido.

**Las migraciones se aplican al arrancar el contenedor** (`prisma migrate deploy`), antes de levantar el servidor. Railway construye la imagen desde el repo y la ejecuta; no hace falta ningún paso manual tras cada despliegue.

**En local, `docker-compose.yml` levanta solo el Postgres**; la app corre con `pnpm dev` fuera de Docker, que es mucho más rápido para desarrollar. El `Dockerfile` es para producción; el compose, para tener base de datos sin instalarla.

---

## 1. El equipo

**Claude orquesta. Los roles ejecutan. William revisa en cada hito.**

El orquestador no escribe el código de los hitos: reparte el trabajo, mantiene la coherencia con `REQUISITOS.md`, integra lo que entrega cada rol y decide cuándo un hito está cerrado. Cuando un rol propone algo que contradice una decisión (D1–D38), el orquestador lo frena y lo lleva a §12.2 como pregunta abierta.

Cuatro roles. No seis, no diez: un proyecto para dos usuarios no aguanta más división de la que puede coordinar.

### R1 — Cimientos

**Dueño de:** esquema de base de datos, migraciones, capa de acceso a datos, autenticación, Dockerfile, despliegue en Railway, variables de entorno.

**Entrega:** una base sobre la que los demás no tengan que pensar en infraestructura.

**Responsabilidad crítica:** RNF-4. La capa de acceso debe hacer **imposible** consultar sin `vinculo_id`. Si esto se hace mal, se filtran datos entre parejas y no hay forma elegante de arreglarlo después.

### R2 — Motor

**Dueño de:** toda la lógica de dominio, sin una sola línea de interfaz.

- La matriz de decisión (§3.0.15): tres preguntas, seis celdas
- Clasificación de emociones en grupos y en clases (presencia/conversación)
- Caducidad de estados a las 8 h (RF-3.0.7.7)
- Estados de entrega (RF-3.0.13)
- Qué destinos ofrece cada emoción (§2.0.1)
- Programación de las seis preguntas diarias desfasadas (RF-1.0)

**Entrega:** funciones puras, con pruebas, que dado un estado devuelven una decisión. **Se puede desarrollar y verificar entero sin que exista ninguna pantalla.**

**Por qué está separado:** es la parte que más se ha discutido y la que más caro sale equivocar. Aislada, se puede probar exhaustivamente.

### R3 — Interfaz

**Dueño de:** pantallas, componentes, sistema visual, PWA, notificaciones.

- Las cuatro pestañas (§8.1)
- Check-in de un toque (RF-1.1.3 a RF-1.1.7)
- Compositor de mensaje y destinos
- Umbral (§6.1), cofre, calendario, canciones, periodo, 11:11
- Service worker, manifest, instalación en iOS, Web Push (VAPID)

**Responsabilidad crítica:** P10 y §1.2. La maquinaria no se ve. Ninguna pantalla dice *"check-in registrado"*.

### R4 — Verificación

**Dueño de:** pruebas y revisión de cada hito contra el documento de requisitos.

**Tres cosas que nadie más va a mirar:**
1. **Aislamiento entre vínculos** — pruebas que intenten leer datos de otro vínculo y deban fallar.
2. **Las reglas emocionales** — que el umbral salga *solo* en enojo, que el amortiguador no se active en apenado, que un mensaje de presencia nunca genere recordatorio.
3. **El tono** — que ningún texto de la interfaz viole §1.2 (sin jerga terapéutica, sin felicitar, sin signos de alarma).

**Por qué es un rol y no una tarea:** quien escribe una función es mal juez de si cumple el requisito que la motivó. Sobre todo con requisitos como *"no debe sentirse invasivo"*.

---

## 2. Orden de trabajo

Cada hito es **demostrable**: al terminarlo se puede abrir la app y ver algo funcionando. Nada de "el 60 % del backend".

| # | Hito | Roles | Criterio de aceptación |
|---|---|---|---|
| **H0** | Esqueleto desplegable | R1 | La app responde en una URL de Railway, conectada a Postgres, desde un Dockerfile. Sin funciones |
| **H1** | Vínculo de dos personas | R1 · R3 | Dos cuentas se unen por código de invitación. Ninguna ve datos de otro vínculo (probado por R4) |
| **H2** | Check-in | R2 · R3 | Registrar *bien* cuesta un toque y menos de 3 s (RF-1.1.3) |
| **H3** | **El bucle completo** | R2 · R3 | Uno registra y deja mensaje → al otro le llega → lo lee → responde. **Este hito valida el producto** |
| **H4** | Push y preguntas periódicas | R1 · R3 | Las seis preguntas diarias llegan desfasadas. Push funciona en iOS instalado |
| **H5** | Protecciones | R2 · R4 | Umbral solo en enojo · caducidad 8 h · matriz de entrega completa |
| **H6** | Cofre | R3 | Colección de recibidos, con guardados aparte |
| **H7** | Los 11:11 | R2 · R3 | Aviso, ventana hasta 11:15, colección. Sin rachas |
| **H8** | Calendario | R1 · R3 | Eventos compartidos e individuales, recordatorios |
| **H9** | Canciones | R3 | Enlace pegado + tarjeta oEmbed + entrega por franja |
| **H10** | Periodo | R1 · R3 | Registro, predicción, y los tres niveles de visibilidad de RF-5.3 |

**H0–H3 es la columna vertebral.** Si H3 funciona y se siente bien, el proyecto está encaminado. Si H3 se siente frío o torpe, conviene parar y rediseñar antes de construir los siete hitos restantes.

---

## 3. Cómo se avanza

**Un hito a la vez.** Nada de trabajar en tres frentes: en un equipo pequeño el paralelismo produce integraciones dolorosas, no velocidad.

Los cuatro roles no son agentes en paralelo: son **cuatro sombreros que se ponen en orden** dentro de cada hito.

### Ciclo de un hito

```
  1. Cimientos    →  esquema, migraciones, acceso a datos (si el hito lo toca)
  2. Motor        →  lógica pura + tests, antes de que exista ninguna pantalla
  3. Interfaz     →  pantallas sobre un motor ya probado
  4. Verificación →  revisión independiente antes de cerrar
```

El orden importa: **el motor se escribe y se prueba antes que la interfaz.** Así, cuando una pantalla se comporta raro, ya sabemos que la regla es correcta y el fallo está en la presentación.

### La revisión de cierre

Al terminar cada hito, antes de integrarlo, se lanza una **revisión con varios revisores independientes**, cada uno con una lente distinta:

| Lente | Qué busca |
|---|---|
| **Aislamiento** | Cualquier consulta que pueda leer datos de otro vínculo (RNF-4, D41) |
| **Requisitos** | Que lo implementado diga lo mismo que el `RF-` que lo motivó — ni más ni menos |
| **Tono** | Que ningún texto viole §1.2: sin jerga terapéutica, sin felicitar, sin alarmas |
| **Corrección** | Bugs, casos límite, fechas y zonas horarias |

Los hallazgos se verifican antes de reportarse: **una sospecha no confirmada no es un hallazgo.** Lo que sobreviva se corrige antes de pasar al siguiente hito.

**Revisión reforzada** —más revisores y más profundidad— en tres hitos concretos:
- **H1**, porque un fallo de aislamiento no se arregla elegantemente después.
- **H3**, porque si el bucle no se *siente* bien, da igual que funcione.
- **H5**, porque las protecciones deben dispararse exactamente cuándo deben, y solo entonces.

**Cada hito termina con:** funciona y se puede ver → revisión → correcciones → William decide si se pasa al siguiente.

**Regla de desvíos:** si durante un hito aparece una idea nueva, va a `REQUISITOS.md` §12.2 como pregunta abierta. **No se implementa sobre la marcha.** La conversación de diseño ya generó 38 decisiones; el desarrollo tiene que ser aburrido para que eso sirva de algo.

---

## 4. Lo que no se toca en el MVP

Para que quede por escrito y no haya que discutirlo dos veces: IA, mascota, amortiguador, buzón en frío completo, registro de conflicto, series y películas, recuerdos, audio y fotos.

Están en `REQUISITOS.md` con su fase asignada. No desaparecen; esperan.

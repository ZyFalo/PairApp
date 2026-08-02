# PairApp

App privada para dos personas. El empujón cómodo para decir lo que normalmente se calla.

- **Requisitos:** [`docs/REQUISITOS.md`](docs/REQUISITOS.md) — qué se construye y por qué (41 decisiones)
- **Plan:** [`docs/PLAN.md`](docs/PLAN.md) — stack, equipo, hitos y convenciones

---

## Probarlo en cinco minutos

Hace falta **Node 24+**, **pnpm** y **Docker** (solo para la base de datos).

```bash
pnpm install
cp .env.example .env       # y rellenar los secretos (ver abajo)
pnpm db:up                 # Postgres en Docker, puerto 5433
pnpm db:migrate            # crea las tablas
pnpm db:sembrar            # dos personas con datos de ejemplo
pnpm dev                   # http://localhost:3000
```

Secretos del `.env`:

```bash
openssl rand -base64 32                 # AUTH_SECRET
openssl rand -hex 32                    # CRON_SECRET
npx web-push generate-vapid-keys        # el par VAPID
```

### Las dos cuentas de prueba

| | Correo | Contraseña |
|---|---|---|
| Él | `will@pairapp.local` | `pairapp123` |
| Ella | `ana@pairapp.local` | `pairapp123` |

Ábrelas **en dos navegadores distintos** (o una en ventana privada) para ver el
bucle de las dos partes a la vez.

---

## Qué probar, función por función

### 1. Dos personas

Entra como Will. En **Yo → Cerrar sesión** puedes cambiar de cuenta. Para empezar
de cero: regístrate, genera un código en `/vincular`, y úsalo al crear la segunda
cuenta.

### 2. Mensajes y estado de ánimo — *el bucle*

Como **Will** verás un mensaje de Ana esperando: un *incómodo* con su necesidad
declarada (*escucha*). Léelo y responde. Fíjate en que la caja de respuesta no
aparece de golpe: primero está el mensaje, solo.

Luego registra tu propio estado en **Hoy**: nueve emociones en tres familias, un
toque. La intensidad solo aparece si la buscas.

**Prueba el umbral:** elige `😠 Enojado`, escribe algo y pulsa *Ahora*. Aparece
*"Escribiste esto enojado"* con dos salidas del mismo peso. Elige `😐 Incómodo` y
verás que **no** aparece — es deliberado: si cuesta decir lo pequeño, nadie lo dice.

**Prueba los tres destinos:** desde `🌤 Bien` puedes guardar *"cuando le sirva"*;
desde `😢 Triste` esa opción desaparece.

### 3. Colección de mensajes lindos

**Cofre**: todo lo recibido, y una vista aparte con lo guardado. El corazón solo
existe en positivo: no hay "no guardado" en ninguna parte.

### 4. Los 11:11

En **Nosotros**. La ventana abre a las 11:11 y las 23:11 de tu zona horaria, con
cuatro minutos de gracia. Para verla fuera de hora, cambia la hora del sistema o
espera. Si los dos piden en la misma ventana, la app lo dice una vez.

### 5. Calendario

En **Nosotros → Añadir un plan**. Compartido, con eventos de pareja o individuales.

### 6. Canciones

En **Nosotros → Dedicar una canción**. Pega un enlace de YouTube y saca título y
miniatura solo con el oEmbed público — sin API, sin claves.

### 7. Periodo

En **Yo → Registrar periodo**. Con los tres niveles de visibilidad. Si Ana elige
compartir su nota, Will la ve en **Nosotros** — con las palabras de ella, nunca
traducidas a una etiqueta.

### Extra: cosas por hablar

En **Yo** hay un apunte privado de Will con el botón **"Decirlo ahora"**, que lo
convierte en mensaje enviado. Mover algo de callado a hablado sin empezar de cero
es el propósito entero de la app.

### Avisos y cron

```bash
# Dispara el despacho a mano en vez de esperar al cron
curl -H "Authorization: Bearer $(grep CRON_SECRET .env | cut -d'"' -f2)" \
  http://localhost:3000/api/cron/despachar
```

Los avisos push requieren HTTPS o `localhost`. **En iPhone solo funcionan con la
app añadida a la pantalla de inicio.**

---

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Compilación de producción |
| `pnpm check` / `check:fix` | Formato y lint (Biome) |
| `pnpm test` | 38 pruebas: motor de reglas y aislamiento |
| `pnpm db:up` / `db:down` | Levanta o para el Postgres local |
| `pnpm db:migrate` | Crea y aplica una migración |
| `pnpm db:sembrar` | Rehace los datos de prueba |
| `pnpm db:studio` | Visor de datos |

## Estructura

```
docs/               Requisitos y plan
prisma/             Esquema, migraciones y datos de prueba
src/app/            Rutas y pantallas
src/componentes/    Interfaz propia (sin librería de componentes)
src/lib/motor/      Reglas del dominio, en lógica pura y con tests
src/lib/acciones/   Server actions
src/generated/      Cliente de Prisma (generado, no se versiona)
```

## Reglas del proyecto

1. **Nunca se usa `prismaCrudo` fuera de `src/lib/db.ts` y `src/auth.ts`.** Todo
   acceso pasa por `dbDelVinculo(vinculoId)`, que hace imposible leer datos de
   otra pareja. Hay cuatro pruebas que lo verifican.
2. **Toda variable de entorno nueva va a `.env` y a `.env.example`** en el mismo commit.
3. **Cada función lleva una línea** explicando para qué existe, con la referencia
   al requisito cuando implementa una regla del documento.
4. **Todo se guarda en UTC.** Las zonas horarias se aplican solo al mostrar y al decidir.
5. **Las ideas nuevas van a `docs/REQUISITOS.md` §12.2**, no al código sobre la marcha.

## Despliegue

Railway construye desde el `Dockerfile` y aplica las migraciones al arrancar el
contenedor. Variables necesarias: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`,
`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`, `TZ=UTC`.

Para las preguntas periódicas, configurar un cron cada 15 minutos que llame a
`/api/cron/despachar` con la cabecera `Authorization: Bearer $CRON_SECRET`.

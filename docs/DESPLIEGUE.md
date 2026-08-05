# Desplegar PairApp en Railway

> Para dos personas. Unos 5–12 $ al mes, dominio aparte.
>
> Este documento es la lista completa. Si algo falla, está aquí abajo en
> «Cuando algo no arranca».

---

## Antes de empezar

Ten a mano una cuenta de Railway con el repositorio de GitHub conectado. Nada más:
todas las claves menos una las generas tú con un comando.

---

## 1. El proyecto y la base de datos

En Railway: **New Project → Deploy from GitHub repo**, elige `PairApp`.

Cuando aparezca el servicio, añade la base **en el mismo proyecto**:
**New → Database → Add PostgreSQL**. Estando juntos, la app puede referirse a
ella por variable y no por una URL escrita a mano.

---

## 2. Las variables

En el servicio de la app, pestaña **Variables**. Las once:

```bash
# La da el servicio de Postgres. Referencia, no la copies a mano:
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Generar: openssl rand -base64 32
AUTH_SECRET=

# El dominio real, con https y sin barra final
AUTH_URL=https://…

# Generar el par: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:tu@correo.com

# Generar: openssl rand -hex 32
CRON_SECRET=

# No cambiar: el servidor trabaja siempre en UTC y las zonas se
# resuelven por persona (PLAN.md §0.3)
TZ=UTC
```

**Dos son opcionales**, y las dos degradan igual: si faltan, la app funciona
entera y solo desaparece esa función. Ninguna pantalla se cae.

| | De dónde | Qué se pierde sin ella |
|---|---|---|
| `CLOUDINARY_*` | Cloudinary → Settings → API Keys | Adjuntar fotos y audios |
| `TMDB_API_KEY` | themoviedb.org → Ajustes → API → «API Key (v3 auth)» | Buscar series y películas; se escriben a mano |

`AUTH_SECRET` no aparece en el código porque lo lee Auth.js del entorno. Si
falta, la app arranca y falla al iniciar sesión.

---

## 3. Las migraciones

Ajustes del servicio → **Pre-deploy Command**:

```bash
pnpm db:deploy
```

Corre antes de cada despliegue y aplica las migraciones pendientes. Es
`prisma migrate deploy`, que **no** genera migraciones nuevas ni toca datos:
solo aplica las que ya están en `prisma/migrations`.

`prisma generate` no hace falta ponerlo: ya va dentro del `build`.

---

## 4. El dominio

Ajustes → **Networking → Generate Domain** para uno de Railway, o **Custom
Domain** si tienes el tuyo.

**Cópialo a `AUTH_URL`** y vuelve a desplegar. Si no coincide con el dominio
real, el inicio de sesión falla.

---

## 5. El cron

La app necesita que alguien llame a `/api/cron/despachar` **cada quince
minutos**. De ahí salen las preguntas del día, los avisos de los 11:11, los
mensajes guardados que esperan un mal día y las dedicatorias por franja.

Es una ruta HTTP protegida con `CRON_SECRET`, así que el programador puede vivir
donde sea. Dos formas:

**En Railway** — New → Empty Service, con `*/15 * * * *` en Cron Schedule y este
comando:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://TU-DOMINIO/api/cron/despachar
```

**Fuera** — cualquier programador gratuito (cron-job.org, GitHub Actions) con esa
misma cabecera. Un servicio menos que pagar.

---

## 6. Las cuentas

**No ejecutes `pnpm db:sembrar` en producción**: crea a Will y Cata con una
contraseña conocida, y son para desarrollo.

Entrad por la app:

1. La primera persona se registra en `/registro`
2. Cae en `/vincular` y genera el código — dura 72 h y sirve una vez
3. La segunda se registra con ese código
4. Al enlazarse, la app abre `/empezar`: elegís qué módulos usáis, cada quien lo
   suyo, y entráis

---

## 7. Comprobar que está vivo

- **Entrar** con las dos cuentas, cada una en su teléfono
- **Instalarla**: en iPhone hay que añadirla a la pantalla de inicio *antes* de
  que los avisos funcionen
- **Activar los avisos** en Yo, en cada dispositivo
- **Registrar un ánimo** y comprobar que el otro lo ve
- **Escribir un mensaje** y ver los estados: enviado, le llegó, visto
- **Forzar el cron** a mano y ver que responde:

```bash
curl -H "Authorization: Bearer TU_SECRETO" https://TU-DOMINIO/api/cron/despachar
```

---

## Las contraseñas

**No hay recuperación por correo, y es deliberado** (PLAN.md §0.1.2). La app no
manda correos: sin dominio verificado, un proveedor transaccional solo escribe a
la dirección del dueño de la cuenta, así que el enlace de la otra persona nunca
llegaría. Y para dos personas que entran una vez y quedan con la sesión abierta
noventa días, el flujo no compensa.

La consecuencia: **si alguien olvida su contraseña y cambia de teléfono, no hay
vuelta** salvo tocar la base a mano. Guardad las dos en un gestor de contraseñas
el día que las creéis.

Si algún día hay dominio propio, volver al enlace mágico es cambiar el proveedor
de Auth.js. La puerta no está cerrada.

---

## Las copias de seguridad

**Esto no es opcional.** No es una base de datos cualquiera: es el archivo de
vuestra relación, y perderla no es una incidencia — es perder las cartas.

Confirma en Railway que el servicio de Postgres tiene copias automáticas
activadas, y **prueba una restauración una vez**. Una copia que nunca se ha
restaurado no se sabe si existe.

---

## Cuando algo no arranca

| Síntoma | Qué es |
|---|---|
| El build falla con `Cannot find module '@/generated/prisma'` | El cliente de Prisma se genera en el `build` y no se versiona. Si tocaste ese script, devuélvelo a `prisma generate && next build` |
| Iniciar sesión da `UntrustedHost` | Falta `trustHost: true` en `src/auth.ts`, o `AUTH_URL` no coincide con el dominio |
| Entra y vuelve a la pantalla de acceso | `AUTH_SECRET` sin poner, o cambiado — al cambiarlo caducan todas las sesiones |
| `The table … does not exist` | No corrió `pnpm db:deploy`. Revisa el Pre-deploy Command |
| No llega ningún aviso | El cron no está llamando. Pruébalo con `curl`: si responde y no llegan, mira las claves VAPID y que los avisos estén activados en ese dispositivo |
| Las horas salen desplazadas | Falta `TZ=UTC`. El servidor tiene que estar en UTC siempre |
| Adjuntar no aparece | Es lo esperado sin las claves de Cloudinary. La app funciona igual |

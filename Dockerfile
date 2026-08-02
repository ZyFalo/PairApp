# Imagen de producción para Railway (PLAN.md §0.8).
# Multi-stage: la imagen final no lleva devDependencies, código fuente ni tests.

FROM node:24-alpine AS base
RUN corepack enable pnpm
WORKDIR /app

# --- deps: todas las dependencias, para poder compilar -----------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# --- build: genera el cliente de Prisma y compila Next ----------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build

# --- prod-deps: solo dependencias de producción, en árbol plano --------------
# pnpm enlaza con symlinks a un almacén virtual, así que copiar carpetas sueltas
# al runner deja fuera sus dependencias. Con `node-linker=hoisted` el árbol es
# plano y autocontenido, y el CLI de Prisma funciona al copiarlo.
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod --config.node-linker=hoisted

# --- runner: solo lo necesario para servir ----------------------------------
FROM base AS runner

ENV NODE_ENV=production
ENV TZ=UTC
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# El CLI de Prisma vive aparte: el bundle standalone trae su propio
# node_modules y mezclarlos rompe la copia.
COPY --from=prod-deps /app/node_modules /prisma-cli/node_modules
COPY --from=build /app/prisma /prisma-cli/prisma
COPY --from=build /app/prisma.config.ts /prisma-cli/prisma.config.ts
COPY --from=build /app/package.json /prisma-cli/package.json

# La aplicación compilada. El standalone incluye sus dependencias y el cliente
# de Prisma generado en src/generated.
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Las migraciones se aplican al arrancar: Railway no necesita ningún paso manual.
CMD ["sh", "-c", "cd /prisma-cli && node node_modules/prisma/build/index.js migrate deploy && cd /app && node server.js"]

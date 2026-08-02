-- CreateEnum
CREATE TYPE "TipoTitulo" AS ENUM ('SERIE', 'PELICULA');

-- CreateEnum
CREATE TYPE "EstadoTitulo" AS ENUM ('POR_VER', 'VIENDO', 'VISTA', 'ABANDONADA');

-- CreateTable
CREATE TABLE "titulo" (
    "id" TEXT NOT NULL,
    "vinculoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoTitulo" NOT NULL DEFAULT 'PELICULA',
    "estado" "EstadoTitulo" NOT NULL DEFAULT 'POR_VER',
    "propuestoPorId" TEXT NOT NULL,
    "soloJuntos" BOOLEAN NOT NULL DEFAULT false,
    "temporada" INTEGER,
    "episodio" INTEGER,
    "anio" INTEGER,
    "posterUrl" TEXT,
    "sinopsis" TEXT,
    "minutos" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "titulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voto_titulo" (
    "id" TEXT NOT NULL,
    "vinculoId" TEXT NOT NULL,
    "tituloId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "puntuacion" INTEGER NOT NULL,
    "comentario" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voto_titulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recuerdo" (
    "id" TEXT NOT NULL,
    "vinculoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "nota" TEXT,
    "ocurrioEl" DATE NOT NULL,
    "fotoUrl" TEXT,
    "fotoPublicId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recuerdo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "titulo_vinculoId_estado_idx" ON "titulo"("vinculoId", "estado");

-- CreateIndex
CREATE INDEX "voto_titulo_vinculoId_idx" ON "voto_titulo"("vinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "voto_titulo_tituloId_usuarioId_key" ON "voto_titulo"("tituloId", "usuarioId");

-- CreateIndex
CREATE INDEX "recuerdo_vinculoId_ocurrioEl_idx" ON "recuerdo"("vinculoId", "ocurrioEl");

-- AddForeignKey
ALTER TABLE "titulo" ADD CONSTRAINT "titulo_vinculoId_fkey" FOREIGN KEY ("vinculoId") REFERENCES "vinculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voto_titulo" ADD CONSTRAINT "voto_titulo_vinculoId_fkey" FOREIGN KEY ("vinculoId") REFERENCES "vinculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voto_titulo" ADD CONSTRAINT "voto_titulo_tituloId_fkey" FOREIGN KEY ("tituloId") REFERENCES "titulo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recuerdo" ADD CONSTRAINT "recuerdo_vinculoId_fkey" FOREIGN KEY ("vinculoId") REFERENCES "vinculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

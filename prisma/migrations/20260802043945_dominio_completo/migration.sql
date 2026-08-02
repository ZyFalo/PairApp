/*
  Warnings:

  - You are about to drop the column `fotoUrl` on the `usuario` table. All the data in the column will be lost.
  - You are about to drop the column `pronombres` on the `usuario` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Emocion" AS ENUM ('BIEN', 'AGRADECIDO', 'TE_EXTRANO', 'TRISTE', 'ME_SIENTO_SOLO', 'PREOCUPADO', 'INCOMODO', 'APENADO', 'ENOJADO');

-- CreateEnum
CREATE TYPE "GrupoEmocion" AS ENUM ('ESTOY_CONTIGO', 'ME_FALTA_ALGO', 'ALGO_PASO');

-- CreateEnum
CREATE TYPE "Necesidad" AS ENUM ('ESCUCHA', 'ESPACIO', 'DISTRACCION', 'CONTACTO', 'SOLUCIONES', 'NO_SE');

-- CreateEnum
CREATE TYPE "Visibilidad" AS ENUM ('COMPLETO', 'SOLO_COLOR', 'PRIVADO');

-- CreateEnum
CREATE TYPE "ClaseMensaje" AS ENUM ('PRESENCIA', 'CONVERSACION');

-- CreateEnum
CREATE TYPE "DestinoMensaje" AS ENUM ('AHORA', 'CUANDO_LE_SIRVA', 'SOLO_PARA_MI');

-- CreateEnum
CREATE TYPE "CierreHilo" AS ENUM ('GRACIAS', 'TE_QUIERO', 'HABLARLO_MAS', 'HABLAMOS_LUEGO');

-- CreateEnum
CREATE TYPE "FranjaDia" AS ENUM ('MANANA', 'TARDE', 'NOCHE');

-- AlterTable
ALTER TABLE "usuario" DROP COLUMN "fotoUrl",
DROP COLUMN "pronombres",
ADD COLUMN     "horasPregunta" INTEGER[] DEFAULT ARRAY[9, 14, 19]::INTEGER[];

-- CreateTable
CREATE TABLE "checkin" (
    "id" TEXT NOT NULL,
    "vinculoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "emocion" "Emocion" NOT NULL,
    "grupo" "GrupoEmocion" NOT NULL,
    "intensidad" INTEGER NOT NULL DEFAULT 3,
    "necesidad" "Necesidad",
    "visibilidad" "Visibilidad" NOT NULL DEFAULT 'COMPLETO',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensaje" (
    "id" TEXT NOT NULL,
    "vinculoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "checkinId" TEXT,
    "emocion" "Emocion" NOT NULL,
    "clase" "ClaseMensaje" NOT NULL,
    "destino" "DestinoMensaje" NOT NULL,
    "texto" TEXT NOT NULL,
    "necesidad" "Necesidad",
    "tonoMarcado" BOOLEAN NOT NULL DEFAULT false,
    "disparadorEmociones" "Emocion"[] DEFAULT ARRAY[]::"Emocion"[],
    "archivadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entrega" (
    "id" TEXT NOT NULL,
    "vinculoId" TEXT NOT NULL,
    "mensajeId" TEXT NOT NULL,
    "destinatarioId" TEXT NOT NULL,
    "entregadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "llegadaEn" TIMESTAMP(3),
    "vistaEn" TIMESTAMP(3),
    "necesitaRatoEn" TIMESTAMP(3),
    "amortiguadoConId" TEXT,
    "recordatorioEn" TIMESTAMP(3),

    CONSTRAINT "entrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respuesta" (
    "id" TEXT NOT NULL,
    "entregaId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "texto" TEXT,
    "emocionAdjunta" "Emocion",
    "cierre" "CierreHilo",
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "respuesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardado" (
    "id" TEXT NOT NULL,
    "vinculoId" TEXT NOT NULL,
    "mensajeId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guardado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "once_once" (
    "id" TEXT NOT NULL,
    "vinculoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "texto" VARCHAR(140) NOT NULL,
    "dia" TEXT NOT NULL,
    "esNoche" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "once_once_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento" (
    "id" TEXT NOT NULL,
    "vinculoId" TEXT NOT NULL,
    "creadorId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'cita',
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3),
    "todoElDia" BOOLEAN NOT NULL DEFAULT false,
    "esDePareja" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "avisoHoras" INTEGER,
    "avisadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dedicatoria" (
    "id" TEXT NOT NULL,
    "vinculoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "titulo" TEXT,
    "miniaturaUrl" TEXT,
    "mensaje" TEXT,
    "franja" "FranjaDia" NOT NULL,
    "entregadaEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dedicatoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ciclo" (
    "id" TEXT NOT NULL,
    "vinculoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "inicio" DATE NOT NULL,
    "fin" DATE,
    "nivelVisibilidad" TEXT NOT NULL DEFAULT 'SOLO_FECHAS',
    "notaParaPareja" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ciclo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suscripcion_push" (
    "id" TEXT NOT NULL,
    "vinculoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suscripcion_push_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "checkin_vinculoId_autorId_creadoEn_idx" ON "checkin"("vinculoId", "autorId", "creadoEn");

-- CreateIndex
CREATE INDEX "mensaje_vinculoId_autorId_creadoEn_idx" ON "mensaje"("vinculoId", "autorId", "creadoEn");

-- CreateIndex
CREATE INDEX "mensaje_vinculoId_destino_idx" ON "mensaje"("vinculoId", "destino");

-- CreateIndex
CREATE UNIQUE INDEX "entrega_mensajeId_key" ON "entrega"("mensajeId");

-- CreateIndex
CREATE INDEX "entrega_vinculoId_destinatarioId_vistaEn_idx" ON "entrega"("vinculoId", "destinatarioId", "vistaEn");

-- CreateIndex
CREATE UNIQUE INDEX "respuesta_entregaId_key" ON "respuesta"("entregaId");

-- CreateIndex
CREATE INDEX "guardado_vinculoId_usuarioId_idx" ON "guardado"("vinculoId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "guardado_mensajeId_usuarioId_key" ON "guardado"("mensajeId", "usuarioId");

-- CreateIndex
CREATE INDEX "once_once_vinculoId_dia_idx" ON "once_once"("vinculoId", "dia");

-- CreateIndex
CREATE INDEX "evento_vinculoId_inicio_idx" ON "evento"("vinculoId", "inicio");

-- CreateIndex
CREATE INDEX "dedicatoria_vinculoId_franja_entregadaEn_idx" ON "dedicatoria"("vinculoId", "franja", "entregadaEn");

-- CreateIndex
CREATE INDEX "ciclo_vinculoId_usuarioId_inicio_idx" ON "ciclo"("vinculoId", "usuarioId", "inicio");

-- CreateIndex
CREATE UNIQUE INDEX "suscripcion_push_endpoint_key" ON "suscripcion_push"("endpoint");

-- CreateIndex
CREATE INDEX "suscripcion_push_vinculoId_usuarioId_idx" ON "suscripcion_push"("vinculoId", "usuarioId");

-- AddForeignKey
ALTER TABLE "checkin" ADD CONSTRAINT "checkin_vinculoId_fkey" FOREIGN KEY ("vinculoId") REFERENCES "vinculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensaje" ADD CONSTRAINT "mensaje_vinculoId_fkey" FOREIGN KEY ("vinculoId") REFERENCES "vinculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensaje" ADD CONSTRAINT "mensaje_checkinId_fkey" FOREIGN KEY ("checkinId") REFERENCES "checkin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrega" ADD CONSTRAINT "entrega_vinculoId_fkey" FOREIGN KEY ("vinculoId") REFERENCES "vinculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrega" ADD CONSTRAINT "entrega_mensajeId_fkey" FOREIGN KEY ("mensajeId") REFERENCES "mensaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respuesta" ADD CONSTRAINT "respuesta_entregaId_fkey" FOREIGN KEY ("entregaId") REFERENCES "entrega"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardado" ADD CONSTRAINT "guardado_vinculoId_fkey" FOREIGN KEY ("vinculoId") REFERENCES "vinculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardado" ADD CONSTRAINT "guardado_mensajeId_fkey" FOREIGN KEY ("mensajeId") REFERENCES "mensaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "once_once" ADD CONSTRAINT "once_once_vinculoId_fkey" FOREIGN KEY ("vinculoId") REFERENCES "vinculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_vinculoId_fkey" FOREIGN KEY ("vinculoId") REFERENCES "vinculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dedicatoria" ADD CONSTRAINT "dedicatoria_vinculoId_fkey" FOREIGN KEY ("vinculoId") REFERENCES "vinculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ciclo" ADD CONSTRAINT "ciclo_vinculoId_fkey" FOREIGN KEY ("vinculoId") REFERENCES "vinculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripcion_push" ADD CONSTRAINT "suscripcion_push_vinculoId_fkey" FOREIGN KEY ("vinculoId") REFERENCES "vinculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

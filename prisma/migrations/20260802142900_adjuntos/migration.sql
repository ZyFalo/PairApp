-- CreateEnum
CREATE TYPE "TipoAdjunto" AS ENUM ('IMAGEN', 'AUDIO');

-- CreateTable
CREATE TABLE "adjunto" (
    "id" TEXT NOT NULL,
    "vinculoId" TEXT NOT NULL,
    "mensajeId" TEXT NOT NULL,
    "tipo" "TipoAdjunto" NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "segundos" INTEGER,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adjunto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "adjunto_mensajeId_key" ON "adjunto"("mensajeId");

-- CreateIndex
CREATE INDEX "adjunto_vinculoId_idx" ON "adjunto"("vinculoId");

-- AddForeignKey
ALTER TABLE "adjunto" ADD CONSTRAINT "adjunto_vinculoId_fkey" FOREIGN KEY ("vinculoId") REFERENCES "vinculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adjunto" ADD CONSTRAINT "adjunto_mensajeId_fkey" FOREIGN KEY ("mensajeId") REFERENCES "mensaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

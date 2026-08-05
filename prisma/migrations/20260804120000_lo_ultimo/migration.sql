-- CreateEnum
CREATE TYPE "TipoNovedad" AS ENUM ('PLAN', 'CANCION', 'TITULO', 'RECUERDO', 'ACUERDO');

-- CreateTable
CREATE TABLE "novedad" (
    "id" TEXT NOT NULL,
    "vinculoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "tipo" "TipoNovedad" NOT NULL,
    "titulo" TEXT NOT NULL,
    "enlace" TEXT NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "apartadaEn" TIMESTAMP(3),

    CONSTRAINT "novedad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "novedad_vinculoId_apartadaEn_creadaEn_idx" ON "novedad"("vinculoId", "apartadaEn", "creadaEn");

-- AddForeignKey
ALTER TABLE "novedad" ADD CONSTRAINT "novedad_vinculoId_fkey" FOREIGN KEY ("vinculoId") REFERENCES "vinculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

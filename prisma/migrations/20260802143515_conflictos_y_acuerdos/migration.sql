-- CreateTable
CREATE TABLE "conflicto" (
    "id" TEXT NOT NULL,
    "vinculoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "quePaso" TEXT NOT NULL,
    "queSenti" TEXT NOT NULL,
    "queNecesitaba" TEXT NOT NULL,
    "queHariaDistinto" TEXT NOT NULL,
    "compartidoEn" TIMESTAMP(3),
    "respondeAId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conflicto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acuerdo" (
    "id" TEXT NOT NULL,
    "vinculoId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "creadorId" TEXT NOT NULL,
    "archivadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acuerdo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conflicto_vinculoId_autorId_creadoEn_idx" ON "conflicto"("vinculoId", "autorId", "creadoEn");

-- CreateIndex
CREATE INDEX "acuerdo_vinculoId_archivadoEn_idx" ON "acuerdo"("vinculoId", "archivadoEn");

-- AddForeignKey
ALTER TABLE "conflicto" ADD CONSTRAINT "conflicto_vinculoId_fkey" FOREIGN KEY ("vinculoId") REFERENCES "vinculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflicto" ADD CONSTRAINT "conflicto_respondeAId_fkey" FOREIGN KEY ("respondeAId") REFERENCES "conflicto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acuerdo" ADD CONSTRAINT "acuerdo_vinculoId_fkey" FOREIGN KEY ("vinculoId") REFERENCES "vinculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

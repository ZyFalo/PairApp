-- AlterTable
ALTER TABLE "novedad" ADD COLUMN     "refId" TEXT;

-- CreateIndex
CREATE INDEX "novedad_vinculoId_refId_idx" ON "novedad"("vinculoId", "refId");


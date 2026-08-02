/*
  Warnings:

  - Added the required column `vinculoId` to the `respuesta` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "respuesta" ADD COLUMN     "vinculoId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "respuesta_vinculoId_idx" ON "respuesta"("vinculoId");

-- AddForeignKey
ALTER TABLE "respuesta" ADD CONSTRAINT "respuesta_vinculoId_fkey" FOREIGN KEY ("vinculoId") REFERENCES "vinculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

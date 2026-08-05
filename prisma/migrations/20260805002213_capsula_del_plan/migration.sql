-- AlterTable
ALTER TABLE "evento" ADD COLUMN     "capsulaId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "evento_capsulaId_key" ON "evento"("capsulaId");

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_capsulaId_fkey" FOREIGN KEY ("capsulaId") REFERENCES "mensaje"("id") ON DELETE SET NULL ON UPDATE CASCADE;

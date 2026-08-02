/*
  Warnings:

  - You are about to drop the column `recordatorioEn` on the `entrega` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "entrega" DROP COLUMN "recordatorioEn",
ADD COLUMN     "pospuestaHasta" TIMESTAMP(3);

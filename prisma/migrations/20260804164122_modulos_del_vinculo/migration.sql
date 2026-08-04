-- AlterTable
ALTER TABLE "vinculo" ADD COLUMN     "configuradoEn" TIMESTAMP(3),
ADD COLUMN     "modulosEn" TIMESTAMP(3),
ADD COLUMN     "modulosPorId" TEXT,
ADD COLUMN     "usaMusica" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "usaOnce" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "usaRecuerdos" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "usaTitulos" BOOLEAN NOT NULL DEFAULT true;

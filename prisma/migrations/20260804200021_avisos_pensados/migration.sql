-- CreateEnum
CREATE TYPE "FrecuenciaDeAnimo" AS ENUM ('SIEMPRE', 'SOLO_INTENSO', 'NUNCA');

-- AlterTable
ALTER TABLE "checkin" ADD COLUMN     "avisadoEn" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "frecuenciaAnimo" "FrecuenciaDeAnimo" NOT NULL DEFAULT 'SOLO_INTENSO',
ADD COLUMN     "ultimoAvisoEn" TIMESTAMP(3);


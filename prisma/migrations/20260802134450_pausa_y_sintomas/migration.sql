-- AlterTable
ALTER TABLE "ciclo" ADD COLUMN     "antojos" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dolor" INTEGER,
ADD COLUMN     "energia" INTEGER,
ADD COLUMN     "sueno" INTEGER;

-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "pausaHasta" TIMESTAMP(3);

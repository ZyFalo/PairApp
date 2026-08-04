-- CreateEnum
CREATE TYPE "VentanasOnce" AS ENUM ('AMBAS', 'MANANA', 'NOCHE', 'NINGUNA');

-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "ventanasOnce" "VentanasOnce" NOT NULL DEFAULT 'AMBAS';

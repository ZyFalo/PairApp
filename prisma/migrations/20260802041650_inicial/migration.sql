-- CreateEnum
CREATE TYPE "GeneroGramatical" AS ENUM ('MASCULINO', 'FEMENINO', 'NEUTRO');

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "contrasenaHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "genero" "GeneroGramatical" NOT NULL DEFAULT 'NEUTRO',
    "pronombres" TEXT,
    "zonaHoraria" TEXT NOT NULL DEFAULT 'America/Bogota',
    "fotoUrl" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vinculo" (
    "id" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vinculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membresia" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "vinculoId" TEXT NOT NULL,
    "unidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membresia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitacion" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "vinculoId" TEXT NOT NULL,
    "creadorId" TEXT NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "usadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_correo_key" ON "usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "membresia_usuarioId_key" ON "membresia"("usuarioId");

-- CreateIndex
CREATE INDEX "membresia_vinculoId_idx" ON "membresia"("vinculoId");

-- CreateIndex
CREATE UNIQUE INDEX "invitacion_codigo_key" ON "invitacion"("codigo");

-- CreateIndex
CREATE INDEX "invitacion_vinculoId_idx" ON "invitacion"("vinculoId");

-- AddForeignKey
ALTER TABLE "membresia" ADD CONSTRAINT "membresia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membresia" ADD CONSTRAINT "membresia_vinculoId_fkey" FOREIGN KEY ("vinculoId") REFERENCES "vinculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitacion" ADD CONSTRAINT "invitacion_vinculoId_fkey" FOREIGN KEY ("vinculoId") REFERENCES "vinculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitacion" ADD CONSTRAINT "invitacion_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

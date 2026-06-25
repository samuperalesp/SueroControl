-- AlterTable
ALTER TABLE "Sale" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "PackageSession" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "patientId" TEXT,
    "medicoId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "cantidadSesiones" INTEGER NOT NULL,
    "sesionesConsumidas" INTEGER NOT NULL DEFAULT 0,
    "sesionesPendientes" INTEGER NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "descuentoPorcentaje" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "descuentoValor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPagado" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackageSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionApplication" (
    "id" TEXT NOT NULL,
    "packageSessionId" TEXT NOT NULL,
    "salePackageId" TEXT,
    "sesionNumero" INTEGER NOT NULL,
    "fechaAplicacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionApplication_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PackageSession" ADD CONSTRAINT "PackageSession_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageSession" ADD CONSTRAINT "PackageSession_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Tercero"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageSession" ADD CONSTRAINT "PackageSession_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "Tercero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageSession" ADD CONSTRAINT "PackageSession_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionApplication" ADD CONSTRAINT "SessionApplication_packageSessionId_fkey" FOREIGN KEY ("packageSessionId") REFERENCES "PackageSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionApplication" ADD CONSTRAINT "SessionApplication_salePackageId_fkey" FOREIGN KEY ("salePackageId") REFERENCES "SalePackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

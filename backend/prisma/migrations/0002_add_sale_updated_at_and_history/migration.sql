-- AlterTable: Add updatedAt to Sale with default for existing rows
ALTER TABLE "Sale" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable: SaleHistory for audit trail
CREATE TABLE "SaleHistory" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SaleHistory" ADD CONSTRAINT "SaleHistory_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

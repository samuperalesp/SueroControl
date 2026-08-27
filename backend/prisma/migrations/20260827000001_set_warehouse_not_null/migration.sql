-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryMovement" DROP CONSTRAINT "InventoryMovement_warehouseId_fkey";

-- AlterTable
ALTER TABLE "Purchase" ALTER COLUMN "warehouseId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Sale" ALTER COLUMN "warehouseId" SET NOT NULL;

-- AlterTable
ALTER TABLE "InventoryMovement" ALTER COLUMN "warehouseId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Partial unique index: guarantees at most one principal warehouse
CREATE UNIQUE INDEX "Warehouse_esPrincipal_key" ON "Warehouse"("esPrincipal") WHERE "esPrincipal" = true;

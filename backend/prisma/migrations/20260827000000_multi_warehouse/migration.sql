-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "warehouseId" TEXT;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "warehouseId" TEXT;

-- AlterTable
ALTER TABLE "InventoryMovement" ADD COLUMN     "warehouseId" TEXT;

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseStock" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stockMinimo" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Warehouse_esPrincipal_idx" ON "Warehouse"("esPrincipal");

-- CreateIndex
CREATE INDEX "WarehouseStock_productId_idx" ON "WarehouseStock"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseStock_warehouseId_productId_key" ON "WarehouseStock"("warehouseId", "productId");

-- CreateIndex
CREATE INDEX "Purchase_warehouseId_idx" ON "Purchase"("warehouseId");

-- CreateIndex
CREATE INDEX "Sale_warehouseId_idx" ON "Sale"("warehouseId");

-- CreateIndex
CREATE INDEX "InventoryMovement_warehouseId_idx" ON "InventoryMovement"("warehouseId");

-- CreateIndex
CREATE INDEX "InventoryMovement_warehouseId_productId_idx" ON "InventoryMovement"("warehouseId", "productId");

-- AddForeignKey
ALTER TABLE "WarehouseStock" ADD CONSTRAINT "WarehouseStock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseStock" ADD CONSTRAINT "WarehouseStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================================
-- MIGRACIÓN DE DATOS: ALMACÉN PRINCIPAL + BACKFILL
-- (id fijo del almacén principal para re-ejecutabilidad e idempotencia)
-- =====================================================================

-- 1. Crear almacén principal
INSERT INTO "Warehouse" (id, nombre, "esPrincipal", activo, "createdAt", "updatedAt")
VALUES ('00000000-0000-0000-0000-000000000001', 'Almacén Principal', true, true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- 2. Backfill WarehouseStock por cada producto (stock y stockMinimo desde Product)
INSERT INTO "WarehouseStock" (id, "warehouseId", "productId", stock, "stockMinimo", "createdAt", "updatedAt")
SELECT gen_random_uuid(), '00000000-0000-0000-0000-000000000001', id, "stockActual", "stockMinimo", now(), now()
FROM "Product"
ON CONFLICT ("warehouseId", "productId") DO NOTHING;

-- 3. Asignar compras existentes al almacén principal
UPDATE "Purchase" SET "warehouseId" = '00000000-0000-0000-0000-000000000001' WHERE "warehouseId" IS NULL;

-- 4. Asignar ventas existentes al almacén principal
UPDATE "Sale" SET "warehouseId" = '00000000-0000-0000-0000-000000000001' WHERE "warehouseId" IS NULL;

-- 5. Asignar movimientos de inventario existentes al almacén principal
UPDATE "InventoryMovement" SET "warehouseId" = '00000000-0000-0000-0000-000000000001' WHERE "warehouseId" IS NULL;

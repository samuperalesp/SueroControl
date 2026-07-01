-- Add fechaVenta column to Sale (nullable, preserves existing data)
ALTER TABLE "Sale" ADD COLUMN "fechaVenta" TIMESTAMP(3);

-- Add fechaCompra column to Purchase (nullable, preserves existing data)
ALTER TABLE "Purchase" ADD COLUMN "fechaCompra" TIMESTAMP(3);

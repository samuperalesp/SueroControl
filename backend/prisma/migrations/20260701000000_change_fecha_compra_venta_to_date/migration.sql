-- Change fechaVenta and fechaCompra from TIMESTAMP to DATE
-- to avoid timezone conversion issues (business dates, not timestamps)

ALTER TABLE "Sale" ALTER COLUMN "fechaVenta" TYPE DATE;
ALTER TABLE "Purchase" ALTER COLUMN "fechaCompra" TYPE DATE;

# Manual Técnico

## Módulo de Compras

### Modelo de Datos
- `facturaNumero` (String?): número de factura del proveedor.
- `paciente` (String?): nombre del proveedor.
- `tipo` (String): "PEDIDO" o "COMPRA". Default "COMPRA".
- `pedidoId` (String?): relación autorreferencial para conversión PEDIDO → COMPRA.

### Búsqueda de Producto en el Modal
- Implementada con input de texto + filtrado en tiempo real sobre `activeProducts`.
- Coincidencia por `codigo` o `nombre` (case-insensitive).
- Al seleccionar, se auto-asigna `productId` y se pre-carga `unitCost` con `costoCompra`.

### Búsqueda de Proveedor
- Autocompletado sobre array `suppliers` extraído de compras anteriores (`paciente` único).
- El usuario puede escribir un proveedor nuevo (no requiere selección forzada).

### Validación de Stock Entero
- Backend: `@IsInt()` + `@Min(0)` + `@Type(() => Number)` en DTOs.
- Frontend: `step="1"` en inputs HTML de tipo `number`.
- Prisma: campos `stockActual` y `stockMinimo` declarados como `Int`.

### Conversión PEDIDO → COMPRA
- `PUT /purchases/:id/convert` actualiza `tipo` a "COMPRA".
- Incrementa stock de cada producto en el detalle.
- Registra movimientos InventoryMovement tipo ENTRY.
- No modifica `facturaNumero` ni `paciente`.

## Dashboard - Cálculos

El endpoint `GET /dashboard` ejecuta las siguientes consultas para poblar los indicadores:

### Ventas Totales
```
SELECT SUM(total) FROM "Sale" WHERE estado = 'ACTIVA'
```
Suma del campo `total` de todas las ventas activas (no anuladas).

### Compras Totales
```
SELECT SUM(total) FROM "Purchase" WHERE tipo = 'COMPRA'
```
Suma del campo `total` de todas las compras completadas (tipo COMPRA). No incluye pedidos (PEDIDO).

### Ganancia Centro
```
SELECT SUM(sp.gananciaCentro)
FROM "SalePackage" sp
JOIN "Sale" s ON s.id = sp.saleId
WHERE s.estado = 'ACTIVA'
```
Suma de la ganancia del centro de todos los paquetes vendidos en ventas activas.
Por cada paquete vendido: `GananciaCentro = utilidad × (porcentajeCentro / 100)`, donde `utilidad = precioVenta - costoMedicamentos - costoOperativo`.

### Utilidad Total
```
SELECT SUM(sp.utilidad)
FROM "SalePackage" sp
JOIN "Sale" s ON s.id = sp.saleId
WHERE s.estado = 'ACTIVA'
```
Suma de la utilidad real de todos los paquetes vendidos. No se calcula como ventas menos costos de compra, sino directamente desde el snapshot histórico de cada paquete (`SalePackage.utilidad`).

### Top Médicos
```
SELECT sp.medicoId, SUM(sp.gananciaMedico) as total
FROM "SalePackage" sp
JOIN "Sale" s ON s.id = sp.saleId
WHERE s.estado = 'ACTIVA' AND sp.medicoId IS NOT NULL
GROUP BY sp.medicoId
ORDER BY total DESC
```
Médicos rankeados por la ganancia acumulada asignada a cada uno en las ventas de paquetes.

### Notas importantes
- Todos los valores se obtienen de snapshots históricos (`SalePackage`), no se recalculan en tiempo real.
- Los cálculos de ganancia médico/centro se realizan al momento de crear la venta y se almacenan en `SalePackage`.
- No se utiliza `Sale.costoTotal`, `Sale.gananciaCentro` ni `Sale.gananciaMedico` (esos campos no se establecen actualmente en la creación de ventas).

## Configuración de Prisma
- Prisma v7 con `@prisma/adapter-pg`.
- Conexión vía `DATABASE_URL` en variables de entorno.
- Config file: `prisma.config.js` (CommonJS, excluido de compilación TS).

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

## Configuración de Prisma
- Prisma v7 con `@prisma/adapter-pg`.
- Conexión vía `DATABASE_URL` en variables de entorno.
- Config file: `prisma.config.js` (CommonJS, excluido de compilación TS).

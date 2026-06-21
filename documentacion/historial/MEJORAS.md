# Mejoras Realizadas

## Implementado (v2.0.0)
- Módulo Terceros unificado (CLIENTE, PROVEEDOR, CLIENTE_PROVEEDOR).
- Persona Natural vs Jurídica con campos dinámicos.
- Compras y Ventas asociadas a Terceros con validación de tipo de relación.
- Consecutivo automático en Ventas.
- Eliminación del módulo Pacientes.
- Facturación integrada directamente en Ventas (cada venta es el comprobante).

## Implementado (v1.1.0)
- Búsqueda de producto por código o nombre en modal de compras (reemplaza dropdown).
- Campo N° Factura Proveedor en registro de compras.
- Búsqueda y autocompletado de proveedor desde compras anteriores.

## Implementado (v1.0.0)
- Migración de persistencia JSON a PostgreSQL con Prisma ORM.
- Módulo de Compras: CRUD + incremento automático de stock + registro de movimientos.
- Módulo de Ventas: CRUD + descuento automático de stock + validación de existencia + registro de movimientos.
- Módulo de Pacientes: CRUD base para futuras ventas a pacientes.
- Módulo de Paquetes/Combos: creación de paquetes compuestos + venta con descuento de inventario.
- Historial de movimientos (Kardex) para cada producto (InventoryMovement).
- Código único de producto con validación en backend.
- Control de stock no negativo en ventas.

## Pendientes Técnicos
- Implementar autenticación y autorización (JWT).
- Implementar tests unitarios para servicios y repositorios.
- Implementar tests e2e para todos los módulos.
- Configurar CI/CD.

## Pendientes Funcionales
- Dashboard Gerencial: indicadores y gráficos en tiempo real.
- Alertas de Inventario: notificaciones de stock mínimo.
- Configurar lazy loading en frontend.
- Agregar paginación en listados.
- Implementar búsqueda y filtros avanzados.
- Agregar exportación de reportes (Excel, PDF).

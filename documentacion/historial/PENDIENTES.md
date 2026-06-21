# Tareas Pendientes

## Estado Actual del Proyecto (19/06/2026)

### Completado
- [x] Estructura base del proyecto (backend + frontend + documentación).
- [x] Backend NestJS con Clean Architecture.
- [x] Módulo de Productos (CRUD completo con persistencia PostgreSQL + Prisma).
- [x] Módulo de Compras (CRUD + incremento de stock + movimientos ENTRY).
- [x] Módulo de Ventas (CRUD + descuento de stock + validación de existencia + movimientos EXIT).
- [x] Módulo de Pacientes (CRUD base).
- [x] Módulo de Paquetes/Combos (creación + venta con descuento de inventario).
- [x] Historial de movimientos (Kardex) para cada producto.
- [x] Migración completa de JSON a PostgreSQL con Prisma ORM.
- [x] Validaciones: código único, stock no negativo, cantidades válidas.
- [x] Validación de datos con DTOs y class-validator.
- [x] Frontend React + Vite + TypeScript + TailwindCSS v4.
- [x] React Router con navegación sidebar.
- [x] Página de Inventario funcional (tabla, buscador, CRUD, validaciones, API).
- [x] Proxy inverso Vite con todas las rutas API.
- [x] Documentación de arquitectura, requerimientos y manuales.
- [x] Pruebas funcionales automatizadas (23 tests, 0 fallos).
- [x] Stock actual y mínimo como enteros (sin decimales).
- [x] Búsqueda de producto por código o nombre en compras.
- [x] Campo N° Factura Proveedor en compras.
- [x] Búsqueda y autocompletado de proveedor en compras.
- [x] Reemplazo de Pacientes por Terceros (CLIENTE, PROVEEDOR, CLIENTE_PROVEEDOR).
- [x] Compras asociadas a proveedores (Terceros tipo PROVEEDOR).
- [x] Ventas asociadas a clientes (Terceros tipo CLIENTE).
- [x] Consecutivo automático en ventas (comprobante interno).

### En Progreso
- (ninguno)

### No Iniciado
- [ ] Dashboard Gerencial (indicadores y gráficos).
- [ ] Alertas de Inventario (stock mínimo).
- [ ] Autenticación y autorización (JWT).
- [ ] Tests unitarios y e2e formales.
- [ ] CI/CD.
- [ ] Paginación en listados.
- [ ] Exportación de reportes (Excel, PDF).

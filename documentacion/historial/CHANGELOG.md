# Historial de Cambios

## [2.0.0] - 2026-06-19

### Cambios Mayores
- **Eliminado** módulo Pacientes. Reemplazado por **Terceros**.
- **Nuevo** módulo Terceros: entidad única para CLIENTE, PROVEEDOR y CLIENTE_PROVEEDOR.
- **Compras**: ahora se asocian a un Tercero de tipo PROVEEDOR o CLIENTE_PROVEEDOR.
- **Ventas**: ahora se asocian a un Tercero de tipo CLIENTE o CLIENTE_PROVEEDOR.
- **Ventas**: generación automática de consecutivo interno (comprobante).
- **Eliminado** el concepto independiente de Facturación: cada venta es el comprobante interno.
- **Eliminados** los campos `patientId` y `paciente` de Compras y Ventas.
- **Actualizado** el modelo Package.sellPackage para usar `terceroId`.

### Añadido
- Modelo `Tercero` en Prisma con campos: tipoRelacion, tipoPersona, tipoDocumento, numeroDocumento (único), nombres, apellidos, razonSocial, direccion, ciudad, departamento, telefono, email, observaciones, activo.
- CRUD completo de Terceros (backend + frontend).
- Validación de tipo de relación al crear compras (PROVEEDOR) y ventas (CLIENTE).
- Frontend: Página de Ventas con modal de registro y tabla de comprobantes.
- Frontend: Página de Terceros con formulario dinámico (Natural vs Jurídica).
- Sidebar actualizada: reemplazado "Pacientes" y "Facturación" por "Terceros".

### Eliminado
- Módulo Pacientes completo (domain, application, infrastructure, presentation).
- Tabla `Patient` de la base de datos.
- Columnas `patientId` y `paciente` de las tablas `Purchase` y `Sale`.
- Ruta `/pacientes` y `/facturacion` del frontend.
- Proxy `/patients` de vite.config.ts.

## [1.1.0] - 2026-06-19

### Añadido
- Campo `facturaNumero` (N° Factura Proveedor) en el módulo de Compras.
- Búsqueda de proveedor con autocompletado desde proveedores existentes.
- Búsqueda de producto por código o nombre en el modal de compras (reemplaza lista desplegable).

### Modificado
- `ProductModal`: inputs de stock (`stockActual`, `stockMinimo`) usan `step="1"` para solo aceptar enteros.
- `NumberField`: acepta prop `step` opcional para controlar incrementos.
- Backend DTOs: `stockActual` y `stockMinimo` validados con `@IsInt()`.

### Corregido
- `prisma.config.js`: reescrito como CommonJS para compatibilidad con Prisma v7.
- Archivos `prisma.config.*` de respaldo eliminados.

## [1.0.0] - 2026-06-19

### Añadido
- Migración completa de persistencia JSON a PostgreSQL mediante Prisma ORM.
- Instalación y configuración de `prisma` y `@prisma/client` versión 7.8.0.
- Configuración de `prisma/schema.prisma` con todos los modelos del sistema.
- `PrismaService` y `PrismaModule` como capa de infraestructura global.
- Driver adapter `@prisma/adapter-pg` para conexión directa a PostgreSQL.

### Modelos Creados
- **Product**: Gestión de productos con campos completos (código único, stock, precios, etc.).
- **Patient**: Base para ventas a pacientes (documento, nombres, contacto).
- **Purchase**: Compras/entradas de almacén con detalle de productos.
- **PurchaseDetail**: Detalle de productos en cada compra.
- **Sale**: Ventas/salidas de almacén con detalle de productos.
- **SaleDetail**: Detalle de productos en cada venta (soporta venta directa y por paquete).
- **Package**: Paquetes/combos de productos.
- **PackageDetail**: Productos que componen cada paquete.
- **InventoryMovement**: Kardex de inventario (ENTRY/EXIT con stock antes/después).

### Repositorios
- ProductPrismaRepository (reemplaza ProductJsonRepository)
- PatientPrismaRepository
- PurchasePrismaRepository
- SalePrismaRepository
- PackagePrismaRepository
- InventoryMovementPrismaRepository

### Módulos Implementados
- ProductModule (CRUD + control de stock)
- PatientModule (CRUD base)
- PurchaseModule (registro de compras + incremento automático de stock + movimiento ENTRY)
- SaleModule (registro de ventas + descuento automático de stock + movimiento EXIT + validación de stock)
- PackageModule (CRUD de paquetes + venta de paquete con descuento de inventario)
- InventoryMovementModule (consulta de movimientos por producto y global)

### Frontend
- Actualizado `vite.config.ts` con proxies para todas las nuevas rutas API.

### Migraciones
- Migración inicial `0001_init` generada y aplicada.
- Esquema de base de datos sincronizado mediante `prisma db push`.

### Corregido
- Error de compilación en `product.service.ts`: agregados campos `createdAt` y `updatedAt`.
- Configuración de compilación `tsconfig.build.json` para excluir `prisma.config.ts`.

## [0.2.0] - 2026-06-15

### Añadido
- Frontend: React Router con navegación sidebar.
- Frontend: Página de Inventario funcional con tabla, buscador, y CRUD completo.
- Frontend: Modal de producto con validaciones.
- Frontend: API service para comunicación con backend.
- Backend: Campos de producto actualizados (codigo, costoCompra, precioVenta, activo booleano).
- Backend: Inyección de dependencia corregida con token string.

### Corregido
- Frontend: Error CORS eliminado. Reemplazado por proxy inverso de Vite (`/products` → `localhost:3000`).
- Frontend: Error "Product with ID undefined" por clausura obsoleta. Reemplazado por estado único `modalProduct`.
- Frontend: Warning "missing key prop" por producto sin `id` en JSON. Añadido fallback con índice.
- Backend: CORS habilitado en `main.ts` (respaldo).
- Backend: ValidationPipe global agregado con `class-transformer`.
- Backend: Ruta de archivo JSON corregida a `data/productos.json`.

## [0.1.0] - 2026-06-15

### Añadido
- Backend NestJS con Clean Architecture (capas: domain, application, infrastructure, presentation).
- Módulo de Productos completo (CRUD + control de stock).
- Persistencia JSON en `data/productos.json`.
- Validación de datos con class-validator.
- Frontend React con Vite + TypeScript + TailwindCSS v4.
- Página principal de SueroControl con módulos de navegación.
- Documentación de arquitectura, requerimientos y manuales base.

### Corregido
- Error de compilación TS1272: tipo de interfaz usado en firma decorada.
- Error de compilación TS2322: tipo incompatible entre entidad y DTO para estado de producto.
- Error de compilación TS2693: uso de interfaz como token de inyección en NestJS.
- Ruta incorrecta en README.md (`backend/suerocontrol-backend` → `backend`).
- Frontend: template por defecto de Vite reemplazado con interfaz de SueroControl.
- Frontend: TailwindCSS v4 configurado con plugin de Vite.
- Frontend: título del HTML actualizado.

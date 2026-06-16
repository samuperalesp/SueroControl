# Historial de Cambios

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

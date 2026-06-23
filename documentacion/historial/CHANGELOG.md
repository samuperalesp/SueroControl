# Historial de Cambios

## [5.1.0] - 2026-06-23

### Corrección de Cálculos del Dashboard

#### Problema
- `gananciaCentro` siempre mostraba 0 porque se leía del campo `Sale.gananciaCentro`, el cual nunca se establece al crear una venta.
- `costosTotales` siempre mostraba 0 porque se leía de `Sale.costoTotal`, que tampoco se establece.
- `utilidadTotal` se calculaba como `ventasTotales - costosTotales`, dando un resultado incorrecto.

#### Solución
- **gananciaCentro**: ahora se calcula como la suma de `SalePackage.gananciaCentro` de todos los paquetes vendidos en ventas activas.
- **comprasTotales**: renombrado desde `costosTotales`. Se calcula como la suma de `Purchase.total` donde `tipo = 'COMPRA'`.
- **utilidadTotal**: ahora se calcula como la suma de `SalePackage.utilidad` de todos los paquetes vendidos, reflejando la utilidad real.
- **Top Médicos**: Unificado con la misma consulta de SalePackage para evitar llamadas duplicadas a la base de datos.

#### Fórmulas implementadas
```
Ventas Totales    = SUM(Sale.total) WHERE estado = 'ACTIVA'
Compras Totales   = SUM(Purchase.total) WHERE tipo = 'COMPRA'
Ganancia Centro   = SUM(SalePackage.gananciaCentro) WHERE sale.estado = 'ACTIVA'
Utilidad Total    = SUM(SalePackage.utilidad) WHERE sale.estado = 'ACTIVA'
Top Médicos       = SUM(SalePackage.gananciaMedico) GROUP BY medicoId ORDER BY total DESC
```

#### Frontend
- Renombrada tarjeta "Costos Totales" → "Compras Totales".
- Subtítulo actualizado de "Costo de medicamentos e insumos" → "Compras realizadas".
- Tipo `DashboardSummary` actualizado: `costosTotales` → `comprasTotales`.

## [5.0.0] - 2026-06-22

### Conexión Completa Paquetes ↔ Ventas + Script de Limpieza

#### Integración Paquetes en Ventas
- **Backend**: `SaleService.create()` ahora acepta `packageId` en los detalles, procesando la venta de paquetes: valida stock de componentes, descuenta inventario de cada producto componente, crea snapshot de rentabilidad (`SalePackage`) y registra movimientos de inventario.
- **Backend**: `SaleService.cancel()` restaura stock de todos los productos componentes al anular una venta con paquete.
- **Backend**: `SaleService.getComprobante()` muestra "Paquete: {nombre}" en lugar del ID genérico.
- **Backend**: `SaleDetailDto` añade campo opcional `packageId`.
- **Backend**: `SaleModule` inyecta `PACKAGE_REPOSITORY` y `SALE_PACKAGE_REPOSITORY`.
- **Frontend**: Ventana de nueva venta con selector de tipo (Producto/Paquete) por cada línea, búsqueda de paquetes por nombre, visualización de componentes del paquete seleccionado.
- **Frontend**: `SaleDetailDto` actualizado con `packageId` opcional.
- **Validación**: No permite vender paquete si algún componente no tiene stock suficiente. Mensaje claro indicando producto, stock disponible y requerido.

#### Script de Limpieza de Datos de Prueba
- **Nuevo**: `backend/scripts/reset-test-data.ts` — script reutilizable que elimina todos los datos transaccionales y de prueba de la base de datos, conservando únicamente los usuarios del sistema.
- **Nuevo**: Comando `npm run clean-data` para ejecutar la limpieza.
- **Seguridad**: Solicita confirmación escrita ("BORRAR") antes de ejecutar. Bloquea ejecución en entorno de producción.
- **Reporte**: Al finalizar muestra registros eliminados por tabla y total general.

## [4.0.0] - 2026-06-22

### Ampliación del Modelo de Negocio: Médicos y Liquidación de Utilidades

#### Cambios Mayores
- **Nuevo tipo de tercero MEDICO**: la entidad Terceros ahora soporta el rol de médico.
- **Asociación médico-venta**: cada venta queda asociada al médico que ordenó el tratamiento.
- **Cálculo individual de utilidad médica**: la utilidad se acumula individualmente por médico, no de forma global.
- **Snapshot histórico en venta de paquetes**: SalePackage ahora guarda el médico responsable, porcentajes aplicados y valores calculados al momento de la venta.
- **Dashboard actualizado**: se eliminó la tarjeta "Ganancia Médicos Total" y se reemplazó por "Top Médicos por Utilidad" con ranking individual.

#### Modelos Modificados
- **Tercero**: nuevo campo `registroProfesional` (opcional para médicos). Nuevas relaciones `medicoSales` (ventas como médico) y `salePackagesMedico` (snapshots de paquetes vendidos como médico).
- **Sale**: nuevo campo `medicoId` (obligatorio) que asocia la venta al médico responsable. Nueva relación `medico` con Tercero.
- **SalePackage**: nuevo campo `medicoId` para snapshot histórico del médico asociado al paquete vendido.

#### Backend
- DTOs actualizados: `CreateTerceroDto` acepta `MEDICO` como tipoRelación y `registroProfesional`. `CreateSaleDto` requiere `medicoId` obligatorio.
- `SaleService.create()`: valida que el médico exista y sea de tipo MEDICO.
- `PackageService.sellPackage()`: acepta y valida `medicoId`, lo persiste en Sale y SalePackage.
- `DashboardService.getSummary()`: ya no suma `gananciaMedicos` global. Calcula `topMedicos` agregando `gananciaMedico` del SalePackage agrupado por `medicoId`, ordenado de mayor a menor.
- `PackageModule` y `SaleModule`: inyectan `TERCERO_REPOSITORY` para validación de médicos.

#### Frontend
- **Página Terceros**: nueva opción "Médico" en tipo de relación. Campo "Registro Profesional" visible solo para médicos. Columna "Reg. Prof." en la tabla.
- **Página Ventas**: nuevo selector obligatorio de médico al crear/editar ventas. Columna "Médico" en la tabla de ventas.
- **Página Paquetes**: nuevo selector obligatorio de médico en el modal de venta de paquete.
- **Dashboard**: tarjeta "Ganancia Médicos" reemplazada por "Top Médicos". Nuevo panel "Top Médicos por Utilidad" con ranking numerado (1-5) con medallas de colores (oro, plata, bronce). Sección de rentabilidad simplificada (ya no muestra distribución a médicos global).

#### Migraciones
- Esquema actualizado con `prisma db push`.
- Nuevos campos: `registroProfesional` en Tercero, `medicoId` en Sale y SalePackage.

## [3.1.0] - 2026-06-20

### Autenticación y Control de Acceso

#### Nuevo: Sistema de Autenticación JWT
- Implementación completa de autenticación mediante JSON Web Tokens (JWT).
- Hash de contraseñas con bcrypt (nunca se almacenan en texto plano).
- Login con usuario o correo electrónico.
- Mostrar/Ocultar contraseña en pantalla de login.
- Sesión persistente mediante localStorage (token JWT).
- Cierre de sesión manual con eliminación del token.

#### Nuevo: Modelo User
- Tabla `User` en PostgreSQL con campos: id, username, email, passwordHash, nombres, apellidos, rol, activo, ultimoAcceso, createdAt, updatedAt.
- Username único y email único (restricciones a nivel BD).
- Validación de usuario activo para permitir acceso.

#### Nuevo: Sistema de Roles
- **ADMINISTRADOR**: acceso completo a todos los módulos, gestión de usuarios, configuración del sistema.
- **OPERADOR**: ventas, terceros, consulta de inventario y paquetes.
- Protección de rutas backend mediante `@Roles()` decorator y `RolesGuard`.
- Protección de endpoints específicos según el rol.

#### Nuevo: Usuario Administrador Inicial
- Creación automática del primer usuario si no existen usuarios en la BD.
- Usuario: `admin` / Contraseña temporal: `Admin123*`.
- Contraseña almacenada cifrada con bcrypt.
- Se ejecuta al iniciar el backend (`OnModuleInit`).

#### Backend: Guards y Decorators
- `JwtAuthGuard`: guard global que protege todos los endpoints.
- `RolesGuard`: guard para restringir acceso por roles.
- `@Public()` decorator: marca endpoints públicos (login, health check).
- `@Roles()` decorator: especifica roles permitidos.
- `@CurrentUser()` decorator: obtiene el usuario autenticado desde el request.

#### Backend: Nuevos Módulos
- `AuthModule`: login, JWT strategy, guard global, seed de admin.
- `UserModule`: CRUD de usuarios (solo ADMINISTRADOR).

#### Frontend: Pantalla de Login
- Diseño profesional con gradiente azul.
- Campos: usuario/correo y contraseña.
- Botón Mostrar/Ocultar contraseña.
- Manejo de errores (credenciales inválidas, error de conexión).
- Redirección automática al dashboard tras login exitoso.

#### Frontend: Protección de Rutas
- `ProtectedRoute` component: redirige a `/login` si no hay sesión.
- `AuthContext` y `AuthProvider`: estado global de autenticación.
- Todas las rutas internas protegidas: Dashboard, Inventario, Compras, Ventas, Paquetes, Terceros.

#### Frontend: Barra Superior
- Nombre del usuario autenticado y rol en la barra superior.
- Botón "Cerrar Sesión" en la barra superior.
- Información del usuario en el sidebar.

#### Frontend: API Helper
- `apiFetch` wrapper que incluye automáticamente el token JWT en todas las solicitudes.
- Manejo de sesión expirada (redirección automática a login al recibir 401).

#### Dependencias Nuevas
- Backend: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`.
- Backend dev: `@types/passport-jwt`, `@types/bcrypt`.

### Migraciones
- Tabla `User` agregada mediante `prisma db push`.

## [3.0.0] - 2026-06-20

### Modelo de Rentabilidad para Paquetes y Ventas

#### Cambios Mayores
- **Modelo de negocio implementado**: rentabilidad real sobre paquetes de sueroterapia.
- **Cálculo automático** de utilidad y distribución médico/centro.
- **Costos operativos** agregados al cálculo (aplicación, domicilio, materiales, etc.).
- **Snapshot histórico** de costos al momento de la venta (los cálculos no cambian aunque los costos de productos varíen).

#### Modelos Nuevos
- **PackageOperatingCost**: costos operativos asociados a cada paquete (concepto, valor).
- **SalePackage**: snapshot de rentabilidad por venta de paquete (precioVenta, costoMedicamentos, costoOperativo, costoTotal, utilidad, gananciaMedico, gananciaCentro).

#### Tablas Modificadas
- **Package**: nuevos campos `descripcion`, `porcentajeMedico` (default 70), `porcentajeCentro` (default 30).
- **Sale**: nuevos campos `costoTotal`, `utilidadTotal`, `gananciaMedico`, `gananciaCentro`.
- **SaleDetail**: soporte para `productId` opcional (cuando se vende paquete, se crea un detail con `packageId` sin `productId`).

#### Módulo Paquetes Actualizado
- CRUD de paquetes con descripción, porcentajes configurables médico/centro.
- Validación automática: suma de porcentajes debe ser 100%.
- Componentes del paquete: productos con cantidad.
- Costos operativos: concepto + valor.
- Vista previa de rentabilidad en tiempo real (costo medicamentos, costo operativo, costo total, utilidad, ganancias).
- Venta de paquete: descuenta inventario, calcula automáticamente utilidad y distribución, guarda snapshot histórico.

#### Dashboard
- Nuevo endpoint `GET /dashboard` con datos reales desde PostgreSQL.
- Cuatro tarjetas principales:
  - Ventas Totales (valor acumulado en COP)
  - Costos Totales (suma de costos reales)
  - Ganancia Médicos (valor acumulado)
  - Ganancia Centro (valor acumulado)
- Resumen de rentabilidad y distribución.
- Sin datos simulados, todos los cálculos desde PostgreSQL.

#### Frontend
- **Nueva página Paquetes** (`/paquetes`): tabla con rentabilidad visible, modal de creación/edición con vista previa, modal de venta con selección de cliente, cálculo en tiempo real.
- **Dashboard actualizado**: tarjetas financieras reales con formato COP, resumen de rentabilidad.
- **Sidebar**: agregado enlace "Paquetes".
- **Tipos TypeScript**: actualizados `Sale`, agregados `Package`, `PackageOperatingCost`.

#### Arquitectura Preparada para Reportes Futuros
- Rentabilidad por paquete.
- Rentabilidad por médico.
- Rentabilidad por período.
- Rentabilidad por paciente.
- Liquidación de médicos.
- Ranking de paquetes más rentables.
- Endpoint `GET /packages/profitability/:id` ya implementado para consultas de rentabilidad por paquete.

### Backend
- Nuevo módulo `DashboardModule` con `DashboardController` y `DashboardService`.
- Nuevo repositorio `SalePackagePrismaRepository`.
- Valores se almacenan en la BD al momento de la venta (no se recalculan).
- `SalePackage` guarda precioVenta, costos, utilidad, porcentajes y ganancias como snapshot.

### Migraciones
- Esquema actualizado con `prisma db push`.
- 3 nuevas tablas: `PackageOperatingCost`, `SalePackage`, más campos en `Package` y `Sale`.

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

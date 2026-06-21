# Arquitectura del Sistema

## Pila Tecnológica

- **Backend:** Node.js + TypeScript + NestJS
- **Frontend:** React + Vite + TypeScript + TailwindCSS
- **Persistencia:** PostgreSQL + Prisma ORM v7 (@prisma/client + @prisma/adapter-pg)
- **Driver:** pg (node-postgres)

## Principios de Diseño

- **Arquitectura Limpia (Clean Architecture):** El sistema se organiza en capas concéntricas, donde las dependencias fluyen hacia adentro.

    - **Domain Layer (Capa de Dominio):** Contiene las entidades, interfaces de repositorio y lógica de negocio central (use cases). Es completamente independiente de los detalles de implementación de la base de datos o la interfaz de usuario.
    - **Application Layer (Capa de Aplicación):** Contiene los servicios de aplicación (application services) que orquestan los use cases del dominio. Depende de la capa de dominio.
    - **Infrastructure Layer (Capa de Infraestructura):** Contiene las implementaciones concretas de los repositorios (Prisma), PrismaService, PrismaModule, etc. Depende de la capa de aplicación y de dominio.
    - **Presentation Layer (Capa de Presentación):** Contiene los controladores (en el caso de NestJS) o componentes de UI (en el caso de React). Depende de la capa de aplicación.

- **Patrón de Repositorio (Repository Pattern):** Se utiliza para desacoplar la lógica de negocio de la capa de persistencia de datos. Las interfaces de repositorio se definen en la capa de dominio, y sus implementaciones concretas se encuentran en la capa de infraestructura (Prisma).

- **Inyección de Dependencias (Dependency Injection):** Se utiliza en todos los módulos de NestJS para gestionar las dependencias entre componentes, facilitando la modularidad y la capacidad de prueba.

## Estructura de Directorios

```
SueroControl/
├── backend/                     # Proyecto NestJS
│   ├── prisma/
│   │   ├── schema.prisma        # Modelos de datos (13 modelos)
│   │   ├── migrations/          # Migraciones generadas
│   │   │   └── 0001_init/
│   │   │       └── migration.sql
│   ├── src/
│   │   ├── domain/              # Entidades, interfaces de repositorio
│   │   │   ├── product/
│   │   │   ├── user/
│   │   │   ├── tercero/
│   │   │   ├── purchase/
│   │   │   ├── sale/
│   │   │   ├── package/
│   │   │   └── inventory-movement/
│   │   ├── application/         # Servicios de aplicación, DTOs
│   │   │   ├── product/
│   │   │   ├── auth/
│   │   │   ├── tercero/
│   │   │   ├── purchase/
│   │   │   ├── sale/
│   │   │   ├── package/
│   │   │   ├── inventory-movement/
│   │   │   └── dashboard/
│   │   ├── infrastructure/      # Implementaciones de repositorios (Prisma)
│   │   │   ├── prisma/
│   │   │   │   ├── prisma.service.ts
│   │   │   │   └── prisma.module.ts
│   │   │   ├── auth/
│   │   │   │   ├── strategies/
│   │   │   │   ├── guards/
│   │   │   │   └── decorators/
│   │   │   ├── user/repositories/
│   │   │   ├── product/repositories/
│   │   │   ├── tercero/repositories/
│   │   │   ├── purchase/repositories/
│   │   │   ├── sale/repositories/
│   │   │   ├── package/repositories/
│   │   │   ├── sale-package/repositories/
│   │   │   └── inventory-movement/repositories/
│   │   ├── presentation/        # Controladores (APIs REST)
│   │   │   ├── product/controllers/
│   │   │   ├── auth/controllers/
│   │   │   ├── user/controllers/
│   │   │   ├── tercero/controllers/
│   │   │   ├── purchase/controllers/
│   │   │   ├── sale/controllers/
│   │   │   ├── package/controllers/
│   │   │   ├── dashboard/controllers/
│   │   │   └── inventory-movement/controllers/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── auth.module.ts
│   │   ├── user.module.ts
│   │   ├── product.module.ts
│   │   ├── tercero.module.ts
│   │   ├── purchase.module.ts
│   │   ├── sale.module.ts
│   │   ├── package.module.ts
│   │   ├── dashboard.module.ts
│   │   └── inventory-movement.module.ts
│   ├── dist/
│   ├── node_modules/
│   ├── prisma.config.js
│   ├── .env                     # DATABASE_URL + PORT
│   ├── package.json
│   └── tsconfig.json
├── frontend/                    # Proyecto React + Vite + TailwindCSS
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   ├── context/             # AuthContext (estado global de autenticación)
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/
│   │   └── types/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── data/                        # Archivos JSON legacy (ya no se usan)
├── documentacion/
│   ├── arquitectura/
│   ├── historial/
│   ├── requerimientos/
│   └── manuales/
├── README.md
└── .gitignore
```

## Modelos de Datos (Prisma) — 13 modelos

### User
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | ID único |
| username | String (único) | Nombre de usuario |
| email | String (único) | Correo electrónico |
| passwordHash | String | Hash de contraseña (bcrypt) |
| nombres | String | Nombres del usuario |
| apellidos | String | Apellidos del usuario |
| rol | String | ADMINISTRADOR o OPERADOR |
| activo | Boolean | Estado activo/inactivo |
| ultimoAcceso | DateTime? | Último inicio de sesión |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

### Product
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | ID único |
| codigo | String (único) | Código de producto |
| nombre | String | Nombre del producto |
| categoria | String | Categoría |
| descripcion | String | Descripción |
| costoCompra | Float | Costo de compra |
| precioVenta | Float | Precio de venta |
| stockActual | Int | Stock actual |
| stockMinimo | Int | Stock mínimo |
| activo | Boolean | Estado activo/inactivo |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

### Tercero
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | ID único |
| tipoRelacion | String | CLIENTE, PROVEEDOR o CLIENTE_PROVEEDOR |
| tipoPersona | String | NATURAL o JURIDICA |
| tipoDocumento | String | Tipo de documento (DNI, RUC, CE) |
| numeroDocumento | String (único) | Número de documento |
| nombres | String? | Nombres (Persona Natural) |
| apellidos | String? | Apellidos (Persona Natural) |
| razonSocial | String? | Razón Social (Persona Jurídica) |
| direccion | String? | Dirección |
| ciudad | String? | Ciudad |
| departamento | String? | Departamento |
| telefono | String? | Teléfono principal |
| email | String? | Correo electrónico |
| observaciones | String? | Observaciones |
| activo | Boolean | Estado activo/inactivo |

### Purchase / PurchaseDetail
- Compra con múltiples detalles (producto, cantidad, costo unitario).
- Asociada a un Tercero de tipo PROVEEDOR o CLIENTE_PROVEEDOR.
- Soporta pedidos (PEDIDO) y facturas de compra (COMPRA) mediante campo `tipo`.
- Conversión de PEDIDO a COMPRA vía `PUT /purchases/:id/convert` (incrementa stock y registra movimientos).
- `facturaNumero`: número de factura del proveedor (opcional).
- Al registrar COMPRA: incrementa stock + crea InventoryMovement tipo ENTRY.
- Al registrar PEDIDO: no afecta stock.

### Sale / SaleDetail
- Venta con múltiples detalles (producto, cantidad, precio unitario).
- Asociada a un Tercero de tipo CLIENTE o CLIENTE_PROVEEDOR.
- `consecutivo`: número de comprobante interno auto-generado.
- Soporta venta directa y venta por paquete (campo packageId opcional).
- Cada venta genera automáticamente el comprobante (no existe módulo de facturación separado).
- Al registrar: descuenta stock + valida existencia + crea InventoryMovement tipo EXIT.

### Package / PackageDetail / PackageOperatingCost
- Paquete compuesto por múltiples productos con cantidades.
- `porcentajeMedico` (default 70) y `porcentajeCentro` (default 30) para distribución de utilidad.
- Costos operativos asociados (aplicación, domicilio, materiales, etc.).
- Al vender: descuenta stock de cada producto, calcula automáticamente utilidad y distribución, guarda snapshot histórico en SalePackage.
- Vista previa de rentabilidad en tiempo real.

### SalePackage
- Snapshot histórico de rentabilidad por venta de paquete.
- Almacena precioVenta, costoMedicamentos, costoOperativo, costoTotal, utilidad, porcentajes y ganancias.
- Los cálculos no cambian aunque varíen los costos de productos posteriormente.

### Dashboard
- Endpoint `GET /dashboard` con datos reales desde PostgreSQL.
- Ventas Totales, Costos Totales, Ganancia Médicos, Ganancia Centro.
- Todos los cálculos provienen de la base de datos (sin datos simulados).

### InventoryMovement (Kardex)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | ID único |
| productId | UUID | Producto relacionado |
| movementType | String | ENTRY o EXIT |
| quantity | Int | Cantidad movida |
| stockBefore | Int | Stock antes del movimiento |
| stockAfter | Int | Stock después del movimiento |
| referenceType | String | PURCHASE, SALE, PACKAGE_SALE |
| referenceId | String | ID de la referencia |
| createdAt | DateTime | Fecha del movimiento |

## Flujo de Datos

1. **Petición (Presentation Layer - Controllers):** Un controlador recibe una petición HTTP.
2. **Validación y Mapeo (Application Layer - DTOs):** El controlador valida los datos de entrada usando DTOs y los mapea a los objetos de dominio si es necesario.
3. **Lógica de Negocio (Application Layer - Services):** El controlador invoca un método en un servicio de aplicación, pasando los DTOs. El servicio contiene la lógica de negocio y orquesta las operaciones.
4. **Persistencia de Datos (Infrastructure Layer - Repositories):** El servicio utiliza la interfaz del repositorio (definida en la capa de dominio) para interactuar con PostgreSQL a través de Prisma ORM.
5. **Respuesta (Presentation Layer):** El servicio devuelve los resultados al controlador, que los formatea como respuesta HTTP.

## Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /products | Listar productos |
| POST | /products | Crear producto |
| GET | /products/:id | Obtener producto |
| PUT | /products/:id | Actualizar producto |
| DELETE | /products/:id | Eliminar producto |
| GET | /terceros | Listar terceros |
| POST | /terceros | Crear tercero |
| GET | /terceros/:id | Obtener tercero |
| PUT | /terceros/:id | Actualizar tercero |
| DELETE | /terceros/:id | Eliminar tercero |
| GET | /purchases | Listar compras |
| POST | /purchases | Registrar compra |
| GET | /purchases/:id | Obtener compra |
| PUT | /purchases/:id/convert | Convertir pedido a compra |
| GET | /sales | Listar ventas |
| POST | /sales | Registrar venta |
| GET | /sales/:id | Obtener venta |
| GET | /packages | Listar paquetes |
| POST | /packages | Crear paquete |
| GET | /packages/:id | Obtener paquete |
| PUT | /packages/:id | Actualizar paquete |
| DELETE | /packages/:id | Eliminar paquete |
| POST | /packages/:id/sell | Vender paquete (calcula utilidad + distribución automáticamente) |
| GET | /packages/profitability/:id | Rentabilidad histórica de un paquete |
| GET | /dashboard | Dashboard: ventas totales, costos, ganancias médico/centro |
| POST | /auth/login | Iniciar sesión (público) |
| POST | /auth/init | Verificar inicialización (público) |
| GET | /users | Listar usuarios (solo ADMINISTRADOR) |
| POST | /users | Crear usuario (solo ADMINISTRADOR) |
| GET | /users/:id | Obtener usuario (solo ADMINISTRADOR) |
| PUT | /users/:id | Actualizar usuario (solo ADMINISTRADOR) |
| DELETE | /users/:id | Eliminar usuario (solo ADMINISTRADOR) |
| GET | /inventory-movements | Listar movimientos |
| GET | /inventory-movements/product/:id | Movimientos por producto |

## Autenticación y Control de Acceso

### Flujo de Autenticación
1. El usuario ingresa usuario/correo y contraseña en la pantalla de Login.
2. El frontend envía `POST /auth/login` con las credenciales.
3. El backend valida las credenciales contra la tabla `User` usando bcrypt.
4. Si son válidas, genera un JWT con payload `{ sub, username, rol }` y expiración de 24h.
5. El frontend almacena el token y datos del usuario en localStorage.
6. Todas las solicitudes API incluyen el token en el header `Authorization: Bearer <token>`.
7. El backend valida el token en cada solicitud mediante `JwtAuthGuard` global y `JwtStrategy`.

### Guards y Decorators
- **@Public()**: Marca un endpoint como público (ej: login). Los endpoints sin este decorator requieren autenticación.
- **@Roles('ADMINISTRADOR')**: Restringe el acceso a usuarios con el rol especificado.
- **@CurrentUser()**: Obtiene el usuario autenticado desde el request.

### Roles
| Rol | Permisos |
|-----|----------|
| ADMINISTRADOR | Acceso completo a todos los módulos. CRUD de usuarios. Configuración del sistema. |
| OPERADOR | Ventas, Terceros, Consulta de inventario, Consulta de paquetes. |

### Usuario Inicial
- Si no existen usuarios en la BD, se crea automáticamente al iniciar el backend:
  - Usuario: `admin`
  - Contraseña: `Admin123*`
  - Rol: `ADMINISTRADOR`

## Control de Cambios

- `documentacion/historial/CHANGELOG.md`: Registro de todas las modificaciones importantes del proyecto.
- `documentacion/historial/MEJORAS.md`: Ideas y planes para futuras mejoras y refactorizaciones.
- `documentacion/historial/PENDIENTES.md`: Tareas y problemas actuales que necesitan atención.
- `documentacion/requerimientos/REQUERIMIENTOS.md`: Detalle de los requisitos funcionales y no funcionales.

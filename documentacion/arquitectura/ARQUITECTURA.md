# Arquitectura del Sistema

## Pila Tecnológica

- **Backend:** Node.js + TypeScript + NestJS
- **Frontend:** React + Vite + TypeScript + TailwindCSS
- **Persistencia Inicial:** JSON (archivos en `data/`). Preparado para migrar a SQLite con Prisma ORM.

## Principios de Diseño

- **Arquitectura Limpia (Clean Architecture):** El sistema se organiza en capas concéntricas, donde las dependencias fluyen hacia adentro.

    - **Domain Layer (Capa de Dominio):** Contiene las entidades, interfaces de repositorio y lógica de negocio central (use cases). Es completamente independiente de los detalles de implementación de la base de datos o la interfaz de usuario.
    - **Application Layer (Capa de Aplicación):** Contiene los servicios de aplicación (application services) que orquestan los use cases del dominio. Depende de la capa de dominio.
    - **Infrastructure Layer (Capa de Infraestructura):** Contiene las implementaciones concretas de los repositorios (JSON, preparado para Prisma), implementaciones de APIs externas, etc. Depende de la capa de aplicación y de dominio.
    - **Presentation Layer (Capa de Presentación):** Contiene los controladores (en el caso de NestJS) o componentes de UI (en el caso de React). Depende de la capa de aplicación.

- **Patrón de Repositorio (Repository Pattern):** Se utiliza para desacoplar la lógica de negocio de la capa de persistencia de datos. Las interfaces de repositorio se definen en la capa de dominio, y sus implementaciones concretas se encuentran en la capa de infraestructura (actualmente JSON, preparado para migrar a Prisma/SQLite).

- **Inyección de Dependencias (Dependency Injection):** Se utiliza en todos los módulos de NestJS para gestionar las dependencias entre componentes, facilitando la modularidad y la capacidad de prueba.

## Estructura de Directorios

```
SueroControl/
├── backend/                     # Proyecto NestJS
│   ├── src/
│   │   ├── domain/              # Entidades, interfaces de repositorio
│   │   │   └── product/
│   │   │       ├── entities/        # Definiciones de entidades
│   │   │       └── interfaces/      # Interfaces de repositorio
│   │   ├── application/         # Servicios de aplicación, DTOs
│   │   │   └── product/
│   │   │       ├── dtos/            # DTOs para entrada y salida
│   │   │       └── services/        # Lógica de negocio del módulo
│   │   ├── infrastructure/      # Implementaciones de repositorios (JSON)
│   │   │   └── product/
│   │   │       └── repositories/   # ProductJsonRepository
│   │   ├── presentation/        # Controladores (APIs REST)
│   │   │   └── product/
│   │   │       └── controllers/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   └── product.module.ts
│   ├── dist/                    # Compilación TypeScript
│   ├── node_modules/
│   ├── package.json
│   └── tsconfig.json
├── frontend/                    # Proyecto React + Vite + TailwindCSS
│   ├── src/
│   │   ├── App.tsx              # Router principal
│   │   ├── main.tsx             # Punto de entrada
│   │   ├── index.css            # TailwindCSS v4
│   │   ├── pages/               # Páginas (Inventory, etc.)
│   │   ├── components/          # Componentes reutilizables (Layout, ProductModal)
│   │   ├── api/                 # Servicios de API REST
│   │   └── types/               # Interfaces TypeScript
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts           # Proxy /products → localhost:3000
│   └── tsconfig.json
├── data/                        # Archivos de persistencia (JSON)
│   └── productos.json
├── documentacion/
│   ├── arquitectura/
│   │   └── ARQUITECTURA.md
│   ├── historial/
│   │   ├── CHANGELOG.md
│   │   ├── MEJORAS.md
│   │   └── PENDIENTES.md
│   ├── requerimientos/
│   │   └── REQUERIMIENTOS.md
│   └── manuales/
│       ├── MANUAL_USUARIO.md
│       └── MANUAL_TECNICO.md
├── README.md
└── .gitignore
```

## Flujo de Datos

1. **Petición (Presentation Layer - Controllers):** Un controlador recibe una petición HTTP.
2. **Validación y Mapeo (Application Layer - DTOs):** El controlador valida los datos de entrada usando DTOs y los mapea a los objetos de dominio si es necesario.
3. **Lógica de Negocio (Application Layer - Services):** El controlador invoca un método en un servicio de aplicación, pasando los DTOs. El servicio contiene la lógica de negocio y orquesta las operaciones.
4. **Persistencia de Datos (Infrastructure Layer - Repositories):** El servicio utiliza la interfaz del repositorio (definida en la capa de dominio) para interactuar con la fuente de datos. La implementación concreta del repositorio (en la capa de infraestructura) maneja los detalles de la persistencia (actualmente JSON, preparado para Prisma/SQLite).
5. **Respuesta (Presentation Layer):** El servicio devuelve los resultados al controlador, que los formatea como respuesta HTTP.

## Control de Cambios

- `documentacion/historial/CHANGELOG.md`: Registro de todas las modificaciones importantes del proyecto.
- `documentacion/historial/MEJORAS.md`: Ideas y planes para futuras mejoras y refactorizaciones.
- `documentacion/historial/PENDIENTES.md`: Tareas y problemas actuales que necesitan atención.
- `documentacion/requerimientos/REQUERIMIENTOS.md`: Detalle de los requisitos funcionales y no funcionales.

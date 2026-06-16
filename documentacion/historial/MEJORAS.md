# Mejoras Futuras

## Pendientes Técnicos
- Migrar persistencia JSON a SQLite con Prisma ORM (según arquitectura documentada).
- Implementar autenticación y autorización (JWT).
- Agregar validaciones y sanitización adicional en los DTOs.
- Implementar tests unitarios para servicios y repositorios.
- Implementar tests e2e para módulo de productos.
- Configurar CI/CD.

## Pendientes Funcionales
- Módulo de Compras: CRUD + incremento automático de stock.
- Módulo de Ventas: CRUD + descuento automático de stock.
- Módulo de Pacientes: CRUD + historial de compras.
- Módulo de Paquetes/Combos: productos compuestos.
- Facturación Interna: generación de comprobantes, impresión, exportación PDF.
- Dashboard Gerencial: indicadores y gráficos en tiempo real.
- Alertas de Inventario: notificaciones de stock mínimo.
- Historial de movimientos (Kardex) para cada producto.

## Optimizaciones
- Migrar a base de datos relacional (SQLite/PostgreSQL).
- Implementar carga diferida (lazy loading) en frontend.
- Agregar paginación en listados.
- Implementar búsqueda y filtros avanzados.
- Agregar exportación de reportes (Excel, PDF).

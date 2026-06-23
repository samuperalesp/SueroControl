# Mejoras Realizadas

## Implementado (v5.1.0)
- Dashboard: `gananciaCentro` ahora se calcula desde `SalePackage.gananciaCentro` (suma de paquetes vendidos), no desde `Sale.gananciaCentro`.
- Dashboard: "Costos Totales" renombrado a "Compras Totales". Ahora suma `Purchase.total` donde `tipo = 'COMPRA'`.
- Dashboard: `utilidadTotal` ahora suma `SalePackage.utilidad` (utilidad real de paquetes), no `ventas - costos`.
- Dashboard: consulta unificada de SalePackage para ganancia centro, utilidad total y top médicos (una sola llamada a BD).
- Manual técnico: agregada sección "Cálculos del Dashboard" con fórmulas documentadas.

## Implementado (v5.0.0)
- Ventas unificadas: paquetes y productos se venden desde el mismo flujo (POST /sales).
- Selector de tipo (Producto/Paquete) en cada línea de venta del frontend.
- Visualización de componentes del paquete al seleccionarlo en una venta.
- Al vender paquete: descuenta stock de cada producto componente, no del paquete.
- Validación de stock suficiente en todos los componentes antes de confirmar la venta.
- Anulación de venta con paquete: restaura stock de todos los componentes.
- Comprobante muestra nombre del paquete en lugar de ID genérico.
- Script de limpieza de datos de prueba (`npm run clean-data`) con confirmación y bloqueo de producción.

## Implementado (v4.0.0)
- Tipo de tercero MEDICO (registro profesional, nombres, apellidos, documento, contacto).
- Asociación obligatoria médico-venta (toda venta requiere médico).
- Asociación médico-paquete (al vender paquete se requiere médico).
- Cálculo individual de utilidad médica (acumulada por médico, no global).
- Snapshot histórico en SalePackage con médico, porcentajes y valores calculados.
- Dashboard: Top Médicos por Utilidad con ranking individual.
- Dashboard: Ganancia Centro acumulada globalmente (se mantiene).
- Preparación de arquitectura para reportes futuros (liquidación mensual, ventas por médico, comisiones, ranking).

## Implementado (v3.1.0)
- Autenticación JWT con login de usuarios.
- Hash de contraseñas con bcrypt.
- Sistema de roles (ADMINISTRADOR / OPERADOR).
- Usuario administrador inicial creado automáticamente (admin / Admin123*).
- Protección global de endpoints con JwtAuthGuard.
- Protección de rutas frontend con ProtectedRoute.
- Pantalla de login profesional con mostrar/ocultar contraseña.
- Barra superior con nombre de usuario, rol y cierre de sesión.
- API helper con token JWT automático en todas las solicitudes.

## Implementado (v3.0.0)
- Modelo de rentabilidad para paquetes (cálculo automático de utilidad y distribución médico/centro).
- Costos operativos por paquete (aplicación, domicilio, materiales, etc.).
- Snapshot histórico de costos al momento de la venta (no se recalcula).
- Dashboard gerencial con indicadores reales desde PostgreSQL.
- Vista previa de rentabilidad en creación/edición de paquetes.
- Página de Paquetes en frontend con CRUD completo y venta.
- Endpoint de rentabilidad por paquete para futuros reportes.
- Validación automática de porcentajes (suma = 100%).
- Formato COP en dashboard.

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

# Requerimientos del Sistema

## Requisitos Generales

- Proyecto modular, escalable y mantenible.
- Utilizar arquitectura limpia (Clean Architecture).
- Documentar todas las funcionalidades.
- Código limpio y comentado.
- Control de errores.
- Validaciones de formularios.
- Base de datos relacional.
- Preparar el sistema para futuras ampliaciones.

## Gestión del Proyecto y Memoria de Cambios

- Estructura de directorios obligatoria:
    - /documentacion
    - /documentacion/historial
    - /documentacion/requerimientos
    - /documentacion/manuales
- Archivos obligatorios en la raíz: CHANGELOG.md, MEJORAS.md, REQUERIMIENTOS.md, ARQUITECTURA.md, PENDIENTES.md.
- Registro de modificaciones: fecha y hora, archivo, funcionalidad agregada, funcionalidad corregida, impactos, pendientes futuros.

## Módulo de Inventario

### Campos de Producto:
- Código interno
- Nombre
- Categoría
- Descripción
- Unidad de medida
- Costo de compra
- Precio de venta
- Stock actual
- Stock mínimo
- Estado activo/inactivo

### Funciones:
- Crear producto
- Editar producto
- Eliminar producto
- Consultar producto
- Kardex de movimientos
- Historial completo

## Módulo de Compras

### Datos de Compra:
- Número de factura
- Fecha
- Proveedor
- Observaciones

### Detalle de Compra:
- Producto
- Cantidad
- Valor unitario
- Valor total

### Acciones al Guardar:
- Incrementar stock automáticamente.
- Registrar movimiento de inventario tipo ENTRADA.
- Actualizar costo promedio del producto.
- Generar historial completo de compras.

## Módulo de Ventas

### Datos de Venta:
- Fecha
- Paciente
- Documento
- Teléfono
- Observaciones

### Detalle de Venta:
- Producto
- Cantidad
- Precio
- Descuento
- Total

### Acciones al Confirmar:
- Descontar stock automáticamente.
- Registrar movimiento de inventario tipo SALIDA.
- Actualizar estadísticas del dashboard.

## Módulo de Paquetes o Combos

- Crear paquetes compuestos por varios productos.
- Configuración: Nombre, Descripción, Precio de venta, Estado.
- Acciones al Vender: Descontar productos del inventario, registrar movimientos individuales, registrar venta de paquete.
- Validación de stock.

## Facturación Interna

- No implementar facturación electrónica.
- Crear comprobantes internos.
- Funciones: Generar, Imprimir, Exportar PDF, Consultar historial, Reimprimir.

### Datos Visibles:
- Consecutivo
- Fecha
- Paciente
- Productos vendidos
- Totales
- Observaciones

## Módulo de Pacientes

### Campos de Paciente:
- Tipo documento
- Número documento
- Nombres
- Apellidos
- Teléfono
- Correo
- Dirección
- Observaciones

### Funciones:
- Crear
- Editar
- Consultar
- Historial de compras

## Dashboard Gerencial

### Indicadores en Tiempo Real:
- Tarjetas: Total compras, Total ventas, Ganancia estimada, Productos activos, Productos agotados, Pacientes registrados.
- Gráficos: Ventas por mes, Compras por mes, Ganancias por mes, Productos más vendidos, Productos menos vendidos.
- Fórmula de Ganancia: Ventas - Costos de compra.
- Filtros: Día, Semana, Mes, Año, Rango de fechas.

## Alertas de Inventario

- Cada producto tendrá un stock mínimo.

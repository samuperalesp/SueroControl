# INFORME — FASE 13: ANÁLISIS DEL REPORTE DETALLADO DE GANANCIAS POR PROFESIONAL

Fecha: 15/09/2026
Alcance: análisis exclusivo. No se modificó ningún archivo, no se ejecutaron migraciones, no se insertó/actualizó/eliminó ningún dato. Solo consultas de lectura contra la BD real.

## 1. Fuentes de datos

| Modelo | Rol en el cálculo | Campos relevantes |
|---|---|---|
| `Sale` | Cabecera de la operación | `id`, `consecutivo`, `terceroId` (cliente/paciente), `medicoId` (profesional), `warehouseId`, `total`, `fechaVenta`, `estado`, `costoTotal?`, `utilidadTotal?`, `gananciaMedico?`, `gananciaCentro?`, `details[]` |
| `SaleDetail` | Líneas de la venta | `productId` \| `packageId`, `quantity`, `unitPrice`, `subTotal` (sin campo de descuento) |
| `SalePackage` | **Snapshot de rentabilidad** (fuente real de la ganancia profesional/centro) | `saleId`, `packageId`, `medicoId`, `precioVenta`, `costoMedicamentos`, `costoOperativo`, `costoTotal`, `utilidad`, `porcentajeMedico`, `porcentajeCentro`, `gananciaMedico`, `gananciaCentro`, `createdAt` |
| `Package` | Definición del paquete | `precio`, `porcentajeMedico`, `porcentajeCentro`, `details[]` (productos), `operatingCosts[]` |
| `PackageSession` | Paquete vendido por sesiones | `saleId`, `patientId`, `medicoId`, `packageId`, `cantidadSesiones`, `precioUnitario`, `subtotal`, `descuentoPorcentaje`, `descuentoValor`, `totalPagado`, `estado`, `fechaInicio`, `fechaVencimiento` |
| `SessionApplication` | Aplicación de una sesión (reconocimiento) | `packageSessionId`, `salePackageId`, `sesionNumero`, `fechaAplicacion`, `userId` |
| `Product` | Costo unitario | `costoCompra` (costo), `precioVenta` |
| `InventoryMovement` | Trazabilidad de stock | `referenceType` (`SALE`, `PACKAGE_SALE`, `SESSION_APPLICATION`, `CANCEL_SALE`), `quantity`, `warehouseId`, `referenceId` |
| `Tercero` | Profesional / paciente | profesional = `tipoRelacion='MEDICO'`; paciente/cliente = `'CLIENTE'`/`'CLIENTE_PROVEEDOR'` |

**No existe hoy un módulo/servicio de reportes por profesional.** Lo más cercano:

- `DashboardService.getSummary()` agrega `gananciaCentro`/`utilidad` y arma `topMedicos` desde `SalePackage`.
- `PackageService.getPackageProfitability()` agrega por **paquete**, no por profesional, y no filtra por almacén/estado.

### Dato clave: hay TRES caminos que generan `SalePackage`

| Camino | Dónde | ¿Crea SalePackage? | ¿Cuándo reconoce utilidad? | `referenceType` stock |
|---|---|---|---|---|
| A. Venta con ítem PACKAGE (página Ventas) | `SaleService.create` (`sale.service.ts:135-258`) | Sí, al vender | Al vender | `SALE` |
| B. `POST /packages/:id/sell` (página Paquetes) | `PackageService.sellPackage` (`package.service.ts:154-272`) | Sí, al vender | Al vender | `PACKAGE_SALE` |
| C. Paquete por sesiones | `PackageSessionService.create` + `applySession` (`package-session.service.ts:82-261`) | **No al crear**; sí **una por sesión** aplicada | En cada `applySession` | `SESSION_APPLICATION` |

Datos reales: `SALE`=1041 movs, `SESSION_APPLICATION`=360, `PACKAGE_SALE`=0 (camino B sin uso), `CANCEL_SALE`=0. 139 ventas con 1 `SalePackage` (camino A), 10 ventas con >1 `SalePackage` (camino C, 45 sesiones), 3 ventas solo producto.

## 2. Fórmula/regla actual de ganancia profesional

Se toma del snapshot almacenado en `SalePackage` (no se recalcula en reportes):

```
utilidad        = precioVenta − (costoMedicamentos + costoOperativo)
gananciaMedico  = utilidad × (porcentajeMedico / 100)
```

`precioVenta` y `costo*` se calculan así según el camino:

- **A (venta directa de paquete):** `precioVenta = unitPrice × packageQty` (unitPrice editable en la venta; por defecto `pkg.precio`); `costoMedicamentos = Σ producto.costoCompra × comp.quantity × packageQty`; `costoOperativo = Σ operatingCosts.valor` (completo).
- **B (`sellPackage`):** igual pero `precioVenta = pkg.precio`; además escribe `costoTotal/utilidadTotal/gananciaMedico/gananciaCentro` en `Sale`.
- **C (sesión):** `precioVenta = totalPagado / cantidadSesiones`; `costoMedicamentos = Σ costoCompra × comp.quantity` (una sesión); `costoOperativo = Σ operatingCosts.valor` **completo por cada sesión** (no se prorratea); `utilidad = precioSesion − costoTotal`.

> En A y C las columnas `Sale.gananciaMedico`/`gananciaCentro` **no** se llenan (quedan `null`); la única fuente fiable es `SalePackage`.

## 3. Fórmula/regla actual de utilidad/ganancia centro

```
gananciaCentro = utilidad × (porcentajeCentro / 100)
utilidadTotal  = utilidad
```

Misma base que el profesional, con `porcentajeCentro = 100 − porcentajeMedico` (validado en `PackageService.create/update`, `package.service.ts:88,119-133`). `SalePackage` guarda ambos porcentajes como snapshot, por lo que cambios posteriores del paquete no alteran el histórico.

## 4. Cómo se debe construir el RESUMEN por profesional

Base: **`SalePackage`** (cada registro = una operación de paquete/sesión reconocida), unido a `Sale` para almacén/estado/fecha y a `Tercero` para el nombre del profesional. Se agrega por `SalePackage.medicoId`:

| Columna | Origen |
|---|---|
| Profesional | `Tercero` de `SalePackage.medicoId` (`nombres + apellidos` / `razonSocial`) |
| Cantidad de operaciones | `count(SalePackage)` (o `count(distinct saleId)` si se quiere "ventas", no "sesiones" — decisión a definir) |
| Ingresos generados | `Σ SalePackage.precioVenta` |
| Costos | `Σ SalePackage.costoTotal` |
| Ganancia profesional | `Σ SalePackage.gananciaMedico` |
| Ganancia centro | `Σ SalePackage.gananciaCentro` |
| Total | `Σ SalePackage.utilidad` (equivale a profesional + centro) |

**Advertencia de alcance:** las **ventas de producto (sin paquete) no generan `SalePackage`** y por tanto **no producen ganancia profesional/centro** en la lógica actual. Si el reporte debe incluirlas, sería una fórmula nueva (no justificada por lo existente) y no debería inventarse.

## 5. Cómo se debe construir el DETALLE

Una fila por `SalePackage`, con contexto de la operación:

| Campo | Origen |
|---|---|
| Fecha | Según tipo: venta de paquete → `Sale.fechaVenta` (o `SalePackage.createdAt`); sesión → `SessionApplication.fechaAplicacion` / `SalePackage.createdAt` |
| Identificador | `Sale.consecutivo` (FV-xxxxxx); para sesión, `consecutivo` + `sesionNumero` |
| Tipo de operación | "Venta de paquete" / "Sesión de paquete" (y "Venta de producto" solo si se decide incluirla) |
| Paciente/cliente | `Sale.terceroId` / `PackageSession.patientId` → `Tercero` |
| Producto/paquete/sesión | `Package.nombre` vía `SalePackage.packageId`; para producto, `SaleDetail.productId` → `Product` |
| Cantidad | `SaleDetail.quantity` (paquete) o `1` (sesión); `SalePackage` **no** guarda cantidad |
| Ingreso | `SalePackage.precioVenta` |
| Descuento | Solo en sesiones: `PackageSession.descuentoValor / cantidadSesiones`; en venta directa el descuento es implícito en `unitPrice` y no se almacena |
| Costo | `SalePackage.costoTotal` (o desglose `costoMedicamentos` + `costoOperativo`) |
| Ganancia profesional | `SalePackage.gananciaMedico` |
| Ganancia centro | `SalePackage.gananciaCentro` |

## 6. Respuestas puntuales

1. **Identificación del profesional:** `Sale.medicoId` y `SalePackage.medicoId` (y `PackageSession.medicoId`), todos referenciando `Tercero.tipoRelacion='MEDICO'`. En ventas directas `medicoId` es obligatorio (`CreateSaleDto`, `sale.dtos.ts:28`); en `sellPackage` es opcional. Datos reales: 0 nulos.
2. **Ganancia profesional:** ver §2, `SalePackage.gananciaMedico` (snapshot).
3. **Ganancia centro:** ver §3, `SalePackage.gananciaCentro`.
4. **De `Sale`:** `warehouseId`, `estado`, `fechaVenta`, `terceroId`, `medicoId`, `consecutivo`, `total`; y `gananciaMedico/Centro` **solo** en el camino B.
5. **De `SalePackage`:** toda la rentabilidad (`precioVenta`, `costoMedicamentos`, `costoOperativo`, `costoTotal`, `utilidad`, porcentajes y ganancias) + `medicoId`, `packageId`, `createdAt`.
6. **De `PackageSession`:** descuento (`descuentoPorcentaje/Valor`, `totalPagado`), `cantidadSesiones`, `precioUnitario`, `subtotal`, paciente y estado del paquete por sesiones. `SessionApplication` aporta `fechaAplicacion` y el vínculo `salePackageId`.
7. **Costo del producto:** `Product.costoCompra` en el momento de la operación; el resultado agregado se congela en `SalePackage.costoMedicamentos`. No hay costo histórico por línea de producto.
8. **Descuentos:** solo el flujo de sesiones los modela explícitamente (`totalPagado`), reduciendo `precioSesion` y por ende la utilidad. En ventas directas no hay campo de descuento; se refleja bajando `unitPrice`.
9. **Ventas canceladas:** `SaleService.cancel` marca `estado='ANULADA'`, restaura stock y crea movimientos `CANCEL_SALE`, pero **no toca `SalePackage`**. El Dashboard las excluye porque filtra `sale.estado='ACTIVA'`. En cambio `SalePackageRepository.findAll()` (usado por `getPackageProfitability`) **no** filtra estado. Datos reales: 0 anuladas.
10. **Sin profesional:** el esquema lo permite (`medicoId?`); el reporte debería agruparlas como "Sin profesional" en lugar de descartarlas. Hoy no hay casos.
11. **Fecha por cálculo:** ventas/compras del Dashboard → `Sale.fechaVenta`/`Purchase.fechaCompra`; ganancia/utilidad/topMédicos → `SalePackage` filtrado por `sale.fechaVenta` (Fase 12); `SalePackage.createdAt` = instante real (venta o sesión); `SessionApplication.fechaAplicacion` = reconocimiento de sesión. `getPackageProfitability` usa `sp.createdAt` con comparación no inclusiva (bug existente a no replicar).
12. **warehouseId:** solo existe en `Sale`. `SalePackage`/`PackageSession`/`SessionApplication` no lo tienen → hay que unir a `Sale.warehouseId`.
13. **fromDate/toDate:** inclusivo; usar el mecanismo existente (`new Date(from+'T00:00:00')` / `new Date(to+'T00:00:00')`) para campos `@db.Date`, y `lte ...T23:59:59.999` para campos timestamp (`SalePackage.createdAt`, `SessionApplication.fechaAplicacion`).
14. **Sesiones:** la utilidad **NO** se reconoce al vender el paquete (`create` solo crea `Sale` + `PackageSession`). Se reconoce **en cada `applySession`**, que crea un `SalePackage` con `precioSesion = totalPagado/cantidadSesiones`, costos de una sesión y reparto de utilidad. Datos reales: 12 `PackageSession`, 45 `SessionApplication`, 0 inconsistencias entre sesiones aplicadas y `SalePackage`.

## 7. Archivos a modificar en la futura implementación

Backend (nuevo módulo `reports`, sin tocar los existentes):

- `backend/src/application/reports/dtos/professional-earnings.dtos.ts` (nuevo)
- `backend/src/application/reports/services/professional-earnings.service.ts` (nuevo; consultas de solo lectura vía `PrismaService`, reutilizando los campos ya calculados de `SalePackage`)
- `backend/src/presentation/reports/controllers/reports.controller.ts` (nuevo)
- `backend/src/reports.module.ts` (nuevo) + registrar en `app.module.ts`

Frontend:

- `frontend/src/api/reportsApi.ts` (nuevo)
- `frontend/src/pages/Reports.tsx` (nuevo, resumen + detalle expandible)
- `frontend/src/components/Layout.tsx` (agregar enlace "Reportes")
- `frontend/src/App.tsx` (ruta)
- `frontend/vite.config.ts` (proxy `/reports`)

Opcional si se prefiere reutilizar en lugar de `PrismaService` directo: exportar repositorios de `package.module.ts`/`sale.module.ts`. No es necesario.

## 8. ¿Necesita cambios `schema.prisma`?

**No.** Todo lo necesario existe. El `SalePackage` ya guarda el snapshot completo de rentabilidad y el `medicoId`; `Sale` aporta almacén, estado, fecha y consecutivo; `PackageSession`/`SessionApplication` aportan descuento, sesiones y fecha de reconocimiento; `Tercero` aporta nombres.

Limitaciones (no bloquean, se resuelven con joins):

- `SalePackage` no tiene `warehouseId`, `cantidad` ni fecha de negocio propia → se obtienen de `Sale`/`SaleDetail`/`SessionApplication`.
- No hay descuento explícito en ventas directas (solo implícito en `unitPrice`).
- Las ventas de producto no generan ganancia profesional.

## 9. Riesgos de regresión

- **No duplicar cálculos:** el reporte debe **leer** `SalePackage.gananciaMedico/gananciaCentro/utilidad`, no recalcular, para no divergir del Dashboard.
- **Fecha ambigua:** elegir por tipo de operación entre `Sale.fechaVenta`, `SalePackage.createdAt` y `SessionApplication.fechaAplicacion`. Datos reales: **108/182 `SalePackage` tienen un día distinto a `sale.fechaVenta`**, mayormente sesiones. Debe definirse y documentarse.
- **Cancelaciones:** filtrar `sale.estado='ACTIVA'`. Ojo: `PackageSession.cancel` **no** anula la `Sale` asociada (sigue `ACTIVA` y suma en `ventasTotales`); es una inconsistencia preexistente.
- **Redondeo:** `precioSesion = totalPagado / cantidadSesiones` puede no sumar exactamente `sale.total` (6 ventas con diferencia > 0.01 en datos reales). El reporte debe sumar los `SalePackage`, no derivar de `Sale.total`.
- **Alcance producto:** no inventar ganancia profesional para ventas sin paquete.
- **Rendimiento:** el volumen actual es bajo (182 `SalePackage`), pero conviene filtrar/agregar en BD (no en memoria) y evitar N+1.
- **Permisos:** reutilizar `@Roles('ADMINISTRADOR','OPERADOR')` como en ventas/dashboard; no crear reglas nuevas.
- **Multi-almacén:** el filtro de almacén se aplica vía `Sale.warehouseId`; un `SalePackage` pertenece a un único almacén (el de la venta original), lo cual es coherente.

## 10. Plan de implementación por fases pequeñas

1. **Contrato de datos:** definir DTO `{ fromDate?, toDate?, warehouseId?, medicoId? }` e interfaz de respuesta (`summary[]`, `detail[]`), con validación `fromDate <= toDate` e inclusividad.
2. **Consulta resumen (solo lectura):** `groupBy medicoId` sobre `SalePackage` unido a `Sale` (estado ACTIVA + warehouse + rango) y `Tercero`; devolver los 7 campos del resumen.
3. **Consulta detalle (solo lectura):** listado de `SalePackage` con joins a `Sale`, `Package`, `Tercero` y (para sesiones) `SessionApplication`; sin recomputar fórmulas.
4. **Controlador + módulo:** `GET /reports/professional-earnings` con `@Roles`, registrar módulo.
5. **API + página frontend:** filtros (Desde/Hasta/Almacén/Profesional), tabla resumen y detalle expandible, estados de carga/vacío, estilo actual.
6. **Verificación read-only:** cuadrar contra `SalePackage` real, comprobar inclusividad de fechas, filtro de almacén, exclusión de anuladas y que el stock no se toca.

## 11. Filtros futuros

- Fecha desde / Fecha hasta (rango inclusivo).
- Almacén (respetando multi-almacén vía `Sale.warehouseId`).
- Profesional (`SalePackage.medicoId`).

---

**Estado:** análisis únicamente. No se implementó ni modificó nada, no se tocó `schema.prisma` ni la BD, y no se avanzó a funcionalidades adicionales. Pendiente de aprobación.

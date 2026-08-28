# INFORME — FASE 1: ANÁLISIS DE SOPORTE PARA MÚLTIPLES ALMACENES

Fecha: 27/08/2026
Alcance: análisis exclusivo. No se modificó ningún archivo, no se ejecutaron migraciones, no se insertó/actualizó/eliminó dato.

## 1. Estado actual de la arquitectura

**Stack:** NestJS + TypeScript (Clean Architecture por capas: domain → application → infrastructure → presentation) · Prisma ORM v7 con PostgreSQL · Frontend React/Vite/Tailwind (sin axios ni react-query, todo `fetch` nativo con `apiFetch`).

**Módulos NestJS** (`backend/src/app.module.ts`): `PrismaModule`, `AuthModule`, `UserModule`, `ProductModule`, `TerceroModule`, `PurchaseModule`, `SaleModule`, `PackageModule`, `InventoryMovementModule`, `DashboardModule`, `PackageSessionModule`.

**Base de datos real conectada** (`192.168.0.207/suerocontrol`) — datos verificados en modo solo lectura:

| Tabla | Registros |
|---|---|
| Product | 27 |
| Purchase / PurchaseDetail | 43 / 186 |
| Sale / SaleDetail | 98 / 104 |
| InventoryMovement | 1.133 |
| Tercero | 58 |
| Package / PackageDetail | 12 / 93 |
| SalePackage | 114 |
| PackageSession / SessionApplication | 9 / 27 |
| User | 1 |

## 2. Cómo funciona actualmente el inventario

**Stock único global por producto.** No se calcula: se almacena en `Product.stockActual` (Int) y se muta con `updateStock()` en `backend/src/infrastructure/product/repositories/product.prisma.repository.ts:47` (`stockActual + quantity`). `Product.stockMinimo` también es global.

- **Entrada por compra** → `updateStock(+qty)` + `InventoryMovement` ENTRY.
- **Salida por venta** → validación `stockActual < qty` + `updateStock(-qty)` + `InventoryMovement` EXIT.
- **Paquetes** (`package.service.ts sellPackage`) y **sesiones** (`package-session.service.ts applySession`) descuentan stock de los componentes igualmente.
- **Anulación de venta** (`sale.service.ts cancel`) repone stock + movimiento ENTRY.
- Los `InventoryMovement` registran `stockBefore/stockAfter` como bitácora, pero **no son la fuente de verdad**: solo 3 de 27 productos tienen `stockActual` coherente con la suma de movimientos (el kardex es histórico e incompleto; `stockActual` es lo autoritativo).

**Hallazgo importante (bug existente):** en `purchase.service.ts:49-90`, cada detalle de compra genera **dos** movimientos ENTRY (uno con `referenceId=''` en el loop y otro con `referenceId=purchase.id` tras crear la compra). En la BD hay **90 movimientos con `referenceId=''`**. Este desfase explica la incoherencia de stock antes mencionada.

## 3. Modelos involucrados

`schema.prisma` (16 tablas): `User`, `Product`, `Tercero`, `Purchase`, `PurchaseDetail`, `Sale`, `SaleDetail`, `SaleHistory`, `Package`, `PackageDetail`, `PackageOperatingCost`, `SalePackage`, `PackageSession`, `SessionApplication`, `InventoryMovement`.

## 4. Tablas que necesitarían cambios

| Tabla | Cambio | Motivo |
|---|---|---|
| **Nueva: `Warehouse`** | Crear | Entidad almacén (id, nombre, activo) — "nombre configurable" |
| **Nueva: `WarehouseStock`** | Crear | **La clave**: stock independiente por (producto, almacén). Sin duplicar productos |
| `Purchase` | `+ warehouseId` | La compra entra a un almacén |
| `Sale` | `+ warehouseId` | La venta sale de un almacén |
| `InventoryMovement` | `+ warehouseId` | Movimiento pertenece a un almacén |
| `Product` | **No** eliminar `stockActual` aún | Durante transición; la fuente de verdad pasa a `WarehouseStock` |
| `SalePackage`, `PackageSession`, `SessionApplication` | **Sin cambio de esquema** | El almacén se deriva de su `Sale` |
| `User` | Opcional `warehouseId` | Solo si se desea usuarios asignados a almacén |

## 5. Relaciones que habría que agregar

```
Warehouse 1──N Purchase            (Purchase.warehouseId  → Warehouse.id)
Warehouse 1──N Sale                (Sale.warehouseId      → Warehouse.id)
Warehouse 1──N InventoryMovement   (InventoryMovement.warehouseId → Warehouse.id)
Warehouse 1──N WarehouseStock
WarehouseStock   N──1 Product      (Product 1──N WarehouseStock)  ← NO duplica producto
WarehouseStock   N──1 Warehouse    (@@unique([warehouseId, productId]))
```

Relaciones actuales que **se mantienen intactas**: `Product 1:N PurchaseDetail`, `Product 1:N SaleDetail`, `Product 1:N InventoryMovement`, `Purchase 1:N PurchaseDetail`, `Sale 1:N SaleDetail`, etc.

## 6. Impacto en compras

- `CreatePurchaseDto` recibiría `warehouseId` obligatorio.
- En `purchase.service.ts create()` y `convertPedidoToCompra()`: el `updateStock` y la validación deben apuntar a `WarehouseStock` del `warehouseId` de la compra (no a `Product.stockActual`).
- El movimiento ENTRY debe incluir `warehouseId`.
- Aprovechar para **corregir el duplicado de movimientos** y envolver stock+movimiento en **transacción** (hoy no es atómico).

## 7. Impacto en ventas

- `CreateSaleDto` recibiría `warehouseId`.
- En `sale.service.ts`: validación `stock suficiente` y `updateStock(-qty)` deben leerse del `WarehouseStock` del almacén de la venta. Mismo cambio en `cancel()` (reposición), en `package.service.ts sellPackage()` y en `package-session.service.ts applySession()`.
- `SalePackage` / `PackageSession` heredan el almacén de la venta (sin columna nueva).
- `findMaxConsecutivo()` se mantiene **global** (recomendado; no romper el consecutivo).

## 8. Impacto en movimientos de inventario

- `InventoryMovement.warehouseId` nuevo.
- `findByProductId` y `findAll` en `inventory-movement.prisma.repository.ts` deben filtrar por `warehouseId` (o exponerlo en la respuesta).
- Los `stockBefore/stockAfter` históricos corresponden al único almacén existente → asignables al principal.

## 9. Impacto en frontend

Hoy no existe ningún selector de almacén (grep: 0 coincidencias de `warehouse/bodega/sucursal/sede/almacen`). Puntos a tocar en fases posteriores:

- `Inventory.tsx` / `ProductModal.tsx`: edición de stock dirigida al almacén seleccionado; `stockActual` mostrado = suma o stock del almacén en contexto.
- `PurchaseModal.tsx` / `Sales.tsx`: selector de almacén + stock mostrado **del almacén elegido** (líneas que muestran `Stock: {p.stockActual}`).
- `Dashboard.tsx`: sin filtro hoy; puede mantenerse global o agregarse filtro.
- No existe UI de movimientos (`/inventory-movements` no se consume), así que no hay nada que romper.

## 10. Estrategia de migración de datos existentes

Migración en **4 pasos** (cada uno una migración Prisma separada):

1. **Migración A — crear estructura:** tabla `Warehouse`, tabla `WarehouseStock`, columnas `warehouseId` **NULLABLE** en `Purchase`, `Sale`, `InventoryMovement` + FKs. Insertar `Warehouse` "Almacén Principal" (id fijo).
2. **Backfill (script o SQL):** asociar todo lo existente al principal:
   - `INSERT INTO "WarehouseStock" (warehouseId, productId, stock, stockMinimo) SELECT '<idPrincipal>', id, "stockActual", "stockMinimo" FROM "Product";`
   - `UPDATE "Purchase" SET "warehouseId"='<idPrincipal>' WHERE "warehouseId" IS NULL;` (43 registros)
   - `UPDATE "Sale" SET "warehouseId"='<idPrincipal>' WHERE "warehouseId" IS NULL;` (98)
   - `UPDATE "InventoryMovement" SET "warehouseId"='<idPrincipal>' WHERE "warehouseId" IS NULL;` (1.133)
3. **Migración B — endurecer:** `ALTER COLUMN SET NOT NULL` + `DEFAULT` donde corresponda.
4. **Corte lógico:** los services pasan a leer/escribir `WarehouseStock` como única fuente de verdad; `Product.stockActual` queda deprecado/sincronizado durante un periodo de transición.

Nada de lo anterior se ejecuta en esta fase.

## 11. Riesgos

1. **FKs y orden:** aplicar `NOT NULL` sin backfill previo rompe la migración. Las columnas deben nacer `NULLABLE` → backfill → `SET NOT NULL`.
2. **Registros huérfanos:** cualquier purchase/sale/movimiento sin `warehouseId` quedaría inconsistente. El backfill debe cubrir el 100% (verificado: 43/98/1.133).
3. **Histórico:** los `stockBefore/After` antiguos son del almacén principal (era el único) → correcto asignarlos allí. No se pierde información, incluidas las 90 filas con `referenceId=''`.
4. **Consultas que asumen stock único:** validaciones de stock en sale/package/session, `updateStock()`, `findByProductId`, dropdowns del frontend, y la edición manual de stock en `ProductModal`.
5. **Lógica de compras/ventas:** toda la validación y mutación debe parametrizarse por almacén; error típico es validar contra el almacén equivocado o el stock global.
6. **Concurrencia:** `updateStock` no es transaccional hoy. Con stock por almacén, dos ventas simultáneas sobre el mismo `WarehouseStock` pueden sobrevender. Conviene transacciones en el refactor.
7. **Dashboard/reportes:** agregados globales (ventas, compras) quedan igual o se filtran por almacén; no rompe, pero define comportamiento deseado.
8. **Doble fuente de verdad (transición):** si `Product.stockActual` y `WarehouseStock` coexisten y se escriben por rutas distintas → desincronización. Elegir **una** fuente y mantener la otra solo como lectura.

## 12. Plan recomendado (fases pequeñas)

- **Fase 1 (esta):** análisis. ✔ Completada.
- **Fase 2:** diseño del esquema (definir campos exactos, índices, FKs, decisión stockMinimo global vs por almacén) y aprobación.
- **Fase 3:** Migración A (estructura + `Warehouse` "Almacén Principal") + backfill + Migración B (NOT NULL). Backups antes de migrar.
- **Fase 4:** dominio/application backend — crear entidades/interfaces/repositorio de `Warehouse` y `WarehouseStock`.
- **Fase 5:** refactor de `PurchaseService` (warehouseId, stock por almacén, transacción, arreglo del duplicado de movimientos).
- **Fase 6:** refactor de `SaleService`, `PackageService`, `PackageSessionService` (validación y descuento por almacén).
- **Fase 7:** `InventoryMovement` + endpoint `GET /warehouses` + filtrado.
- **Fase 8:** frontend — selector de almacén (contexto), dropdowns de stock por almacén, CRUD de almacenes.
- **Fase 9:** dashboard/reportes por almacén + tests + pruebas funcionales.

---

# FASE 2A — DISEÑO EXACTO DEL ESQUEMA MULTI-ALMACÉN

Fecha: 27/08/2026 · Diseño aprobado como base conceptual. No se ejecutó ninguna migración ni se modificó el schema.

## 2A.1 Modelo `Warehouse`

```prisma
model Warehouse {
  id          String   @id @default(uuid())
  nombre      String
  esPrincipal Boolean  @default(false)
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  purchaseDetails     Purchase[]
  sales               Sale[]
  inventoryMovements  InventoryMovement[]
  stocks              WarehouseStock[]

  @@index([esPrincipal])
}
```

| Campo | Tipo | Justificación |
|---|---|---|
| `id` | String @id @default(uuid()) | Mismo patrón que todos los modelos del proyecto |
| `nombre` | String | Nombre configurable ("Almacén Principal", "Almacén 2", ...) |
| `esPrincipal` | Boolean @default(false) | Identificación por bandera, NO por nombre |
| `activo` | Boolean @default(true) | Mismo patrón que `Product`/`Tercero` |
| `createdAt`/`updatedAt` | DateTime | Convención del proyecto + auditoría; los almacenes no se eliminan físicamente, se desactivan |
| `@@index([esPrincipal])` | | Consulta "obtener el almacén principal" |

## 2A.2 Modelo `WarehouseStock`

```prisma
model WarehouseStock {
  id          String   @id @default(uuid())
  warehouseId String
  productId   String
  stock       Int      @default(0)
  stockMinimo Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  warehouse Warehouse @relation(fields: [warehouseId], references: [id])
  product   Product   @relation(fields: [productId], references: [id])

  @@unique([warehouseId, productId])
  @@index([productId])
}
```

- `@@unique([warehouseId, productId])`: garantiza a nivel de BD una sola fila de stock por (almacén, producto).
- `@@index([productId])`: stock de un producto en todos los almacenes y JOIN desde Product.

## 2A.3 Relaciones exactas

```
Warehouse  1 ── N  WarehouseStock     (WarehouseStock.warehouseId → Warehouse.id)
Product    1 ── N  WarehouseStock     (WarehouseStock.productId   → Product.id)
Warehouse  1 ── N  Purchase           (Purchase.warehouseId       → Warehouse.id)
Warehouse  1 ── N  Sale               (Sale.warehouseId           → Warehouse.id)
Warehouse  1 ── N  InventoryMovement  (InventoryMovement.warehouseId → Warehouse.id)
```

`Purchase`, `Sale` e `InventoryMovement` ganan `warehouse Warehouse @relation(...)`; `Product` gana `warehouseStocks WarehouseStock[]`.

## 2A.4 `warehouseId`: nullable inicial → NOT NULL posterior

**Debe nacer NULLABLE y endurecerse después a NOT NULL.**

- Agregar `NOT NULL` a tablas con datos (43 compras / 98 ventas / 1.133 movimientos) obliga a valores en el mismo ALTER → `DEFAULT` riesgoso o reconstrucción.
- `NULLABLE` agrega la columna sin tocar filas existentes; luego backfill explícito; finalmente `SET NOT NULL`.
- El `SET NOT NULL` final obliga a la aplicación a proveer siempre `warehouseId`.

## 2A.5 `stockMinimo`: decisión

| Criterio | A) Global en `Product` | B) Independiente en `WarehouseStock` |
|---|---|---|
| Definición | Un mínimo por producto, igual en todos los almacenes | Cada almacén define su propio mínimo |
| Alertas | Una alerta global | Alertas por almacén (más correcto) |

**Recomendación: B) `stockMinimo` en `WarehouseStock`.** La existencia ya es por almacén; que la alerta lo sea también es coherente y no añade costo. En la migración, `Product.stockMinimo` se copia a la fila del almacén principal y luego se depreca.

## 2A.6 `Product.stockActual`: estrategia de transición

1. **Migración A (backfill):** `Product.stockActual` → `WarehouseStock.stock` del almacén principal. A partir de aquí `WarehouseStock` es la **única fuente de verdad**.
2. **Fases 5-6 (refactor):** todas las escrituras de stock (compras, ventas, paquetes, sesiones, anulación, edición manual) se redirigen a `WarehouseStock`. `Product.stockActual` queda **solo lectura** (valor congelado).
3. **Fase final (limpieza):** cuando grep + tests confirmen que nada lo lee/escribe, se elimina en migración de limpieza.

**Deja de ser fuente de verdad:** en el momento del backfill (punto de corte). La desincronización se evita porque tras el refactor ninguna ruta escribe en él.

## 2A.7 Identificación del "Almacén Principal"

Se usa `esPrincipal` + índice único parcial a nivel de BD (Prisma no genera índices parciales, se agrega manualmente al SQL de la migración):

```sql
CREATE UNIQUE INDEX "Warehouse_esPrincipal_key" ON "Warehouse"("esPrincipal") WHERE "esPrincipal" = true;
```

- La BD rechaza un segundo almacén principal (garantía dura).
- La app refuerza la regla en el service de `Warehouse`.
- Consulta canónica: `WHERE esPrincipal = true`. Nunca por nombre.
- El id del principal es una **constante fija** en la migración (ej. `'00000000-0000-0000-0000-000000000001'`) → backfill determinista y re-ejecutable.

## 2A.8 Migración conceptual (NO ejecutada)

```
Migración A (una sola, con backfill intermedio):
 1. CREATE TABLE "Warehouse"
 2. INSERT "Warehouse" (id='0000...0001', nombre='Almacén Principal', esPrincipal=true)
 3. CREATE TABLE "WarehouseStock"
 4. INSERT INTO "WarehouseStock" (warehouseId, productId, stock, stockMinimo)
      SELECT '0000...0001', id, "stockActual", "stockMinimo" FROM "Product";        -- 27 filas
 5. ALTER TABLE "Purchase"  ADD COLUMN "warehouseId" TEXT NULL REFERENCES "Warehouse"("id");
 6. ALTER TABLE "Sale"      ADD COLUMN "warehouseId" TEXT NULL REFERENCES "Warehouse"("id");
 7. ALTER TABLE "InventoryMovement" ADD COLUMN "warehouseId" TEXT NULL REFERENCES "Warehouse"("id");
 8. UPDATE "Purchase"        SET "warehouseId"='0000...0001' WHERE "warehouseId" IS NULL;  -- 43
 9. UPDATE "Sale"            SET "warehouseId"='0000...0001' WHERE "warehouseId" IS NULL;  -- 98
10. UPDATE "InventoryMovement" SET "warehouseId"='0000...0001' WHERE "warehouseId" IS NULL; -- 1133
11. ALTER TABLE "Purchase"  ALTER COLUMN "warehouseId" SET NOT NULL;
12. ALTER TABLE "Sale"      ALTER COLUMN "warehouseId" SET NOT NULL;
13. ALTER TABLE "InventoryMovement" ALTER COLUMN "warehouseId" SET NOT NULL;
14. CREATE UNIQUE INDEX "Warehouse_esPrincipal_key" ON "Warehouse"("esPrincipal") WHERE "esPrincipal" = true;
15. CREATE INDEX (punto 2A.10)
```

Pasos 8-10 idempotentes (solo filas con NULL). `Product.stockActual/stockMinimo` no se borran.

## 2A.9 Riesgos de usar `DEFAULT` en `warehouseId`

**No usar `DEFAULT`.** Riesgos:
1. Asignación silenciosa: INSERTs que olviden `warehouseId` irían al almacén por defecto sin error.
2. Enmascara bugs: convierte un error de código en un dato erróneo.
3. Acoplamiento: si el almacén por defecto cambia/desactiva, el `DEFAULT` queda obsoleto.
4. Falso sentimiento de seguridad: `NOT NULL` garantiza presencia, no corrección.

Alternativa: columna NULLABLE sin DEFAULT → backfill explícito → `SET NOT NULL` sin DEFAULT.

## 2A.10 Índices necesarios

| Índice | Tabla | Cubre |
|---|---|---|
| `@@unique([warehouseId, productId])` | WarehouseStock | Lookup exacto stock producto+almacén |
| `@@index([productId])` | WarehouseStock | Stock de un producto en todos los almacenes |
| `@@index([warehouseId])` | InventoryMovement | Movimientos por almacén |
| `@@index([warehouseId, productId])` | InventoryMovement | Kardex de producto dentro de un almacén |
| `@@index([warehouseId])` | Purchase | Compras por almacén |
| `@@index([warehouseId])` | Sale | Ventas por almacén |
| `UNIQUE (esPrincipal) WHERE esPrincipal=true` | Warehouse | Unicidad del almacén principal |

## 2A.11 Propuesta del `schema.prisma` (solo modelos afectados)

```prisma
model Product {
  id          String   @id @default(uuid())
  codigo      String   @unique
  nombre      String
  categoria   String
  descripcion String
  costoCompra Float
  precioVenta Float
  stockActual Int      @default(0)   // ← transición: se depreca tras backfill, no se borra aún
  stockMinimo Int      @default(0)   // ← transición: se depreca tras backfill, no se borra aún
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  purchaseDetails    PurchaseDetail[]
  saleDetails        SaleDetail[]
  packageDetails     PackageDetail[]
  inventoryMovements InventoryMovement[]
  warehouseStocks    WarehouseStock[]          // ← NUEVO
}

model Warehouse {
  id          String   @id @default(uuid())
  nombre      String
  esPrincipal Boolean  @default(false)         // ← NUEVO
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  purchases          Purchase[]
  sales              Sale[]
  inventoryMovements InventoryMovement[]
  stocks             WarehouseStock[]

  @@index([esPrincipal])
}

model WarehouseStock {
  id          String   @id @default(uuid())
  warehouseId String
  productId   String
  stock       Int      @default(0)
  stockMinimo Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  warehouse Warehouse @relation(fields: [warehouseId], references: [id])
  product   Product   @relation(fields: [productId], references: [id])

  @@unique([warehouseId, productId])
  @@index([productId])
}

model Purchase {
  id            String   @id @default(uuid())
  tipo          String   @default("COMPRA")
  pedidoId      String?
  facturaNumero String?
  terceroId     String?
  warehouseId   String                          // ← NUEVO (NOT NULL tras backfill)
  total         Float
  fechaCompra   DateTime? @db.Date
  createdAt     DateTime @default(now())

  pedidoOrigen Purchase?    @relation("PedidoToCompra", fields: [pedidoId], references: [id])
  pedidosHijos Purchase[]   @relation("PedidoToCompra")
  tercero      Tercero?     @relation(fields: [terceroId], references: [id])
  warehouse    Warehouse    @relation(fields: [warehouseId], references: [id])   // ← NUEVO
  details      PurchaseDetail[]

  @@index([warehouseId])                        // ← NUEVO
}

model Sale {
  id             String    @id @default(uuid())
  consecutivo    Int       @default(0)
  terceroId      String?
  medicoId       String?
  warehouseId    String                          // ← NUEVO (NOT NULL tras backfill)
  total          Float
  fechaVenta     DateTime? @db.Date
  costoTotal     Float?
  utilidadTotal  Float?
  gananciaMedico Float?
  gananciaCentro Float?
  estado         String    @default("ACTIVA")
  anuladaMotivo  String?
  anuladaAt      DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  tercero      Tercero?      @relation(fields: [terceroId], references: [id])
  medico       Tercero?      @relation("MedicoSales", fields: [medicoId], references: [id])
  warehouse    Warehouse     @relation(fields: [warehouseId], references: [id])   // ← NUEVO
  details         SaleDetail[]
  salePackages    SalePackage[]
  history         SaleHistory[]
  packageSessions PackageSession[]

  @@index([warehouseId])                        // ← NUEVO
}

model InventoryMovement {
  id            String   @id @default(uuid())
  productId     String
  warehouseId   String                          // ← NUEVO (NOT NULL tras backfill)
  movementType  String
  quantity      Int
  stockBefore   Int
  stockAfter    Int
  referenceType String
  referenceId   String
  createdAt     DateTime @default(now())

  product   Product   @relation(fields: [productId], references: [id])
  warehouse Warehouse @relation(fields: [warehouseId], references: [id])   // ← NUEVO

  @@index([warehouseId])                        // ← NUEVO
  @@index([warehouseId, productId])             // ← NUEVO
}
```

`SalePackage`, `PackageSession`, `SessionApplication`, `Tercero`, `User`: sin cambios (el almacén se deriva de su `Sale`). El índice parcial único de `esPrincipal` y los índices de consulta se agregan manualmente al SQL de la migración.

---

# FASE 3B — MIGRACIÓN GENERADA (SIN APLICAR)

Fecha: 27/08/2026 · `schema.prisma` ya contiene los cambios aprobados (Fase 3A). Esta fase generó y revisó la migración, **sin aplicarla a la base**.

## A. Migración generada

- **Nombre:** `20260827000000_multi_warehouse`
- **Ubicación:** `backend/prisma/migrations/20260827000000_multi_warehouse/migration.sql`
- **Método de generación:** `prisma migrate diff --from-schema <schema anterior (git)> --to-schema prisma/schema.prisma --script` (comparación de esquemas; **sin conexión ni escritura** a la BD original).

## B. Contenido completo del `migration.sql`

```sql
-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "warehouseId" TEXT;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "warehouseId" TEXT;

-- AlterTable
ALTER TABLE "InventoryMovement" ADD COLUMN     "warehouseId" TEXT;

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseStock" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stockMinimo" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Warehouse_esPrincipal_idx" ON "Warehouse"("esPrincipal");

-- CreateIndex
CREATE INDEX "WarehouseStock_productId_idx" ON "WarehouseStock"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseStock_warehouseId_productId_key" ON "WarehouseStock"("warehouseId", "productId");

-- CreateIndex
CREATE INDEX "Purchase_warehouseId_idx" ON "Purchase"("warehouseId");

-- CreateIndex
CREATE INDEX "Sale_warehouseId_idx" ON "Sale"("warehouseId");

-- CreateIndex
CREATE INDEX "InventoryMovement_warehouseId_idx" ON "InventoryMovement"("warehouseId");

-- CreateIndex
CREATE INDEX "InventoryMovement_warehouseId_productId_idx" ON "InventoryMovement"("warehouseId", "productId");

-- AddForeignKey
ALTER TABLE "WarehouseStock" ADD CONSTRAINT "WarehouseStock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseStock" ADD CONSTRAINT "WarehouseStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

## C. Explicación de cada operación

1. **`ALTER TABLE ... ADD COLUMN "warehouseId" TEXT`** (×3): agrega la columna **NULLABLE** a `Purchase`, `Sale` e `InventoryMovement`. No asigna valores (sin `DEFAULT`) → seguro sobre datos existentes.
2. **`CREATE TABLE "Warehouse"`**: crea la tabla de almacenes. `esPrincipal` con `DEFAULT false` (aún sin el índice parcial, que se agregará en la migración controlada posterior).
3. **`CREATE TABLE "WarehouseStock"`**: crea la tabla de existencias por (almacén, producto). `stock`/`stockMinimo` con `DEFAULT 0`.
4. **`CREATE INDEX ...`** (×7): índices de consulta (`esPrincipal`, `productId`, `warehouseId` en Purchase/Sale/InventoryMovement, compuesto `warehouseId+productId`) + **índice único** `WarehouseStock_warehouseId_productId_key` (garantiza una sola fila de stock por par).
5. **`ADD CONSTRAINT ... FOREIGN KEY`** (×5):
   - `WarehouseStock → Warehouse` y `WarehouseStock → Product`: `ON DELETE RESTRICT` (no se puede borrar un almacén/producto con stock asociado).
   - `Purchase/Sale/InventoryMovement → Warehouse`: `ON DELETE SET NULL` (si se elimina un almacén, las filas existentes quedan con `warehouseId = NULL`; con columnas NULLABLE es coherente).

## D. Confirmación de alcance

| Verificación | Resultado |
|---|---|
| Crea `Warehouse` | ✅ |
| Crea `WarehouseStock` | ✅ |
| Agrega `warehouseId` a `Purchase` | ✅ (NULLABLE, sin DEFAULT) |
| Agrega `warehouseId` a `Sale` | ✅ (NULLABLE, sin DEFAULT) |
| Agrega `warehouseId` a `InventoryMovement` | ✅ (NULLABLE, sin DEFAULT) |
| Crea índices | ✅ (7 índices, incluye el único `warehouseId+productId`) |
| Crea foreign keys | ✅ (5 FKs) |
| Modifica o elimina datos existentes | ❌ **NO** (solo `ADD COLUMN`/`CREATE`, sin INSERT/UPDATE/DELETE) |
| Elimina columnas existentes | ❌ **NO** (no toca `Product.stockActual`/`stockMinimo` ni ninguna otra) |
| Índice parcial `esPrincipal` único | ❌ **NO** (pendiente para la migración controlada) |

## E. Estado de la base de datos original (pre-aplicación)

La migración **no fue aplicada** durante la Fase 3B (se confirmó en solo lectura: solo las 5 migraciones originales, sin `Warehouse`/`WarehouseStock`/`Purchase.warehouseId`).

---

# FASE 3 — MIGRACIÓN CONTROLADA APLICADA

Fecha: 27/08/2026 · Estructura + backfill aplicados a la base original, sin pérdida de datos.

## SQL ejecutado

El contenido íntegro de `backend/prisma/migrations/20260827000000_multi_warehouse/migration.sql` (líneas 1-69: DDL; líneas 71-94: migración de datos), aplicado con `prisma migrate deploy` en **una única transacción** (PostgreSQL soporta DDL transaccional; si algo fallaba, se revertía todo).

## Tablas/columnas creadas o modificadas

- **Nuevas tablas:** `Warehouse`, `WarehouseStock`.
- **Columnas agregadas (NULLABLE, sin DEFAULT):** `Purchase.warehouseId`, `Sale.warehouseId`, `InventoryMovement.warehouseId`.
- **Índices:** 7 (incluye el único `WarehouseStock_warehouseId_productId_key`).
- **FKs:** 5 (`WarehouseStock→Warehouse/Product` RESTRICT; `Purchase/Sale/InventoryMovement→Warehouse` SET NULL).

## Preservación de datos

- Ningún valor existente se borró ni se sobrescribió; solo se rellenaron columnas recién creadas.
- `Product.stockActual` y `Product.stockMinimo` permanecen intactos.
- Backfill idempotente (`ON CONFLICT DO NOTHING`, id fijo `00000000-0000-0000-0000-000000000001`).
- El bug de movimientos duplicados de compras NO se tocó (tarea independiente).

## Verificación post-aplicación (solo lectura)

| Verificación | Resultado |
|---|---|
| Almacén principal existe | ✅ 1 fila: "Almacén Principal", `esPrincipal=true`, `activo=true` |
| Un `WarehouseStock` por producto | ✅ 27 = 27 productos |
| Sin productos duplicados por almacén | ✅ 0 |
| `stock`/`stockMinimo` coinciden con `Product` | ✅ 0 discrepancias |
| Sin registros sin `warehouseId` | ✅ 0 (Purchase / Sale / InventoryMovement) |
| `prisma validate` | ✅ schema válido |
| `prisma generate` | ✅ cliente v7.10.0 regenerado |
| Build backend | ✅ `nest build` sin errores |

## Cantidades antes → después

| Tabla | Antes | Después |
|---|---|---|
| Product | 27 | 27 |
| Purchase | 43 | 43 (todas con `warehouseId`) |
| Sale | 98 | 98 (todas con `warehouseId`) |
| InventoryMovement | 1.133 | 1.133 (todos con `warehouseId`) |
| Warehouse | 0 | 1 |
| WarehouseStock | 0 | 27 (suma stock = 164 = suma `stockActual` 164) |

## Pendiente (fases posteriores, NO ejecutadas)

- `SET NOT NULL` en `warehouseId` + índice parcial único `esPrincipal` (cuando el código escriba siempre `warehouseId`).
- Refactor de services (compras/ventas/paquetes/sesiones) hacia `WarehouseStock`.
- Frontend: selector de almacén.

---

# FASE 4 — ANÁLISIS PARA REFACTOR DE INVENTARIO A MULTI-ALMACÉN (PRIMER PASO)

Fecha: 27/08/2026 · Análisis aprobado como base. No se modificó ningún archivo de código.

## A. Lecturas de `Product.stockActual`

| Archivo | Línea | Uso |
|---|---|---|
| `infrastructure/product/repositories/product.prisma.repository.ts` | 50-51 | `updateStock`: lee `stockActual` para sumar/restar |
| `application/purchase/services/purchase.service.ts` | 50, 83, 157 | `stockBefore`/`stockAfter` de movimientos ENTRY |
| `application/sale/services/sale.service.ts` | 74, 76, 113, 114 | Validación "stock insuficiente" (producto y componentes de paquete) |
| `application/sale/services/sale.service.ts` | 174-175, 189-190, 313-314, 331-332 | `stockBefore`/`stockAfter` de EXIT y cancelaciones |
| `application/package/services/package.service.ts` | 121-122, 140, 202-203 | Validación y movimientos de `sellPackage` |
| `application/package-session/services/package-session.service.ts` | 123, 126, 146, 178-179 | Validación y movimientos de `applySession` |
| `application/product/services/product.service.ts` | 21, 73 | Inicializa `stockActual` al crear; `updateProductStock` |
| `presentation/product/controllers/product.controller.ts` | 53 | Expone `stockActual` en la respuesta (frontend lo muestra) |

## B. Escrituras de `Product.stockActual`

| Archivo | Línea | Operación |
|---|---|---|
| `product.prisma.repository.ts` | 53-55 | `updateStock` escribe `stockActual = stockActual + quantity` (**única escritura directa**) |
| `product.prisma.repository.ts` | 24-31 | `update` genérico (podría escribir `stockActual` si el DTO lo trae) |
| `product.service.ts` | 21 | `create` setea `stockActual` desde el DTO |
| Callers de `updateStock` | purchase:52,160 · sale:87,120,306,324 · package:143 · package-session:146 | Entradas/salidas/reposiciones |

## C. Creación de `InventoryMovement`

| Archivo | Línea | Tipo/referencia |
|---|---|---|
| `inventory-movement.prisma.repository.ts` | 19 | **Única** escritura directa (`prisma.inventoryMovement.create`) |
| `purchase.service.ts` | 53, 79 | ENTRY `PURCHASE` (duplicado conocido, `referenceId` '' y real — se deja intacto) |
| `purchase.service.ts` | 162 | ENTRY `PURCHASE` (convertPedidoToCompra) |
| `sale.service.ts` | 170, 185 | EXIT `SALE` |
| `sale.service.ts` | 309, 327 | ENTRY `CANCEL_SALE` |
| `package.service.ts` | 145, 198 | EXIT `PACKAGE_SALE` |
| `package-session.service.ts` | 174 | EXIT `SESSION_APPLICATION` |

## D. Validación de disponibilidad

| Archivo | Línea | Lógica |
|---|---|---|
| `sale.service.ts` | 74 | Paquete: `product.stockActual < requiredQty` |
| `sale.service.ts` | 113 | Producto directo: `product.stockActual < detail.quantity` |
| `package.service.ts` | 121 | `sellPackage`: `product.stockActual < detail.quantity` |
| `package-session.service.ts` | 123 | `applySession`: `product.stockActual < requiredQty` |

## E / F. Cómo Purchase y Sale afectan inventario

- **Purchase**: `create` (COMPRA) → `updateStock(+qty)` + ENTRY (líneas 49-90); `convertPedidoToCompra` → `updateStock(+qty)` + ENTRY (144-176). PEDIDO no afecta.
- **Sale**: `create` → `updateStock(-qty)` producto/componentes + EXIT (87, 120, 170, 185); `cancel` → reposición `updateStock(+qty)` + ENTRY CANCEL_SALE (306-336). También `sellPackage` (package.service.ts) y `applySession` (package-session.service.ts).

## G. Qué debe pasar a `WarehouseStock`

1. `IProductRepository.updateStock` → se reemplaza por método orientado a (warehouseId, productId).
2. Validación de disponibilidad (sección D) → leer `WarehouseStock.stock` del almacén de la operación.
3. `stockBefore`/`stockAfter` de movimientos → usar `WarehouseStock`.
4. `InventoryMovement.warehouseId` → incluir en todas las creaciones.
5. `PurchaseService` / `SaleService` → aceptar `warehouseId` opcional; resolver almacén principal si no viene.
6. `PackageService` / `PackageSessionService` → derivar almacén de la venta.

## H. Qué sigue usando `Product.stockActual` temporalmente

- `ProductService.create` y `ProductController` (GET /products): el frontend aún muestra `stockActual` → se mantiene como **espejo** del almacén principal.
- Durante la transición, todas las operaciones van al almacén principal → `WarehouseStock` escribe el stock real y se **sincroniza el espejo** `Product.stockActual` (compatibilidad con el frontend). La desincronización se elimina cuando el frontend lea desde `WarehouseStock`.
- `Product.stockMinimo`: igual, espejo del `stockMinimo` del almacén principal.

## Cambio propuesto por archivo

| Archivo | Ubicación | Cambio propuesto |
|---|---|---|
| **Nuevo** `domain/warehouse/...` | entidad, `IWarehouseRepository`, token | Resolver almacén principal (`esPrincipal=true`) y listar almacenes |
| **Nuevo** `domain/warehouse-stock/...` | `IWarehouseStockRepository` | `getStock` · `updateStock(warehouseId, productId, delta)` atómico · `getByProduct` |
| **Nuevo** `infrastructure/warehouse/...` + `warehouse-stock/...` | Prisma | Implementaciones |
| **Nuevo** `warehouse.module.ts` (+ `GET /warehouses`) | — | Providers + exports |
| `product.prisma.repository.ts` | `updateStock` (47-61) | Se conserva como espejo del almacén principal; la escritura operativa pasa a `WarehouseStockRepository` |
| `product.service.ts` | `create` (21) | `upsert` de fila `WarehouseStock` del almacén principal |
| `purchase.service.ts` | `create` (22-93), `convertPedidoToCompra` (144-176) | Resolver `warehouseId` (default principal); stock + movimientos vía `WarehouseStock`; espejo en `Product.stockActual` |
| `purchase.dtos.ts` | `CreatePurchaseDto` | `warehouseId` opcional |
| `sale.service.ts` | `create` (29-199), `cancel` (298-343) | Ídem |
| `sale.dtos.ts` | `CreateSaleDto` | `warehouseId` opcional |
| `package.service.ts` | `sellPackage` (102-221) | Almacén de la venta; stock/movimientos vía `WarehouseStock` |
| `package-session.service.ts` | `applySession` (102-202) | Ídem |
| `inventory-movement.prisma.repository.ts` | `create` (10-21) | Incluir `warehouseId` |
| `inventory-movement.service.ts` / repo | `findByProductId`, `findAll` | Opcional: filtrar por `warehouseId` |
| `product.module.ts`, `purchase.module.ts`, `sale.module.ts`, `package.module.ts`, `package-session.module.ts` | providers | Inyectar `WAREHOUSE_REPOSITORY` y `WAREHOUSE_STOCK_REPOSITORY` |
| `app.module.ts` | imports | Importar `WarehouseModule` |

## Orden de implementación sugerido (sub-fases, cada una con validate + build)

1. **4A** — infraestructura nueva (Warehouse + WarehouseStock repos, módulo, resolución de almacén principal). Sin cambios de lógica existente.
2. **4B** — `PurchaseService`.
3. **4C** — `SaleService`.
4. **4D** — `PackageService` + `PackageSessionService`.
5. **4E** — `InventoryMovement` (warehouseId en creación + filtros opcionales).
6. **4F** — verificación integral (validate, generate, build, consultas de solo lectura, comparación de stocks).

## Decisiones de diseño a confirmar

- (a) `warehouseId` del DTO **opcional**; si no llega, se resuelve el almacén principal → el frontend actual funciona sin cambios.
- (b) Durante la transición, `Product.stockActual` se mantiene **sincronizado como espejo** del almacén principal; su eliminación quedará para fases posteriores.
- (c) El bug del doble movimiento de compras NO se toca en esta fase.

---

# FASE 8 — ANÁLISIS DEL FRONTEND MULTI-ALMACÉN (SOLO ANÁLISIS)

Fecha: 27/08/2026 · No se modificó ningún archivo.

## A. Arquitectura actual relevante

- **React + Vite + TypeScript + Tailwind**; sin react-query/axios: todo vía `apiFetch` (`src/api/helpers.ts`) con `Authorization: Bearer` desde `localStorage`.
- **Rutas** en `src/App.tsx`: `/` Dashboard, `/inventario`, `/compras`, `/ventas`, `/paquetes`, `/terceros`. Sidebar en `src/components/Layout.tsx` (sin selector de almacén).
- **Patrón de contexto**: `AuthContext.tsx` (createContext + Provider + `useAuth`) → modelo a replicar para el almacén.
- **Stock actual**: cada `Product` expone `stockActual`/`stockMinimo` (espejo del almacén principal). Se muestra en `Inventory.tsx`, `ProductModal.tsx`, dropdowns de `Sales.tsx`, `PurchaseModal.tsx` y `Packages.tsx`.
- **Payloads actuales**: `createPurchase`, `createSale`, `POST /packages/:id/sell` y `POST /package-sessions` no envían `warehouseId`.
- **Backend ya listo** (4A-4E + Fase 5): `GET /warehouses` (activos); `POST/PUT /purchases` y `POST /sales` aceptan `warehouseId` (opcional, fallback al principal); `GET /inventory-movements?warehouseId=`.

## B. Archivos que deberían modificarse

- `src/types/product.ts`, `src/types/purchase.ts`, `src/types/sale.ts` (nuevos campos/stock por almacén).
- `src/api/productApi.ts` (`fetchProducts(warehouseId?)`), `src/api/purchaseApi.ts` (payload + warehouseId), `src/api/saleApi.ts` (payloads de venta/sesión con warehouseId), `src/api/packageApi.ts` (`sellPackage` con warehouseId).
- `src/components/Layout.tsx` (selector de almacén en el header).
- `src/App.tsx` (envolver con `WarehouseProvider` + ruta `/almacenes`).
- `src/pages/Inventory.tsx` + `src/components/ProductModal.tsx` (stock del almacén).
- `src/pages/Purchases.tsx` + `src/components/PurchaseModal.tsx` (enviar warehouseId; stock por almacén).
- `src/pages/Sales.tsx`, `src/pages/Packages.tsx` (warehouseId; stock del almacén).
- `src/pages/Warehouses.tsx` (CRUD, en subfase posterior).

## C. Archivos nuevos necesarios

- `src/context/WarehouseContext.tsx` — estado del almacén seleccionado (persistido en `localStorage`, auto-selección del principal).
- `src/api/warehouseApi.ts` — `fetchWarehouses()`, y CRUD si aplica.
- `src/types/warehouse.ts` — tipo `Warehouse` (`id`, `nombre`, `esPrincipal`, `activo`).
- `src/pages/Warehouses.tsx` — gestión de almacenes (opcional, al final).

## D. Flujo propuesto del selector/contexto

1. `WarehouseProvider` monta y llama `GET /warehouses` (activos). Si hay exactamente 1 → lo selecciona (principal). Si hay varios → selecciona el **principal** por defecto.
2. `selectedWarehouseId` se guarda en `localStorage` (validado al cargar; inválido/inactivo → fallback al principal).
3. `Layout` muestra un `<select>` de almacenes activos; al cambiar → actualiza el contexto (las páginas recargan vía `useEffect` dependiente).
4. Las páginas usan `useWarehouse()` para leer stock (`fetchProducts(warehouseId)`) y enviar `warehouseId` en compras/ventas/paquete/sesión.
5. **Compatibilidad**: si solo existe el Almacén Principal, el comportamiento es idéntico al actual (warehouseId=principal explícito).

## E. Cambios de API necesarios

**Backend (aditivos, mínimos y estrictamente necesarios):**
1. `GET /products?warehouseId=` → devolver el stock del almacén seleccionado (usando `WarehouseStock`; sin `warehouseId` → espejo actual = principal). Una sola consulta batch (findMany por warehouseId) para evitar N+1. El campo `stockActual` mantiene la semántica "stock del almacén consultado" durante la transición.
2. `POST /packages/:id/sell` y `POST /package-sessions` → aceptar `warehouseId` **opcional** (fallback principal).
3. `GET /warehouses` — **ya existe** (Fase 4E).

**Frontend:** agregar `warehouseId` a los payloads de compra/venta/paquete/sesión; `fetchProducts(warehouseId?)`; nueva `warehouseApi`.

## F. Riesgos

1. Cambiar la forma de `GET /products` → mantener el nombre de campo `stockActual`; solo aditivo con query param.
2. Carrera de carga (páginas antes que el contexto) → `WarehouseProvider` expone `loading`; mientras carga, llamar sin `warehouseId` o esperar.
3. `localStorage` con almacén obsoleto/desactivado → validar y fallback al principal.
4. Backend y frontend desincronizados → implementar el backend mínimo (8.1) primero o en la misma subfase.
5. Rendimiento del stock por almacén → consulta batch, no N+1.
6. Paquete/sesión: si no se agrega `warehouseId` al backend de sell/session, una venta desde almacén secundario caería al principal.
7. Regresión con un solo almacén → verificar al final.

## G. Plan en subfases pequeñas y verificables

1. **8.1 Backend mínimo aditivo**: `GET /products?warehouseId=` (stock por almacén, batch) + `warehouseId` opcional en `POST /packages/:id/sell` y `POST /package-sessions`. Verificar con validate/generate/build y respuestas HTTP reales (sin escribir datos).
2. **8.2 Base frontend**: `types/warehouse.ts`, `warehouseApi.ts`, `WarehouseContext`, selector en `Layout`, ruta `/almacenes` (solo lectura).
3. **8.3 Inventario**: `fetchProducts(warehouseId)` + edición de stock del almacén en `ProductModal`.
4. **8.4 Compras**: enviar `warehouseId`; stock por almacén en `PurchaseModal`.
5. **8.5 Ventas + Paquetes + Sesiones**: enviar `warehouseId`; stock por almacén en dropdowns.
6. **8.6 CRUD de almacenes** (`Warehouses.tsx`): crear/editar/desactivar; proteger `esPrincipal` (el índice parcial único bloquea un segundo principal a nivel BD).
7. **8.7 Verificación integral**: build frontend + backend, pruebas manuales, y confirmar regresión cero con solo el Almacén Principal.

---

# FASE 9 — ANÁLISIS DASHBOARD/REPORTES POR ALMACÉN (SOLO ANÁLISIS)

Fecha: 27/08/2026 · No se modificó ningún archivo ni la BD.

## Estado actual del dashboard/reportes

- **Backend** `DashboardService.getSummary()` (`dashboard.service.ts`): agrega **globalmente, sin filtro**:
  - `sale.findMany({ where: { estado: 'ACTIVA' } })` → `ventasTotales`, `totalSales`, `totalPackagesSold`.
  - `purchase.findMany({ where: { tipo: 'COMPRA' } })` → `comprasTotales`.
  - `salePackage.findMany({ where: { sale: { estado: 'ACTIVA' } }, include: { medico } })` → `gananciaCentro`, `utilidadTotal`, `topMedicos`.
- **Controller** (`dashboard.controller.ts`): `GET /dashboard` sin parámetros.
- **Frontend** `Dashboard.tsx`: llama `fetchDashboard()` (sin filtros) y pinta 4 KPIs + rentabilidad + Top Médicos. `dashboardApi.ts` → `GET /dashboard`.

## Qué debe modificarse para el filtro por warehouseId

**Backend (aditivo):**
1. `DashboardService.getSummary(warehouseId?: string)`:
   - Sales: `where: { estado: 'ACTIVA', ...(warehouseId ? { warehouseId } : {}) }`.
   - Purchases: `where: { tipo: 'COMPRA', ...(warehouseId ? { warehouseId } : {}) }`.
   - SalePackages: `where: { sale: { estado: 'ACTIVA', ...(warehouseId ? { warehouseId } : {}) } }`.
   - Opcional: validar el almacén si viene (existente + activo), por consistencia con `GET /products`.
2. `DashboardController`: `@Query('warehouseId') warehouseId?: string` → `getSummary(warehouseId)`.

**Frontend:**
3. `dashboardApi.ts`: `fetchDashboard(warehouseId?)` → `GET /dashboard?warehouseId=`.
4. `Dashboard.tsx`: `useWarehouse()` → `selectedWarehouseId`; `fetchDashboard(selectedWarehouseId ?? undefined)`; recargar al cambiar de almacén; mostrar el nombre del almacén en el título.

## Archivos involucrados

- Backend: `src/application/dashboard/services/dashboard.service.ts`, `src/presentation/dashboard/controllers/dashboard.controller.ts`.
- Frontend: `src/api/dashboardApi.ts`, `src/pages/Dashboard.tsx`.
- Sin cambios de `schema.prisma`, sin migraciones, sin nuevos endpoints de almacenes.

## Comportamiento propuesto

- **Un solo almacén (actual):** el selector global elige el principal → `GET /dashboard?warehouseId=principal` → como todo el historial es del principal (backfill Fase 3), los números son **idénticos** a hoy. Regresión cero.
- **Varios almacenes:** el dashboard refleja el almacén seleccionado. Un modo "todos los almacenes" quedaría como mejora opcional (toggle local), no en el selector global.

## Riesgos de regresión

1. Cambiar las consultas de agregación → mantener el filtro **opcional**: sin `warehouseId` el comportamiento es el global actual exacto.
2. Consulta anidada `salePackages → where.sale` debe mantener sintaxis correcta (no romper `gananciaCentro`/`topMedicos`).
3. Recarga del dashboard al cambiar de almacén: `useEffect` dependiente de `selectedWarehouseId`.
4. Verificar que los KPIs filtrados por principal coincidan con los globales actuales (comparación SQL solo lectura).
5. Sin cambios de BD; sin riesgo para datos reales.

## Plan por subfases

- **9.1 Backend**: `getSummary(warehouseId?)` + query param en el controller. validate/generate/build. Verificación solo lectura: agregados globales vs. filtrados por principal deben coincidir.
- **9.2 Frontend**: `fetchDashboard(warehouseId?)` + `Dashboard.tsx` con contexto y recarga + nombre del almacén en el título.
- **9.3 Verificación integral**: builds, KPIs globales vs. principal idénticos, confirmar BD intacta, regresión cero con el único almacén.

---

# CORRECCIONES POST-FASE 9 (APLICADAS)

## Corrección 1 — Bucle infinito en Login

- **Causa**: `WarehouseProvider` (Fase 8.2) ejecutaba `fetchWarehouses()` (endpoint protegido) al montar, incluso en `/login` sin token → `apiFetch` en 401 hacía `window.location.href = '/login'` (reload) → bucle.
- **Solución** (en `frontend/src/context/WarehouseContext.tsx`): condicionar el fetch a `useAuth().isAuthenticated`; si no hay sesión, limpiar `warehouses`, `selectedWarehouseId`, `error` y `loading=false`. `useEffect` depende de `[isAuthenticated]`.
- **Verificado**: `GET /warehouses` sin token → 401 (ya no se llama desde `/login`); con token → 200 (los almacenes cargan tras autenticarse).

## Corrección 2 — Aislamiento de listados de Compras y Ventas por almacén

- **Causa**: `GET /purchases` y `GET /sales` no filtraban por `warehouseId` (frontend no lo enviaba ni backend lo usaba en `findAll`).
- **Solución**:
  - Backend: `PurchaseController.findAll(@Query('warehouseId'))` → service → repo `findAll(warehouseId?)` con `where.warehouseId`. Sale: `warehouseId` en `SaleSearchParams`/`SaleSearchDto`; repo filtra `where.warehouseId`.
  - Frontend: `fetchPurchases(warehouseId?)` y `SaleSearchParams.warehouseId?`; `Purchases.tsx`/`Sales.tsx` envían `selectedWarehouseId` y recargan al cambiar de almacén.
- **Verificado**: principal → 46 compras / 106 ventas; secundario → 0; sin param → legacy (todas).

---

# ANÁLISIS Y PLAN — TRASLADO DE INVENTARIO ENTRE ALMACENES (PENDIENTE DE APROBACIÓN)

Fecha: 27/08/2026 · Solo análisis; no implementado.

## Arquitectura reutilizable

- `WarehouseStock`: `findByWarehouseAndProduct`, `updateStock` (atómico, sin negativos), `setStock`/`upsert`.
- `InventoryMovement`: `create` ya acepta `warehouseId`; campos `movementType`, `stockBefore/After`, `referenceType`, `referenceId`.
- `PrismaService` (`@Global`) disponible para `$transaction`.

## Mecanismo propuesto (sin schema ni tabla nueva)

- **`InventoryMovement` con `referenceType: 'TRANSFER'`**: dos movimientos por traslado (EXIT del origen + ENTRY del destino) con el mismo `referenceId` (UUID generado).
- **`schema.prisma` NO requiere cambios** (`WarehouseStock` e `InventoryMovement` ya lo soportan).

## Lógica de traslado (backend, transacción única)

`WarehouseService.transferStock(dto)`:
1. Validar `origenId ≠ destinoId`, almacenes existentes/activos, `cantidad ≥ 1`, producto existe.
2. `$transaction(async (tx) => ...)`:
   - Decremento origen (`stock >= cantidad`, sin negativos) → `tx.warehouseStock.updateMany`.
   - Incremento/upsert destino → `tx.warehouseStock.upsert`.
   - Si participa el **principal**: sincronizar espejo `Product.stockActual` (`tx.product.update`).
   - Crear 2 `InventoryMovement` `TRANSFER` (EXIT origen / ENTRY destino) con `stockBefore/After` reales.
   - Fallo → rollback completo.
3. `referenceId` = UUID común.

## Archivos a modificar/crear

- Backend: `warehouse.dtos.ts` (`TransferStockDto`), `warehouse.service.ts` (`transferStock` + PrismaService), `warehouse.controller.ts` (`POST /warehouses/transfer`).
- Frontend: `types/warehouse.ts` (`TransferStockDto`), `api/warehouseApi.ts` (`transferStock`), `components/TransferModal.tsx` (nuevo), `pages/Inventory.tsx` (botón "Trasladar stock" + modal + recarga). Sin cambios de sidebar.

## Compatibilidad y riesgos

- Opera con principal y secundarios según `WarehouseStock`. `referenceType: 'TRANSFER'` es distinto de `SALE`/`PURCHASE` (no se mezcla con ventas; la futura venta entre almacenes será una operación comercial aparte).
- Espejo `Product.stockActual` solo se sincroniza cuando participa el principal.
- Riesgo bajo: transacción única, guardia anti-negativos, exactamente 2 movimientos por traslado, sin cambios en flujos existentes.

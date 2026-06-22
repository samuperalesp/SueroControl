import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as readline from 'node:readline/promises';
import * as dotenv from 'dotenv';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

interface TableResult {
  table: string;
  deleted: number;
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('   LIMPIEZA DE DATOS DE PRUEBA - SueroControl ');
  console.log('═══════════════════════════════════════════════');
  console.log('');
  console.log('ADVERTENCIA: Esta operación eliminará TODOS los datos transaccionales');
  console.log('y de prueba de la base de datos.');
  console.log('');
  console.log('SE MANTENDRÁ:');
  console.log('  - Usuarios del sistema');
  console.log('  - Estructura de tablas');
  console.log('  - Migraciones');
  console.log('  - Configuración');
  console.log('');
  console.log('SE ELIMINARÁ:');
  console.log('  - Ventas');
  console.log('  - Detalles de ventas');
  console.log('  - Compras');
  console.log('  - Detalles de compras');
  console.log('  - Movimientos de inventario');
  console.log('  - Paquetes');
  console.log('  - Detalles de paquetes');
  console.log('  - Costos operativos de paquetes');
  console.log('  - Snapshots de rentabilidad (SalePackage)');
  console.log('  - Productos');
  console.log('  - Terceros (clientes, proveedores, médicos)');
  console.log('');

  const env = process.env.NODE_ENV || 'development';
  const dbUrl = process.env.DATABASE_URL || '';
  const dbName = dbUrl.split('/').pop()?.split('?')[0] || 'unknown';

  console.log(`Entorno: ${env}`);
  console.log(`Base de datos: ${dbName}`);
  console.log('');

  if (env === 'production') {
    console.log('ERROR: No se puede ejecutar la limpieza en entorno de producción.');
    console.log('Establezca NODE_ENV=development o NODE_ENV=staging para continuar.');
    process.exit(1);
  }

  const answer = await rl.question(
    'Escriba "BORRAR" en mayúsculas para confirmar la eliminación de todos los datos: '
  );

  if (answer !== 'BORRAR') {
    console.log('Operación cancelada por el usuario.');
    process.exit(0);
  }

  console.log('');
  console.log('Iniciando limpieza...');
  console.log('');

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('ERROR: DATABASE_URL no está configurada en el archivo .env');
    process.exit(1);
  }
  const adapter = new PrismaPg(url);
  const prisma = new PrismaClient({ adapter });
  const results: TableResult[] = [];

  try {
    await prisma.$connect();

    // --- Delete in FK-safe order ---

    // 1. SalePackage (depends on Sale, Package, Tercero)
    const salePackageCount = await prisma.salePackage.count();
    await prisma.salePackage.deleteMany();
    results.push({ table: 'SalePackage (rentabilidad)', deleted: salePackageCount });

    // 2. SaleDetail (depends on Sale, Product, Package)
    const saleDetailCount = await prisma.saleDetail.count();
    await prisma.saleDetail.deleteMany();
    results.push({ table: 'SaleDetail', deleted: saleDetailCount });

    // 3. Sale (depends on Tercero)
    const saleCount = await prisma.sale.count();
    await prisma.sale.deleteMany();
    results.push({ table: 'Sale', deleted: saleCount });

    // 4. PurchaseDetail (depends on Purchase, Product)
    const purchaseDetailCount = await prisma.purchaseDetail.count();
    await prisma.purchaseDetail.deleteMany();
    results.push({ table: 'PurchaseDetail', deleted: purchaseDetailCount });

    // 5. Purchase (depends on Tercero)
    const purchaseCount = await prisma.purchase.count();
    await prisma.purchase.deleteMany();
    results.push({ table: 'Purchase', deleted: purchaseCount });

    // 6. InventoryMovement (depends on Product)
    const movementCount = await prisma.inventoryMovement.count();
    await prisma.inventoryMovement.deleteMany();
    results.push({ table: 'InventoryMovement', deleted: movementCount });

    // 7. PackageOperatingCost (depends on Package)
    const opCostCount = await prisma.packageOperatingCost.count();
    await prisma.packageOperatingCost.deleteMany();
    results.push({ table: 'PackageOperatingCost', deleted: opCostCount });

    // 8. PackageDetail (depends on Package, Product)
    const pkgDetailCount = await prisma.packageDetail.count();
    await prisma.packageDetail.deleteMany();
    results.push({ table: 'PackageDetail', deleted: pkgDetailCount });

    // 9. Package
    const packageCount = await prisma.package.count();
    await prisma.package.deleteMany();
    results.push({ table: 'Package', deleted: packageCount });

    // 10. Product
    const productCount = await prisma.product.count();
    await prisma.product.deleteMany();
    results.push({ table: 'Product', deleted: productCount });

    // 11. Tercero
    const terceroCount = await prisma.tercero.count();
    await prisma.tercero.deleteMany();
    results.push({ table: 'Tercero', deleted: terceroCount });

    // --- Show results ---
    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('   LIMPIEZA COMPLETADA ');
    console.log('═══════════════════════════════════════════════');
    console.log('');

    let totalDeleted = 0;
    for (const r of results) {
      console.log(`  ${r.table.padEnd(35)} ${String(r.deleted).padStart(6)} registros eliminados`);
      totalDeleted += r.deleted;
    }

    console.log('');
    console.log(`  TOTAL: ${totalDeleted} registros eliminados`);
    console.log('');

    // Remaining data
    const remainingUsers = await prisma.user.count();
    console.log('REGISTROS CONSERVADOS:');
    console.log(`  User                                          ${String(remainingUsers).padStart(6)} usuarios`);
    console.log('');

    console.log('La base de datos está lista para iniciar operaciones reales.');
    console.log('');

  } catch (error) {
    console.error('Error durante la limpieza:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

main();

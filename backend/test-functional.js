require('dotenv/config');
require('reflect-metadata');
const http = require('http');
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { AppModule } = require('./dist/app.module');

const BASE = 'http://localhost:3000';
let PASS = 0, FAIL = 0;

function green(m) { console.log('\x1b[32m  \u2713 ' + m + '\x1b[0m'); }
function red(m) { console.log('\x1b[31m  \u2717 ' + m + '\x1b[0m'); }
function bold(m) { console.log('\x1b[1m' + m + '\x1b[0m'); }

function fetch(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: body ? { 'Content-Type': 'application/json' } : {},
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function assert(condition, msg) {
  if (condition) { green(msg); PASS++; }
  else { red(msg); FAIL++; }
}

async function main() {
  bold('=== Starting Backend ===');
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.listen(3000);
  green('Backend running');

  bold('=== Test 1: Create Product ===');
  let r = await fetch('POST', '/products', { codigo: 'PROD-001', nombre: 'Producto Test', categoria: 'Categoria A', descripcion: 'Descripcion test', costoCompra: 10.5, precioVenta: 25.0, stockActual: 100, stockMinimo: 10, activo: true });
  assert(r.status === 201, 'Create product returns 201');
  const prod = JSON.parse(r.body);
  assert(prod.codigo === 'PROD-001', 'Product has correct codigo');
  const prodId = prod.id;

  bold('=== Test 2: Duplicate Product (should fail) ===');
  r = await fetch('POST', '/products', { codigo: 'PROD-001', nombre: 'Duplicado', categoria: 'A', descripcion: 'test', costoCompra: 10, precioVenta: 20, stockActual: 0, stockMinimo: 0, activo: true });
  assert(r.status === 400, 'Duplicate product returns 400');

  bold('=== Test 3: List Products ===');
  r = await fetch('GET', '/products');
  assert(r.status === 200, 'List products returns 200');
  const list = JSON.parse(r.body);
  assert(list.length >= 1, 'List is not empty');

  bold('=== Test 4: Get Product by ID ===');
  r = await fetch('GET', '/products/' + prodId);
  assert(r.status === 200, 'Get product by ID returns 200');

  bold('=== Test 5: Edit Product ===');
  r = await fetch('PUT', '/products/' + prodId, { nombre: 'Producto Modificado', precioVenta: 30 });
  assert(r.status === 200, 'Edit product returns 200');
  assert(JSON.parse(r.body).nombre === 'Producto Modificado', 'Product name updated');

  bold('=== Test 6: Delete Product ===');
  r = await fetch('DELETE', '/products/' + prodId);
  assert(r.status === 204, 'Delete product returns 204');
  r = await fetch('GET', '/products/' + prodId);
  assert(r.status === 404, 'Deleted product returns 404');

  bold('=== Creating products for purchase/sale tests ===');
  r = await fetch('POST', '/products', { codigo: 'PROD-A', nombre: 'Producto A', categoria: 'Test', descripcion: 'test', costoCompra: 5, precioVenta: 15, stockActual: 50, stockMinimo: 5, activo: true });
  const prodA = JSON.parse(r.body);
  const prodAId = prodA.id;
  console.log('  Producto A ID:', prodAId);

  r = await fetch('POST', '/products', { codigo: 'PROD-B', nombre: 'Producto B', categoria: 'Test', descripcion: 'test', costoCompra: 3, precioVenta: 10, stockActual: 30, stockMinimo: 3, activo: true });
  const prodB = JSON.parse(r.body);
  const prodBId = prodB.id;
  console.log('  Producto B ID:', prodBId);

  bold('=== Test 7: Register Purchase (ENTRY) ===');
  r = await fetch('POST', '/purchases', { details: [{ productId: prodAId, quantity: 20, unitCost: 5 }, { productId: prodBId, quantity: 10, unitCost: 3 }] });
  assert(r.status === 201, 'Create purchase returns 201');

  bold('=== Test 8: Verify Stock Increase ===');
  r = await fetch('GET', '/products/' + prodAId);
  let pA = JSON.parse(r.body);
  assert(pA.stockActual === 70, 'Product A stock increased to 70');

  r = await fetch('GET', '/products/' + prodBId);
  let pB = JSON.parse(r.body);
  assert(pB.stockActual === 40, 'Product B stock increased to 40');

  bold('=== Test 9: Register Sale (EXIT) ===');
  r = await fetch('POST', '/sales', { details: [{ productId: prodAId, quantity: 10, unitPrice: 15 }, { productId: prodBId, quantity: 5, unitPrice: 10 }] });
  assert(r.status === 201, 'Create sale returns 201');

  bold('=== Test 10: Verify Stock Decrease ===');
  r = await fetch('GET', '/products/' + prodAId);
  pA = JSON.parse(r.body);
  assert(pA.stockActual === 60, 'Product A stock decreased to 60');

  r = await fetch('GET', '/products/' + prodBId);
  pB = JSON.parse(r.body);
  assert(pB.stockActual === 35, 'Product B stock decreased to 35');

  bold('=== Test 11: Sale with insufficient stock (should fail) ===');
  r = await fetch('POST', '/sales', { details: [{ productId: prodAId, quantity: 999, unitPrice: 15 }] });
  assert(r.status === 400, 'Insufficient stock returns 400');

  bold('=== Test 12: Create Package ===');
  r = await fetch('POST', '/packages', { nombre: 'Paquete Detox', precio: 35, activo: true, details: [{ productId: prodAId, quantity: 2 }, { productId: prodBId, quantity: 1 }] });
  assert(r.status === 201, 'Create package returns 201');
  const pkg = JSON.parse(r.body);
  assert(pkg.nombre === 'Paquete Detox', 'Package name correct');
  const pkgId = pkg.id;

  bold('=== Test 13: Sell Package ===');
  r = await fetch('POST', '/packages/' + pkgId + '/sell', {});
  assert(r.status === 201, 'Sell package returns 201');

  bold('=== Test 14: Verify Stock After Package Sale ===');
  r = await fetch('GET', '/products/' + prodAId);
  pA = JSON.parse(r.body);
  assert(pA.stockActual === 58, 'Product A stock after package sale: 58');

  r = await fetch('GET', '/products/' + prodBId);
  pB = JSON.parse(r.body);
  assert(pB.stockActual === 34, 'Product B stock after package sale: 34');

  bold('=== Test 15: Verify Inventory Movements ===');
  r = await fetch('GET', '/inventory-movements');
  const movements = JSON.parse(r.body);
  assert(movements.length >= 4, 'Inventory movements recorded: ' + movements.length);

  bold('');
  bold('==========================================');
  bold('         FUNCTIONAL TEST RESULTS          ');
  bold('==========================================');
  bold('  PASSED: ' + PASS);
  bold('  FAILED: ' + FAIL);
  bold('==========================================');

  await app.close();
  process.exit(FAIL > 0 ? 1 : 0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });

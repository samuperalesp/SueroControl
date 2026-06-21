#!/bin/bash
set -e

BASE="http://localhost:3000"
PASS=0
FAIL=0

green() { echo -e "\033[32m$1\033[0m"; }
red() { echo -e "\033[31m$1\033[0m"; }
bold() { echo -e "\033[1m$1\033[0m"; }

assert_status() {
    local expected=$1
    local actual=$2
    local msg=$3
    if [ "$actual" = "$expected" ]; then
        green "  ✓ $msg"
        PASS=$((PASS+1))
    else
        red "  ✗ $msg (expected status $expected, got $actual)"
        FAIL=$((FAIL+1))
    fi
}

assert_contains() {
    local haystack=$1
    local needle=$2
    local msg=$3
    if echo "$haystack" | grep -q "$needle"; then
        green "  ✓ $msg"
        PASS=$((PASS+1))
    else
        red "  ✗ $msg (expected to contain '$needle')"
        FAIL=$((FAIL+1))
    fi
}

bold "=== Starting Backend ==="
node -e "
require('dotenv/config');
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { AppModule } = require('./dist/app.module');
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.listen(process.env.PORT || 3000);
}
bootstrap().catch(e => { console.error('FATAL:', e); process.exit(1); });
" &
BACKEND_PID=$!
sleep 4

if ! kill -0 $BACKEND_PID 2>/dev/null; then
    red "Backend failed to start"
    exit 1
fi
green "Backend running (PID: $BACKEND_PID)"

bold "=== Test 1: Create Product ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/products" \
    -H "Content-Type: application/json" \
    -d '{"codigo":"PROD-001","nombre":"Producto Test","categoria":"Categoria A","descripcion":"Descripcion test","costoCompra":10.5,"precioVenta":25.0,"stockActual":100,"stockMinimo":10,"activo":true}')
HTTP=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
PROD_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
assert_status 201 "$HTTP" "Create product returns 201"
assert_contains "$BODY" "PROD-001" "Product has correct codigo"

bold "=== Test 2: Create Duplicate Product (should fail) ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/products" \
    -H "Content-Type: application/json" \
    -d '{"codigo":"PROD-001","nombre":"Duplicado","categoria":"Categoria A","descripcion":"test","costoCompra":10,"precioVenta":20,"stockActual":0,"stockMinimo":0,"activo":true}')
HTTP=$(echo "$RESP" | tail -1)
assert_status 400 "$HTTP" "Duplicate product code returns 400"

bold "=== Test 3: List Products ==="
RESP=$(curl -s -w "\n%{http_code}" "$BASE/products")
HTTP=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$HTTP" "List products returns 200"
assert_contains "$BODY" "PROD-001" "List contains created product"

bold "=== Test 4: Get Product by ID ==="
RESP=$(curl -s -w "\n%{http_code}" "$BASE/products/$PROD_ID")
HTTP=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$HTTP" "Get product by ID returns 200"
assert_contains "$BODY" "$PROD_ID" "Response contains product ID"

bold "=== Test 5: Edit Product ==="
RESP=$(curl -s -w "\n%{http_code}" -X PUT "$BASE/products/$PROD_ID" \
    -H "Content-Type: application/json" \
    -d '{"nombre":"Producto Modificado","precioVenta":30.0}')
HTTP=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
assert_status 200 "$HTTP" "Edit product returns 200"
assert_contains "$BODY" "Producto Modificado" "Product name was updated"

bold "=== Test 6: Delete Product ==="
RESP=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE/products/$PROD_ID")
HTTP=$(echo "$RESP" | tail -1)
assert_status 204 "$HTTP" "Delete product returns 204"

# Verify deleted
RESP=$(curl -s -w "\n%{http_code}" "$BASE/products/$PROD_ID")
HTTP=$(echo "$RESP" | tail -1)
assert_status 404 "$HTTP" "Deleted product returns 404"

bold "=== Creating products for purchase/sale tests ==="
RESP=$(curl -s -X POST "$BASE/products" -H "Content-Type: application/json" \
    -d '{"codigo":"PROD-A","nombre":"Producto A","categoria":"Test","descripcion":"test","costoCompra":5,"precioVenta":15,"stockActual":50,"stockMinimo":5,"activo":true}')
PROD_A_ID=$(echo "$RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  Producto A ID: $PROD_A_ID"

RESP=$(curl -s -X POST "$BASE/products" -H "Content-Type: application/json" \
    -d '{"codigo":"PROD-B","nombre":"Producto B","categoria":"Test","descripcion":"test","costoCompra":3,"precioVenta":10,"stockActual":30,"stockMinimo":3,"activo":true}')
PROD_B_ID=$(echo "$RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  Producto B ID: $PROD_B_ID"

bold "=== Test 7: Register Purchase (ENTRY) ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/purchases" \
    -H "Content-Type: application/json" \
    -d "{\"details\":[{\"productId\":\"$PROD_A_ID\",\"quantity\":20,\"unitCost\":5},{\"productId\":\"$PROD_B_ID\",\"quantity\":10,\"unitCost\":3}]}")
HTTP=$(echo "$RESP" | tail -1)
PURCHASE_ID=$(echo "$RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
assert_status 201 "$HTTP" "Create purchase returns 201"

bold "=== Test 8: Verify Stock Increase ==="
RESP=$(curl -s "$BASE/products/$PROD_A_ID")
STOCK_A=$(echo "$RESP" | grep -o '"stockActual":[0-9]*' | cut -d: -f2)
if [ "$STOCK_A" = "70" ]; then
    green "  ✓ Product A stock increased to 70 (was 50, +20)"
    PASS=$((PASS+1))
else
    red "  ✗ Product A stock expected 70, got $STOCK_A"
    FAIL=$((FAIL+1))
fi

RESP=$(curl -s "$BASE/products/$PROD_B_ID")
STOCK_B=$(echo "$RESP" | grep -o '"stockActual":[0-9]*' | cut -d: -f2)
if [ "$STOCK_B" = "40" ]; then
    green "  ✓ Product B stock increased to 40 (was 30, +10)"
    PASS=$((PASS+1))
else
    red "  ✗ Product B stock expected 40, got $STOCK_B"
    FAIL=$((FAIL+1))
fi

bold "=== Test 9: Register Sale (EXIT) ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/sales" \
    -H "Content-Type: application/json" \
    -d "{\"details\":[{\"productId\":\"$PROD_A_ID\",\"quantity\":10,\"unitPrice\":15},{\"productId\":\"$PROD_B_ID\",\"quantity\":5,\"unitPrice\":10}]}")
HTTP=$(echo "$RESP" | tail -1)
SALE_ID=$(echo "$RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
assert_status 201 "$HTTP" "Create sale returns 201"

bold "=== Test 10: Verify Stock Decrease ==="
RESP=$(curl -s "$BASE/products/$PROD_A_ID")
STOCK_A=$(echo "$RESP" | grep -o '"stockActual":[0-9]*' | cut -d: -f2)
if [ "$STOCK_A" = "60" ]; then
    green "  ✓ Product A stock decreased to 60 (was 70, -10)"
    PASS=$((PASS+1))
else
    red "  ✗ Product A stock expected 60, got $STOCK_A"
    FAIL=$((FAIL+1))
fi

RESP=$(curl -s "$BASE/products/$PROD_B_ID")
STOCK_B=$(echo "$RESP" | grep -o '"stockActual":[0-9]*' | cut -d: -f2)
if [ "$STOCK_B" = "35" ]; then
    green "  ✓ Product B stock decreased to 35 (was 40, -5)"
    PASS=$((PASS+1))
else
    red "  ✗ Product B stock expected 35, got $STOCK_B"
    FAIL=$((FAIL+1))
fi

bold "=== Test 11: Sale with insufficient stock (should fail) ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/sales" \
    -H "Content-Type: application/json" \
    -d "{\"details\":[{\"productId\":\"$PROD_A_ID\",\"quantity\":999,\"unitPrice\":15}]}")
HTTP=$(echo "$RESP" | tail -1)
assert_status 400 "$HTTP" "Sale with insufficient stock returns 400"

bold "=== Test 12: Create Package ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/packages" \
    -H "Content-Type: application/json" \
    -d "{\"nombre\":\"Paquete Detox\",\"precio\":35,\"activo\":true,\"details\":[{\"productId\":\"$PROD_A_ID\",\"quantity\":2},{\"productId\":\"$PROD_B_ID\",\"quantity\":1}]}")
HTTP=$(echo "$RESP" | tail -1)
PKG_ID=$(echo "$RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
assert_status 201 "$HTTP" "Create package returns 201"
assert_contains "$RESP" "Paquete Detox" "Package name is correct"

bold "=== Test 13: Sell Package ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/packages/$PKG_ID/sell" \
    -H "Content-Type: application/json" \
    -d '{}')
HTTP=$(echo "$RESP" | tail -1)
assert_status 201 "$HTTP" "Sell package returns 201"

bold "=== Test 14: Verify Stock After Package Sale ==="
RESP=$(curl -s "$BASE/products/$PROD_A_ID")
STOCK_A=$(echo "$RESP" | grep -o '"stockActual":[0-9]*' | cut -d: -f2)
if [ "$STOCK_A" = "58" ]; then
    green "  ✓ Product A stock after package sale: 58 (was 60, -2)"
    PASS=$((PASS+1))
else
    red "  ✗ Product A stock expected 58, got $STOCK_A"
    FAIL=$((FAIL+1))
fi

RESP=$(curl -s "$BASE/products/$PROD_B_ID")
STOCK_B=$(echo "$RESP" | grep -o '"stockActual":[0-9]*' | cut -d: -f2)
if [ "$STOCK_B" = "34" ]; then
    green "  ✓ Product B stock after package sale: 34 (was 35, -1)"
    PASS=$((PASS+1))
else
    red "  ✗ Product B stock expected 34, got $STOCK_B"
    FAIL=$((FAIL+1))
fi

bold "=== Test 15: Verify Inventory Movements ==="
RESP=$(curl -s "$BASE/inventory-movements")
MOV_COUNT=$(echo "$RESP" | grep -o '"id"' | wc -l)
if [ "$MOV_COUNT" -ge 4 ]; then
    green "  ✓ Inventory movements recorded: $MOV_COUNT"
    PASS=$((PASS+1))
else
    red "  ✗ Expected at least 4 movements, got $MOV_COUNT"
    FAIL=$((FAIL+1))
fi

bold "=== Cleanup ==="
kill $BACKEND_PID 2>/dev/null || true

bold ""
bold "=========================================="
bold "         FUNCTIONAL TEST RESULTS          "
bold "=========================================="
bold "  PASSED: $PASS"
bold "  FAILED: $FAIL"
bold "=========================================="

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi

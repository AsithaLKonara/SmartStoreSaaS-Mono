#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔍 API ISSUE INVESTIGATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

DOMAIN="https://smartstore-demo.vercel.app"

echo "1. Testing APIs that returned errors in E2E..."
echo ""

# Export API (returned 500)
echo "📤 Product Export API:"
curl -s "$DOMAIN/api/export/products" -w "\n  Status: %{http_code}\n" | head -20

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "2. Testing all 9 core APIs with detailed response..."
echo ""

echo "📦 Products API:"
curl -s "$DOMAIN/api/products" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  Success: {d.get(\"success\")}'); print(f'  Count: {len(d.get(\"data\", []))}'); print(f'  Error: {d.get(\"error\", \"None\")}')" 2>&1

echo ""
echo "📋 Orders API:"
curl -s "$DOMAIN/api/orders" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  Success: {d.get(\"success\")}'); print(f'  Count: {len(d.get(\"data\", []))}'); print(f'  Error: {d.get(\"error\", \"None\")}')" 2>&1

echo ""
echo "👥 Customers API:"
curl -s "$DOMAIN/api/customers" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  Success: {d.get(\"success\")}'); print(f'  Count: {len(d.get(\"data\", []))}'); print(f'  Error: {d.get(\"error\", \"None\")}')" 2>&1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "3. Testing POST/PUT methods (these should require auth/body)..."
echo ""

echo "📝 Create Product (without auth - should fail gracefully):"
curl -s -X POST "$DOMAIN/api/products" -H "Content-Type: application/json" -w "\n  Status: %{http_code}\n" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  Error: {d.get(\"error\", \"No error\")}')" 2>&1

echo ""
echo "📝 Create Order (without auth - should fail gracefully):"
curl -s -X POST "$DOMAIN/api/orders" -H "Content-Type: application/json" -w "\n  Status: %{http_code}\n" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  Error: {d.get(\"error\", \"No error\")}')" 2>&1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "4. Checking for 500 errors across all endpoints..."
echo ""

ENDPOINTS=(
  "/api/products"
  "/api/orders"
  "/api/customers"
  "/api/users"
  "/api/tenants"
  "/api/subscriptions"
  "/api/analytics/dashboard"
  "/api/reports/sales"
  "/api/reports/inventory"
  "/api/export/products"
  "/api/loyalty"
  "/api/suppliers"
  "/api/purchase-orders"
  "/api/returns"
)

ERROR_COUNT=0
for endpoint in "${ENDPOINTS[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN$endpoint")
  if [ "$STATUS" = "500" ]; then
    echo "  ❌ $endpoint - 500 Internal Server Error"
    ((ERROR_COUNT++))
  fi
done

if [ $ERROR_COUNT -eq 0 ]; then
  echo "  ✅ No 500 errors found in tested endpoints"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📊 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  500 Errors Found: $ERROR_COUNT"
echo ""


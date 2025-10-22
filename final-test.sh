#!/bin/bash
echo "🚀 FINAL COMPREHENSIVE API TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
DOMAIN="https://smartstore-demo.vercel.app"
PASS=0
FAIL=0

test_api() {
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$1")
  if [ "$STATUS" = "200" ]; then
    echo "✅ $2"
    ((PASS++))
  else
    echo "❌ $2 (HTTP $STATUS)"
    ((FAIL++))
  fi
}

test_api "$DOMAIN/api/products" "Products API"
test_api "$DOMAIN/api/orders" "Orders API"
test_api "$DOMAIN/api/customers" "Customers API"
test_api "$DOMAIN/api/users" "Users API"
test_api "$DOMAIN/api/tenants" "Tenants API"
test_api "$DOMAIN/api/subscriptions" "Subscriptions API"
test_api "$DOMAIN/api/analytics/dashboard" "Analytics API"
test_api "$DOMAIN/api/reports/sales" "Sales Report API"
test_api "$DOMAIN/api/reports/inventory" "Inventory Report API"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "RESULTS: ✅ $PASS passed | ❌ $FAIL failed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

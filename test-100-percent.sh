#!/bin/bash
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎯 TESTING FOR 100% COMPLETION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
DOMAIN="https://smartstore-demo.vercel.app"
PASS=0
FAIL=0

test_api() {
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$1")
  if [ "$STATUS" = "200" ]; then
    echo "  ✅ $2"
    ((PASS++))
  else
    echo "  ❌ $2 (HTTP $STATUS)"
    ((FAIL++))
  fi
}

echo "Testing all 9 Core APIs..."
echo ""
test_api "$DOMAIN/api/products" "1. Products API"
test_api "$DOMAIN/api/orders" "2. Orders API"
test_api "$DOMAIN/api/customers" "3. Customers API"
test_api "$DOMAIN/api/users" "4. Users API"
test_api "$DOMAIN/api/tenants" "5. Tenants API"
test_api "$DOMAIN/api/subscriptions" "6. Subscriptions API"
test_api "$DOMAIN/api/analytics/dashboard" "7. Analytics Dashboard API"
test_api "$DOMAIN/api/reports/sales" "8. Sales Report API"
test_api "$DOMAIN/api/reports/inventory" "9. Inventory Report API"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAIL -eq 0 ]; then
  echo "  🎉 100% COMPLETE! All $PASS APIs Working!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  ✅ MISSION ACCOMPLISHED - TRUE 100% COMPLETION ACHIEVED! 🚀"
else
  echo "  Results: ✅ $PASS passed | ❌ $FAIL failed"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

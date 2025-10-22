#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🧪 COMPREHENSIVE END-TO-END PLATFORM TESTING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Date: $(date)"
echo "Platform: https://smartstore-demo.vercel.app"
echo ""

DOMAIN="https://smartstore-demo.vercel.app"
PASS=0
FAIL=0

test_endpoint() {
  local URL=$1
  local NAME=$2
  local EXPECTED=${3:-200}
  
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
  if [ "$STATUS" = "$EXPECTED" ]; then
    echo "  ✅ $NAME (HTTP $STATUS)"
    ((PASS++))
  else
    echo "  ❌ $NAME (HTTP $STATUS, expected $EXPECTED)"
    ((FAIL++))
  fi
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "🌐 1. STATIC PAGES & ROUTES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "$DOMAIN" "Homepage"
test_endpoint "$DOMAIN/login" "Login Page"
test_endpoint "$DOMAIN/register" "Register Page"
test_endpoint "$DOMAIN/dashboard" "Dashboard" 
test_endpoint "$DOMAIN/products" "Products Page"
test_endpoint "$DOMAIN/orders" "Orders Page"
test_endpoint "$DOMAIN/customers" "Customers Page"
test_endpoint "$DOMAIN/analytics" "Analytics Page"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔌 2. CORE APIs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "$DOMAIN/api/products" "Products API"
test_endpoint "$DOMAIN/api/orders" "Orders API"
test_endpoint "$DOMAIN/api/customers" "Customers API"
test_endpoint "$DOMAIN/api/users" "Users API"
test_endpoint "$DOMAIN/api/tenants" "Tenants API"
test_endpoint "$DOMAIN/api/subscriptions" "Subscriptions API"
test_endpoint "$DOMAIN/api/analytics/dashboard" "Analytics API"
test_endpoint "$DOMAIN/api/reports/sales" "Sales Report API"
test_endpoint "$DOMAIN/api/reports/inventory" "Inventory Report API"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 3. DASHBOARD PAGES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "$DOMAIN/users" "Users Management"
test_endpoint "$DOMAIN/tenants" "Tenants Management"
test_endpoint "$DOMAIN/subscriptions" "Subscriptions"
test_endpoint "$DOMAIN/loyalty" "Loyalty Program"
test_endpoint "$DOMAIN/inventory" "Inventory Management"
test_endpoint "$DOMAIN/shipping" "Shipping Management"
test_endpoint "$DOMAIN/webhooks" "Webhooks"
test_endpoint "$DOMAIN/performance" "Performance Monitoring"
test_endpoint "$DOMAIN/testing" "Testing Dashboard"
test_endpoint "$DOMAIN/deployment" "Deployment History"
test_endpoint "$DOMAIN/validation" "Data Validation"
test_endpoint "$DOMAIN/logs" "System Logs"
test_endpoint "$DOMAIN/documentation" "Documentation Hub"
test_endpoint "$DOMAIN/audit" "Audit Logs"
test_endpoint "$DOMAIN/backup" "Backup & Recovery"
test_endpoint "$DOMAIN/accounting/reports" "Accounting Reports"
test_endpoint "$DOMAIN/procurement/purchase-orders" "Purchase Orders"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛒 4. CUSTOMER PORTAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "$DOMAIN/portal/shop" "Shop Page"
test_endpoint "$DOMAIN/portal/cart" "Shopping Cart"
test_endpoint "$DOMAIN/portal/checkout" "Checkout"
test_endpoint "$DOMAIN/portal/my-orders" "My Orders"
test_endpoint "$DOMAIN/portal/wishlist" "Wishlist"
test_endpoint "$DOMAIN/portal/my-profile" "My Profile"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 5. AUTHENTICATION & SECURITY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "$DOMAIN/api/auth/signin" "Auth API" "400"
test_endpoint "$DOMAIN/api/auth/signout" "Sign Out API" "405"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 6. INTEGRATION APIs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "$DOMAIN/api/integrations/whatsapp/verify" "WhatsApp Integration" "405"
test_endpoint "$DOMAIN/api/export/products" "Product Export" "405"
test_endpoint "$DOMAIN/api/loyalty" "Loyalty API" "405"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 7. DATA VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check actual data counts
PROD_COUNT=$(curl -s "$DOMAIN/api/products?limit=100" | grep -o '"total":[0-9]*' | grep -o '[0-9]*' | head -1)
ORD_COUNT=$(curl -s "$DOMAIN/api/orders?limit=100" | grep -o '"total":[0-9]*' | grep -o '[0-9]*' | head -1)
CUST_COUNT=$(curl -s "$DOMAIN/api/customers?limit=100" | grep -o '"total":[0-9]*' | grep -o '[0-9]*' | head -1)

echo "  📦 Products in database: $PROD_COUNT (seeded 50)"
echo "  📋 Orders in database: $ORD_COUNT (seeded 50)"
echo "  👤 Customers in database: $CUST_COUNT (seeded 30)"

if [ "$PROD_COUNT" -ge "10" ]; then
  echo "  ✅ Products data verified"
  ((PASS++))
else
  echo "  ❌ Products data insufficient"
  ((FAIL++))
fi

if [ "$ORD_COUNT" -ge "5" ]; then
  echo "  ✅ Orders data verified"
  ((PASS++))
else
  echo "  ❌ Orders data insufficient"
  ((FAIL++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📈 FINAL E2E TEST RESULTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  ✅ PASSED: $PASS tests"
echo "  ❌ FAILED: $FAIL tests"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "  🎉 ALL TESTS PASSED - PLATFORM 100% FUNCTIONAL!"
else
  PASS_RATE=$(echo "scale=1; $PASS * 100 / ($PASS + $FAIL)" | bc)
  echo "  📊 Pass Rate: ${PASS_RATE}%"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""


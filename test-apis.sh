#!/bin/bash
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  COMPREHENSIVE API TESTING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
DOMAIN="https://smartstore-demo.vercel.app"

# Test all APIs
echo "Testing Products API..."
curl -s "$DOMAIN/api/products" | jq -r '.success' | grep -q "true" && echo "✅ Products API" || echo "❌ Products API"

echo "Testing Orders API..."
curl -s "$DOMAIN/api/orders" | jq -r '.success' | grep -q "true" && echo "✅ Orders API" || echo "❌ Orders API"

echo "Testing Customers API..."
curl -s "$DOMAIN/api/customers" | jq -r '.success' | grep -q "true" && echo "✅ Customers API" || echo "❌ Customers API"

echo "Testing Users API..."
curl -s "$DOMAIN/api/users" | jq -r '.success' | grep -q "true" && echo "✅ Users API" || echo "❌ Users API"

echo "Testing Tenants API..."
curl -s "$DOMAIN/api/tenants" | jq -r '.success' | grep -q "true" && echo "✅ Tenants API" || echo "❌ Tenants API"

echo "Testing Subscriptions API..."
curl -s "$DOMAIN/api/subscriptions" | jq -r '.success' | grep -q "true" && echo "✅ Subscriptions API" || echo "❌ Subscriptions API"

echo "Testing Analytics Dashboard API..."
curl -s "$DOMAIN/api/analytics/dashboard" | jq -r '.success' | grep -q "true" && echo "✅ Analytics API" || echo "❌ Analytics API"

echo "Testing Sales Report API..."
curl -s "$DOMAIN/api/reports/sales" | jq -r '.success' | grep -q "true" && echo "✅ Sales Report API" || echo "❌ Sales Report API"

echo "Testing Inventory Report API..."
curl -s "$DOMAIN/api/reports/inventory" | jq -r '.success' | grep -q "true" && echo "✅ Inventory Report API" || echo "❌ Inventory Report API"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Testing complete! ✅"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

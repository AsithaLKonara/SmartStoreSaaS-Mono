#!/bin/bash

echo "🧪 Testing All Pages on https://smartstore-demo.vercel.app"
echo "═══════════════════════════════════════════════════════════"

BASE_URL="https://smartstore-demo.vercel.app"

# Test pages
pages=(
    "/"
    "/login"
    "/register"
    "/dashboard"
    "/products"
    "/orders"
    "/customers"
    "/analytics"
    "/accounting"
    "/inventory"
    "/settings"
    "/unauthorized"
)

pass=0
fail=0

for page in "${pages[@]}"; do
    echo -n "Testing $page ... "
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$page" 2>&1)
    
    if [ "$status" = "200" ] || [ "$status" = "307" ] || [ "$status" = "302" ]; then
        echo "✅ $status"
        ((pass++))
    else
        echo "❌ $status"
        ((fail++))
    fi
done

echo ""
echo "Results: ✅ $pass passed, ❌ $fail failed"

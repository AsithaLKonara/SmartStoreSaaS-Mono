#!/bin/bash

echo "🧪 Testing SmartStore SaaS Production Deployment"
echo "================================================"
echo ""

BASE_URL="https://smartstore-saas.vercel.app"
CUSTOM_DOMAIN="https://smartstore-demo.asithalkonara.com"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_url() {
  local url=$1
  local description=$2
  
  echo -n "Testing $description..."
  response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)
  
  if [ "$response" = "200" ] || [ "$response" = "201" ] || [ "$response" = "302" ] || [ "$response" = "307" ]; then
    echo -e " ${GREEN}✅ OK${NC} ($response)"
    return 0
  else
    echo -e " ${RED}❌ Failed${NC} ($response)"
    return 1
  fi
}

echo "1️⃣ Testing Main Pages"
echo "-------------------"
test_url "$BASE_URL" "Home Page"
test_url "$BASE_URL/login" "Login Page"
test_url "$BASE_URL/dashboard" "Dashboard (may redirect)"
echo ""

echo "2️⃣ Testing API Endpoints"
echo "----------------------"
test_url "$BASE_URL/api/health" "Health Check"
test_url "$BASE_URL/api/db-check" "Database Check"
test_url "$BASE_URL/api/auth/providers" "Auth Providers"
test_url "$BASE_URL/api/monitoring/status" "Monitoring Status"
echo ""

echo "3️⃣ Testing Custom Domain"
echo "----------------------"
test_url "$CUSTOM_DOMAIN" "Custom Domain Home"
test_url "$CUSTOM_DOMAIN/login" "Custom Domain Login"
echo ""

echo "4️⃣ Testing Response Times"
echo "----------------------"
start_time=$(date +%s%N)
curl -s "$BASE_URL" > /dev/null
end_time=$(date +%s%N)
elapsed=$(( ($end_time - $start_time) / 1000000 ))
echo -e "Home page load time: ${GREEN}${elapsed}ms${NC}"

start_time=$(date +%s%N)
curl -s "$BASE_URL/api/health" > /dev/null
end_time=$(date +%s%N)
elapsed=$(( ($end_time - $start_time) / 1000000 ))
echo -e "API response time: ${GREEN}${elapsed}ms${NC}"
echo ""

echo "5️⃣ Testing API Response Content"
echo "------------------------------"
echo "Health endpoint response:"
curl -s "$BASE_URL/api/health" | head -c 200
echo ""
echo ""

echo "✅ Production Testing Complete!"
echo ""
echo "📊 Summary:"
echo "  - Main URL: $BASE_URL"
echo "  - Custom Domain: $CUSTOM_DOMAIN"
echo "  - Test Time: $(date)"
echo ""
echo "💡 Next Steps:"
echo "  1. If tests passed: Production is healthy ✅"
echo "  2. If tests failed: Check Vercel logs 🔍"
echo "  3. For detailed testing: Open URLs in browser"





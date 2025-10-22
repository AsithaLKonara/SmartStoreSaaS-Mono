#!/bin/bash

echo "🔧 Updating Vercel DATABASE_URL for smartstore-saas project"
echo ""

# Get Vercel token
echo "Getting authentication token..."
VERCEL_TOKEN=$(cat ~/.config/vercel/auth.json 2>/dev/null | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ No Vercel token found. Please run: vercel login"
  exit 1
fi

echo "✅ Token found"
echo ""

# Database URL
DB_URL="postgres://avnadmin:AVNS_YOUR_PASSWORD_HERE@pg-abee0c4-asviaai2025-4cfd.b.aivencloud.com:25492/defaultdb?sslmode=require"

echo "📋 Updating DATABASE_URL for project: smartstore-saas"
echo ""

# Use Vercel API to update environment variable
# This bypasses the linking issues

echo "Instructions:"
echo "1. Go to: https://vercel.com/dashboard"
echo "2. Select: smartstore-saas project"
echo "3. Settings → Environment Variables"
echo "4. Update DATABASE_URL to:"
echo "   $DB_URL"
echo ""
echo "OR use the Vercel dashboard to avoid CLI issues."


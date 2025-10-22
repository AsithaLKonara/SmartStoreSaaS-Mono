#!/bin/bash

BASE_URL="https://smartstore-demo.vercel.app"

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║         🔍 COMPREHENSIVE FEATURE AUDIT 🔍                       ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# All dashboard pages
pages=(
    # Core
    "/dashboard"
    
    # Products & Inventory
    "/products"
    "/products/new"
    "/inventory"
    
    # Orders & Sales
    "/orders"
    "/orders/new"
    
    # Customers
    "/customers"
    "/customers/new"
    "/customer-portal"
    
    # Accounting & Finance
    "/accounting"
    "/accounting/bank"
    "/accounting/chart-of-accounts"
    "/accounting/journal-entries"
    "/accounting/journal-entries/new"
    "/accounting/ledger"
    "/accounting/reports"
    "/accounting/tax"
    
    # Payments
    "/payments"
    "/payments/new"
    "/billing"
    
    # Analytics & Reports
    "/analytics"
    "/analytics/enhanced"
    "/analytics/customer-insights"
    "/ai-analytics"
    "/ai-insights"
    "/reports"
    
    # Procurement & Supply Chain
    "/procurement"
    "/procurement/suppliers"
    "/procurement/purchase-orders"
    "/procurement/analytics"
    
    # Shipping & Logistics
    "/shipping"
    "/couriers"
    "/warehouse"
    
    # Marketing & Sales
    "/campaigns"
    "/bulk-operations"
    "/omnichannel"
    "/pos"
    
    # Integrations
    "/integrations"
    "/integrations/whatsapp"
    "/sync"
    "/webhooks"
    
    # Admin & Settings
    "/admin"
    "/admin/packages"
    "/tenants"
    "/settings"
    "/settings/features"
    "/configuration"
    
    # Operations
    "/monitoring"
    "/performance"
    "/audit"
    "/logs"
    "/backup"
    "/compliance"
    "/compliance/audit-logs"
    
    # Advanced
    "/chat"
    "/expenses"
    "/docs"
    "/documentation"
    "/deployment"
    "/testing"
    "/validation"
)

working=0
auth_required=0
not_working=0

for page in "${pages[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$page" 2>&1)
    
    if [ "$status" = "200" ]; then
        echo "✅ $page (HTTP 200)"
        ((working++))
    elif [ "$status" = "307" ] || [ "$status" = "302" ]; then
        echo "🔒 $page (HTTP $status - Auth required)"
        ((auth_required++))
    else
        echo "❌ $page (HTTP $status)"
        ((not_working++))
    fi
done

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                      FEATURE SUMMARY                             ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "  ✅ Public Pages:        $working"
echo "  🔒 Protected Pages:     $auth_required"
echo "  ❌ Not Working:         $not_working"
echo "  📊 Total Pages:         $((working + auth_required + not_working))"
echo ""
echo "  Success Rate: $((100 * (working + auth_required) / (working + auth_required + not_working)))%"
echo ""

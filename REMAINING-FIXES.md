# Remaining API Endpoints to Fix

## Summary
- **Total Files Remaining:** 73
- **Files Fixed So Far:** 75
- **Progress:** ~51% complete

---

## Files by Category

### 1. Customer Portal (9 files) - Priority: HIGH
- `src/app/api/customer-portal/account/route.ts`
- `src/app/api/customer-portal/addresses/route.ts`
- `src/app/api/customer-portal/analytics/route.ts`
- `src/app/api/customer-portal/gift-cards/route.ts`
- `src/app/api/customer-portal/orders/route.ts`
- `src/app/api/customer-portal/orders/[id]/route.ts`
- `src/app/api/customer-portal/support/route.ts`
- `src/app/api/customer-portal/support/[id]/route.ts`
- `src/app/api/customer-portal/wishlist/route.ts`

### 2. Integrations (6 files) - Priority: HIGH
- `src/app/api/integrations/route.ts`
- `src/app/api/integrations/shopify/sync/route.ts`
- `src/app/api/integrations/woocommerce/sync/route.ts`
- `src/app/api/integrations/whatsapp/send/route.ts`
- `src/app/api/integrations/whatsapp/verify/route.ts`
- `src/app/api/marketplace/integrations/route.ts`

### 3. Notifications (3 files) - Priority: HIGH
- `src/app/api/notifications/route.ts`
- `src/app/api/notifications/[id]/route.ts`
- `src/app/api/notifications/send/route.ts`

### 4. AI/ML Analytics (7 files) - Priority: MEDIUM
- `src/app/api/ai-analytics/dashboard/route.ts`
- `src/app/api/ai-analytics/insights/route.ts`
- `src/app/api/ai-analytics/predictions/route.ts`
- `src/app/api/ai-analytics/recommendations/route.ts`
- `src/app/api/ml/churn-prediction/route.ts`
- `src/app/api/ml/demand-forecast/route.ts`
- `src/app/api/ml/recommendations/route.ts`

### 5. Enterprise (2 files) - Priority: MEDIUM
- `src/app/api/enterprise/api-keys/route.ts`
- `src/app/api/enterprise/webhooks/route.ts`

### 6. Performance & Monitoring (4 files) - Priority: MEDIUM
- `src/app/api/performance/alerts/[id]/resolve/route.ts`
- `src/app/api/performance/dashboard/route.ts`
- `src/app/api/performance/optimize/route.ts`
- `src/app/api/monitoring/metrics/route.ts`
- `src/app/api/monitoring/status/route.ts`

### 7. Procurement (2 files) - Priority: MEDIUM
- `src/app/api/procurement/analytics/route.ts`
- `src/app/api/procurement/purchase-orders/[id]/route.ts`

### 8. Courier/Shipping (4 files) - Priority: MEDIUM
- `src/app/api/courier/deliveries/route.ts`
- `src/app/api/courier/integrations/route.ts`
- `src/app/api/courier/services/route.ts`
- `src/app/api/couriers/route.ts`
- `src/app/api/shipping/statistics/route.ts`

### 9. Core Features (10 files) - Priority: HIGH
- `src/app/api/products/[id]/route.ts`
- `src/app/api/categories/route.ts`
- `src/app/api/subscriptions/route.ts`
- `src/app/api/search/route.ts`
- `src/app/api/affiliates/route.ts`
- `src/app/api/loyalty/route.ts`
- `src/app/api/chat/route.ts`
- `src/app/api/chat/conversations/route.ts`
- `src/app/api/realtime/events/route.ts`
- `src/app/api/bulk-operations/route.ts`
- `src/app/api/bulk-operations/templates/route.ts`

### 10. Import/Export (3 files) - Priority: MEDIUM
- `src/app/api/export/route.ts`
- `src/app/api/export/products/route.ts`
- `src/app/api/import/products/route.ts`

### 11. System/Admin (10 files) - Priority: LOW (but important)
- `src/app/api/white-label/route.ts`
- `src/app/api/set-password/route.ts`
- `src/app/api/reset-admin-password/route.ts`
- `src/app/api/migrate/route.ts`
- `src/app/api/security/audit/route.ts`
- `src/app/api/database/status/route.ts`
- `src/app/api/database/performance/route.ts`
- `src/app/api/database/seed-comprehensive/route.ts`
- `src/app/api/db-check/route.ts`
- `src/app/api/compliance/audit-logs/route.ts`
- `src/app/api/compliance/gdpr/export/route.ts`

### 12. Documentation & Utilities (3 files) - Priority: LOW
- `src/app/api/docs/route.ts`
- `src/app/api/docs/[id]/route.ts`
- `src/app/api/currency/convert/route.ts`
- `src/app/api/email/statistics/route.ts`
- `src/app/api/hr/employees/route.ts`
- `src/app/api/sms/statistics/route.ts`

### 13. Inventory (2 files) - Priority: HIGH (Note: These may have been fixed but still showing)
- `src/app/api/inventory/value/route.ts`
- `src/app/api/warehouses/movements/route.ts`

### 14. Packages (1 file) - Priority: MEDIUM (Note: May have been fixed but still showing)
- `src/app/api/packages/route.ts`

---

## Recommended Fix Order

### Batch 1: Core Features (High Priority)
1. Customer Portal endpoints (9 files)
2. Core features: products/[id], categories, subscriptions, search (4 files)
3. Notifications (3 files)

### Batch 2: Integrations & Commerce (High Priority)
4. Integrations (6 files)
5. Courier/Shipping (4 files)
6. Affiliates, Loyalty, Chat (4 files)

### Batch 3: Advanced Features (Medium Priority)
7. AI/ML Analytics (7 files)
8. Enterprise (2 files)
9. Procurement remaining (2 files)
10. Performance remaining (4 files)

### Batch 4: System & Admin (Lower Priority)
11. Import/Export (3 files)
12. System/Admin (10 files)
13. Documentation & Utilities (6 files)

---

## Notes

- Some files listed here may have been partially fixed but still contain `getServerSession` imports
- Files marked as "Note: May have been fixed" need verification
- Total count: 73 files remaining
- Estimated remaining work: ~49% of total API endpoints

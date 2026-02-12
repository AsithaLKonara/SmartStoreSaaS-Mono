# ✅ Phase 0 — Service Extraction & AI Readiness (Foundation)

**Goal:** Make every business capability callable as a function.

### 🏗️ Service Layer Refactor
Organize core logic into a dedicated service directory:
`/lib/services/`

Create the following service handlers:
- `order.service.ts`: Handle order creation and lifecycle.
- `inventory.service.ts`: Manage stock levels and movements.
- `pricing.service.ts`: Logic for prices, discounts, and taxes.
- `crm.service.ts`: Customer data and communication campaigns.
- `supplier.service.ts`: Procurement and supplier management.
- `analytics.service.ts`: Data aggregation and reporting.

### 🧬 Function Standards
Each service must expose pure, predictable functions:
- `createOrder(data, orgId)`
- `createPurchaseOrder(data, orgId)`
- `updateProductPrice(data, orgId)`
- `sendCampaign(data, orgId)`
- `getStoreAnalytics(orgId)`

### 📑 AI Audit Trail
Modify standard database fields to track the origin of changes:
```ts
createdBy: 'human' | 'ai'
updatedBy: 'human' | 'ai'
```

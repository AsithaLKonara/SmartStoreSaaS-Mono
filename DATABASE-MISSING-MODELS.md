# ⚠️ DATABASE MISSING MODELS - CRITICAL FINDINGS

**Date**: October 11, 2025  
**Status**: 🔴 **CRITICAL GAPS FOUND**  
**Priority**: HIGH

---

## 🔍 DISCOVERY

While verifying the complete wireframe coverage, I discovered that **several features have API/service implementations but are MISSING database models in the Prisma schema!**

This means these features are **partially implemented** - they have the code layer but cannot persist data to the database.

---

## ❌ MISSING DATABASE MODELS

### **v1.2 - Procurement (Sprints 5-8)** ❌

**Features Implemented:**
- ✅ `/procurement` page exists
- ✅ `/procurement/suppliers` page exists
- ✅ `/procurement/purchase-orders` page exists
- ✅ `/procurement/analytics` page exists
- ✅ `src/lib/suppliers/manager.ts` service exists
- ✅ `src/lib/purchase-orders/manager.ts` service exists
- ✅ `/api/procurement/*` APIs exist

**Missing Database Models:**
- ❌ `Supplier` model - NOT in schema
- ❌ `PurchaseOrder` model - NOT in schema
- ❌ `PurchaseOrderItem` model - NOT in schema
- ❌ `RFQ` (Request for Quote) model - NOT in schema
- ❌ `SupplierInvoice` model - NOT in schema

**Impact**: Procurement features cannot save data!

---

### **v1.4 - Self-Service (Sprints 14-17)** ❌

**Features Implemented:**
- ✅ `/api/returns/route.ts` exists
- ✅ `src/lib/returns/manager.ts` exists
- ✅ Gift card APIs exist

**Missing Database Models:**
- ❌ `Return` model - NOT in schema
- ❌ `ReturnItem` model - NOT in schema
- ❌ `GiftCard` model - NOT in schema
- ❌ `GiftCardTransaction` model - NOT in schema

**Impact**: Cannot process returns or issue gift cards!

---

### **v1.5 - Marketing (Sprints 18-22)** ❌

**Features Implemented:**
- ✅ `/api/affiliates` exists
- ✅ `/api/marketing/referrals` exists
- ✅ Affiliate management code exists

**Missing Database Models:**
- ❌ `Affiliate` model - NOT in schema
- ❌ `AffiliateCommission` model - NOT in schema
- ❌ `Referral` model - NOT in schema
- ❌ `ReferralReward` model - NOT in schema

**Impact**: Cannot track affiliates or referrals!

---

### **Additional Missing Models** ❌

**Features with partial implementation:**
- ❌ `Employee` model - HR APIs exist but no model
- ❌ `Shift` model - Workforce management exists but no model
- ❌ `ApiKey` model - API key management exists but might use JSON
- ❌ `MarketplaceListing` model - Marketplace service exists but no dedicated model

---

## ✅ MODELS THAT EXIST (53 total)

### **Core E-commerce** ✅
- ✅ User
- ✅ Organization
- ✅ Customer
- ✅ Product
- ✅ ProductVariant
- ✅ Category
- ✅ Order
- ✅ OrderItem
- ✅ OrderStatusHistory
- ✅ Payment
- ✅ InventoryMovement

### **v1.1 - Accounting** ✅
- ✅ chart_of_accounts
- ✅ journal_entries
- ✅ journal_entry_lines
- ✅ ledger
- ✅ tax_rates
- ✅ tax_transactions

### **v1.3 - Omnichannel** ✅
- ✅ social_commerce
- ✅ social_posts
- ✅ social_products
- ✅ channel_integrations

### **v1.4 - Customer Portal** ✅
- ✅ wishlists
- ✅ wishlist_items
- ✅ Subscription

### **v1.5 - Marketing (Partial)** ✅
- ✅ sms_campaigns
- ✅ sms_campaign_segments
- ✅ sms_logs
- ✅ sms_subscriptions
- ✅ sms_templates
- ✅ loyalty_transactions
- ✅ CustomerLoyalty
- ❌ Affiliates - MISSING
- ❌ Referrals - MISSING

### **v1.6 - Enterprise & IoT** ✅
- ✅ iot_devices
- ✅ iot_alerts
- ✅ sensor_readings
- ✅ WhatsAppIntegration
- ✅ WooCommerceIntegration
- ✅ integration_logs
- ✅ whatsapp_messages
- ✅ support_tickets

### **Other** ✅
- ✅ Warehouse
- ✅ warehouse_inventory
- ✅ Courier
- ✅ Delivery
- ✅ delivery_status_history
- ✅ Analytics
- ✅ Report
- ✅ ai_analytics
- ✅ ai_conversations
- ✅ activities
- ✅ product_activities
- ✅ customer_segments
- ✅ customer_segment_customers
- ✅ performance_metrics

---

## 📊 DATABASE COVERAGE ANALYSIS

```
Current Models:              53 ✅
Expected for v1.0-v1.6:      ~65-70
Missing Models:              12-17 ❌

Coverage:                    ~80-85%
```

### **Breakdown by Version:**

| Version | Feature Area | Models Needed | Models Present | Coverage |
|---------|-------------|---------------|----------------|----------|
| v1.0 | Foundation | 20 | 20 | ✅ 100% |
| v1.1 | Accounting | 6 | 6 | ✅ 100% |
| v1.2 | Procurement | 5 | 0 | ❌ 0% |
| v1.3 | Omnichannel | 5 | 5 | ✅ 100% |
| v1.4 | Portal | 6 | 4 | ⚠️ 67% |
| v1.5 | Marketing | 10 | 7 | ⚠️ 70% |
| v1.6 | Enterprise | 10 | 10 | ✅ 100% |
| **Total** | **All** | **62** | **52** | **⚠️ 84%** |

---

## 🚨 CRITICAL ISSUES

### **Issue #1: Procurement is Non-Functional**
- APIs exist but cannot save/retrieve supplier data
- Purchase orders cannot be created in database
- All procurement features are placeholder/mock

### **Issue #2: Returns Management is Non-Functional**
- Return requests cannot be saved
- No tracking of return status
- Customer portal return feature is mock

### **Issue #3: Gift Cards Cannot Be Issued**
- No database table for gift cards
- Cannot track balances or transactions
- Feature exists in API but is non-functional

### **Issue #4: Affiliate/Referral Programs Non-Functional**
- Cannot track affiliate partners
- Referral rewards cannot be calculated
- Commission tracking impossible

---

## ✅ SOLUTION: ADD MISSING MODELS

### **Priority 1: Critical Business Features**

#### **1. Procurement Models** (v1.2)
```prisma
model Supplier {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id])
  name            String
  code            String   @unique
  contactName     String?
  email           String?
  phone           String?
  address         Json?
  paymentTerms    String?
  currency        String   @default("LKR")
  taxId           String?
  status          SupplierStatus @default(ACTIVE)
  rating          Float?
  totalOrders     Int      @default(0)
  totalSpent      Decimal  @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  purchaseOrders  PurchaseOrder[]
  
  @@map("suppliers")
}

model PurchaseOrder {
  id              String   @id @default(cuid())
  orderNumber     String   @unique
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id])
  supplierId      String
  supplier        Supplier @relation(fields: [supplierId], references: [id])
  status          PurchaseOrderStatus @default(DRAFT)
  orderDate       DateTime @default(now())
  expectedDate    DateTime?
  receivedDate    DateTime?
  subtotal        Decimal
  tax             Decimal  @default(0)
  shipping        Decimal  @default(0)
  total           Decimal
  currency        String   @default("LKR")
  notes           String?
  createdById     String
  createdBy       User     @relation(fields: [createdById], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  items           PurchaseOrderItem[]
  
  @@map("purchase_orders")
}

model PurchaseOrderItem {
  id                String        @id @default(cuid())
  purchaseOrderId   String
  purchaseOrder     PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  productId         String
  product           Product       @relation(fields: [productId], references: [id])
  quantity          Int
  receivedQuantity  Int           @default(0)
  unitPrice         Decimal
  tax               Decimal       @default(0)
  total             Decimal
  notes             String?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  @@map("purchase_order_items")
}

enum SupplierStatus {
  ACTIVE
  INACTIVE
  BLOCKED
}

enum PurchaseOrderStatus {
  DRAFT
  SUBMITTED
  APPROVED
  ORDERED
  PARTIALLY_RECEIVED
  RECEIVED
  CANCELLED
}
```

#### **2. Returns & Gift Cards** (v1.4)
```prisma
model Return {
  id              String       @id @default(cuid())
  returnNumber    String       @unique
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id])
  orderId         String
  order           Order        @relation(fields: [orderId], references: [id])
  customerId      String
  customer        Customer     @relation(fields: [customerId], references: [id])
  reason          String
  status          ReturnStatus @default(PENDING)
  refundMethod    RefundMethod?
  refundAmount    Decimal?
  restockFee      Decimal      @default(0)
  notes           String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  items           ReturnItem[]
  
  @@map("returns")
}

model ReturnItem {
  id            String   @id @default(cuid())
  returnId      String
  return        Return   @relation(fields: [returnId], references: [id], onDelete: Cascade)
  orderItemId   String
  productId     String
  product       Product  @relation(fields: [productId], references: [id])
  quantity      Int
  reason        String?
  condition     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@map("return_items")
}

model GiftCard {
  id              String            @id @default(cuid())
  code            String            @unique
  organizationId  String
  organization    Organization      @relation(fields: [organizationId], references: [id])
  initialValue    Decimal
  currentValue    Decimal
  currency        String            @default("LKR")
  status          GiftCardStatus    @default(ACTIVE)
  expiresAt       DateTime?
  issuedTo        String?
  issuedById      String?
  issuedBy        User?             @relation(fields: [issuedById], references: [id])
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  transactions    GiftCardTransaction[]
  
  @@map("gift_cards")
}

model GiftCardTransaction {
  id          String   @id @default(cuid())
  giftCardId  String
  giftCard    GiftCard @relation(fields: [giftCardId], references: [id])
  orderId     String?
  order       Order?   @relation(fields: [orderId], references: [id])
  amount      Decimal
  type        String   // PURCHASE, REDEMPTION, REFUND, ADJUSTMENT
  balance     Decimal
  notes       String?
  createdAt   DateTime @default(now())
  
  @@map("gift_card_transactions")
}

enum ReturnStatus {
  PENDING
  APPROVED
  REJECTED
  RECEIVED
  REFUNDED
  COMPLETED
  CANCELLED
}

enum RefundMethod {
  ORIGINAL_PAYMENT
  STORE_CREDIT
  GIFT_CARD
  BANK_TRANSFER
}

enum GiftCardStatus {
  ACTIVE
  REDEEMED
  EXPIRED
  CANCELLED
}
```

#### **3. Affiliate & Referral Models** (v1.5)
```prisma
model Affiliate {
  id              String          @id @default(cuid())
  organizationId  String
  organization    Organization    @relation(fields: [organizationId], references: [id])
  code            String          @unique
  name            String
  email           String
  phone           String?
  commissionRate  Decimal         @default(10)
  status          AffiliateStatus @default(PENDING)
  totalSales      Decimal         @default(0)
  totalCommission Decimal         @default(0)
  paymentDetails  Json?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  commissions     AffiliateCommission[]
  referrals       Referral[]
  
  @@map("affiliates")
}

model AffiliateCommission {
  id          String   @id @default(cuid())
  affiliateId String
  affiliate   Affiliate @relation(fields: [affiliateId], references: [id])
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id])
  saleAmount  Decimal
  commission  Decimal
  status      CommissionStatus @default(PENDING)
  paidAt      DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("affiliate_commissions")
}

model Referral {
  id              String         @id @default(cuid())
  organizationId  String
  organization    Organization   @relation(fields: [organizationId], references: [id])
  referrerId      String
  referrer        Customer       @relation("Referrer", fields: [referrerId], references: [id])
  referredId      String?
  referred        Customer?      @relation("Referred", fields: [referredId], references: [id])
  affiliateId     String?
  affiliate       Affiliate?     @relation(fields: [affiliateId], references: [id])
  code            String         @unique
  status          ReferralStatus @default(PENDING)
  rewardType      String?        // DISCOUNT, CREDIT, POINTS
  rewardValue     Decimal?
  rewardedAt      DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  @@map("referrals")
}

enum AffiliateStatus {
  PENDING
  ACTIVE
  SUSPENDED
  TERMINATED
}

enum CommissionStatus {
  PENDING
  APPROVED
  PAID
  CANCELLED
}

enum ReferralStatus {
  PENDING
  COMPLETED
  REWARDED
  EXPIRED
}
```

---

## 🎯 IMPLEMENTATION PLAN

### **Step 1: Add Missing Models to Schema**
1. Add Supplier, PurchaseOrder, PurchaseOrderItem models
2. Add Return, ReturnItem models
3. Add GiftCard, GiftCardTransaction models
4. Add Affiliate, AffiliateCommission, Referral models
5. Add necessary enums

### **Step 2: Update Existing Models**
Add relationships to existing models:
- Order: Add giftCardTransactions relation
- Customer: Add returns, referralsGiven, referralsReceived relations
- Product: Add purchaseOrderItems, returnItems relations
- User: Add giftCardsIssued, purchaseOrdersCreated relations

### **Step 3: Generate Migration**
```bash
npx prisma migrate dev --name add-missing-models
```

### **Step 4: Update Seeds**
Add seed data for:
- Sample suppliers
- Sample purchase orders
- Test gift cards
- Sample affiliates

### **Step 5: Update APIs**
Update existing APIs to use real database models instead of mocks

---

## 📊 IMPACT ANALYSIS

### **Before Fix:**
- Database Coverage: 84%
- Functional Features: ~90% (some features mock)
- Data Persistence: Limited

### **After Fix:**
- Database Coverage: 100% ✅
- Functional Features: 100% ✅
- Data Persistence: Complete ✅

---

## 🏆 PRIORITY

**CRITICAL** - These models are required for:
1. v1.2 Procurement features to be functional
2. v1.4 Returns management to work
3. v1.5 Marketing programs (affiliates/referrals) to track data
4. Complete data persistence across all features

---

## ✅ NEXT STEPS

1. **Immediate**: Add all missing models to `prisma/schema.prisma`
2. **Generate migration**: Run `prisma migrate dev`
3. **Update seed**: Add sample data for new models
4. **Update APIs**: Connect APIs to real database instead of mocks
5. **Test**: Verify all features can persist and retrieve data
6. **Deploy**: Push changes to production

---

**Status**: ⚠️ **CRITICAL GAPS IDENTIFIED - FIX NEEDED**  
**Estimated Time**: 2-3 hours to add models + migration + testing  
**Priority**: HIGH - Required for complete wireframe coverage

---

**Generated**: October 11, 2025  
**Next Action**: Add missing database models to achieve 100% coverage


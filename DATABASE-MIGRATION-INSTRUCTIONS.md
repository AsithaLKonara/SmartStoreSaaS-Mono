# 📋 DATABASE MIGRATION INSTRUCTIONS

**Date**: October 11, 2025  
**Status**: Schema ready, migration pending  
**Database**: Neon PostgreSQL

---

## 🎯 CURRENT STATUS

✅ **Schema Updated**: All 10 new models added to Prisma schema  
✅ **Schema Validated**: Schema is valid  
✅ **Client Generated**: Prisma client updated  
✅ **Build Tested**: Next.js builds successfully  
⏳ **Migration Pending**: Database connection not accessible

---

## 🔧 WHEN DATABASE IS ACCESSIBLE

### **Option 1: Using Prisma DB Push (Recommended for Development)**

```bash
# Navigate to project
cd "/Users/asithalakmal/Documents/web/untitled folder/SmartStoreSaaS-Mono"

# Push schema changes to database
npx prisma db push

# This will:
# - Create all 10 new tables
# - Add all new relations
# - Create all new enums
# - Update existing tables with new relations
```

### **Option 2: Using Prisma Migrate (Recommended for Production)**

```bash
# Create a new migration
npx prisma migrate dev --name add-procurement-returns-giftcard-affiliate-models

# OR apply existing migrations
npx prisma migrate deploy
```

---

## 🌱 SEEDING NEW MODELS

After migration is complete, seed the new models:

```bash
# Seed new models (requires existing organizations, users, customers, products)
npx ts-node prisma/seed-new-models.ts
```

**This will create:**
- 3 Suppliers (US + Sri Lankan vendors)
- 1 Purchase Order with line items
- 1 Return request (if order exists)
- 2 Gift Cards with transactions
- 2 Affiliates
- 1 Referral program entry

---

## 📊 TABLES THAT WILL BE CREATED

### **Procurement (3 tables):**
1. **suppliers** - Supplier management
   - Columns: id, organizationId, code, name, contactName, email, phone, address (JSON), paymentTerms, currency, taxId, status, rating, totalOrders, totalSpent, notes, createdAt, updatedAt
   - Indexes: organizationId, code (unique per org)

2. **purchase_orders** - Purchase order workflow
   - Columns: id, orderNumber (unique), organizationId, supplierId, status, orderDate, expectedDate, receivedDate, subtotal, tax, shipping, total, currency, notes, createdById, createdAt, updatedAt
   - Relations: supplier, organization, createdBy (user), items

3. **purchase_order_items** - PO line items
   - Columns: id, purchaseOrderId, productId, quantity, receivedQuantity, unitPrice, tax, total, notes, createdAt, updatedAt
   - Relations: purchaseOrder, product

### **Returns (2 tables):**
4. **returns** - Return requests
   - Columns: id, returnNumber (unique), organizationId, orderId, customerId, reason, status, refundMethod, refundAmount, restockFee, notes, approvedAt, approvedById, createdAt, updatedAt
   - Relations: organization, order, customer, approvedBy (user), items

5. **return_items** - Return line items
   - Columns: id, returnId, orderItemId, productId, quantity, reason, condition, refundAmount, createdAt, updatedAt
   - Relations: return, product

### **Gift Cards (2 tables):**
6. **gift_cards** - Gift card issuance
   - Columns: id, code (unique), organizationId, initialValue, currentValue, currency, status, expiresAt, issuedTo, issuedToEmail, issuedById, createdAt, updatedAt
   - Relations: organization, issuedBy (user), transactions

7. **gift_card_transactions** - Transaction history
   - Columns: id, giftCardId, orderId, amount, type, balance, notes, createdAt
   - Relations: giftCard, order

### **Marketing (3 tables):**
8. **affiliates** - Affiliate partners
   - Columns: id, organizationId, code, name, email, phone, commissionRate, status, totalSales, totalCommission, paymentDetails (JSON), notes, createdAt, updatedAt
   - Relations: organization, commissions, referrals

9. **affiliate_commissions** - Commission tracking
   - Columns: id, affiliateId, orderId, saleAmount, commission, status, paidAt, notes, createdAt, updatedAt
   - Relations: affiliate, order

10. **referrals** - Referral program
    - Columns: id, organizationId, referrerId, referredId, affiliateId, code (unique), status, rewardType, rewardValue, rewardedAt, completedAt, createdAt, updatedAt
    - Relations: organization, referrer (customer), referred (customer), affiliate

---

## 🔗 EXISTING TABLES MODIFIED

### **Relations Added To:**

**users:**
- purchaseOrdersCreated → PurchaseOrder[]
- returnsApproved → Return[]
- giftCardsIssued → GiftCard[]

**organizations:**
- suppliers → Supplier[]
- purchaseOrders → PurchaseOrder[]
- returns → Return[]
- giftCards → GiftCard[]
- affiliates → Affiliate[]
- referrals → Referral[]

**customers:**
- returns → Return[]
- referralsGiven → Referral[] (as referrer)
- referralsReceived → Referral[] (as referred)

**products:**
- purchaseOrderItems → PurchaseOrderItem[]
- returnItems → ReturnItem[]

**orders:**
- returns → Return[]
- giftCardTransactions → GiftCardTransaction[]
- affiliateCommissions → AffiliateCommission[]

---

## 📝 ENUMS CREATED

1. **SupplierStatus**: ACTIVE, INACTIVE, BLOCKED
2. **PurchaseOrderStatus**: DRAFT, SUBMITTED, APPROVED, ORDERED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED
3. **ReturnStatus**: PENDING, APPROVED, REJECTED, RECEIVED, REFUNDED, COMPLETED, CANCELLED
4. **RefundMethod**: ORIGINAL_PAYMENT, STORE_CREDIT, GIFT_CARD, BANK_TRANSFER
5. **GiftCardStatus**: ACTIVE, REDEEMED, EXPIRED, CANCELLED
6. **GiftCardTransactionType**: PURCHASE, REDEMPTION, REFUND, ADJUSTMENT, EXPIRY
7. **AffiliateStatus**: PENDING, ACTIVE, SUSPENDED, TERMINATED
8. **CommissionStatus**: PENDING, APPROVED, PAID, CANCELLED
9. **ReferralStatus**: PENDING, COMPLETED, REWARDED, EXPIRED, CANCELLED

---

## ⚠️ TROUBLESHOOTING

### **If database connection fails:**

1. **Check Database Status:**
   - Neon databases may auto-pause after inactivity
   - Wake up the database by accessing it through Neon dashboard

2. **Verify Connection String:**
   ```bash
   # Check .env file
   cat .env | grep DATABASE_URL
   ```

3. **Test Connection:**
   ```bash
   # Use Prisma Studio to test connection
   npx prisma studio
   ```

4. **Alternative: Use Vercel Environment:**
   If local database is not accessible, the migration will automatically run on Vercel deployment when you push changes.

### **If migration conflicts occur:**

1. **Reset database (CAUTION - Development only):**
   ```bash
   npx prisma migrate reset
   ```

2. **Baseline existing database:**
   ```bash
   npx prisma migrate resolve --applied "initial"
   ```

---

## 📊 EXPECTED IMPACT

### **Before Migration:**
- 53 tables
- Missing: Procurement, Returns, Gift Cards, Affiliates functionality

### **After Migration:**
- 63 tables (+10 new tables)
- Complete: All v1.2-v1.5 features fully functional
- Data Persistence: All features can save data permanently

---

## ✅ VERIFICATION AFTER MIGRATION

Run these commands to verify:

```bash
# 1. Check all tables exist
npx prisma db execute --stdin <<EOF
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
EOF

# 2. Verify new tables specifically
npx prisma db execute --stdin <<EOF
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN (
  'suppliers',
  'purchase_orders', 
  'purchase_order_items',
  'returns',
  'return_items',
  'gift_cards',
  'gift_card_transactions',
  'affiliates',
  'affiliate_commissions',
  'referrals'
);
EOF

# 3. Count records in new tables
npx ts-node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const counts = await Promise.all([
    prisma.supplier.count(),
    prisma.purchaseOrder.count(),
    prisma.return.count(),
    prisma.giftCard.count(),
    prisma.affiliate.count(),
    prisma.referral.count(),
  ]);
  console.log('Record counts:', {
    suppliers: counts[0],
    purchaseOrders: counts[1],
    returns: counts[2],
    giftCards: counts[3],
    affiliates: counts[4],
    referrals: counts[5],
  });
}

main().finally(() => prisma.\$disconnect());
"
```

---

## 🚀 DEPLOYMENT

The schema changes are already pushed to GitHub. When Vercel rebuilds:

1. ✅ New Prisma client will be generated
2. ✅ Application will build with new models
3. ⏳ Migration needs to run on production database

**To apply migration on Vercel:**
1. Go to Vercel dashboard
2. Navigate to your project
3. Go to Settings → Environment Variables
4. Ensure `DATABASE_URL` is correct
5. Redeploy or run migration via Vercel CLI

---

## 📄 RELATED FILES

- **Schema**: `prisma/schema.prisma` (updated with 10 new models)
- **Seed**: `prisma/seed-new-models.ts` (seed data ready)
- **Documentation**: 
  - `DATABASE-COMPLETE-100-PERCENT.md`
  - `DATABASE-MISSING-MODELS.md`
  - `ABSOLUTE-FINAL-STATUS.md`

---

## 🎯 SUMMARY

**Status**: Schema is ready and validated  
**Action Required**: Run migration when database is accessible  
**Commands**:
```bash
npx prisma db push                    # Apply schema
npx ts-node prisma/seed-new-models.ts # Seed data
```

**Result**: Complete 100% database coverage with all features fully functional!

---

**Generated**: October 11, 2025  
**Next Step**: Run migration when database connection is restored


# 🚀 SmartStore: The Multi-Tenant Commerce Operating System
*(Marketplace + SaaS Storefront + ERP + POS)*

**Status**: 🔵 **PHASE 11 COMPLETE - ARCHITECTURE UPGRADE TO GLOBAL MARKETPLACE**  
**Version**: 3.0.0  
**Last Updated**: March 24, 2026

SmartStore has evolved from a single-tenant SaaS ERP into a **Unified Multi-Tenant Commerce Operating System**. It seamlessly bridges the gap between offline Brick-and-Mortar retail and global digital commerce by marrying a Square-style POS, a Shopify-style SaaS Storefront, and a Daraz/AliExpress-style Global Marketplace into one underlying database.

---

## 🏢 **The Four Pillars of SmartStore**

### 1. 🌍 The Global Marketplace (The AliExpress Model)
A centralized storefront (`www.yourdomain.com`) where products from thousands of independent verified tenants are aggregated globally.
*   **Global Catalog**: Customers can search and discover millions of products across all opted-in tenants.
*   **Unified Cart**: Shoppers can add products from Tenant A, Tenant B, and Tenant C into one single checkout cart.
*   **Split-Order Engine**: Upon checkout, the system generates one Master Order, executing Stripe Connect Destination Charges to instantly distribute funds to respective merchants while taking a centralized platform commission. Sub-orders are automatically injected into the individual merchants' native ERPs.

### 2. 🏪 SaaS E-Commerce Storefronts (The Shopify Model)
Independent storefronts (`tenant.yourdomain.com` or custom domains) generated for each merchant.
*   **Brand Isolation**: Customers checking out here only interact with the isolated Tenant's ecosystem.
*   **Shared Inventory**: Products sold here instantly deduct from the same database row that powers the POS and the Global Marketplace, preventing overselling.

### 3. 📊 Backend Management ERP
The nerve center for merchant operations located at `app.yourdomain.com/dashboard`.
*   **Omnichannel Order Triage**: Merchants process orders originating from their physical POS, their private website, or the Global Marketplace side-by-side (complete with visual origin badging).
*   **AI Financial Auto-Pilot**: AI-driven insights into cash flow, top-performing marketplace products, and cost-of-goods forecasting.
*   **Fulfillment Management**: Out-of-the-box integrations with global couriers mapped to localized tenant rules.

### 4. 💳 Customer & Sales Management POS
A completely browser-based, touch-optimized Point of Sale terminal (`/pos/terminal`).
*   **Hardware Connectivity**: Connects to digital cash drawers, receipt printers, and barcode scanners.
*   **Offline Mode**: Local Storage caching allows the terminal to process cash transactions during network outages and synchronize them back to the ERP automatically when reconnected.

---

## ✨ **Core Architecture & Financials**

### 💸 Multi-Gateway & Commission Routing (Stripe Connect)
The platform utilizes **Stripe Connect** to ensure legal compliance for global payouts. 
1.  **Merchant Onboarding**: Tenants authenticate their business entities via Stripe inside their ERP dashboard.
2.  **Platform Fee**: The root platform extracts an automated percentage (e.g., 5%) from every Global Marketplace transaction.
3.  **Destination Charges**: The `transfer_group` API handles the legal payload of paying merchants their exact cuts immediately without the funds touching your native bank account (skipping money-transmitter liability).

### 🏢 Database Tenancy Isolation
Data privacy is tightly guaranteed by `organizationId` schemas. The `Order`, `Product`, `Customer`, and `Inventory` tables utilize row-level scoping so the ERP heavily restricts data access exclusively to the tenant, while the Marketplace layer specifically queries `where: { isMarketplacePublished: true }`.

---

## 🚀 **Quick Start & Deployment**

### Prerequisites
*   Node.js 18+
*   PostgreSQL 14+
*   Redis 6+
*   Stripe Account (with Connect enabled)

### Local Setup
```bash
# 1. Clone the repository
git clone <your-repo-url>
cd SmartStoreSaaS

# 2. Install Dependencies
npm install

# 3. Environment Variables
cp env.example .env.local
# You must configure STRIPE_SECRET_KEY to test the marketplace checkout splits!

# 4. Database Initialization
npx prisma generate
npx prisma db push

# 5. Start Development Server
npm run dev
# The Global Marketplace runs at http://localhost:3000/marketplace
# The ERP Dashboard runs at http://localhost:3000/dashboard
# The POS Terminal runs at http://localhost:3000/pos/terminal
```

---

## 🔧 **Configuration & Environment Variables**

Key environment variables required in `.env` for the Commerce OS features:

```bash
# Database & Caching
DATABASE_URL=postgresql://username:password@localhost:5432/smartstore?schema=public
REDIS_URL=redis://localhost:6379

# Authentication & Security
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Stripe Connect & Split Payments
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI Models (Optional for standard commerce)
OPENAI_API_KEY=sk-...
```

---

## 📊 **Database Schema Overview**

The Prisma schema powers the multi-channel synchronization:
*   **`Product`**: Contains `isMarketplacePublished` flags and stock trackers. Ties directly into both the local POS and global web catalogs.
*   **`Order`**: Utilizes `parentOrderId` to group multiple merchant transactions under a single global marketplace checkout flow.
*   **`Organization`**: Functions as the core "Tenant". Stores `stripeConnectAccountId` and `platformCommissionRate`.
*   **`PosTransaction`**: Specialized ledger exclusively for tracking offline-synced terminal actions before they mature into global Orders.
*   **`InventoryMovement`**: An append-only ledger providing strict stock accounting for returns, damages, sales, and procurements.

---

## 📚 **Troubleshooting & Development**

*   **Next.js 500 Errors on the POS**: The POS terminal utilizes a specialized `(pos-app)` route group. Ensure webpack is cleanly compiled by restarting your dev server if you make modifications to the root Context providers.
*   **Failed Split Checkouts**: A marketplace checkout will `Throw 500` if the merchants added to the cart have not authenticated their `stripeConnectAccountId` in the database. Ensure dummy tenants have a Stripe ID connected before testing cross-tenant global carts.
*   **Prisma Client Out of Sync**: Run `npx prisma generate` after modifying `schema.prisma` to prevent silent TS resolution errors across API routes.

---

**Built to scale merchants globally with Next.js & Prisma.**
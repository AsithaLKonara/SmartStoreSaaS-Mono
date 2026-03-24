# 🔄 SmartStore System Flows & User Roles

This document outlines the operational flows and permissions for the three primary roles within the SmartStore Multi-Tenant Commerce OS: **Superadmin**, **Tenant (Merchant)**, and **User (Customer)**.

---

## 👑 1. Superadmin Flow (Platform Owner)
The Superadmin manages the entire infrastructure and the global marketplace.

### Key Responsibilities:
*   **Tenant Management**: Onboard, suspend, or manage subscription plans for individual organizations.
*   **Global Marketplace Control**: Oversee the aggregated catalog, manage global categories, and set featured products.
*   **Financial Orchestration**: Define default platform commission rates (e.g., 5% per marketplace sale).
*   **Platform Analytics**: Monitor total Gross Merchandise Value (GMV), active tenant counts, and platform-wide revenue.
*   **System Configuration**: Manage global API keys, Stripe Connect platform settings, and system-wide security policies.

### Core Workflow:
1.  **Dashboard Access**: Logs in at `app.yourdomain.com/admin`.
2.  **Merchant Audit**: Reviews merchant onboarding status and Stripe Connect verification.
3.  **Commission Collection**: Automatically receives platform fees via Stripe Destination Charges on every marketplace checkout.

---

## 🏪 2. Tenant Flow (Merchant/Organization)
Tenants are the business owners who use the SaaS ERP and POS to run their daily operations.

### Key Responsibilities:
*   **Inventory Management**: Create products, manage stock levels, and set store-specific pricing.
*   **Omnichannel Sales**: Process sales through their private storefront, the POS terminal, or the global marketplace.
*   **Fulfillment**: Manage orders, update shipping statuses, and handle returns.
*   **Stripe Onboarding**: Link their business bank account via Stripe Connect to receive automated payouts.
*   **Marketplace Publishing**: Toggle `isMarketplacePublished` on specific products to push them to the global discovery layer.

### Core Workflow:
1.  **Login**: Accesses their isolated ERP at `/dashboard`.
2.  **Setup**: Configures store branding, tax rules, and local shipping zones.
3.  **Sales Ingestion**: Orders from the POS, their standalone site, or the Global Marketplace arrive in a single unified "Orders" view.
4.  **Automatic Payouts**: Receives funds directly to their bank account (minus platform commission) as soon as the customer checks out on the marketplace.

---

## 🛍️ 3. User Flow (Global Customer)
Users are the shoppers who interact with the consumer-facing storefronts.

### Key Responsibilities:
*   **Discovery**: Search and filter millions of products from thousands of different tenants in one place.
*   **Unified Shopping**: Add items from multiple different stores into a single, global cart.
*   **Secure Checkout**: Pay once using a single credit card transaction.
*   **Order Tracking**: View order status and history for multiple sub-orders in a unified customer portal.

### Core Workflow:
1.  **Entry**: Visits the global marketplace home at `www.yourdomain.com`.
2.  **Cart Assembly**: Adds a "Headset" from *Merchant A* and a "Keyboard" from *Merchant B*.
3.  **Checkout**: The system splits the payment:
    *   *Merchant A* gets paid for the Headset.
    *   *Merchant B* gets paid for the Keyboard.
    *   *Superadmin* receives the platform commission.
    *   *Customer* receives two separate sub-orders for tracking.

---

## 🛠️ Technical Architecture of the Flow

| Feature | Superadmin | Tenant | Customer |
| :--- | :--- | :--- | :--- |
| **Data Access** | Cross-tenant global view | Strictly isolated to `orgId` | Public marketplace data only |
| **Price Control** | None (Marketplace fees only) | Full control over SKU pricing | View only |
| **Order Origin** | System-wide view | Local + Marketplace | Personal History |
| **Payments** | Platform Fee recipient | Main Recipient (Connected Account) | Payer |

---

**SmartStore: Bridging the gap between isolated SaaS and Global Marketplaces.**

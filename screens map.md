Below is the **Enterprise SaaS Marketplace Screen Architecture (≈200 screens)** for a system like **SmartStore**.
This structure is similar to large platforms like Shopify, Amazon, and Stripe.

This will help you:

✅ find **missing workflows**
✅ prevent **404 pages**
✅ verify **every user journey**
✅ complete your **QA checklist**

---

# 🧠 SmartStore Enterprise Screen Architecture (~200 Screens)

---

# 1️⃣ GLOBAL PLATFORM

### Core Navigation

| Screen               | Route            |
| -------------------- | ---------------- |
| Platform Dashboard   | `/dashboard`     |
| Notifications Center | `/notifications` |
| Global Search        | `/search`        |
| Activity Feed        | `/activity`      |
| Command Palette      | `/command`       |

---

# 2️⃣ AUTHENTICATION SYSTEM

| Screen             | Route                   |
| ------------------ | ----------------------- |
| Login              | `/login`                |
| Register           | `/register`             |
| Forgot Password    | `/forgot-password`      |
| Reset Password     | `/reset-password`       |
| Email Verification | `/verify-email`         |
| MFA Setup          | `/auth/mfa`             |
| MFA Verify         | `/auth/mfa-verify`      |
| Session Expired    | `/auth/session-expired` |
| Account Locked     | `/auth/locked`          |

---

# 3️⃣ USER & ACCESS MANAGEMENT

### Users

| Screen          | Route                    |
| --------------- | ------------------------ |
| User List       | `/users`                 |
| Create User     | `/users/new`             |
| User Profile    | `/users/[id]`            |
| Edit User       | `/users/[id]/edit`       |
| Deactivate User | `/users/[id]/deactivate` |

### Roles

| Screen             | Route          |
| ------------------ | -------------- |
| Roles List         | `/roles`       |
| Create Role        | `/roles/new`   |
| Edit Role          | `/roles/[id]`  |
| Permissions Matrix | `/permissions` |

### Security

| Screen          | Route                |
| --------------- | -------------------- |
| Login Activity  | `/security/logins`   |
| Device Sessions | `/security/sessions` |
| Access Logs     | `/security/access`   |

---

# 4️⃣ TENANT / ORGANIZATION MANAGEMENT

| Screen          | Route                    |
| --------------- | ------------------------ |
| Organizations   | `/tenants`               |
| Create Tenant   | `/tenants/new`           |
| Tenant Profile  | `/tenants/[id]`          |
| Tenant Settings | `/tenants/[id]/settings` |
| Tenant Billing  | `/tenants/[id]/billing`  |
| Tenant Usage    | `/tenants/[id]/usage`    |

---

# 5️⃣ MARKETPLACE (GLOBAL)

### Discovery

| Screen            | Route                          |
| ----------------- | ------------------------------ |
| Marketplace Home  | `/marketplace`                 |
| Categories        | `/marketplace/categories`      |
| Category Products | `/marketplace/category/[slug]` |
| Search Results    | `/marketplace/search`          |
| Trending Products | `/marketplace/trending`        |

### Product

| Screen          | Route                               |
| --------------- | ----------------------------------- |
| Product Page    | `/marketplace/product/[id]`         |
| Seller Store    | `/marketplace/store/[tenant]`       |
| Product Reviews | `/marketplace/product/[id]/reviews` |

### Checkout

| Screen             | Route                             |
| ------------------ | --------------------------------- |
| Cart               | `/marketplace/cart`               |
| Checkout           | `/marketplace/checkout`           |
| Payment            | `/marketplace/payment`            |
| Order Confirmation | `/marketplace/order-confirmation` |

---

# 6️⃣ MERCHANT DASHBOARD

| Screen             | Route                  |
| ------------------ | ---------------------- |
| Merchant Dashboard | `/dashboard`           |
| Revenue Overview   | `/dashboard/revenue`   |
| Orders Overview    | `/dashboard/orders`    |
| Customer Insights  | `/dashboard/customers` |
| Inventory Alerts   | `/dashboard/inventory` |

---

# 7️⃣ PRODUCT MANAGEMENT

### Core Product

| Screen         | Route                 |
| -------------- | --------------------- |
| Products List  | `/products`           |
| Create Product | `/products/new`       |
| Product Detail | `/products/[id]`      |
| Edit Product   | `/products/[id]/edit` |

### Variants

| Screen         | Route                         |
| -------------- | ----------------------------- |
| Variants       | `/products/[id]/variants`     |
| Create Variant | `/products/[id]/variants/new` |

### Product Data

| Screen            | Route                      |
| ----------------- | -------------------------- |
| Product Media     | `/products/[id]/media`     |
| SEO Settings      | `/products/[id]/seo`       |
| Product Analytics | `/products/[id]/analytics` |

### Bulk Tools

| Screen      | Route              |
| ----------- | ------------------ |
| Bulk Editor | `/products/bulk`   |
| CSV Import  | `/products/import` |
| CSV Export  | `/products/export` |

---

# 8️⃣ CATEGORY MANAGEMENT

| Screen          | Route              |
| --------------- | ------------------ |
| Categories      | `/categories`      |
| Create Category | `/categories/new`  |
| Edit Category   | `/categories/[id]` |

---

# 9️⃣ ORDER MANAGEMENT

### Orders

| Screen         | Route                   |
| -------------- | ----------------------- |
| Orders List    | `/orders`               |
| Order Detail   | `/orders/[id]`          |
| Order Timeline | `/orders/[id]/timeline` |
| Order Activity | `/orders/[id]/activity` |

### Fulfillment

| Screen                | Route              |
| --------------------- | ------------------ |
| Fulfillment Dashboard | `/fulfillment`     |
| Create Shipment       | `/fulfillment/new` |
| Shipping Labels       | `/shipping/labels` |

### Returns

| Screen         | Route                  |
| -------------- | ---------------------- |
| Returns        | `/returns`             |
| Return Detail  | `/returns/[id]`        |
| Refund Request | `/returns/[id]/refund` |

---

# 🔟 CUSTOMER MANAGEMENT (CRM)

| Screen             | Route                       |
| ------------------ | --------------------------- |
| Customers          | `/customers`                |
| Customer Profile   | `/customers/[id]`           |
| Customer Orders    | `/customers/[id]/orders`    |
| Customer Notes     | `/customers/[id]/notes`     |
| Customer Addresses | `/customers/[id]/addresses` |
| Customer Segments  | `/customers/segments`       |

---

# 11️⃣ INVENTORY MANAGEMENT

| Screen              | Route                    |
| ------------------- | ------------------------ |
| Inventory Dashboard | `/inventory`             |
| Stock Movements     | `/inventory/movements`   |
| Stock Adjustments   | `/inventory/adjustments` |
| Low Stock Alerts    | `/inventory/alerts`      |
| Inventory Transfers | `/inventory/transfers`   |

---

# 12️⃣ WAREHOUSE MANAGEMENT

| Screen           | Route                   |
| ---------------- | ----------------------- |
| Warehouses       | `/warehouses`           |
| Create Warehouse | `/warehouses/new`       |
| Warehouse Detail | `/warehouses/[id]`      |
| Bin Locations    | `/warehouses/[id]/bins` |

---

# 13️⃣ PROCUREMENT SYSTEM

| Screen          | Route                           |
| --------------- | ------------------------------- |
| Suppliers       | `/suppliers`                    |
| Create Supplier | `/suppliers/new`                |
| Purchase Orders | `/purchase-orders`              |
| Create PO       | `/purchase-orders/new`          |
| PO Detail       | `/purchase-orders/[id]`         |
| Receiving       | `/purchase-orders/[id]/receive` |

---

# 14️⃣ FINANCE & ACCOUNTING

### Core Accounting

| Screen               | Route                 |
| -------------------- | --------------------- |
| Accounting Dashboard | `/accounting`         |
| Chart of Accounts    | `/accounting/coa`     |
| Ledger               | `/accounting/ledger`  |
| Journal Entries      | `/accounting/journal` |

### Reports

| Screen        | Route                          |
| ------------- | ------------------------------ |
| Profit & Loss | `/accounting/reports/pnl`      |
| Balance Sheet | `/accounting/reports/balance`  |
| Cash Flow     | `/accounting/reports/cashflow` |

---

# 15️⃣ PAYMENT MANAGEMENT

| Screen           | Route                    |
| ---------------- | ------------------------ |
| Payments         | `/payments`              |
| Transactions     | `/payments/transactions` |
| Refunds          | `/payments/refunds`      |
| Disputes         | `/payments/disputes`     |
| Fraud Monitoring | `/payments/fraud`        |

---

# 16️⃣ SHIPPING & LOGISTICS

| Screen               | Route                |
| -------------------- | -------------------- |
| Shipping Dashboard   | `/shipping`          |
| Shipping Zones       | `/shipping/zones`    |
| Shipping Methods     | `/shipping/methods`  |
| Carrier Integrations | `/shipping/carriers` |
| Tracking             | `/shipping/tracking` |

---

# 17️⃣ MARKETING

| Screen          | Route                  |
| --------------- | ---------------------- |
| Campaigns       | `/campaigns`           |
| Create Campaign | `/campaigns/new`       |
| Email Templates | `/campaigns/templates` |
| SMS Campaigns   | `/campaigns/sms`       |

---

# 18️⃣ LOYALTY & REFERRALS

| Screen            | Route              |
| ----------------- | ------------------ |
| Loyalty Dashboard | `/loyalty`         |
| Points Rules      | `/loyalty/rules`   |
| Rewards           | `/loyalty/rewards` |

### Affiliates

| Screen              | Route                 |
| ------------------- | --------------------- |
| Affiliate Dashboard | `/affiliates`         |
| Affiliate Links     | `/affiliates/links`   |
| Commission Payouts  | `/affiliates/payouts` |

---

# 19️⃣ ANALYTICS

| Screen             | Route                  |
| ------------------ | ---------------------- |
| Sales Analytics    | `/analytics/sales`     |
| Revenue Analytics  | `/analytics/revenue`   |
| Customer Analytics | `/analytics/customers` |
| Product Analytics  | `/analytics/products`  |

---

# 20️⃣ AI & AUTOMATION

| Screen           | Route         |
| ---------------- | ------------- |
| AI Dashboard     | `/ai`         |
| Pricing AI       | `/ai/pricing` |
| Demand Forecast  | `/ai/demand`  |
| Churn Prediction | `/ai/churn`   |

---

# 21️⃣ SUPPORT SYSTEM

| Screen        | Route           |
| ------------- | --------------- |
| Helpdesk      | `/support`      |
| Ticket Detail | `/support/[id]` |
| Create Ticket | `/support/new`  |
| Live Chat     | `/chat`         |

---

# 22️⃣ POS SYSTEM

| Screen       | Route          |
| ------------ | -------------- |
| POS Terminal | `/pos`         |
| POS Orders   | `/pos/orders`  |
| POS Returns  | `/pos/returns` |
| POS Shifts   | `/pos/shifts`  |

---

# 23️⃣ STORE FRONT (TENANT WEBSITE)

| Screen        | Route                    |
| ------------- | ------------------------ |
| Store Home    | `/store`                 |
| Category Page | `/store/category/[slug]` |
| Product Page  | `/store/product/[slug]`  |
| Cart          | `/cart`                  |
| Checkout      | `/checkout`              |

---

# 24️⃣ CMS / CONTENT

| Screen       | Route             |
| ------------ | ----------------- |
| Pages        | `/cms/pages`      |
| Page Builder | `/cms/pages/[id]` |
| Blog         | `/cms/blog`       |
| Menus        | `/cms/navigation` |
| Themes       | `/cms/themes`     |

---

# 25️⃣ SETTINGS

| Screen         | Route                |
| -------------- | -------------------- |
| Settings       | `/settings`          |
| Store Settings | `/settings/store`    |
| Taxes          | `/settings/taxes`    |
| Payments       | `/settings/payments` |
| Shipping       | `/settings/shipping` |

---

# 26️⃣ PLATFORM ADMIN

| Screen           | Route             |
| ---------------- | ----------------- |
| Admin Dashboard  | `/admin`          |
| Organizations    | `/admin/tenants`  |
| Platform Billing | `/admin/billing`  |
| Plans            | `/admin/plans`    |
| Feature Flags    | `/admin/features` |

---

# 27️⃣ DEVTOOLS

| Screen        | Route       |
| ------------- | ----------- |
| API Docs      | `/docs`     |
| Webhooks      | `/webhooks` |
| API Keys      | `/api-keys` |
| System Logs   | `/logs`     |
| Error Monitor | `/errors`   |

---

# 📊 Total Estimated Screens

| Module      | Screens |
| ----------- | ------- |
| Auth        | 10      |
| Users       | 10      |
| Marketplace | 20      |
| Products    | 20      |
| Orders      | 15      |
| Inventory   | 12      |
| Procurement | 8       |
| Finance     | 12      |
| Payments    | 10      |
| Marketing   | 10      |
| Analytics   | 10      |
| POS         | 8       |
| Storefront  | 10      |
| Admin       | 10      |

**Total ≈ 180–220 screens**

---

# 🧠 What You Should Do Next

Use this for **3 things**:

### 1️⃣ QA workflow verification

Check every screen exists.

### 2️⃣ Route scanning

Detect **404 routes**.

### 3️⃣ Missing feature detection

Compare with your project.

---

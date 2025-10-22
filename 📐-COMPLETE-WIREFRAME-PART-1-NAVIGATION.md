# 📐 Complete Project Wireframe - Part 1: Navigation & Page Inventory

**Date**: October 13, 2025  
**Version**: 1.0  
**Platform**: SmartStore SaaS Multi-Tenant E-Commerce

---

## 📊 COMPLETE PAGE INVENTORY

**Total Pages**: 72  
**Roles**: 4 (SUPER_ADMIN, TENANT_ADMIN, STAFF, CUSTOMER)  
**API Endpoints**: 236

---

## 🗺️ NAVIGATION STRUCTURE BY ROLE

### SUPER_ADMIN (Full Access - 72 Pages)

**Public Pages (2)**:
- `/` - Homepage
- `/login` - Login page

**Dashboard Pages (66)**:
1. `/dashboard` - Main Dashboard

**Core Operations (10)**:
2. `/dashboard/products` - Product list
3. `/dashboard/products/new` - Create product
4. `/dashboard/products/[id]` - Edit product
5. `/dashboard/orders` - Order list
6. `/dashboard/orders/new` - Create order
7. `/dashboard/orders/[id]` - Order details
8. `/dashboard/customers` - Customer list
9. `/dashboard/customers/new` - Add customer
10. `/dashboard/customers/[id]` - Customer profile
11. `/dashboard/users` - User management

**Operations (10)**:
12. `/dashboard/inventory` - Inventory list
13. `/dashboard/warehouse` - Warehouse management
14. `/dashboard/pos` - Point of Sale
15. `/dashboard/fulfillment` - Fulfillment queue
16. `/dashboard/returns` - Returns management
17. `/dashboard/shipping` - Shipping management
18. `/dashboard/couriers` - Courier management
19. `/dashboard/suppliers` - Supplier management
20. `/dashboard/payments` - Payment processing
21. `/dashboard/expenses` - Expense tracking

**Procurement (4)**:
22. `/dashboard/procurement` - Procurement home
23. `/dashboard/procurement/suppliers` - Suppliers
24. `/dashboard/procurement/purchase-orders` - Purchase orders
25. `/dashboard/procurement/analytics` - Procurement analytics

**Accounting (7)**:
26. `/dashboard/accounting` - Accounting dashboard
27. `/dashboard/accounting/chart-of-accounts` - Chart of accounts
28. `/dashboard/accounting/journal-entries` - Journal entries
29. `/dashboard/accounting/journal-entries/new` - New entry
30. `/dashboard/accounting/ledger` - General ledger
31. `/dashboard/accounting/tax` - Tax management
32. `/dashboard/accounting/reports` - Financial reports

**Analytics & AI (6)**:
33. `/dashboard/analytics` - Analytics dashboard
34. `/dashboard/analytics/enhanced` - Advanced analytics
35. `/dashboard/analytics/customer-insights` - Customer insights
36. `/dashboard/ai-insights` - AI insights
37. `/dashboard/ai-analytics` - AI analytics
38. `/dashboard/reports` - Report center

**Marketing (4)**:
39. `/dashboard/campaigns` - Marketing campaigns
40. `/dashboard/loyalty` - Loyalty programs
41. `/dashboard/reviews` - Product reviews
42. `/dashboard/affiliates` - Affiliate program

**Integrations (9)**:
43. `/dashboard/integrations` - Integration hub
44. `/dashboard/integrations/stripe` - Stripe setup
45. `/dashboard/integrations/payhere` - PayHere setup
46. `/dashboard/integrations/email` - Email (SendGrid)
47. `/dashboard/integrations/sms` - SMS (Twilio)
48. `/dashboard/integrations/whatsapp` - WhatsApp Business
49. `/dashboard/integrations/woocommerce` - WooCommerce
50. `/dashboard/integrations/shopify` - Shopify
51. `/dashboard/omnichannel` - Omnichannel management

**Support (2)**:
52. `/dashboard/chat` - Live chat
53. `/dashboard/customer-portal` - Customer portal settings

**System & Settings (8)**:
54. `/dashboard/settings` - General settings
55. `/dashboard/settings/features` - Feature flags
56. `/dashboard/subscriptions` - Subscription management
57. `/dashboard/billing` - Billing
58. `/dashboard/configuration` - System configuration
59. `/dashboard/webhooks` - Webhook management
60. `/dashboard/bulk-operations` - Bulk actions
61. `/dashboard/sync` - Data synchronization
62. `/dashboard/workflows` - Automation workflows

**Administration (10)**:
63. `/dashboard/tenants` - Tenant management (Organizations)
64. `/dashboard/admin` - Admin dashboard
65. `/dashboard/admin/packages` - Package management
66. `/dashboard/monitoring` - System monitoring
67. `/dashboard/performance` - Performance metrics
68. `/dashboard/audit` - Audit logs
69. `/dashboard/compliance` - Compliance tools
70. `/dashboard/backup` - Backup management
71. `/dashboard/logs` - System logs
72. `/dashboard/deployment` - Deployment management

**Development (5)**:
73. `/dashboard/testing` - Testing utilities
74. `/dashboard/validation` - Data validation
75. `/dashboard/docs` - API documentation
76. `/dashboard/documentation` - Documentation hub
77. `/unauthorized` - Access denied page

**Customer Portal (6)**:
78. `/customer-portal` - Customer home
79. `/customer-portal/orders` - Order history
80. `/customer-portal/orders/[id]` - Order details
81. `/customer-portal/account` - Account settings
82. `/customer-portal/wishlist` - Wishlist
83. `/customer-portal/support` - Support tickets

---

### TENANT_ADMIN (Organization Scope - 60 Pages)

**Excluded from TENANT_ADMIN**:
- ❌ `/dashboard/tenants` (Organization management)
- ❌ `/dashboard/admin/*` (Admin pages)
- ❌ `/dashboard/monitoring` (System monitoring)
- ❌ `/dashboard/performance` (System performance)
- ❌ `/dashboard/deployment` (Deployments)
- ❌ `/dashboard/backup` (System backups)
- ❌ `/dashboard/logs` (System logs - can view org logs)
- ❌ `/dashboard/admin/packages` (Package management)
- ❌ `/dashboard/testing` (Testing utilities)
- ❌ `/dashboard/validation` (Validation tools)

**Can Access**: All other 60 pages (scoped to their organization)

---

### STAFF (Role-Tag Specific - 20-35 Pages)

**All Staff Can Access (12)**:
- `/` - Homepage
- `/login` - Login
- `/dashboard` - Main dashboard
- `/dashboard/orders` - View orders
- `/dashboard/customers` - View customers
- `/dashboard/inventory` - View inventory
- `/dashboard/analytics` - Basic analytics
- `/dashboard/chat` - Customer support chat
- `/dashboard/shipping` - Shipping management
- `/dashboard/returns` - Returns processing
- `/dashboard/settings` - Basic settings
- `/unauthorized` - Access denied

**Sales Staff (sales_staff) - Additional 8 Pages**:
- `/dashboard/products` - Product catalog
- `/dashboard/orders/new` - Create orders
- `/dashboard/customers/new` - Add customers
- `/dashboard/customers/[id]` - Customer details
- `/dashboard/pos` - Point of sale
- `/dashboard/campaigns` - View campaigns
- `/dashboard/loyalty` - Loyalty program
- `/dashboard/reports` - Sales reports

**Inventory Manager (inventory_manager) - Additional 7 Pages**:
- `/dashboard/inventory` - Full inventory management
- `/dashboard/warehouse` - Warehouse operations
- `/dashboard/products` - Product management
- `/dashboard/products/new` - Add products
- `/dashboard/fulfillment` - Fulfillment
- `/dashboard/procurement` - Procurement
- `/dashboard/suppliers` - Supplier management

**Customer Service (customer_service) - Additional 6 Pages**:
- `/dashboard/orders` - Order support
- `/dashboard/returns` - Returns processing
- `/dashboard/shipping` - Shipping tracking
- `/dashboard/chat` - Live chat support
- `/dashboard/customers` - Customer management
- `/dashboard/customer-portal` - Portal settings

**Accountant (accountant) - Additional 7 Pages**:
- `/dashboard/accounting` - All accounting pages
- `/dashboard/accounting/chart-of-accounts` - COA
- `/dashboard/accounting/journal-entries` - Journal
- `/dashboard/accounting/ledger` - Ledger
- `/dashboard/accounting/tax` - Tax management
- `/dashboard/accounting/reports` - Financial reports
- `/dashboard/expenses` - Expense tracking

---

### CUSTOMER (Customer Portal Only - 6 Pages)

**Can Access**:
1. `/` - Homepage
2. `/login` - Login
3. `/register` - Self-registration
4. `/customer-portal` - Customer home
5. `/customer-portal/orders` - Order history
6. `/customer-portal/orders/[id]` - Order details
7. `/customer-portal/account` - Account settings
8. `/customer-portal/wishlist` - Wishlist
9. `/customer-portal/support` - Support tickets

**Cannot Access**:
- ❌ Any `/dashboard/*` pages
- ✅ Redirected to `/unauthorized`

---

## 🔀 NAVIGATION FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                        HOMEPAGE (/)                          │
│  Buttons: [Login] [Get Started] [View Demo]                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ├─► [Login] → /login
                      ├─► [Get Started] → /register
                      └─► [View Demo] → /demo
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    SUPER_ADMIN         TENANT_ADMIN           STAFF           CUSTOMER
          │                   │                   │                │
          ▼                   ▼                   ▼                ▼
    /dashboard          /dashboard          /dashboard     /customer-portal
    (72 pages)          (60 pages)          (20-35 pages)  (6 pages)
          │                   │                   │                │
          │                   │                   │                │
    [Main Nav]          [Main Nav]          [Limited Nav]  [Portal Nav]
          │                   │                   │                │
          ├─► Products        ├─► Products        ├─► Orders      ├─► Orders
          ├─► Orders          ├─► Orders          ├─► Customers   ├─► Account
          ├─► Customers       ├─► Customers       ├─► Inventory   ├─► Wishlist
          ├─► Inventory       ├─► Inventory       ├─► Chat        ├─► Support
          ├─► Analytics       ├─► Analytics       └─► Reports     └─► [Logout]
          ├─► Campaigns       ├─► Campaigns
          ├─► Accounting      ├─► Accounting
          ├─► Procurement     ├─► Procurement
          ├─► Integrations    ├─► Integrations
          ├─► AI Insights     ├─► AI Insights
          ├─► Tenants ⭐      ├─► Settings
          ├─► Admin ⭐        ├─► Billing
          ├─► Monitoring ⭐   └─► [Logout]
          ├─► Performance ⭐
          ├─► Deployment ⭐
          ├─► Backup ⭐
          ├─► Audit ⭐
          ├─► Logs ⭐
          └─► [Logout]
```

**Legend**:
- ⭐ = SUPER_ADMIN only
- 🔒 = Requires permission
- 🏢 = Organization-scoped

---

## 🔘 TOP-LEVEL NAVIGATION BUTTONS

### Main Dashboard Navigation (All Authenticated Users)

**Sidebar Menu Groups**:

1. **Dashboard**
   - 🏠 Dashboard → `/dashboard`

2. **Core Operations**
   - 📦 Products → `/dashboard/products`
   - 🛒 Orders → `/dashboard/orders`
   - 👥 Customers → `/dashboard/customers`
   - 👤 Users → `/dashboard/users` (ADMIN only)

3. **Operations**
   - 📊 Inventory → `/dashboard/inventory`
   - 🏭 Warehouse → `/dashboard/warehouse`
   - 💰 POS → `/dashboard/pos`
   - 📋 Fulfillment → `/dashboard/fulfillment`
   - ↩️ Returns → `/dashboard/returns`
   - 🚚 Shipping → `/dashboard/shipping`
   - 🚛 Couriers → `/dashboard/couriers`

4. **Financial**
   - 💼 Accounting → `/dashboard/accounting`
   - 💳 Payments → `/dashboard/payments`
   - 💸 Expenses → `/dashboard/expenses`
   - 🧾 Billing → `/dashboard/billing`
   - 🏪 Suppliers → `/dashboard/suppliers`
   - 📑 Procurement → `/dashboard/procurement`

5. **Analytics & AI**
   - 📈 Analytics → `/dashboard/analytics`
   - ✨ Enhanced Analytics → `/dashboard/analytics/enhanced`
   - 🧠 AI Insights → `/dashboard/ai-insights`
   - 🤖 AI Analytics → `/dashboard/ai-analytics`
   - 👁️ Customer Insights → `/dashboard/analytics/customer-insights`
   - 📊 Reports → `/dashboard/reports`

6. **Marketing**
   - 📧 Campaigns → `/dashboard/campaigns`
   - 🏆 Loyalty → `/dashboard/loyalty`
   - ⭐ Reviews → `/dashboard/reviews`
   - 🤝 Affiliates → `/dashboard/affiliates`

7. **Integrations**
   - 🔌 Integration Hub → `/dashboard/integrations`
   - 💬 WhatsApp → `/dashboard/integrations/whatsapp`
   - 🛍️ WooCommerce → `/dashboard/integrations/woocommerce`
   - 🛒 Shopify → `/dashboard/integrations/shopify`
   - 💳 Stripe → `/dashboard/integrations/stripe`
   - 💰 PayHere → `/dashboard/integrations/payhere`
   - 📧 Email → `/dashboard/integrations/email`
   - 📱 SMS → `/dashboard/integrations/sms`
   - 🌐 Omnichannel → `/dashboard/omnichannel`

8. **Support**
   - 💬 Chat → `/dashboard/chat`
   - 🏪 Customer Portal → `/dashboard/customer-portal`

9. **System**
   - ⚙️ Settings → `/dashboard/settings`
   - 🎯 Feature Flags → `/dashboard/settings/features`
   - 📦 Subscriptions → `/dashboard/subscriptions`
   - 🔧 Configuration → `/dashboard/configuration`
   - 🪝 Webhooks → `/dashboard/webhooks`
   - ⚡ Bulk Operations → `/dashboard/bulk-operations`
   - 🔄 Sync → `/dashboard/sync`
   - 🔁 Workflows → `/dashboard/workflows`

10. **Administration** ⭐ (SUPER_ADMIN only)
   - 🏢 Organizations → `/dashboard/tenants`
   - 👑 Admin Dashboard → `/dashboard/admin`
   - 📦 Packages → `/dashboard/admin/packages`
   - 👁️ Monitoring → `/dashboard/monitoring`
   - ⚡ Performance → `/dashboard/performance`
   - 📋 Audit Logs → `/dashboard/audit`
   - ✅ Compliance → `/dashboard/compliance`
   - 💾 Backup → `/dashboard/backup`
   - 📄 Logs → `/dashboard/logs`
   - 🚀 Deployment → `/dashboard/deployment`

11. **Developer** (ADMIN roles)
   - 📚 API Docs → `/dashboard/docs`
   - 📖 Documentation → `/dashboard/documentation`
   - 🧪 Testing → `/dashboard/testing`
   - ✔️ Validation → `/dashboard/validation`

**Customer Portal (4)**:
72. `/customer-portal` - Portal home
73. `/customer-portal/orders` - Order history
74. `/customer-portal/account` - Account settings
75. `/customer-portal/wishlist` - Wishlist
76. `/customer-portal/support` - Support tickets

---

## 🎯 ROLE-BASED PAGE ACCESS MATRIX

| Page Category | SUPER_ADMIN | TENANT_ADMIN | STAFF | CUSTOMER |
|---------------|-------------|--------------|-------|----------|
| **Homepage** | ✅ | ✅ | ✅ | ✅ |
| **Authentication** | ✅ | ✅ | ✅ | ✅ |
| **Main Dashboard** | ✅ | ✅ | ✅ | ❌ |
| **Products** | ✅ | ✅ | 🔒 Sales | ❌ |
| **Orders** | ✅ | ✅ | ✅ | ❌ |
| **Customers** | ✅ | ✅ | ✅ | ❌ |
| **Users** | ✅ | ✅ | ❌ | ❌ |
| **Inventory** | ✅ | ✅ | 🔒 Inventory | ❌ |
| **Warehouse** | ✅ | ✅ | 🔒 Inventory | ❌ |
| **POS** | ✅ | ✅ | 🔒 Sales | ❌ |
| **Fulfillment** | ✅ | ✅ | ✅ | ❌ |
| **Returns** | ✅ | ✅ | ✅ | ❌ |
| **Shipping** | ✅ | ✅ | ✅ | ❌ |
| **Procurement** | ✅ | ✅ | 🔒 Inventory | ❌ |
| **Accounting** | ✅ | ✅ | 🔒 Accountant | ❌ |
| **Analytics** | ✅ | ✅ | ✅ | ❌ |
| **AI Insights** | ✅ | ✅ | ❌ | ❌ |
| **Marketing** | ✅ | ✅ | 🔒 Sales | ❌ |
| **Integrations** | ✅ | ✅ | ❌ | ❌ |
| **Settings** | ✅ | ✅ | 🔒 Limited | ❌ |
| **Billing** | ✅ | ✅ | ❌ | ❌ |
| **Tenants** | ✅ | ❌ | ❌ | ❌ |
| **Admin Dashboard** | ✅ | ❌ | ❌ | ❌ |
| **Monitoring** | ✅ | ❌ | ❌ | ❌ |
| **Performance** | ✅ | ❌ | ❌ | ❌ |
| **Audit Logs** | ✅ | ✅ | ❌ | ❌ |
| **Compliance** | ✅ | ✅ | ❌ | ❌ |
| **Backup** | ✅ | ❌ | ❌ | ❌ |
| **Deployment** | ✅ | ❌ | ❌ | ❌ |
| **Logs** | ✅ | 🔒 Org only | ❌ | ❌ |
| **Testing** | ✅ | ❌ | ❌ | ❌ |
| **Customer Portal** | ✅ | ✅ | ✅ | ✅ |

**Legend**:
- ✅ Full access
- 🔒 Conditional access (based on role tag or permission)
- ❌ No access (403 Forbidden)

---

## 📱 MOBILE vs DESKTOP NAVIGATION

### Desktop (Sidebar Navigation)
- **Left Sidebar**: Main navigation (expandable groups)
- **Top Header**: User menu, notifications, search, org switcher
- **Main Content**: Page content
- **Right Sidebar** (optional): Quick actions, recent activity

### Mobile (Hamburger Menu)
- **Top Bar**: Menu button, logo, notifications
- **Slide-out Menu**: Same structure as desktop sidebar
- **Bottom Nav**: Quick access (Dashboard, Orders, Customers, More)
- **Main Content**: Full width

---

## 🔗 GLOBAL NAVIGATION COMPONENTS

### Header Navigation (All Pages)

**Left Side**:
- 🏢 **Organization Switcher** (SUPER_ADMIN only)
  - Click → Modal with organization list
  - Select → Switches context to that organization

**Center**:
- 🔍 **Global Search Bar**
  - Placeholder: "Search products, orders, customers..."
  - Click → Expands search
  - Type → Live results
  - Results show:
    - Products → `/dashboard/products/[id]`
    - Orders → `/dashboard/orders/[id]`
    - Customers → `/dashboard/customers/[id]`

**Right Side**:
- 🔔 **Notifications** (Badge shows count)
  - Click → Dropdown with notifications
  - "View All" → `/dashboard/notifications`
  
- 👤 **User Menu**
  - My Profile → `/dashboard/profile`
  - Settings → `/dashboard/settings`
  - Logout → Calls `/api/logout`

---

## 🎨 COMMON UI PATTERNS

### Data Tables (Used in 30+ Pages)

**Common Actions Row**:
- [➕ Add New] - Create new record
- [📥 Export] - Export data
- [🔄 Refresh] - Reload data
- [⚙️ Columns] - Show/hide columns
- [🔍 Search] - Filter table

**Table Row Actions**:
- [👁️ View] - View details
- [✏️ Edit] - Edit record
- [🗑️ Delete] - Delete record
- [...] - More actions menu

**Pagination**:
- [◀️ Previous] - Previous page
- [1] [2] [3] - Page numbers
- [Next ▶️] - Next page
- [10 per page ▼] - Items per page

---

## 🚀 QUICK ACTION BUTTONS

### Dashboard Page Quick Actions

1. **[+ Create Order]** → `/dashboard/orders/new`
2. **[+ Add Product]** → `/dashboard/products/new`
3. **[+ New Customer]** → `/dashboard/customers/new`
4. **[📧 Send Campaign]** → `/dashboard/campaigns` (Create new)
5. **[📊 Generate Report]** → `/dashboard/reports` (New report)

---

**Continue to Part 2**: Page-by-Page Wireframes →


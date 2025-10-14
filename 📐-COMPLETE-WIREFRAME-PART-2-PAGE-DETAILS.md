# 📐 Complete Project Wireframe - Part 2: Detailed Page Wireframes

**Date**: October 13, 2025  
**Version**: 1.0  

---

## 📱 DETAILED PAGE WIREFRAMES

### 1. AUTHENTICATION PAGES

#### 🔐 `/login` - Login Page

**Layout**:
```
┌────────────────────────────────────────────────────────┐
│                    SmartStore SaaS                      │
│                                                         │
│   ┌─────────────────────────────────────────────┐    │
│   │         Welcome Back                         │    │
│   │         Log in to your account               │    │
│   │                                              │    │
│   │  Email: [________________]                  │    │
│   │  Password: [________________]     [👁️]      │    │
│   │                                              │    │
│   │  [x] Remember me     [Forgot password?]     │    │
│   │                                              │    │
│   │  [        Login        ]                    │    │
│   │                                              │    │
│   │  ─── or continue with ───                   │    │
│   │  [Google] [GitHub] [Microsoft]              │    │
│   │                                              │    │
│   │  Don't have an account? [Sign up]           │    │
│   │                                              │    │
│   │  ═══ Demo Credentials ═══                   │    │
│   │  [Super Admin] [Tenant Admin]               │    │
│   │  [Staff] [Customer]                         │    │
│   └─────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

**All Buttons & Destinations**:
1. **[Login]** → POST `/api/auth/signin` → Redirects based on role:
   - SUPER_ADMIN → `/dashboard`
   - TENANT_ADMIN → `/dashboard`
   - STAFF → `/dashboard`
   - CUSTOMER → `/customer-portal`

2. **[Forgot password?]** → `/forgot-password`

3. **[Sign up]** → `/register`

4. **[Google]** → OAuth flow → `/api/auth/signin/google`

5. **[GitHub]** → OAuth flow → `/api/auth/signin/github`

6. **[Super Admin]** → Auto-fills credentials → Click Login

7. **[Tenant Admin]** → Auto-fills credentials → Click Login

8. **[Staff]** → Auto-fills credentials → Click Login

9. **[Customer]** → Auto-fills credentials → Click Login

**API Calls**:
- `POST /api/auth/[...nextauth]` - NextAuth signin
- `GET /api/me` - Get current user (after login)

---

#### 📝 `/register` - Registration Page

**Layout**:
```
┌────────────────────────────────────────────────────────┐
│              Create Your Account                        │
│                                                         │
│   Step 1 of 3: Business Information                   │
│   [●━━━━━━━━━━] 33%                                    │
│                                                         │
│   Organization Name: [________________]                │
│   Business Type: [Retail ▼]                          │
│   Industry: [E-commerce ▼]                            │
│                                                         │
│   [      Next: Admin Details      ]                   │
│                                                         │
│   Already have an account? [Log in]                   │
└────────────────────────────────────────────────────────┘
```

**Buttons & Flow**:
1. **[Next]** → Step 2 (Admin Details)
2. **Step 2 [Next]** → Step 3 (Plan Selection)
3. **Step 3 [Complete Registration]** → POST `/api/registration/request`
4. **[Log in]** → `/login`

**Full Registration Flow**:
```
Step 1: Business Info
  ↓
Step 2: Admin Details (Name, Email, Password)
  ↓
Step 3: Plan Selection (FREE, BASIC, PRO, ENTERPRISE)
  ↓
Submit → POST /api/registration/request
  ↓
Email Verification → /verify-email
  ↓
Setup Password → /setup-password
  ↓
Complete → /dashboard
```

---

### 2. MAIN DASHBOARD

#### 🏠 `/dashboard` - Main Dashboard

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│ [☰] SmartStore        [🔍 Search...]    [🔔 5] [⚙️] [👤 Admin] │
├────┬────────────────────────────────────────────────────────────┤
│    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│ D  │  │  Revenue    │  │  Orders     │  │  Customers  │      │
│ A  │  │  $425,000   │  │    1,250    │  │    5,420    │      │
│ S  │  │  +7.6% ↗    │  │   +15% ↗    │  │   +45 new   │      │
│ H  │  └─────────────┘  └─────────────┘  └─────────────┘      │
│    │                                                           │
│ 📦 │  Quick Actions:                                          │
│ Pr │  [+ New Order] [+ Add Product] [+ Customer]             │
│ od │  [📊 Generate Report] [📧 Send Campaign]                 │
│    │                                                           │
│ 🛒 │  ┌────────── Recent Orders ──────────┐                 │
│ Or │  │ #ORD-1234  $250.00  Pending  [View]│                 │
│ de │  │ #ORD-1235  $380.50  Shipped  [View]│                 │
│ rs │  │ #ORD-1236  $125.00  Complete [View]│                 │
│    │  └────────────────────────────────────┘                 │
│ 👥 │                                                           │
│ Cu │  ┌────────── Low Stock Alerts ───────┐                 │
│ st │  │ T-Shirt Basic   5 left    [Reorder]│                 │
│    │  │ Jeans Denim    2 left    [Reorder]│                 │
│ 📊 │  │ Sneakers Pro   0 left    [Reorder]│                 │
│ In │  └────────────────────────────────────┘                 │
│ v  │                                                           │
└────┴───────────────────────────────────────────────────────────┘
```

**All Buttons & Destinations**:

**Header Buttons**:
1. **[☰]** → Toggle sidebar
2. **[🔍 Search]** → Opens search modal
3. **[🔔]** → Notification dropdown
   - Click notification → Related page
   - [View All] → `/dashboard/notifications`
4. **[⚙️]** → Quick settings dropdown
5. **[👤 Admin]** → User menu dropdown
   - My Profile → `/dashboard/profile`
   - Settings → `/dashboard/settings`
   - Logout → POST `/api/logout` → `/login`

**Quick Action Buttons**:
1. **[+ New Order]** → `/dashboard/orders/new`
2. **[+ Add Product]** → `/dashboard/products/new`
3. **[+ Customer]** → `/dashboard/customers/new`
4. **[📊 Generate Report]** → `/dashboard/reports` (opens modal)
5. **[📧 Send Campaign]** → `/dashboard/campaigns` (create new)

**Recent Orders**:
- **[View]** → `/dashboard/orders/[id]`

**Low Stock Alerts**:
- **[Reorder]** → `/dashboard/procurement/purchase-orders` (pre-filled)

**API Calls on Load**:
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/orders?limit=5&sort=createdAt:desc` - Recent orders
- `GET /api/inventory?lowStock=true` - Low stock items
- `GET /api/notifications?unreadOnly=true` - Unread notifications

---

### 3. PRODUCT MANAGEMENT PAGES

#### 📦 `/dashboard/products` - Product List

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  Products                                    [+ Add Product] │
├─────────────────────────────────────────────────────────────┤
│  [🔍 Search products...]  [Category ▼] [Status ▼] [⚡ Bulk] │
│  Showing 1-20 of 453 products                               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [✓] Image  Name         SKU      Stock  Price  [...] │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ [✓] [img] T-Shirt      TSH01    45     $29.99  [...]│  │
│  │ [✓] [img] Jeans Blue   JNS02    12     $59.99  [...]│  │
│  │ [✓] [img] Sneakers     SNK03    0 ⚠️   $89.99  [...]│  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [◀️ Prev] [1] [2] [3] ... [23] [Next ▶️]                 │
└─────────────────────────────────────────────────────────────┘
```

**All Buttons & Destinations**:

**Top Actions**:
1. **[+ Add Product]** → `/dashboard/products/new`
2. **[🔍 Search]** → Filters table in-place
3. **[Category ▼]** → Dropdown filter
4. **[Status ▼]** → Filter (Active/Inactive)
5. **[⚡ Bulk]** → Opens bulk actions dropdown:
   - Update Prices → Modal
   - Change Status → Modal
   - Export Selected → Downloads CSV
   - Delete Selected → Confirmation modal

**Table Row Actions** (Click [...]):
- **View** → `/dashboard/products/[id]`
- **Edit** → `/dashboard/products/[id]`
- **Duplicate** → `/dashboard/products/new?clone=[id]`
- **View Inventory** → `/dashboard/inventory?product=[id]`
- **Delete** → Confirmation modal → DELETE `/api/products/[id]`

**Table Click Actions**:
- Click product name → `/dashboard/products/[id]`
- Click image → Opens image preview
- Click SKU → Copies to clipboard
- Click stock (if low) → `/dashboard/inventory?product=[id]`

**API Calls**:
- `GET /api/products?page=1&limit=20` - Product list
- `GET /api/categories` - Category filter options

---

#### ➕ `/dashboard/products/new` - Create Product

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Products              [Save Draft] [Publish]     │
├─────────────────────────────────────────────────────────────┤
│  Create New Product                                         │
│                                                              │
│  Tabs: [📝 Details] [🖼️ Images] [📊 Inventory] [💰 Pricing]│
│                                                              │
│  Basic Information:                                         │
│    Product Name *: [________________]                       │
│    SKU *: [________] [Generate]                            │
│    Category: [Select ▼]                                    │
│    Description:                                            │
│    [Rich text editor...]                                   │
│                                                              │
│  Variants:                                                  │
│    ○ Simple Product (no variants)                          │
│    ○ Variable Product (with variants)                      │
│        [+ Add Variant Group]                               │
│                                                              │
│  [Cancel] [Save Draft] [Publish Product]                   │
└─────────────────────────────────────────────────────────────┘
```

**All Buttons & Destinations**:

1. **[← Back to Products]** → `/dashboard/products`
2. **[Save Draft]** → POST `/api/products` (status=DRAFT) → Stays on page
3. **[Publish]** → POST `/api/products` (status=ACTIVE) → `/dashboard/products`
4. **[Generate SKU]** → Auto-generates SKU based on name
5. **[Select Category]** → Dropdown → Fetches `GET /api/categories`
6. **[+ Add Variant Group]** → Adds variant input fields
7. **[Cancel]** → Confirmation modal → `/dashboard/products`
8. **[Publish Product]** → POST `/api/products` → `/dashboard/products/[id]`

**Tab Navigation**:
- [📝 Details] → Shows details form
- [🖼️ Images] → Image upload section
- [📊 Inventory] → Stock management
- [💰 Pricing] → Pricing & discounts

**API Calls**:
- `GET /api/categories` - Category options
- `POST /api/products` - Create product
- `POST /api/upload` - Upload images

---

### 4. ORDER MANAGEMENT PAGES

#### 🛒 `/dashboard/orders` - Order List

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  Orders                                      [+ Create Order]│
├─────────────────────────────────────────────────────────────┤
│  Filters: [All Status ▼] [Date Range 📅] [Customer 🔍]      │
│  [Export CSV] [Export PDF] [Print]                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Order#   Customer    Total    Status      Actions    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ #ORD1234 John Doe   $250.00  ⏳ Pending  [View][...]│  │
│  │ #ORD1235 Jane Smith $380.50  📦 Shipped  [View][...]│  │
│  │ #ORD1236 Bob Jones  $125.00  ✅ Delivered [View][...]│  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Quick Stats:                                               │
│  Pending: 45  Processing: 120  Shipped: 890  Total: 1,250  │
└─────────────────────────────────────────────────────────────┘
```

**All Buttons & Destinations**:

**Top Actions**:
1. **[+ Create Order]** → `/dashboard/orders/new`
2. **[Export CSV]** → POST `/api/export` (type=orders) → Downloads file
3. **[Export PDF]** → POST `/api/export` (type=orders, format=pdf)
4. **[Print]** → Opens print dialog
5. **[All Status ▼]** → Filter dropdown (Pending, Processing, Shipped, etc.)
6. **[Date Range 📅]** → Date picker modal
7. **[Customer 🔍]** → Customer search/select

**Row Actions**:
- **[View]** → `/dashboard/orders/[id]`
- **[...]** → Dropdown menu:
  - Edit → `/dashboard/orders/[id]`
  - Process → Updates status → PUT `/api/orders/[id]`
  - Print Invoice → Generates PDF
  - Send Email → Opens email modal
  - Cancel Order → Confirmation → PUT `/api/orders/[id]` (status=CANCELLED)

**Click Actions**:
- Click Order # → `/dashboard/orders/[id]`
- Click Customer → `/dashboard/customers/[customer-id]`
- Click Status badge → Status change modal

**API Calls**:
- `GET /api/orders?page=1&limit=20&status=all` - Order list
- `GET /api/orders/statistics` - Quick stats

---

#### ➕ `/dashboard/orders/new` - Create Order

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back                         [Save Draft] [Process Order]│
├─────────────────────────────────────────────────────────────┤
│  Create New Order                                           │
│                                                              │
│  Customer: [Select customer... ▼] [+ New Customer]         │
│                                                              │
│  Products:                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Product         Qty    Price    Subtotal  [x]        │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ T-Shirt Basic   2      $29.99   $59.98    [x]        │  │
│  │ Jeans Blue      1      $59.99   $59.99    [x]        │  │
│  └──────────────────────────────────────────────────────┘  │
│  [+ Add Product]                                            │
│                                                              │
│  Subtotal: $119.97                                          │
│  Tax (10%): $12.00                                          │
│  Shipping: [Calculate ▼]                                    │
│  Discount: [Apply Coupon]                                   │
│  ────────────────                                           │
│  Total: $131.97                                             │
│                                                              │
│  Payment Method: [Cash ▼]                                   │
│  Notes: [_________________]                                 │
│                                                              │
│  [Cancel] [Save Draft] [Process Order]                      │
└─────────────────────────────────────────────────────────────┘
```

**All Buttons & Destinations**:

1. **[← Back]** → `/dashboard/orders`
2. **[Select customer ▼]** → Opens customer search modal
   - Search customers → `GET /api/customers?search=query`
   - Select → Fills customer info
3. **[+ New Customer]** → Quick customer form modal
   - Save → POST `/api/customers`
4. **[+ Add Product]** → Product search modal
   - Search → `GET /api/products?search=query`
   - Select → Adds to cart
5. **[x]** (Remove product) → Removes from cart
6. **[Calculate Shipping]** → POST `/api/shipping/rates` → Shows rates
7. **[Apply Coupon]** → Opens coupon modal
   - Enter code → POST `/api/coupons/validate`
8. **[Cancel]** → Confirmation → `/dashboard/orders`
9. **[Save Draft]** → POST `/api/orders` (status=DRAFT)
10. **[Process Order]** → POST `/api/orders` → POST `/api/payments/confirm` → `/dashboard/orders/[id]`

**Dynamic Actions**:
- Qty change → Recalculates total
- Product select → POST `/api/pricing/calculate`
- Shipping method → POST `/api/shipping/rates`

---

### 5. CUSTOMER MANAGEMENT PAGES

#### 👥 `/dashboard/customers` - Customer List

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  Customers                                  [+ Add Customer] │
├─────────────────────────────────────────────────────────────┤
│  [🔍 Search...] [Segment ▼] [Loyalty ▼] [Export] [Import]  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Name        Email           Orders  LTV      Actions  │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ John Doe    john@email.com  24    $2,450  [View][...]│  │
│  │ Jane Smith  jane@email.com  18    $1,820  [View][...]│  │
│  │ Bob Jones   bob@email.com    5    $450    [View][...]│  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Segments: [VIP: 45] [At Risk: 12] [New: 23]               │
└─────────────────────────────────────────────────────────────┘
```

**All Buttons & Destinations**:

1. **[+ Add Customer]** → `/dashboard/customers/new`
2. **[🔍 Search]** → Filters table → `GET /api/customers?search=query`
3. **[Segment ▼]** → Filter by segment
4. **[Loyalty ▼]** → Filter by tier (Bronze, Silver, Gold, Platinum)
5. **[Export]** → POST `/api/export/customers` → Downloads CSV
6. **[Import]** → Opens import modal → POST `/api/import/customers`
7. **[View]** → `/dashboard/customers/[id]`
8. **[...]** → Actions menu:
   - Edit → `/dashboard/customers/[id]`
   - View Orders → `/dashboard/orders?customer=[id]`
   - Send Email → Email modal → POST `/api/email/send`
   - Add to Segment → Modal → POST `/api/customer-segments`
   - Delete → Confirmation → DELETE `/api/customers/[id]`

**Segment Quick Filters**:
- **[VIP: 45]** → Filters VIP customers
- **[At Risk: 12]** → Shows high churn risk customers
- **[New: 23]** → Recently registered customers

**API Calls**:
- `GET /api/customers?page=1&limit=20` - Customer list
- `GET /api/customer-segments` - Segments

---

#### 👤 `/dashboard/customers/[id]` - Customer Profile

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  ← Customers                         [Edit] [Send Email]    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Avatar]  John Doe                                   │   │
│  │          john@email.com  |  +1 555-1234             │   │
│  │          🏆 Gold Tier (2,450 points)                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Tabs: [Overview] [Orders] [Loyalty] [Activity]            │
│                                                              │
│  ┌── Overview Tab ──────────────────────────┐              │
│  │ Total Orders: 24                          │              │
│  │ Lifetime Value: $2,450                    │              │
│  │ Avg Order: $102                           │              │
│  │ Last Order: 3 days ago                    │              │
│  │ Member Since: Jan 15, 2024                │              │
│  │                                            │              │
│  │ Recent Orders:                             │              │
│  │ #ORD1234  $125.00  Delivered  [View]      │              │
│  │ #ORD1235  $89.50   Shipped    [View]      │              │
│  │                                            │              │
│  │ [View All Orders →]                       │              │
│  └────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

**All Buttons & Destinations**:

1. **[← Customers]** → `/dashboard/customers`
2. **[Edit]** → Inline edit mode or modal
   - Save → PUT `/api/customers/[id]`
3. **[Send Email]** → Email composer modal
   - Send → POST `/api/email/send`
4. **Tab [Overview]** → Overview panel (default)
5. **Tab [Orders]** → Order history
   - Fetches `GET /api/orders?customerId=[id]`
6. **Tab [Loyalty]** → Loyalty details
   - Fetches `GET /api/loyalty?customerId=[id]`
   - [Adjust Points] → Modal → POST `/api/loyalty/adjust`
7. **Tab [Activity]** → Activity timeline
   - Fetches `GET /api/audit-logs?userId=[id]`
8. **[View]** (Order row) → `/dashboard/orders/[order-id]`
9. **[View All Orders →]** → `/dashboard/orders?customer=[id]`

**API Calls**:
- `GET /api/customers/[id]` - Customer details
- `GET /api/orders?customerId=[id]&limit=5` - Recent orders
- `GET /api/loyalty?customerId=[id]` - Loyalty info

---

### 6. INVENTORY & WAREHOUSE PAGES

#### 📊 `/dashboard/inventory` - Inventory Management

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  Inventory                    [Import] [Export] [Adjust All]│
├─────────────────────────────────────────────────────────────┤
│  [Warehouse: All ▼] [Status: All ▼] [🔍 Search...]         │
│                                                              │
│  Alerts: ⚠️ 15 Low Stock  🔴 3 Out of Stock               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Product       SKU    WH1   WH2   Total  Status  [...] │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ T-Shirt      TSH01   30    15    45     ✅       [...] │  │
│  │ Jeans Blue   JNS02   5     7     12     ⚠️       [...] │  │
│  │ Sneakers     SNK03   0     0     0      🔴       [...] │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Total Inventory Value: $245,000                            │
└─────────────────────────────────────────────────────────────┘
```

**All Buttons & Destinations**:

1. **[Import]** → Import modal
   - Upload CSV → POST `/api/import/inventory`
2. **[Export]** → POST `/api/export/inventory` → Downloads
3. **[Adjust All]** → Bulk adjustment modal
4. **[Warehouse ▼]** → Filter by warehouse
5. **[Status ▼]** → Filter (All, Low Stock, Out of Stock)
6. **[...]** → Row actions:
   - Adjust Stock → Modal → POST `/api/inventory/[id]/adjust`
   - View Product → `/dashboard/products/[id]`
   - View Movements → `/dashboard/inventory/movements?product=[id]`
   - Transfer → Modal → POST `/api/inventory/transfer`
7. **Click alerts** → Filters to low/out of stock items

**API Calls**:
- `GET /api/inventory` - Inventory list
- `GET /api/inventory/statistics` - Stats (total value, low stock count)
- `GET /api/warehouses` - Warehouse list for filter

---

### 7. ANALYTICS PAGES

#### 📈 `/dashboard/analytics` - Analytics Dashboard

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  Analytics                  [Date: Last 30 days ▼] [Export] │
├─────────────────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                       │
│  │Sales │ │Orders│ │Cust  │ │AOV   │                       │
│  │$425K │ │1,250 │ │5,420 │ │$340  │                       │
│  │+7.6%↗│ │+15%↗ │ │+2.3%↗│ │+5.1%↗│                       │
│  └──────┘ └──────┘ └──────┘ └──────┘                       │
│                                                              │
│  ┌──────── Revenue Trend ────────┐  ┌─ Top Products ─┐    │
│  │ [Line chart showing trend]     │  │ 1. T-Shirt     │    │
│  │                                 │  │ 2. Jeans       │    │
│  └─────────────────────────────────┘  │ 3. Sneakers    │    │
│                                        └────────────────┘    │
│  ┌──── Sales by Category ────┐  ┌─ Customer Segments ─┐   │
│  │ [Pie chart]                │  │ VIP: 45           │   │
│  │                             │  │ Regular: 890       │   │
│  └─────────────────────────────┘  │ At Risk: 12        │   │
│                                   └────────────────────┘   │
│                                                              │
│  [View Customer Insights →] [View AI Predictions →]         │
└─────────────────────────────────────────────────────────────┘
```

**All Buttons & Destinations**:

1. **[Date ▼]** → Date range picker
   - Changes data → Re-fetches `GET /api/analytics/dashboard?range=...`
2. **[Export]** → POST `/api/reports/generate` (type=analytics)
3. **[View Customer Insights →]** → `/dashboard/analytics/customer-insights`
4. **[View AI Predictions →]** → `/dashboard/ai-insights`
5. **Click metric card** → Drills down to details
   - Sales → `/dashboard/reports?type=sales`
   - Orders → `/dashboard/orders`
   - Customers → `/dashboard/customers`
6. **Click chart segment** → Filtered view

**API Calls**:
- `GET /api/analytics/dashboard?range=30d` - Dashboard data
- `GET /api/analytics/enhanced` - Additional metrics

---

### 8. CUSTOMER PORTAL PAGES

#### 🏪 `/customer-portal` - Customer Portal Home

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  SmartStore          [🔍 Search]      [🔔] [👤 John Doe]   │
├─────────────────────────────────────────────────────────────┤
│  Navigation: [Home] [Orders] [Wishlist] [Account] [Support]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Welcome back, John! 👋                                     │
│  🏆 You have 2,450 points (Gold Tier)                       │
│                                                              │
│  ┌────── Quick Actions ──────┐                             │
│  │ [Track Order]              │                             │
│  │ [Reorder Favorites]        │                             │
│  │ [Contact Support]          │                             │
│  └────────────────────────────┘                             │
│                                                              │
│  ┌────── Recent Orders ───────────────────┐                │
│  │ #ORD1234  $125.00  📦 In Transit [Track]│                │
│  │ #ORD1235  $89.50   ✅ Delivered  [View] │                │
│  └─────────────────────────────────────────┘                │
│  [View All Orders →]                                        │
│                                                              │
│  ┌────── Recommended for You ──────┐                       │
│  │ [Product 1] [Product 2] [Product 3]                     │
│  └──────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

**All Buttons & Destinations**:

**Top Navigation**:
1. **[Home]** → `/customer-portal`
2. **[Orders]** → `/customer-portal/orders`
3. **[Wishlist]** → `/customer-portal/wishlist`
4. **[Account]** → `/customer-portal/account`
5. **[Support]** → `/customer-portal/support`
6. **[🔔]** → Notification dropdown
7. **[👤 John Doe]** → User menu:
   - My Account → `/customer-portal/account`
   - Order History → `/customer-portal/orders`
   - Wishlist → `/customer-portal/wishlist`
   - Support → `/customer-portal/support`
   - Logout → POST `/api/logout` → `/login`

**Quick Actions**:
1. **[Track Order]** → Modal with order number input
   - Enter # → GET `/api/shipping/track?orderNumber=...`
2. **[Reorder Favorites]** → `/customer-portal/orders` (filter favorites)
3. **[Contact Support]** → `/customer-portal/support` (new ticket)

**Recent Orders**:
- **[Track]** → Tracking modal → `GET /api/shipping/track?orderId=[id]`
- **[View]** → `/customer-portal/orders/[id]`
- **[View All Orders →]** → `/customer-portal/orders`

**Recommended Products**:
- Click product → `/products/[id]` (storefront, if exists)
- **[Add to Cart]** → POST `/api/cart`

**API Calls**:
- `GET /api/customer-portal/account` - Customer info
- `GET /api/customer-portal/orders?limit=5` - Recent orders
- `GET /api/ml/recommendations` - Recommended products
- `GET /api/loyalty?customerId=current` - Loyalty info

---

## 🔄 COMMON MODAL WORKFLOWS

### Modal: Create New Customer

**Triggered from**: Multiple pages (Orders/new, Customers, etc.)

**Layout**:
```
┌────── Add New Customer ──────┐
│ Name *: [________________]    │
│ Email *: [________________]   │
│ Phone: [_________________]    │
│ Address: [________________]   │
│                                │
│ Enroll in Loyalty: [x]        │
│                                │
│ [Cancel] [Save Customer]       │
└────────────────────────────────┘
```

**Buttons**:
1. **[Cancel]** → Closes modal
2. **[Save Customer]** → POST `/api/customers` → Returns to caller page

---

### Modal: Bulk Actions

**Triggered from**: Product/Order/Customer lists

**Layout**:
```
┌────── Bulk Actions (15 selected) ──────┐
│ Choose action:                          │
│ ○ Update Status                         │
│ ○ Change Category                       │
│ ○ Update Prices                         │
│ ○ Export Selected                       │
│ ○ Delete Selected                       │
│                                          │
│ [Cancel] [Apply Action]                 │
└─────────────────────────────────────────┘
```

**Buttons**:
1. **[Cancel]** → Closes modal
2. **[Apply Action]** → POST `/api/bulk-operations` → Refreshes page

---

**Continue to Part 3**: Detailed Wireframes for All Pages →


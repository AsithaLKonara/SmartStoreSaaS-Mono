# 📐 Complete Project Wireframe - Part 3: All Pages Detailed

**Date**: October 13, 2025

---

## 📄 COMPLETE PAGE-BY-PAGE WIREFRAMES

### ACCOUNTING PAGES

#### 💼 `/dashboard/accounting` - Accounting Dashboard

**Buttons & Destinations**:
- **[+ New Entry]** → `/dashboard/accounting/journal-entries/new`
- **[View COA]** → `/dashboard/accounting/chart-of-accounts`
- **[View Ledger]** → `/dashboard/accounting/ledger`
- **[Generate Report]** → `/dashboard/accounting/reports`
- **Quick Actions Cards**:
  - Journal Entries → `/dashboard/accounting/journal-entries`
  - Chart of Accounts → `/dashboard/accounting/chart-of-accounts`
  - Tax Management → `/dashboard/accounting/tax`
  - Financial Reports → `/dashboard/accounting/reports`

**APIs**: `GET /api/accounting/dashboard`, `GET /api/accounting/summary`

---

#### 📊 `/dashboard/accounting/chart-of-accounts` - Chart of Accounts

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  Chart of Accounts                          [+ Add Account] │
├─────────────────────────────────────────────────────────────┤
│  [🔍 Search] [Type: All ▼] [Export]                         │
│                                                              │
│  ┌── Assets ─────────────────────────────────────┐         │
│  │ ▼ 1000 - Current Assets                        │         │
│  │   ├─ 1010 - Cash                     $50,000   │         │
│  │   ├─ 1020 - Accounts Receivable      $25,000   │         │
│  │   └─ 1030 - Inventory                $245,000  │         │
│  │ ▼ 1500 - Fixed Assets                          │         │
│  │   └─ 1510 - Equipment                $15,000   │         │
│  └─────────────────────────────────────────────────┘         │
│                                                              │
│  [+ Add Account] [Import COA] [Export]                      │
└─────────────────────────────────────────────────────────────┘
```

**Buttons**:
1. **[+ Add Account]** → Modal:
   - Account Code: [____]
   - Account Name: [____]
   - Type: [Asset/Liability/Equity/Revenue/Expense ▼]
   - Parent Account: [Select ▼]
   - [Cancel] [Create Account]
   - **[Create Account]** → POST `/api/accounting/chart-of-accounts`

2. **[Import COA]** → File upload modal → POST `/api/accounting/import`
3. **[Export]** → POST `/api/accounting/export` → Downloads

**Row Actions**:
- Click account → Expands/collapses children
- [...] → Edit, View Transactions, Deactivate, Delete
- **Edit** → Modal → PUT `/api/accounting/accounts/[id]`
- **View Transactions** → `/dashboard/accounting/ledger?account=[id]`

**APIs**: `GET /api/accounting/chart-of-accounts`

---

#### 📝 `/dashboard/accounting/journal-entries` - Journal Entries

**Buttons**:
1. **[+ New Entry]** → `/dashboard/accounting/journal-entries/new`
2. **[Filter ▼]** → Status (Draft, Posted, Reversed)
3. **[Export]** → Downloads CSV
4. **Row [View]** → View entry details (read-only modal)
5. **Row [Edit]** → `/dashboard/accounting/journal-entries/new?id=[id]` (if DRAFT)
6. **Row [Post]** → POST `/api/accounting/journal-entries/[id]/post`
7. **Row [Reverse]** → Confirmation → POST `/api/accounting/journal-entries/[id]/reverse`

**APIs**: `GET /api/accounting/journal-entries`

---

#### ➕ `/dashboard/accounting/journal-entries/new` - New Journal Entry

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  New Journal Entry                 [Save Draft] [Post Entry]│
├─────────────────────────────────────────────────────────────┤
│  Date: [Oct 12, 2025 📅]                                    │
│  Reference: [________]                                       │
│  Description: [_____________________]                        │
│                                                              │
│  Entries:                                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Account              Debit      Credit      [x]       │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ 1010 - Cash          $1,000                  [x]       │  │
│  │ 4000 - Sales Revenue             $1,000     [x]       │  │
│  └──────────────────────────────────────────────────────┘  │
│  [+ Add Line]                                               │
│                                                              │
│  Totals: Debit: $1,000  Credit: $1,000  ✅ Balanced        │
│                                                              │
│  [Cancel] [Save Draft] [Post Entry]                         │
└─────────────────────────────────────────────────────────────┘
```

**Buttons**:
1. **[📅]** → Date picker
2. **[+ Add Line]** → Adds new entry row
3. **[x]** → Removes entry line
4. **Account dropdown** → `GET /api/accounting/chart-of-accounts`
5. **[Cancel]** → `/dashboard/accounting/journal-entries`
6. **[Save Draft]** → POST `/api/accounting/journal-entries` (status=DRAFT)
7. **[Post Entry]** → POST `/api/accounting/journal-entries` → POST `/api/accounting/journal-entries/[id]/post` → `/dashboard/accounting/journal-entries`

**Validation**:
- ⚠️ Debit must equal Credit (real-time validation)
- ⚠️ At least 2 lines required

**APIs**: 
- `GET /api/accounting/chart-of-accounts`
- `POST /api/accounting/journal-entries`

---

### PROCUREMENT PAGES

#### 🏪 `/dashboard/procurement` - Procurement Dashboard

**Buttons**:
1. **[+ New PO]** → `/dashboard/procurement/purchase-orders` (create new)
2. **[View Suppliers]** → `/dashboard/procurement/suppliers`
3. **[View Analytics]** → `/dashboard/procurement/analytics`
4. **Pending POs card** → `/dashboard/procurement/purchase-orders?status=PENDING`
5. **Active Suppliers card** → `/dashboard/procurement/suppliers?status=ACTIVE`

**APIs**: `GET /api/procurement/analytics`, `GET /api/procurement/dashboard`

---

#### 📋 `/dashboard/procurement/purchase-orders` - Purchase Orders

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  Purchase Orders                        [+ Create PO]        │
├─────────────────────────────────────────────────────────────┤
│  [Status: All ▼] [Supplier ▼] [Date Range]                 │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ PO #     Supplier    Total    Expected  Status  [...] │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ PO-001   Acme Inc   $5,000   Oct 15    Draft   [...] │  │
│  │ PO-002   XYZ Ltd    $3,200   Oct 20    Ordered [...] │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Buttons**:
1. **[+ Create PO]** → New PO form modal or page
2. **[Status ▼]** → Filter (Draft, Submitted, Approved, Ordered, Received)
3. **[Supplier ▼]** → Filter by supplier
4. **[...]** → Row actions:
   - View Details → View PO details modal
   - Edit → Edit PO (if DRAFT)
   - Submit → PUT `/api/procurement/purchase-orders/[id]` (status=SUBMITTED)
   - Approve → PUT `/api/procurement/purchase-orders/[id]` (status=APPROVED)
   - Receive → Receiving modal → POST `/api/procurement/receive`
   - Cancel → Confirmation → PUT `/api/procurement/purchase-orders/[id]` (status=CANCELLED)

**APIs**: 
- `GET /api/procurement/purchase-orders`
- `GET /api/procurement/suppliers`

---

### INTEGRATION PAGES

#### 🔌 `/dashboard/integrations` - Integration Hub

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  Integrations                                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Stripe  │ │PayHere  │ │SendGrid │ │ Twilio  │          │
│  │ [icon]  │ │ [icon]  │ │ [icon]  │ │ [icon]  │          │
│  │✅ Active│ │⚪ Setup │ │✅ Active│ │✅ Active│          │
│  │[Config] │ │[Setup]  │ │[Config] │ │[Config] │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │WhatsApp │ │WooCom   │ │ Shopify │ │  More   │          │
│  │ [icon]  │ │ [icon]  │ │ [icon]  │ │ [icon]  │          │
│  │✅ Active│ │⚪ Setup │ │⚪ Setup │ │         │          │
│  │[Config] │ │[Setup]  │ │[Setup]  │ │[Browse] │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────────────────────────────────────────────┘
```

**Buttons**:
1. **[Config]** (Active integrations) → Specific integration page:
   - Stripe → `/dashboard/integrations/stripe`
   - SendGrid → `/dashboard/integrations/email`
   - Twilio → `/dashboard/integrations/sms`
   - WhatsApp → `/dashboard/integrations/whatsapp`

2. **[Setup]** (Inactive) → Setup wizard:
   - PayHere → `/dashboard/integrations/payhere`
   - WooCommerce → `/dashboard/integrations/woocommerce`
   - Shopify → `/dashboard/integrations/shopify`

3. **[Browse]** → Integration marketplace modal

**APIs**: `GET /api/integrations/setup`

---

#### 💳 `/dashboard/integrations/stripe` - Stripe Configuration

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Integrations                        [Disconnect] │
├─────────────────────────────────────────────────────────────┤
│  Stripe Payment Integration                                 │
│  Status: ✅ Active  |  Last sync: 2 minutes ago            │
│                                                              │
│  Connection:                                                │
│    API Key: sk_live_************************  [Reveal]      │
│    Webhook Secret: whsec_*******************  [Reveal]      │
│    [Test Connection]                                        │
│                                                              │
│  Settings:                                                  │
│    [x] Enable automatic payouts                             │
│    [x] Send payment receipts                                │
│    [x] Enable 3D Secure                                     │
│                                                              │
│  Webhook URL:                                               │
│    https://yourapp.com/api/webhooks/stripe                  │
│    [Copy] [Test Webhook]                                    │
│                                                              │
│  [Cancel] [Save Changes]                                    │
└─────────────────────────────────────────────────────────────┘
```

**Buttons**:
1. **[← Back]** → `/dashboard/integrations`
2. **[Disconnect]** → Confirmation → DELETE `/api/integrations/setup?type=stripe`
3. **[Reveal]** → Shows full API key
4. **[Test Connection]** → POST `/api/integrations/stripe/verify`
5. **[Copy]** → Copies webhook URL to clipboard
6. **[Test Webhook]** → POST `/api/webhooks/test` (type=stripe)
7. **[Cancel]** → `/dashboard/integrations`
8. **[Save Changes]** → PUT `/api/integrations/setup` → `/dashboard/integrations`

**APIs**:
- `GET /api/integrations/setup?type=stripe`
- `PUT /api/integrations/setup`
- `POST /api/integrations/stripe/verify`

---

### MARKETING & CAMPAIGNS

#### 📧 `/dashboard/campaigns` - Marketing Campaigns

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  Campaigns                                 [+ Create Campaign]│
├─────────────────────────────────────────────────────────────┤
│  [Active] [Scheduled] [Completed] [Drafts]                  │
│  [🔍 Search] [Type ▼] [Export]                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Name          Type   Sent    Opens   Clicks   [...]  │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Summer Sale  EMAIL  5,420   45%     12%      [...]  │  │
│  │ New Arrivals  SMS    1,200   N/A     N/A      [...]  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Buttons**:
1. **[+ Create Campaign]** → Campaign creation wizard:
   - Step 1: Choose Type (EMAIL, SMS, PUSH, IN_APP)
   - Step 2: Select Audience (Segments, Custom)
   - Step 3: Design Content (Template editor)
   - Step 4: Schedule (Send Now, Schedule Later)
   - **[Send Campaign]** → POST `/api/campaigns` → POST `/api/campaigns/[id]/send`

2. **Tab [Active]** → Shows active campaigns
3. **Tab [Scheduled]** → Shows scheduled campaigns
4. **[...]** → Row actions:
   - View Analytics → Campaign analytics page
   - Edit → Edit campaign (if DRAFT)
   - Duplicate → Creates copy
   - Pause → Pauses campaign
   - Delete → DELETE `/api/campaigns/[id]`

**APIs**:
- `GET /api/campaigns`
- `POST /api/campaigns`
- `GET /api/campaigns/[id]/analytics`

---

### AI & ML PAGES

#### 🧠 `/dashboard/ai-insights` - AI Insights

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  AI-Powered Insights                      [Refresh] [Export]│
├─────────────────────────────────────────────────────────────┤
│  [Demand Forecast] [Churn Prediction] [Recommendations]     │
│                                                              │
│  🔮 Demand Forecast (Next 30 days):                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Product      Current   Predicted   Recommendation    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ T-Shirt      45       120 units    ⚠️ Order 80 units │  │
│  │ Jeans Blue   12       15 units     ✅ Stock OK       │  │
│  │ Sneakers     0        45 units     🔴 Order 50 NOW   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ⚠️ Churn Risk Customers (High Priority):                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Customer      Last Order   Risk    Action           │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Sarah Lee     60 days ago  75%     [Send Offer]     │  │
│  │ Mike Chen     45 days ago  62%     [Send Offer]     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [View Full AI Analytics →]                                 │
└─────────────────────────────────────────────────────────────┘
```

**Buttons**:
1. **[Refresh]** → Re-runs predictions → POST `/api/ml/demand-forecast`, `/api/ml/churn-prediction`
2. **[Export]** → Downloads insights → POST `/api/reports/generate` (type=ai-insights)
3. **Tab [Demand Forecast]** → Shows demand predictions
4. **Tab [Churn Prediction]** → Shows at-risk customers
5. **Tab [Recommendations]** → Shows AI recommendations
6. **[Send Offer]** → Opens campaign modal:
   - Pre-filled with customer
   - Template selector
   - **[Send]** → POST `/api/campaigns`
7. **[View Full AI Analytics →]** → `/dashboard/ai-analytics`

**Row Actions** (Demand Forecast):
- **[Order Now]** → `/dashboard/procurement/purchase-orders` (pre-filled with product & quantity)

**APIs**:
- `POST /api/ml/demand-forecast`
- `POST /api/ml/churn-prediction`
- `POST /api/ml/recommendations`
- `GET /api/ai-analytics/dashboard`

---

### FULFILLMENT WORKFLOW

#### 📋 `/dashboard/fulfillment` - Fulfillment Queue

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  Fulfillment Queue                        [Warehouse: All ▼]│
├─────────────────────────────────────────────────────────────┤
│  [Ready to Pick: 15] [Picking: 8] [Packing: 5] [Shipping: 3]│
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Order      Customer    Items   Priority   Actions    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ #ORD1234  John Doe     3      🔴 High    [Pick]      │  │
│  │ #ORD1235  Jane Smith   1      🟡 Med     [Pick]      │  │
│  │ #ORD1236  Bob Jones    5      🟢 Low     [Pick]      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Fulfillment Flow**:

1. **[Pick]** → POST `/api/fulfillment/[id]/pick` → Picking screen:
```
   ┌── Picking Order #ORD1234 ──┐
   │ Items to Pick:              │
   │ ☐ T-Shirt (Bin: A-15)      │
   │ ☐ Jeans (Bin: B-22)        │
   │ ☐ Shoes (Bin: C-08)        │
   │                             │
   │ [Mark All Picked]           │
   └─────────────────────────────┘
```
   - **[Mark All Picked]** → POST `/api/fulfillment/[id]/pick` → Moves to "Packing" status

2. **[Pack]** → POST `/api/fulfillment/[id]/pack` → Packing screen:
```
   ┌── Packing Order #ORD1234 ──┐
   │ Box Size: [Medium ▼]        │
   │ Weight: [____] lbs          │
   │ Fragile: [x]                │
   │                              │
   │ [Generate Label]             │
   │ [Mark as Packed]             │
   └──────────────────────────────┘
```
   - **[Generate Label]** → POST `/api/fulfillment/[id]/label` → Downloads PDF
   - **[Mark as Packed]** → POST `/api/fulfillment/[id]/pack` → Moves to "Shipping"

3. **[Ship]** → POST `/api/fulfillment/[id]/ship` → Shipping screen:
```
   ┌── Ship Order #ORD1234 ─────┐
   │ Carrier: [UPS ▼]            │
   │ Service: [Ground ▼]         │
   │ Tracking #: [_____________] │
   │                              │
   │ [Print Label]                │
   │ [Mark as Shipped]            │
   └──────────────────────────────┘
```
   - **[Print Label]** → Prints shipping label
   - **[Mark as Shipped]** → POST `/api/fulfillment/[id]/ship` → Completes fulfillment

**APIs**:
- `GET /api/fulfillment`
- `POST /api/fulfillment/[id]/pick`
- `POST /api/fulfillment/[id]/pack`
- `POST /api/fulfillment/[id]/label`
- `POST /api/fulfillment/[id]/ship`

---

### POS SYSTEM

#### 💰 `/dashboard/pos` - Point of Sale

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  POS Terminal           Cash Drawer: $450.00  [Open Drawer] │
├───────────────────────────┬─────────────────────────────────┤
│ [🔍 Scan/Search product]  │  ┌── Cart ─────────────────┐  │
│                            │  │ T-Shirt x2     $59.98   │  │
│ ┌── Product Categories ──┐│  │ Jeans x1       $59.99   │  │
│ │ [All] [Clothing]       ││  │                         │  │
│ │ [Footwear] [Access.]   ││  │ Subtotal:     $119.97   │  │
│ └────────────────────────┘│  │ Tax (10%):     $12.00   │  │
│                            │  │ ────────────────────── │  │
│ ┌── Products ────────────┐│  │ Total:        $131.97   │  │
│ │ [T-Shirt $29.99]  [+] ││  │                         │  │
│ │ [Jeans   $59.99]  [+] ││  │ [Clear Cart]            │  │
│ │ [Sneakers $89.99] [+] ││  │ [Hold]                  │  │
│ └────────────────────────┘│  │ [Checkout]              │  │
│                            │  └─────────────────────────┘  │
└───────────────────────────┴─────────────────────────────────┘
```

**Buttons**:
1. **[Open Drawer]** → POST `/api/pos/cash-drawer` (action=OPEN)
2. **[🔍]** → Product search
   - Type/scan → `GET /api/products?search=query`
   - Select → Adds to cart
3. **[Category buttons]** → Filters products
4. **[+]** (Product) → Adds product to cart
5. **Cart [+/-]** → Adjusts quantity
6. **[x]** (Cart item) → Removes from cart
7. **[Clear Cart]** → Clears all items
8. **[Hold]** → Saves cart for later → POST `/api/pos/hold`
9. **[Checkout]** → Payment screen:
```
   ┌──── Payment ────────────────┐
   │ Total: $131.97               │
   │                               │
   │ Payment Method:              │
   │ [Cash] [Card] [Mobile]       │
   │                               │
   │ Amount Tendered: [_______]   │
   │ Change: $0.00                │
   │                               │
   │ [Print Receipt] [Complete]   │
   └───────────────────────────────┘
```
   - **[Complete]** → POST `/api/pos/transactions` → Receipt screen
   - **[Print Receipt]** → Prints receipt

**APIs**:
- `GET /api/products?pos=true`
- `POST /api/pos/transactions`
- `POST /api/pos/cash-drawer`

---

### REPORTS & ANALYTICS

#### 📊 `/dashboard/reports` - Report Center

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  Reports                                  [+ Generate Report]│
├─────────────────────────────────────────────────────────────┤
│  Report Templates:                                          │
│                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │  Sales  │ │Inventory│ │Customer │ │Financial│          │
│  │ Report  │ │ Report  │ │ Report  │ │ Report  │          │
│  │ [Generate]│ [Generate]│ [Generate]│ [Generate]│          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                              │
│  Recent Reports:                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Report Name      Generated    Type      [Download]    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Sales Oct 2025  Oct 12, 10am  Sales     [PDF][CSV]  │  │
│  │ Inventory Q3    Oct 1, 9am    Inventory [PDF][CSV]  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Scheduled Reports: [View All →]                            │
└─────────────────────────────────────────────────────────────┘
```

**Buttons**:
1. **[+ Generate Report]** → Report wizard modal:
   - Step 1: Report Type (Sales, Inventory, Customer, Financial, Tax)
   - Step 2: Date Range
   - Step 3: Filters & Options
   - Step 4: Format (PDF, CSV, Excel)
   - **[Generate]** → POST `/api/reports/generate` → Downloads/emails

2. **Template [Generate]** buttons:
   - Sales Report → POST `/api/reports/sales`
   - Inventory Report → POST `/api/reports/inventory`
   - Customer Report → POST `/api/reports/customers`
   - Financial Report → POST `/api/accounting/reports/profit-loss`

3. **[PDF]** → Downloads PDF version
4. **[CSV]** → Downloads CSV version
5. **[View All →]** → `/dashboard/reports/scheduled`

**APIs**:
- `GET /api/reports`
- `POST /api/reports/generate`
- `GET /api/reports/templates`

---

### ADMINISTRATION (SUPER_ADMIN Only)

#### 🏢 `/dashboard/tenants` - Organization Management

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  Organizations                         [+ Create Organization]│
├─────────────────────────────────────────────────────────────┤
│  [🔍 Search] [Plan ▼] [Status ▼]                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Name       Plan  Users  Status    MRR      Actions   │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Acme Corp  PRO   25     Active   $299     [View][...]│  │
│  │ XYZ Ltd    BASIC 5      Active   $49      [View][...]│  │
│  │ Demo Org   FREE  3      Active   $0       [View][...]│  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Total MRR: $5,430  |  Active Orgs: 45  |  Total Users: 234│
└─────────────────────────────────────────────────────────────┘
```

**Buttons**:
1. **[+ Create Organization]** → Organization creation form:
   - Name, Domain, Plan, Admin Email
   - **[Create]** → POST `/api/tenants`

2. **[View]** → `/dashboard/tenants/[id]` - Organization details:
   - Users list
   - Subscription details
   - Usage metrics
   - Activity logs
   - **[Edit]** → PUT `/api/tenants/[id]`
   - **[Suspend]** → PUT `/api/tenants/[id]` (status=SUSPENDED)
   - **[Delete]** → DELETE `/api/tenants/[id]`

3. **[...]** → Actions:
   - Impersonate → POST `/api/tenants/switch` → `/dashboard` (as that org)
   - View Audit Logs → `/dashboard/audit?org=[id]`
   - Upgrade Plan → Plan change modal
   - Suspend → Confirmation modal
   - Delete → Confirmation modal

**APIs**:
- `GET /api/tenants`
- `POST /api/tenants`
- `GET /api/tenants/[id]`
- `POST /api/tenants/switch`

---

#### 📦 `/dashboard/admin/packages` - Package Management

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  Subscription Packages                      [+ Create Package]│
├─────────────────────────────────────────────────────────────┤
│  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────────┐           │
│  │ FREE  │  │ BASIC │  │  PRO  │  │ENTERPRISE │           │
│  │  $0   │  │  $49  │  │ $299  │  │  Custom   │           │
│  │       │  │       │  │       │  │           │           │
│  │ Features:         │  │ Features:           │           │
│  │ ✓ 1 user          │  │ ✓ All FREE         │           │
│  │ ✓ 100 products    │  │ ✓ 10 users         │           │
│  │ ✓ Basic reports   │  │ ✓ Unlimited prod   │           │
│  │                   │  │ ✓ Advanced analytics│          │
│  │ [Edit Package]    │  │ [Edit Package]     │           │
│  └───────┘  └───────┘  └───────┘  └───────────┘           │
└─────────────────────────────────────────────────────────────┘
```

**Buttons**:
1. **[+ Create Package]** → Package creation form:
   - Name, Price, Features, Limits
   - **[Save]** → POST `/api/admin/packages`

2. **[Edit Package]** → Package edit modal:
   - Update features, pricing, limits
   - **[Save Changes]** → PUT `/api/admin/packages/[id]`
   - **[Delete]** → DELETE `/api/admin/packages/[id]`

**APIs**:
- `GET /api/admin/packages`
- `POST /api/admin/packages`
- `PUT /api/admin/packages/[id]`

---

### MONITORING & SYSTEM

#### 👁️ `/dashboard/monitoring` - System Monitoring

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  System Monitoring                     [Auto Refresh: ON ⏸️] │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Uptime  │ │API Resp │ │Requests │ │ Errors  │          │
│  │ 99.98%  │ │  45ms   │ │1.2K/min │ │ 0.01%   │          │
│  │ ✅ Good │ │ ✅ Good │ │ ✅ Good │ │ ✅ Good │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                              │
│  Services Status:                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Service      Status    Uptime    Last Check          │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ API          ✅ Up     99.99%    Just now            │  │
│  │ Database     ✅ Up     100%      Just now            │  │
│  │ Redis        ✅ Up     99.95%    Just now            │  │
│  │ Stripe       ✅ Up     99.90%    2 min ago           │  │
│  │ SendGrid     ⚠️ Slow   98.50%    5 min ago           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [View Performance →] [View Logs →] [Create Alert]          │
└─────────────────────────────────────────────────────────────┘
```

**Buttons**:
1. **[Auto Refresh: ON ⏸️]** → Toggle auto-refresh (every 30s)
2. **[View Performance →]** → `/dashboard/performance`
3. **[View Logs →]** → `/dashboard/logs`
4. **[Create Alert]** → Alert configuration modal:
   - Metric, Threshold, Action
   - **[Save]** → POST `/api/performance/alerts`

**Click Actions**:
- Click metric card → Detailed view with historical data
- Click service row → Service-specific dashboard

**APIs**:
- `GET /api/monitoring/status` - Overall status
- `GET /api/monitoring/health` - Health checks
- `GET /api/monitoring/metrics` - Detailed metrics

**Auto-refresh**: Calls APIs every 30 seconds when enabled

---

### SETTINGS PAGES

#### ⚙️ `/dashboard/settings` - General Settings

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                                    │
├─────────────────────────────────────────────────────────────┤
│  Sidebar:                          Main Content:             │
│  ┌────────────────┐               ┌──────────────────────┐ │
│  │ [General] ◄     │               │ Organization Info    │ │
│  │ Team            │               │                      │ │
│  │ Billing         │               │ Name: [Acme Corp]    │ │
│  │ Integrations    │               │ Domain: [acme.com]   │ │
│  │ Webhooks        │               │ Logo: [Upload]       │ │
│  │ API Keys        │               │                      │ │
│  │ Notifications   │               │ [Save Changes]       │ │
│  │ Security        │               └──────────────────────┘ │
│  │ Features        │                                         │
│  └────────────────┘                                         │
└─────────────────────────────────────────────────────────────┘
```

**Sidebar Navigation**:
1. **[General]** → Organization settings
2. **[Team]** → `/dashboard/users`
3. **[Billing]** → `/dashboard/billing`
4. **[Integrations]** → `/dashboard/integrations`
5. **[Webhooks]** → `/dashboard/webhooks`
6. **[API Keys]** → API key management section
   - **[+ Generate Key]** → POST `/api/api-keys`
   - **[Revoke]** → DELETE `/api/api-keys/[id]`
7. **[Notifications]** → Notification preferences
8. **[Security]** → Security settings (MFA, password policy)
9. **[Features]** → `/dashboard/settings/features`

**Buttons**:
- **[Upload Logo]** → File upload → POST `/api/upload` → Updates org
- **[Save Changes]** → PUT `/api/configuration`

**APIs**:
- `GET /api/configuration`
- `PUT /api/configuration`
- `GET /api/api-keys`

---

**Continue to Part 4**: User Journey Maps & Workflows →


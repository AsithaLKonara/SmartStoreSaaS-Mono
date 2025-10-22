# 📐 Complete Project Wireframe - Part 4: User Journey Maps

**Date**: October 13, 2025

---

## 🗺️ USER JOURNEY MAPS

### JOURNEY 1: Customer Registration & First Purchase

**Actors**: New Customer  
**Goal**: Register account and make first purchase  
**Steps**: 11

```
START → Homepage (/)
  │
  ├─► [Get Started] Button
  │
  ▼
Register Page (/register)
  │
  ├─► Fill form (Name, Email, Password)
  ├─► [Create Account] Button
  ├─► API: POST /api/customer-registration
  │
  ▼
Email Verification
  │
  ├─► Click verification link in email
  ├─► API: GET /api/verify-email?token=...
  │
  ▼
Login Page (/login)
  │
  ├─► Enter credentials
  ├─► [Login] Button
  ├─► API: POST /api/auth/signin
  │
  ▼
Customer Portal (/customer-portal)
  │
  ├─► Browse products (if storefront exists)
  ├─► [Add to Cart] Button
  ├─► API: POST /api/cart
  │
  ▼
Cart Review
  │
  ├─► [Proceed to Checkout] Button
  │
  ▼
Checkout Page
  │
  ├─► Fill shipping address
  ├─► Select payment method
  ├─► [Place Order] Button
  ├─► API: POST /api/checkout
  ├─► API: POST /api/payments/intent
  │
  ▼
Order Confirmation
  │
  ├─► Email confirmation sent
  ├─► [View Order] Button → /customer-portal/orders/[id]
  │
  ▼
END → Order placed successfully
```

**Total Time**: 5-10 minutes  
**API Calls**: 5  
**Pages Visited**: 6

---

### JOURNEY 2: Staff Processing an Order

**Actors**: STAFF (sales_staff)  
**Goal**: Process customer order from creation to shipment  
**Steps**: 15

```
START → Login (/login)
  │
  ├─► Enter credentials
  ├─► [Login] Button
  ├─► API: POST /api/auth/signin
  │
  ▼
Dashboard (/dashboard)
  │
  ├─► [+ New Order] Quick Action
  │
  ▼
Create Order (/dashboard/orders/new)
  │
  ├─► [Select Customer ▼] → Choose existing customer
  ├─► API: GET /api/customers
  ├─► [+ Add Product] → Search & add products
  ├─► API: GET /api/products
  ├─► API: POST /api/pricing/calculate (auto-calculates totals)
  ├─► [Process Order] Button
  ├─► API: POST /api/orders
  │
  ▼
Order Created → Redirect to Order Details (/dashboard/orders/[id])
  │
  ├─► Order appears in fulfillment queue
  │
  ▼
Fulfillment (/dashboard/fulfillment)
  │
  ├─► [Pick] Button
  ├─► API: POST /api/fulfillment/[id]/pick
  ├─► Check off items as picked
  ├─► [Mark All Picked] Button
  │
  ▼
Packing
  │
  ├─► [Pack] Button
  ├─► API: POST /api/fulfillment/[id]/pack
  ├─► Select box size, enter weight
  ├─► [Generate Label] Button
  ├─► API: POST /api/fulfillment/[id]/label
  ├─► Label downloads/prints
  ├─► [Mark as Packed] Button
  │
  ▼
Shipping
  │
  ├─► [Ship] Button
  ├─► Enter carrier & tracking number
  ├─► [Mark as Shipped] Button
  ├─► API: POST /api/fulfillment/[id]/ship
  │
  ▼
Order Shipped
  │
  ├─► Customer receives tracking email
  ├─► Status updated to SHIPPED
  │
  ▼
END → Order fulfilled successfully
```

**Total Time**: 10-15 minutes  
**API Calls**: 8  
**Pages Visited**: 4

---

### JOURNEY 3: Admin Setting Up Integration

**Actors**: TENANT_ADMIN  
**Goal**: Connect Stripe payment gateway  
**Steps**: 8

```
START → Dashboard (/dashboard)
  │
  ├─► Sidebar: Click [Integrations]
  │
  ▼
Integration Hub (/dashboard/integrations)
  │
  ├─► API: GET /api/integrations/setup (loads all integrations)
  ├─► Find Stripe card (Status: ⚪ Setup)
  ├─► [Setup] Button
  │
  ▼
Stripe Setup (/dashboard/integrations/stripe)
  │
  ├─► Enter API keys (from Stripe dashboard)
  │   - Publishable Key: pk_live_...
  │   - Secret Key: sk_live_...
  ├─► [Test Connection] Button
  ├─► API: POST /api/integrations/stripe/verify
  ├─► ✅ Connection successful
  ├─► Configure webhook URL (shown on page)
  ├─► Copy webhook URL → Paste in Stripe dashboard
  ├─► [Save Changes] Button
  ├─► API: PUT /api/integrations/setup (type=stripe)
  │
  ▼
Integration Hub (/dashboard/integrations)
  │
  ├─► Stripe card now shows: ✅ Active
  ├─► Can now process payments!
  │
  ▼
END → Stripe integration complete
```

**Total Time**: 5-10 minutes  
**API Calls**: 3  
**Pages Visited**: 2  
**External**: Stripe dashboard (for webhook setup)

---

### JOURNEY 4: Super Admin Creating New Organization

**Actors**: SUPER_ADMIN  
**Goal**: Onboard new tenant organization  
**Steps**: 10

```
START → Dashboard (/dashboard)
  │
  ├─► Sidebar: Click [Organizations] (SUPER_ADMIN only)
  │
  ▼
Organizations (/dashboard/tenants)
  │
  ├─► API: GET /api/tenants (loads all organizations)
  ├─► [+ Create Organization] Button
  │
  ▼
Create Organization Modal
  │
  ├─► Fill form:
  │   - Organization Name: "Acme Corp"
  │   - Domain: "acme"
  │   - Plan: [PRO ▼]
  │   - Admin Email: "admin@acme.com"
  │   - Admin Name: "John Admin"
  ├─► [Create Organization] Button
  ├─► API: POST /api/tenants
  │
  ▼
Organization Created
  │
  ├─► Success message
  ├─► Email sent to admin@acme.com with setup link
  ├─► Redirect to Organization Details (/dashboard/tenants/[id])
  │
  ▼
Organization Details Page
  │
  ├─► Shows:
  │   - Users (1 admin created)
  │   - Subscription (PRO plan active)
  │   - Usage metrics (0)
  │   - Activity logs
  ├─► Actions available:
  │   - [Impersonate] → Switch to that org
  │   - [Edit Details] → Update org info
  │   - [View Audit Logs] → See activity
  │
  ▼
Optional: Impersonate
  │
  ├─► [Impersonate] Button
  ├─► API: POST /api/tenants/switch (organizationId=new-org-id)
  ├─► Dashboard now shows Acme Corp context
  ├─► Can setup org as admin would
  │
  ▼
END → New organization ready for use
```

**Total Time**: 3-5 minutes  
**API Calls**: 2 (+ optional impersonate)  
**Pages Visited**: 2  
**Outcome**: New tenant can now login and use platform

---

### JOURNEY 5: Inventory Manager Restocking Product

**Actors**: STAFF (inventory_manager)  
**Goal**: Restock low-inventory product via purchase order  
**Steps**: 12

```
START → Dashboard (/dashboard)
  │
  ├─► See "Low Stock Alert" notification
  ├─► Click alert or navigate to Inventory
  │
  ▼
Inventory (/dashboard/inventory)
  │
  ├─► API: GET /api/inventory
  ├─► See: Sneakers - 0 stock 🔴
  ├─► Click [...] actions menu
  ├─► Select "Create Purchase Order"
  │
  ▼
Purchase Order Form (Modal or /dashboard/procurement/purchase-orders)
  │
  ├─► Product: Sneakers (pre-filled)
  ├─► Quantity: [50]
  ├─► Supplier: [Select ▼]
  ├─► API: GET /api/procurement/suppliers
  ├─► Expected Delivery: [Oct 20, 2025 📅]
  ├─► [Create PO] Button
  ├─► API: POST /api/procurement/purchase-orders
  │
  ▼
Purchase Order Created (PO-123)
  │
  ├─► Status: DRAFT
  ├─► [Submit for Approval] Button
  ├─► API: PUT /api/procurement/purchase-orders/[id] (status=SUBMITTED)
  │
  ▼
PO Submitted (if requires approval)
  │
  ├─► Awaiting TENANT_ADMIN approval
  ├─► Email notification sent to admin
  │
  ▼
Admin Approves (on their end)
  │
  ├─► Admin: [Approve PO] Button
  ├─► API: PUT /api/procurement/purchase-orders/[id] (status=APPROVED)
  ├─► PO sent to supplier
  │
  ▼
Products Received (when stock arrives)
  │
  ├─► Navigate to PO (/dashboard/procurement/purchase-orders)
  ├─► Find PO-123
  ├─► [Receive Items] Button
  │
  ▼
Receiving Screen
  │
  ├─► Enter received quantities
  │   - Ordered: 50
  │   - Received: [50]
  ├─► [Confirm Receipt] Button
  ├─► API: POST /api/procurement/receive
  ├─► API: POST /api/inventory/[id]/adjust (updates stock)
  │
  ▼
Stock Updated
  │
  ├─► Inventory now shows: Sneakers - 50 stock ✅
  ├─► Low stock alert cleared
  │
  ▼
END → Product restocked successfully
```

**Total Time**: 15-20 minutes (spread over days for delivery)  
**API Calls**: 6  
**Pages Visited**: 3  
**Notifications**: 2 (submission, approval)

---

### JOURNEY 6: Customer Returning a Product

**Actors**: CUSTOMER  
**Goal**: Request return and receive refund  
**Steps**: 10

```
START → Customer Portal (/customer-portal)
  │
  ├─► [Orders] Tab
  │
  ▼
Order History (/customer-portal/orders)
  │
  ├─► API: GET /api/customer-portal/orders
  ├─► Find order #ORD1234
  ├─► [View] Button
  │
  ▼
Order Details (/customer-portal/orders/[id])
  │
  ├─► API: GET /api/customer-portal/orders/[id]
  ├─► [Request Return] Button
  │
  ▼
Return Request Form (Modal)
  │
  ├─► Select items to return
  │   [x] T-Shirt x1
  │   [ ] Jeans x1
  ├─► Reason: [Too small ▼]
  ├─► Description: [__________]
  ├─► [Submit Return Request] Button
  ├─► API: POST /api/returns
  │
  ▼
Return Requested (RET-456)
  │
  ├─► Status: PENDING
  ├─► Email confirmation sent
  ├─► "Return request submitted" message
  │
  ▼
Admin Reviews (on admin side)
  │
  ├─► Admin goes to /dashboard/returns
  ├─► Sees RET-456 (PENDING)
  ├─► [Approve] Button
  ├─► API: POST /api/returns/[id]/approve
  ├─► Email sent to customer with return label
  │
  ▼
Customer Ships Product
  │
  ├─► Customer portal shows: "Return approved - print label"
  ├─► [Download Return Label] Button
  ├─► Ships product
  │
  ▼
Admin Receives & Inspects
  │
  ├─► Admin marks as received
  ├─► API: PUT /api/returns/[id] (status=RECEIVED)
  ├─► Inspects product
  ├─► [Process Refund] Button
  ├─► Select refund method: [Original Payment ▼]
  ├─► API: POST /api/returns/[id]/refund
  │
  ▼
Refund Processed
  │
  ├─► API: POST /api/payments/refund
  ├─► Status: REFUNDED
  ├─► Email sent to customer
  ├─► Inventory updated (+1 for T-Shirt)
  │
  ▼
END → Customer receives refund
```

**Total Time**: 5-7 days (including shipping)  
**API Calls**: 6  
**Customer Pages**: 2  
**Admin Pages**: 1  
**Emails**: 3

---

### JOURNEY 7: Admin Generating Financial Report

**Actors**: TENANT_ADMIN  
**Goal**: Generate monthly P&L report  
**Steps**: 7

```
START → Dashboard (/dashboard)
  │
  ├─► Sidebar: Click [Accounting]
  │
  ▼
Accounting Dashboard (/dashboard/accounting)
  │
  ├─► [Financial Reports] Card
  │
  ▼
Financial Reports (/dashboard/accounting/reports)
  │
  ├─► Report Types: [Income Statement] [Balance Sheet] [Cash Flow] [Trial Balance]
  ├─► Click [Income Statement]
  │
  ▼
Report Configuration Modal
  │
  ├─► Period: [Monthly ▼]
  ├─► Date: [October 2025 📅]
  ├─► Format: [PDF ▼]
  ├─► [Generate Report] Button
  ├─► API: POST /api/accounting/reports/profit-loss
  │
  ▼
Report Generating
  │
  ├─► Loading spinner (2-5 seconds)
  ├─► API processes data
  │
  ▼
Report Ready
  │
  ├─► Report displays on screen
  ├─► Actions:
  │   - [Download PDF] → Downloads file
  │   - [Download Excel] → Downloads Excel
  │   - [Email Report] → Email modal
  │   - [Print] → Print dialog
  │   - [Save to Library] → Saves for later access
  ├─► Click [Download PDF]
  ├─► File downloads: "P&L_October_2025.pdf"
  │
  ▼
END → Report downloaded successfully
```

**Total Time**: 2-3 minutes  
**API Calls**: 2  
**Pages Visited**: 3

---

### JOURNEY 8: Creating Marketing Campaign

**Actors**: TENANT_ADMIN  
**Goal**: Send promotional email to customer segment  
**Steps**: 12

```
START → Dashboard (/dashboard)
  │
  ├─► Sidebar: Click [Campaigns]
  │
  ▼
Campaigns (/dashboard/campaigns)
  │
  ├─► API: GET /api/campaigns
  ├─► [+ Create Campaign] Button
  │
  ▼
Campaign Wizard - Step 1: Type
  │
  ├─► Choose type:
  │   ○ Email  ← Selected
  │   ○ SMS
  │   ○ Push Notification
  ├─► [Next] Button
  │
  ▼
Step 2: Select Audience
  │
  ├─► API: GET /api/customer-segments
  ├─► Choose segment:
  │   [x] VIP Customers (45 customers)
  │   [ ] At Risk Customers
  │   [ ] New Customers
  ├─► Or: Custom filter
  ├─► Preview audience: 45 customers
  ├─► [Next] Button
  │
  ▼
Step 3: Design Content
  │
  ├─► Template library
  ├─► Select "Promotional Email" template
  ├─► Or: Start from scratch
  ├─► Edit content:
  │   - Subject: "Exclusive 20% Off for VIPs!"
  │   - Body: [Rich text editor]
  │   - Add variables: {{customer.name}}, {{customer.points}}
  ├─► [Preview] → Shows preview
  ├─► [Send Test Email] → Sends to admin
  ├─► [Next] Button
  │
  ▼
Step 4: Schedule
  │
  ├─► When to send:
  │   ○ Send immediately  ← Selected
  │   ○ Schedule for later
  │   ○ Recurring campaign
  ├─► Review summary:
  │   - Type: Email
  │   - Recipients: 45 VIP customers
  │   - Subject: "Exclusive 20% Off..."
  │   - Scheduled: Immediately
  ├─► [Send Campaign] Button
  ├─► Confirmation: "Send to 45 customers?"
  ├─► [Confirm] Button
  ├─► API: POST /api/campaigns → POST /api/campaigns/[id]/send
  │
  ▼
Campaign Sending
  │
  ├─► Progress bar: Sending... (0/45)
  ├─► Real-time updates via WebSocket or polling
  ├─► API: GET /api/campaigns/[id]/status
  │
  ▼
Campaign Sent
  │
  ├─► Success message: "Campaign sent to 45 customers"
  ├─► [View Analytics] Button
  │
  ▼
Campaign Analytics
  │
  ├─► Shows:
  │   - Sent: 45
  │   - Delivered: 44 (98%)
  │   - Opened: 18 (41%)
  │   - Clicked: 5 (11%)
  │   - Converted: 2 (4.5%)
  ├─► Tracks in real-time (updates as customers open/click)
  │
  ▼
END → Campaign complete with analytics
```

**Total Time**: 15-20 minutes  
**API Calls**: 5  
**Pages Visited**: 1 (wizard within campaigns page)  
**Emails Sent**: 45

---

### JOURNEY 9: Accountant Reconciling Bank Account

**Actors**: STAFF (accountant)  
**Goal**: Reconcile bank transactions with ledger  
**Steps**: 9

```
START → Dashboard (/dashboard)
  │
  ├─► Sidebar: Click [Accounting] → [Bank Reconciliation]
  │
  ▼
Bank Reconciliation (/dashboard/accounting/bank)
  │
  ├─► API: GET /api/accounting/bank/accounts
  ├─► Select bank account: [Checking - Bank of America ▼]
  ├─► API: GET /api/accounting/bank/transactions?account=[id]
  ├─► Enter statement details:
  │   - Statement Date: [Oct 31, 2025 📅]
  │   - Ending Balance: [$52,450.00]
  ├─► [Load Transactions] Button
  │
  ▼
Transaction Matching
  │
  ├─► Shows two columns:
  │   Left: Bank Statement Transactions (imported or manual)
  │   Right: Ledger Transactions
  ├─► Match transactions:
  │   - Drag bank transaction → ledger transaction
  │   - Or: [Auto-Match] Button → API auto-matches
  ├─► Unmatched transactions:
  │   - Bank charge $15.00 → [Create Entry] → Quick journal entry
  │   - Interest $5.00 → [Create Entry]
  ├─► API: POST /api/accounting/journal-entries (for unmatched items)
  │
  ▼
Review & Reconcile
  │
  ├─► Summary:
  │   - Ledger Balance: $52,430.00
  │   - Statement Balance: $52,450.00
  │   - Difference: $20.00
  │   - Unmatched: 2 transactions
  ├─► Create entries for unmatched
  ├─► [Reconcile] Button (enabled when balanced)
  ├─► API: POST /api/accounting/bank/reconcile
  │
  ▼
Reconciliation Complete
  │
  ├─► Status: ✅ Reconciled
  ├─► Reconciliation report generated
  ├─► [Download Report] → PDF downloaded
  │
  ▼
END → Bank account reconciled for month
```

**Total Time**: 30-60 minutes  
**API Calls**: 5  
**Pages Visited**: 1-2

---

### JOURNEY 10: Setting Up WhatsApp Business Integration

**Actors**: TENANT_ADMIN  
**Goal**: Connect WhatsApp Business API for customer messaging  
**Steps**: 11

```
START → Integrations (/dashboard/integrations)
  │
  ├─► Find WhatsApp card (Status: Setup)
  ├─► [Setup] Button
  │
  ▼
WhatsApp Setup (/dashboard/integrations/whatsapp)
  │
  ├─► Shows setup steps:
  │   1. Create Facebook Business account
  │   2. Get WhatsApp Business API access
  │   3. Enter credentials here
  ├─► [Start Setup] Button → Opens instructions
  │
  ▼
Enter Credentials
  │
  ├─► Phone Number ID: [___________]
  ├─► Access Token: [__________________]
  ├─► Business Account ID: [___________]
  ├─► [Verify Credentials] Button
  ├─► API: POST /api/integrations/whatsapp/verify
  │
  ▼
Verification Success
  │
  ├─► ✅ Credentials verified
  ├─► Configure webhook:
  │   - Webhook URL: https://yourapp.com/api/webhooks/whatsapp
  │   - Verify Token: [Generate] → Generates random token
  │   - [Copy Webhook URL] → Copies to clipboard
  │   - [Copy Verify Token] → Copies token
  ├─► Instructions: "Paste these in Meta Business dashboard"
  │
  ▼
User Configures Meta Dashboard (External)
  │
  ├─► User opens Meta Business dashboard
  ├─► Pastes webhook URL and token
  ├─► Meta sends verification request
  ├─► Our API: GET /api/webhooks/whatsapp?hub.verify_token=...
  ├─► Returns challenge → Verification complete
  │
  ▼
Back to App - Test Message
  │
  ├─► [Send Test Message] Button
  ├─► Enter test phone number
  ├─► API: POST /api/integrations/whatsapp/send
  ├─► Test message sent
  ├─► [Save Configuration] Button
  ├─► API: PUT /api/integrations/setup (type=whatsapp)
  │
  ▼
WhatsApp Active
  │
  ├─► Status changes to: ✅ Active
  ├─► Can now send messages to customers
  ├─► Templates available for campaigns
  │
  ▼
END → WhatsApp Business connected
```

**Total Time**: 20-30 minutes  
**API Calls**: 4  
**Pages Visited**: 2  
**External Steps**: Meta Business dashboard configuration

---

## 🔄 COMPLETE WORKFLOW DIAGRAMS

### Order Processing Workflow (All Roles)

```
CUSTOMER                    STAFF/ADMIN              SYSTEM
   │                            │                        │
   │ Browse Products            │                        │
   │ Add to Cart                │                        │
   ├─► POST /api/cart ──────────┼───────────────────────►│ Saves cart
   │                            │                        │
   │ Checkout                   │                        │
   ├─► POST /api/checkout ──────┼───────────────────────►│ Creates order
   ├─► POST /api/payments/intent┼───────────────────────►│ Payment intent
   │ Enter payment details      │                        │
   ├─► Confirm payment ─────────┼───────────────────────►│ Processes payment
   │                            │                        │
   │ ◄─── Order confirmation ───┤                        │
   │ Email receipt              │                        │
   │                            │                        │
   │                            │ Order appears in queue │
   │                            │ Fulfillment dashboard  │
   │                            ├─► Pick items           │
   │                            ├─► Pack order           │
   │                            ├─► Print label          │
   │                            ├─► Ship order           │
   │                            ├─► POST /api/fulfillment/ship
   │                            │                        │
   │ ◄─── Tracking email ───────┤                        │
   │ Can track shipment         │                        │
   ├─► GET /api/shipping/track │                        │
   │                            │                        │
   │ ◄─── Delivery notification─┤                        │
   │                            │                        │
   END                          END                      END
```

---

### Inventory Restock Workflow

```
SYSTEM ALERT           INVENTORY MANAGER         TENANT_ADMIN
      │                       │                        │
      │ Low stock detected    │                        │
      ├───── Alert ──────────►│                        │
      │                       │                        │
      │                       │ Reviews inventory      │
      │                       │ /dashboard/inventory   │
      │                       │                        │
      │                       │ Creates Purchase Order │
      │                       ├─► POST /api/procurement/purchase-orders
      │                       │                        │
      │                       │ Submits for approval   │
      │                       ├───── Notification ────►│
      │                       │                        │
      │                       │                        │ Reviews PO
      │                       │                        │ /dashboard/procurement
      │                       │                        │
      │                       │                        │ Approves PO
      │                       │                        ├─► PUT /api/procurement/purchase-orders/[id]
      │                       │                        │
      │                       │◄──── PO Approved ──────┤
      │                       │                        │
      │                       │ Sends PO to supplier   │
      │                       │ (email/external)       │
      │                       │                        │
      │  [Days later...]      │                        │
      │                       │                        │
      │                       │ Receives shipment      │
      │                       │ Marks as received      │
      │                       ├─► POST /api/procurement/receive
      │                       │                        │
      │◄──── Stock updated ───┤                        │
      │ Alert cleared         │                        │
      │                       │                        │
     END                     END                      END
```

---

### Customer Support Ticket Workflow

```
CUSTOMER                  SUPPORT STAFF           SYSTEM
   │                           │                      │
   │ Has issue                 │                      │
   │ /customer-portal/support  │                      │
   ├─► [Create Ticket]         │                      │
   ├─► POST /api/customer-portal/support              │
   │                           │                      │
   │                           │◄─ Notification       │
   │                           │ New ticket assigned  │
   │                           │                      │
   │                           │ /dashboard/chat      │
   │                           │ Opens ticket         │
   │                           │ Reads issue          │
   │                           │                      │
   │◄──── Reply ───────────────┤                      │
   │ Email notification        │                      │
   │                           │                      │
   │ Views reply in portal     │                      │
   │ /customer-portal/support/[id]                    │
   ├─► Adds reply              │                      │
   ├─► PATCH /api/customer-portal/support/[id]        │
   │                           │                      │
   │                           │◄─ Reply notification │
   │                           │ Continues conversation│
   │                           │                      │
   │                           │ Resolves issue       │
   │                           ├─► PUT /api/chat/[id] (status=RESOLVED)
   │                           │                      │
   │◄──── Resolution email ────┤                      │
   │                           │                      │
   END                        END                    END
```

---

## 📱 MOBILE-SPECIFIC WORKFLOWS

### Mobile: Quick Order Creation (Staff)

**Mobile Layout**:
```
┌──────────────────────┐
│ ☰  New Order     [x] │
├──────────────────────┤
│ Customer:            │
│ [Search 🔍]          │
│ → John Doe          │
│                      │
│ Products:            │
│ [+ Add Product]      │
│ ┌────────────────┐  │
│ │ T-Shirt  x2    │  │
│ │ $59.98    [x]  │  │
│ └────────────────┘  │
│                      │
│ ┌─ Total ─────────┐ │
│ │ Subtotal $59.98 │ │
│ │ Tax      $6.00  │ │
│ │ Total    $65.98 │ │
│ └─────────────────┘ │
│                      │
│ Payment:             │
│ [Cash] [Card]        │
│                      │
│ [Process Order]      │
└──────────────────────┘
```

**Optimizations**:
- Larger buttons for touch
- Barcode scanner integration
- Voice search
- Quick payment buttons

---

## 🎨 COMPONENT LIBRARY

### Reusable UI Components Used Across Pages

1. **DataTable** - Used in 40+ pages
   - Props: columns, data, actions, filters
   - Features: Sort, filter, paginate, export

2. **FormModal** - Used for quick creates
   - Props: fields, onSubmit, title
   - Used in: Quick customer add, quick product add

3. **StatsCard** - Dashboard metrics
   - Shows: value, trend, icon, color
   - Click → Drills down to details

4. **StatusBadge** - Order/product status
   - Colors based on status
   - Clickable to change status (if permitted)

5. **ActionMenu** ([...] button)
   - Standard actions: View, Edit, Delete
   - Custom actions per context

6. **SearchBar** - Global search
   - Autocomplete
   - Multi-entity search (products, customers, orders)

7. **DateRangePicker** - Report filters
   - Presets: Today, This Week, This Month, Custom
   - Used in: Analytics, Reports, Orders, etc.

---

**Continue to Part 5**: Complete Page Reference Table →


# Role-Based Access Control (RBAC) System

SmartStore SaaS implements a robust, hierarchical Role-Based Access Control (RBAC) system designed for multi-tenant isolation and granular task delegation.

---

## 🔑 Core Roles

The system is built around four primary user roles, each with increasing levels of authority.

### 1. 👑 SUPER_ADMIN (Platform Administrator)
The "God Mode" role. This user manages the entire SaaS platform across all organizations.

*   **Access Scope**: Global (All Tenants).
*   **Key Privileges**: 
    *   Manage Organizations (Tenants): Create, Suspend, Delete.
    *   Platform Billing: Manage global subscription plans and payments.
    *   System Auditing: Access global audit logs and compliance reports.
    *   Infrastructure: Access monitoring, performance metrics, and backups.
*   **Dashboard Features**:
    *   **Platform Overview**: Total revenue across all tenants, active vs. inactive orgs.
    *   **Administration Menu**: Organization management, global packages, system logs.

### 2. 🛡️ TENANT_ADMIN (Organization Owner)
The administrator for a specific organization (e.g., "SmartStore Demo"). 

*   **Access Scope**: Single Organization.
*   **Key Privileges**: 
    *   Full control over products, orders, and customer data within the org.
    *   Financial Management: Access to accounting, payments, and expenses.
    *   User Management: Create staff accounts and assign roles.
    *   Integrations: Configure WhatsApp, WooCommerce, Shopify, Stripe, etc.
    *   Settings: Define organization branding, domain, and notification rules.
*   **Dashboard Features**:
    *   **Store Analytics**: Revenue charts, top-selling products, and AI-driven growth insights.
    *   **Full Sidebar Menu**: Access to Operations, Financial, Analytics & AI, Marketing, and System menus.

### 3. 👤 STAFF (Operational User)
Users assigned specific tasks within an organization. Their access is further refined by a **Role Tag**.

*   **Access Scope**: Single Organization (Task-specific).
*   **Key Privileges**: (Varies by tag)
    *   Browse and manage products/orders.
    *   Assist customers via chat.
*   **Dashboard Features**:
    *   **Task Overview**: Pending orders, support tickets, or stock alerts.
    *   **Restricted Sidebar**: Typically limited to Products, Orders, Customers, and Support.

### 4. 👥 CUSTOMER (End User)
External users who interact with the storefront.

*   **Access Scope**: Own data only.
*   **Key Privileges**: 
    *   Track own orders.
    *   Manage own profile and addresses.
    *   View purchase history.
*   **Dashboard Features**:
    *   **Account Hub**: Recent orders, loyalty points, and profile settings.

---

## 🏷️ Staff Role Tags (Granular Delegation)

When a user is assigned the `STAFF` role, they are given a `roleTag` which unlocks specific functional modules:

| Role Tag | Primary Access Area | Key Permissions |
| :--- | :--- | :--- |
| **Inventory Manager** | Products & Warehousing | Create/Edit products, adjust stock levels, warehouse management. |
| **Sales Executive** | Orders & Customers | Process orders, manage customer profiles, generate invoices. |
| **Finance Officer** | Accounting & Payments | View financial reports, reconcile payments, export tax data. |
| **Marketing Manager** | Campaigns & Analytics | Manage loyalty programs, view customer insights, run campaigns. |
| **Support Agent** | Customer Service | Handle live chat, resolve support tickets, update order status. |
| **HR Manager** | Internal Users | View staff lists, manage internal staff profile updates. |

---

## ⚙️ How Permissions are Enforced

1.  **Middleware Protection**: All API routes and page requests pass through an RBAC middleware (`src/lib/rbac/middleware.ts`) that checks the user's role against required permissions.
2.  **Navigation Filtering**: The sidebar menu is dynamically filtered (`src/app/(dashboard)/navigation-config.tsx`) so users only see links they have permission to access.
3.  **Database Isolation**: Every query implicitly filters by `organizationId`, ensuring Staff or Admins from one store can never see data from another.
4.  **Action Origin**: The system tracks whether actions were performed by a `human` or `ai` (ActionOrigin enum), adding an extra layer to the audit trail.

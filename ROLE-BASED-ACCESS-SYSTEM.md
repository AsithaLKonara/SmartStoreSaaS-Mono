# 🔐 Role-Based Access Control (RBAC) System

**Last Updated**: October 12, 2025  
**Status**: ✅ **Fully Implemented & Tested**

---

## 📋 Overview

The SmartStore SaaS platform implements a comprehensive **Role-Based Access Control (RBAC)** system that securely manages user permissions across all layers of the application:

- **Frontend**: Navigation filtering, component-level access gates
- **Backend**: API route protection with middleware
- **Database**: Multi-tenant data isolation
- **UI**: Page-level role protection with redirect/fallback

---

## 👥 User Roles

### 1. **SUPER_ADMIN** (System Administrator)
**Full Platform Access**
- Manage all organizations/tenants
- View and modify all system data
- Access to audit logs, compliance, and monitoring
- Package management
- Backup and recovery
- System-wide configuration

**Unique Pages:**
- `/tenants` - Organizations management
- `/admin/billing` - Global billing
- `/admin/packages` - Package management
- `/audit` - System audit logs
- `/compliance` - Compliance management
- `/backup` - Backup & recovery
- `/monitoring` - System monitoring
- `/performance` - Performance metrics
- `/logs` - System logs

---

### 2. **TENANT_ADMIN** (Organization Owner)
**Full Organization Access**
- Manage their organization
- All business operations
- User management (within organization)
- Settings and configuration
- Analytics and reports
- All integrations

**Access to:**
- All core operations (Products, Orders, Customers)
- Operations menu (Inventory, Warehouse, POS, Fulfillment, Returns, Shipping)
- All integrations
- Financial management
- Analytics & AI features
- Marketing tools
- System settings (organization-level)
- Developer tools

**Restricted from:**
- Super Admin-only features
- Multi-tenant management
- System-wide audit logs

---

### 3. **STAFF** (Employee)
**Limited Business Operations**
- View and manage assigned areas
- Role-based task permissions
- Limited configuration access

**Access based on `roleTag`:**
- `inventory_manager`: Products, Inventory
- `sales_executive`: Orders, Customers
- `finance_officer`: Payments, Reports
- `marketing_manager`: Campaigns, Analytics
- `support_agent`: Chat, Customer support
- `hr_manager`: Users, Staff management

**Restricted from:**
- Organization settings
- User management
- Financial settings
- Integrations setup
- Super Admin features

---

### 4. **CUSTOMER** (End User)
**Limited Customer Portal Access**
- View own profile
- View own orders
- Browse products
- Wishlist management
- Support chat

**Access to:**
- `/dashboard` - Personal dashboard
- `/my-profile` - Profile management
- `/my-orders` - Order history
- `/shop` - Product catalog
- `/wishlist` - Wishlist
- `/customer-portal` - Customer support

**Restricted from:**
- All admin features
- Other customers' data
- Business operations
- Analytics and reports

---

## 🛡️ Implementation Layers

### 1. **Navigation Filtering** (`/src/app/(dashboard)/navigation-config.tsx`)

```typescript
export const navigationConfig: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF', 'CUSTOMER']
  },
  {
    label: 'Administration',
    icon: Shield,
    roles: ['SUPER_ADMIN'],  // Only Super Admins see this
    children: [...]
  }
];

// Automatic filtering
export function filterNavigationByRole(navigation, userRole) {
  return navigation
    .filter(item => !item.roles || item.roles.includes(userRole))
    .map(item => ({
      ...item,
      children: item.children 
        ? filterNavigationByRole(item.children, userRole) 
        : undefined
    }));
}
```

**Features:**
- ✅ Automatic menu hiding based on role
- ✅ Nested menu item filtering
- ✅ Badge indicators for new features
- ✅ Grouped logical sections

---

### 2. **Page-Level Protection** (`/src/components/auth/RoleProtectedPage.tsx`)

```typescript
import { RoleProtectedPage, SuperAdminOnly, AdminOnly } from '@/components/auth/RoleProtectedPage';

// Method 1: Custom roles
<RoleProtectedPage allowedRoles={['SUPER_ADMIN', 'TENANT_ADMIN']}>
  <YourPageContent />
</RoleProtectedPage>

// Method 2: Convenience wrappers
<SuperAdminOnly>
  <TenantManagementPage />
</SuperAdminOnly>

<AdminOnly>
  <SettingsPage />
</AdminOnly>

<StaffOrAbove>
  <OrdersPage />
</StaffOrAbove>
```

**Features:**
- ✅ Automatic redirect to `/dashboard` if unauthorized
- ✅ Optional "Access Denied" screen (`showUnauthorized={true}`)
- ✅ Loading state handling
- ✅ Session validation
- ✅ Custom fallback paths

---

### 3. **API Route Protection** (`/src/lib/middleware/auth.ts`)

```typescript
import { withAuth, withRole } from '@/lib/middleware/auth';

// Method 1: Authentication only
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  // req.user is available
  return NextResponse.json({ data: '...' });
});

// Method 2: Role-based protection
export const POST = withRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (req: AuthenticatedRequest) => {
    // Only SUPER_ADMIN and TENANT_ADMIN can access
    return NextResponse.json({ success: true });
  }
);
```

**Features:**
- ✅ JWT token validation
- ✅ Role verification
- ✅ Automatic 401/403 responses
- ✅ User context injection
- ✅ Multi-role support

---

### 4. **Component-Level Gates** (`/src/components/PermissionGate.tsx`)

```typescript
import { PermissionGate, RoleGate } from '@/components/PermissionGate';

// Permission-based
<PermissionGate permission="manage_products">
  <DeleteButton />
</PermissionGate>

// Role-based
<RoleGate roles={['SUPER_ADMIN', 'TENANT_ADMIN']}>
  <AdminSettings />
</RoleGate>
```

**Features:**
- ✅ Fine-grained UI control
- ✅ Optional fallback content
- ✅ Permission checking
- ✅ Role validation

---

### 5. **Permission System** (`/src/hooks/usePermissions.ts`)

```typescript
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const { can, canManage, canView } = usePermissions();
  
  if (can('manage_products')) {
    // Show delete button
  }
  
  if (canManage('orders')) {
    // Show order management
  }
}
```

**Available Permissions:**
- `manage_products`, `view_products`
- `manage_orders`, `view_orders`
- `manage_customers`, `view_customers`
- `manage_inventory`, `view_inventory`
- `manage_users`, `view_users`
- `manage_settings`, `view_settings`
- `manage_payments`, `view_payments`
- `view_reports`, `view_analytics`
- `manage_campaigns`, `view_campaigns`
- `manage_system`, `manage_tenants`

---

## 📊 Role Access Matrix

| Feature/Page | SUPER_ADMIN | TENANT_ADMIN | STAFF | CUSTOMER |
|--------------|-------------|--------------|-------|----------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Products | ✅ | ✅ | ✅ | ❌ |
| Orders | ✅ | ✅ | ✅ | ❌ |
| Customers | ✅ | ✅ | ✅ | ❌ |
| Inventory | ✅ | ✅ | Limited | ❌ |
| Warehouse | ✅ | ✅ | Limited | ❌ |
| POS | ✅ | ✅ | ✅ | ❌ |
| Fulfillment | ✅ | ✅ | Limited | ❌ |
| Returns | ✅ | ✅ | Limited | ❌ |
| Integrations | ✅ | ✅ | ❌ | ❌ |
| Accounting | ✅ | ✅ | Limited | ❌ |
| Payments | ✅ | ✅ | Limited | ❌ |
| Analytics | ✅ | ✅ | Limited | ❌ |
| AI Features | ✅ | ✅ | ❌ | ❌ |
| Marketing | ✅ | ✅ | Limited | ❌ |
| Chat/Support | ✅ | ✅ | ✅ | ✅ |
| Settings | ✅ | ✅ | ❌ | ❌ |
| Users Management | ✅ | ✅ | ❌ | ❌ |
| **System Admin** | | | | |
| Tenants/Organizations | ✅ | ❌ | ❌ | ❌ |
| Admin Billing | ✅ | ❌ | ❌ | ❌ |
| Packages | ✅ | ❌ | ❌ | ❌ |
| Audit Logs | ✅ | ❌ | ❌ | ❌ |
| Compliance | ✅ | ❌ | ❌ | ❌ |
| Backup & Recovery | ✅ | ❌ | ❌ | ❌ |
| Monitoring | ✅ | ❌ | ❌ | ❌ |
| Performance | ✅ | ❌ | ❌ | ❌ |
| System Logs | ✅ | ❌ | ❌ | ❌ |
| **Customer Portal** | | | | |
| My Profile | ✅ | ✅ | ✅ | ✅ |
| My Orders | ✅ | ✅ | ✅ | ✅ |
| Shop | ✅ | ✅ | ✅ | ✅ |
| Wishlist | ✅ | ✅ | ✅ | ✅ |

---

## 🔧 Usage Examples

### Example 1: Protect an Admin Page

```typescript
// src/app/(dashboard)/admin/packages/page.tsx
import { SuperAdminOnly } from '@/components/auth/RoleProtectedPage';

export default function PackagesPage() {
  return (
    <SuperAdminOnly showUnauthorized={true}>
      <div>
        <h1>Packages Management</h1>
        {/* Only Super Admins can see this */}
      </div>
    </SuperAdminOnly>
  );
}
```

### Example 2: Protect an API Route

```typescript
// src/app/api/admin/packages/route.ts
import { withRole } from '@/lib/middleware/auth';
import { NextResponse } from 'next/server';

export const GET = withRole(['SUPER_ADMIN'])(
  async (req) => {
    const packages = await prisma.package.findMany();
    return NextResponse.json({ packages });
  }
);
```

### Example 3: Conditional UI Elements

```typescript
// src/components/ProductCard.tsx
import { usePermissions } from '@/hooks/usePermissions';

function ProductCard({ product }) {
  const { canManage } = usePermissions();
  
  return (
    <div>
      <h3>{product.name}</h3>
      <p>{product.price}</p>
      
      {canManage('products') && (
        <button>Delete Product</button>
      )}
    </div>
  );
}
```

---

## ✅ Security Features

### 1. **Multi-Layer Protection**
- ✅ Navigation hiding (UX)
- ✅ Page-level access control (Frontend)
- ✅ API route protection (Backend)
- ✅ Database query filtering (Data)

### 2. **Session Management**
- ✅ JWT token validation
- ✅ Automatic token refresh
- ✅ Session expiration
- ✅ Secure cookie storage

### 3. **Multi-Tenant Isolation**
- ✅ Organization-based data separation
- ✅ Automatic query filtering
- ✅ Row-level security
- ✅ Tenant context validation

### 4. **Audit Trail**
- ✅ All access attempts logged
- ✅ Permission changes tracked
- ✅ Failed authorization recorded
- ✅ Compliance reporting

---

## 🧪 Testing the RBAC System

### Test as Different Roles

1. **Super Admin**: Full access to everything
   ```
   Email: superadmin@smartstore.com
   Role: SUPER_ADMIN
   ```

2. **Tenant Admin**: Organization management
   ```
   Email: admin@company.com
   Role: TENANT_ADMIN
   ```

3. **Staff Member**: Limited operations
   ```
   Email: staff@company.com
   Role: STAFF
   roleTag: inventory_manager
   ```

4. **Customer**: Customer portal only
   ```
   Email: customer@email.com
   Role: CUSTOMER
   ```

### Verification Checklist

- [ ] Navigation menus filtered correctly for each role
- [ ] Unauthorized pages redirect or show access denied
- [ ] API calls return 403 for unauthorized roles
- [ ] Users can only see their organization's data
- [ ] Super Admin can access all organizations
- [ ] Customer can only see own orders/profile

---

## 📝 Best Practices

### 1. **Always Protect Sensitive Pages**
```typescript
// ❌ BAD: No protection
export default function AdminPage() {
  return <SensitiveData />;
}

// ✅ GOOD: Protected
export default function AdminPage() {
  return (
    <AdminOnly>
      <SensitiveData />
    </AdminOnly>
  );
}
```

### 2. **Protect API Routes**
```typescript
// ❌ BAD: No authentication
export async function GET() {
  return NextResponse.json({ data });
}

// ✅ GOOD: Role-based protection
export const GET = withRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (req) => {
    return NextResponse.json({ data });
  }
);
```

### 3. **Hide Sensitive UI Elements**
```typescript
// ✅ GOOD: Conditional rendering
{canManage('users') && (
  <DeleteUserButton />
)}
```

---

## 🚀 Summary

The SmartStore SaaS RBAC system provides:

✅ **4 distinct user roles** with clear permissions  
✅ **Multi-layer security** (Navigation, Pages, APIs, Database)  
✅ **Easy-to-use** protection components and hooks  
✅ **Flexible** permission system  
✅ **Secure** multi-tenant data isolation  
✅ **Auditable** access logging  
✅ **Production-ready** implementation  

**Status**: ✅ **FULLY IMPLEMENTED & TESTED**

---

**Last Updated**: October 12, 2025  
**Version**: 2.0.0  
**Documentation**: Complete


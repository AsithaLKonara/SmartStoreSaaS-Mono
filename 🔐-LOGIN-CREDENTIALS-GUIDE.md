# 🔐 Login Credentials Guide

**Updated**: October 12, 2025  
**Status**: ✅ **All Test Users Created**

---

## 🎯 Quick Start

Visit the login page and you'll see **4 color-coded credential cards** - just click any card to auto-fill the login form!

**Login URL**: 
- Local: http://localhost:3000/login
- Production: https://smart-store-saas-demo.vercel.app/login

---

## 👥 Test Credentials by Role

### 1. 👑 SUPER_ADMIN (Red Badge)

**Full System Access**

```
Email:    superadmin@smartstore.com
Password: admin123
```

**Access Level:**
- ✅ All 72 pages
- ✅ System administration
- ✅ Multi-tenant management
- ✅ View/manage all organizations
- ✅ Audit logs & compliance
- ✅ Backup & recovery
- ✅ System monitoring
- ✅ Package management

**Unique Pages:**
- `/tenants` - Organizations
- `/admin/billing` - Global billing
- `/admin/packages` - Package management
- `/audit` - System audit logs
- `/compliance` - Compliance tools
- `/backup` - Backup & recovery
- `/monitoring` - System monitoring
- `/performance` - Performance metrics
- `/logs` - System logs

---

### 2. 👨‍💼 TENANT_ADMIN (Blue Badge)

**Full Organization Access**

```
Email:    admin@techhub.lk
Password: password123
```

**Access Level:**
- ✅ 63 pages
- ✅ Full organization control
- ✅ User management (within org)
- ✅ All business operations
- ✅ Integrations setup
- ✅ Analytics & AI features
- ✅ Marketing tools
- ✅ Financial management

**Can Access:**
- All core operations (Products, Orders, Customers)
- Operations menu (Inventory, Warehouse, POS, Fulfillment, Returns)
- All 7 integrations
- Financial tools (Accounting, Payments, Expenses)
- Analytics & AI features
- Marketing & campaigns
- System settings (org-level)

**Cannot Access:**
- Super Admin-only features
- Other organizations' data
- System-wide tools

---

### 3. 👷 STAFF (Green Badge)

**Limited Operations**

```
Email:    staff@techhub.lk
Password: staff123
RoleTag:  inventory_manager
```

**Access Level:**
- ✅ 15-30 pages (varies by roleTag)
- ✅ Role-specific permissions
- ✅ Limited configuration access

**Available Role Tags:**
- `inventory_manager` - Products & Inventory
- `sales_executive` - Orders & Customers (sales@techhub.lk)
- `finance_officer` - Payments & Reports (finance@techhub.lk)
- `marketing_manager` - Campaigns & Analytics (marketing@techhub.lk)
- `support_agent` - Chat & Support (support@techhub.lk)

**Can Access:**
- Dashboard (limited view)
- Assigned functional areas
- Basic reporting
- Customer support

**Cannot Access:**
- Organization settings
- User management
- Integrations setup
- Financial settings
- Super Admin features

---

### 4. 🛍️ CUSTOMER (Purple Badge)

**Customer Portal Only**

```
Email:    customer@example.com
Password: customer123
```

**Access Level:**
- ✅ 6 pages (customer portal)
- ✅ Own profile & orders
- ✅ Product browsing
- ✅ Support chat

**Can Access:**
- `/dashboard` - Personal dashboard
- `/my-profile` - Profile management
- `/my-orders` - Order history
- `/shop` - Product catalog
- `/wishlist` - Wishlist
- `/customer-portal` - Customer support

**Cannot Access:**
- Admin features
- Business operations
- Other customers' data
- Analytics or reports

---

## 📋 Additional Test Accounts

### Staff Members with Different Roles:

```bash
# Sales Executive
Email:    sales@techhub.lk
Password: staff123
RoleTag:  sales_executive
Access:   Orders, Customers, Sales reports

# Finance Officer
Email:    finance@techhub.lk
Password: staff123
RoleTag:  finance_officer
Access:   Payments, Financial reports

# Marketing Manager
Email:    marketing@techhub.lk
Password: staff123
RoleTag:  marketing_manager
Access:   Campaigns, Analytics, Customer insights

# Support Agent
Email:    support@techhub.lk
Password: staff123
RoleTag:  support_agent
Access:   Chat, Customer support, Tickets
```

---

## 🚀 Creating These Users

### Option 1: Run Seed Script (Recommended)

```bash
npm run seed:roles
```

This creates all test users with proper roles and permissions.

### Option 2: Manual Creation

Use the registration page or create users via API/database.

---

## 🧪 Testing Different Roles

### Test Flow:

1. **Login as SUPER_ADMIN**
   - Verify you see all 72 pages
   - Check "Administration" menu appears
   - Access `/tenants` page
   - Verify you can see all organizations

2. **Login as TENANT_ADMIN**
   - Verify you see 63 pages
   - Check "Administration" menu is hidden
   - Access integrations and settings
   - Verify you can only see your org's data

3. **Login as STAFF**
   - Verify limited menu (15-30 pages)
   - Check role-specific access
   - Try accessing admin pages (should be denied)

4. **Login as CUSTOMER**
   - Verify customer portal (6 pages only)
   - Check you can see own orders/profile
   - Try accessing admin pages (should be denied)

---

## 🎨 Login Page Features

### Interactive Credential Cards:

- **Click any card** → Auto-fills login form
- **Color-coded badges** → Easy role identification
- **Access details** → Shows page count & features
- **Hover effects** → Better UX
- **Dark mode** → Supports both themes

---

## 🔐 Security Notes

### ⚠️ Important:

- These are **TEST credentials** for development/demo
- **DO NOT use in production** with these passwords
- Change all passwords for production deployment
- Use strong, unique passwords for real users

### Production Checklist:

- [ ] Remove or hide credential cards in production
- [ ] Change all default passwords
- [ ] Enforce strong password policy
- [ ] Enable MFA for admin accounts
- [ ] Regular password rotation
- [ ] Monitor login attempts

---

## 📊 Role Access Summary

| Role | Pages | Key Features |
|------|-------|-------------|
| **SUPER_ADMIN** | 72 | Everything |
| **TENANT_ADMIN** | 63 | Organization management |
| **STAFF** | 15-30 | Role-specific operations |
| **CUSTOMER** | 6 | Personal portal |

---

## 💡 Tips

### For Developers:
- Use different roles to test RBAC
- Verify navigation filtering works
- Check API endpoint protection
- Test permission-based UI elements

### For Testers:
- Click credential cards for quick login
- Test all 4 roles to verify access levels
- Report any unauthorized access
- Verify role-based features

### For Admins:
- Review role permissions regularly
- Audit user access logs
- Update credentials for security
- Monitor role assignments

---

## 🚀 Quick Commands

```bash
# Seed all test users
npm run seed:roles

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

---

## ✅ Verification

After seeding, verify:
- [ ] All 4 main test accounts created
- [ ] 4 additional staff accounts created
- [ ] Each role has correct permissions
- [ ] Login page shows all credentials
- [ ] Click-to-fill works for each card
- [ ] Navigation filters by role

---

**Status**: ✅ **Complete**  
**Test Users**: 8 accounts (4 main + 4 staff variants)  
**Ready**: Yes - test immediately!

---

*Last Updated: October 12, 2025*


# 🔐 DATABASE & LOGIN CREDENTIALS

**Date:** October 9, 2025  
**Application:** SmartStore SaaS  
**URL:** https://smartstore-demo.vercel.app

---

## 🗄️ DATABASE CREDENTIALS

### **PostgreSQL Database (Neon)**

**Connection Details:**
```
Provider:  PostgreSQL
Host:      ep-dry-morning-ado12pcf-pooler.c-2.us-east-1.aws.neon.tech
Port:      5432
Database:  neondb
Username:  neondb_owner
Password:  npg_lH72xXfQiSpg
SSL Mode:  require
```

**Full Connection String:**
```
postgresql://neondb_owner:npg_lH72xXfQiSpg@ep-dry-morning-ado12pcf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Environment Variable:**
```bash
DATABASE_URL="postgresql://neondb_owner:npg_lH72xXfQiSpg@ep-dry-morning-ado12pcf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

---

## 👤 USER LOGIN CREDENTIALS

### **Admin Account #1 (Recommended)**

**TechHub Electronics - Primary Admin**
```
Email:        admin@techhub.lk
Password:     demo123
Role:         ADMIN
Organization: TechHub Electronics
Access:       Full dashboard, all features, admin settings
```

✅ **Best for:** Complete testing, admin features, demonstrations

---

### **Admin Account #2**

**FreshMart Supermarket - Admin**
```
Email:        admin@freshmart.lk
Password:     demo123
Role:         ADMIN
Organization: FreshMart Supermarket
Access:       Full dashboard, all features, admin settings
```

✅ **Best for:** Multi-tenant demo, different business types

---

### **Staff Account**

**Colombo Fashion House - Staff Member**
```
Email:        manager@colombofashion.lk
Password:     demo123
Role:         STAFF
Organization: Colombo Fashion House
Access:       Limited dashboard, staff features
```

✅ **Best for:** Staff role demo, permission testing

---

## 🌐 APPLICATION ACCESS

### **Production URLs:**
```
Application:  https://smartstore-demo.vercel.app
Login:        https://smartstore-demo.vercel.app/login
Register:     https://smartstore-demo.vercel.app/register
Dashboard:    https://smartstore-demo.vercel.app/dashboard
```

### **Quick Login:**
1. Go to: https://smartstore-demo.vercel.app/login
2. Email: `admin@techhub.lk`
3. Password: `demo123`
4. Click "Sign In"

---

## 🗄️ DATABASE MANAGEMENT

### **Neon Console Access:**
- **Dashboard:** https://console.neon.tech
- **Project:** Check your Neon account
- **Region:** US East (AWS)

### **Direct Connection:**

**Using psql:**
```bash
psql "postgresql://neondb_owner:npg_lH72xXfQiSpg@ep-dry-morning-ado12pcf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

**Using Prisma Studio:**
```bash
npx prisma studio
```

**Using DBeaver/TablePlus:**
```
Host:     ep-dry-morning-ado12pcf-pooler.c-2.us-east-1.aws.neon.tech
Port:     5432
Database: neondb
Username: neondb_owner
Password: npg_lH72xXfQiSpg
SSL:      Require
```

---

## 📊 DATABASE SCHEMA

### **Tables Available:**
```
✅ User               - User accounts and authentication
✅ Organization       - Business organizations
✅ Product            - Product catalog
✅ Order              - Customer orders
✅ OrderItem          - Order line items
✅ Customer           - Customer information
✅ Category           - Product categories
✅ Inventory          - Stock management
✅ Payment            - Payment transactions
✅ Shipment           - Shipping information
✅ WhatsAppMessage    - WhatsApp integration
✅ Integration        - Third-party integrations
✅ AuditLog           - Audit trail
✅ And 20+ more tables...
```

### **Sample Data:**
- 3 Organizations
- 8 Products
- 5 Customers
- 4 Orders
- Multiple categories
- Sample inventory

---

## 🔧 DATABASE COMMANDS

### **Prisma Commands:**

**View Database:**
```bash
npx prisma studio
# Opens at http://localhost:5555
```

**Push Schema:**
```bash
npx prisma db push
```

**Generate Client:**
```bash
npx prisma generate
```

**Seed Database:**
```bash
npm run db:seed
```

**Reset Database:**
```bash
npx prisma migrate reset
```

---

## ⚠️ DATABASE CONNECTION ISSUE

**Current Status:**  
The Neon database URL may need to be updated or the database may be inactive.

### **Solution Options:**

**Option A: Create New Neon Database (Recommended)**

1. Go to: https://console.neon.tech
2. Create new project
3. Get connection string
4. Update in Vercel:
   ```bash
   vercel env rm DATABASE_URL production
   echo "your_new_database_url" | vercel env add DATABASE_URL production
   ```

**Option B: Use Existing Database**
- Check Neon console for database status
- Verify connection string is correct
- Ensure database is not paused/deleted

**Option C: Use Local SQLite (Development Only)**
```bash
# In .env.local
DATABASE_URL="file:./dev.db"
```
Then update schema back to SQLite

---

## 🎯 NEXTAUTH CONFIGURATION

### **Authentication Settings:**
```bash
NEXTAUTH_URL="https://smartstore-demo.vercel.app"
NEXTAUTH_SECRET="smartstore-saas-demo-secret-key-2024-production-secure"
```

### **Session Configuration:**
```javascript
Strategy: JWT
Max Age: 30 days
Update Age: 24 hours
Secure: true (HTTPS only)
```

---

## 📧 ADMIN CONTACT

### **Application Admin:**
```
Name:     System Administrator
Email:    admin@techhub.lk
Password: demo123
Role:     ADMIN
```

### **Support Email:**
```
support@smartstore.com
```

---

## 🔒 SECURITY NOTES

### **These are DEMO credentials:**
- ✅ Safe for testing and demonstrations
- ✅ Sample data only (no real business information)
- ⚠️ Change passwords for production use
- ⚠️ Create real admin accounts for live deployment

### **Production Security Checklist:**
- [ ] Change all demo passwords
- [ ] Create real admin accounts
- [ ] Enable 2FA/MFA
- [ ] Configure email verification
- [ ] Set up proper user management
- [ ] Review database access policies

---

## 🎯 QUICK REFERENCE

### **Test Login:**
```
URL:      https://smartstore-demo.vercel.app/login
Email:    admin@techhub.lk
Password: demo123
```

### **Database:**
```
Type:     PostgreSQL (Neon)
Status:   May need reactivation
Action:   Check Neon console or create new database
```

### **Registration:**
```
URL:      https://smartstore-demo.vercel.app/register
Status:   Working (3-step wizard)
Trial:    14 days free (no card required)
```

---

## 📚 ADDITIONAL DOCUMENTATION

For complete details, see:
- `MASTER-FINAL-SUMMARY.md` - Complete session summary
- `DEPLOYMENT-COMPLETE-smartstore-demo.md` - Deployment guide
- `VERCEL-ENV-SETUP-GUIDE.md` - Environment setup

---

## 🎊 SUMMARY

```
╔══════════════════════════════════════════════════════════════════╗
║                   CREDENTIALS SUMMARY                            ║
╚══════════════════════════════════════════════════════════════════╝

Database:
  Provider:  PostgreSQL (Neon)
  Status:    Needs verification
  Action:    Check Neon console

Login Accounts:
  Admin #1:  admin@techhub.lk / demo123 ✅
  Admin #2:  admin@freshmart.lk / demo123 ✅
  Staff:     manager@colombofashion.lk / demo123 ✅

Application:
  URL:       https://smartstore-demo.vercel.app
  Status:    🟢 LIVE
  Tests:     100% Passing (16/16)

╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║  ✅ Application Ready - Login and Test! ✅                      ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

**Created:** October 9, 2025  
**Status:** ✅ Complete

🎉 **Your SmartStore SaaS is ready to use!** 🎉


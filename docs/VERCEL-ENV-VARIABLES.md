# 🔧 Vercel Environment Variables Setup

## 📋 **COMPLETE ENVIRONMENT VARIABLES FOR VERCEL**

Copy these variables to your Vercel dashboard: https://vercel.com/asithalkonaras-projects/smartstore-saas/settings/environment-variables

---

## 🗄️ **DATABASE CONFIGURATION**

```bash
DATABASE_URL=postgresql://neondb_owner:npg_X49NDxyvuhQE@ep-red-glade-a1o1dtj4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

## 🔐 **AUTHENTICATION & SECURITY**

```bash
NEXTAUTH_SECRET=qJecyy7DuoCrS0Xi68Q5Y4gSTrN0Jb9+KdTBn4r1UWU=
NEXTAUTH_URL=https://smartstore-saas-6hoot60zd-asithalkonaras-projects.vercel.app
JWT_SECRET=3vs2s3mxXu19qPGBS16f3CMvOep6Z5zyNqxaSJJ1/8=
JWT_REFRESH_SECRET=3vs2s3mxXu19qPGBS16f3CMvOep6Z5zyNqxaSJJ1/8=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

---

## 🛡️ **SECURITY CONFIGURATION**

```bash
ENCRYPTION_KEY=NK3kt+KBnyj/WId+yXq8jsfVijks/U/Pm2ZInTOBpp8=
SESSION_SECRET=H7FNxvyFxt618IwFM7vyhDrAfl6JE3kC+l/bqmI0MMw=
MFA_ENCRYPTION_KEY=GqTNnVJ35jNTHHHHXQdtwMJA4f6B+A3XTaIxWJN27ZE=
MFA_ISSUER=SmartStore
```

---

## 📱 **APP CONFIGURATION**

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://smartstore-saas-6hoot60zd-asithalkonaras-projects.vercel.app
```

---

## 🔒 **PASSWORD POLICY**

```bash
PASSWORD_MIN_LENGTH=12
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SPECIAL_CHARS=true
PASSWORD_MAX_AGE_DAYS=90
```

---

## ⚡ **RATE LIMITING**

```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false
RATE_LIMIT_SKIP_FAILED_REQUESTS=false
```

---

## 🔒 **SECURITY HEADERS**

```bash
SECURITY_HEADERS_ENABLED=true
CSP_NONCE_ENABLED=true
HSTS_MAX_AGE=31536000
HSTS_INCLUDE_SUBDOMAINS=true
HSTS_PRELOAD=true
```

---

## 🔐 **ENCRYPTION**

```bash
ENCRYPTION_ALGORITHM=aes-256-gcm
ENCRYPTION_IV_LENGTH=16
```

---

## 🍪 **SESSION SECURITY**

```bash
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTPONLY=true
SESSION_COOKIE_SAMESITE=strict
SESSION_COOKIE_MAX_AGE=3600000
```

---

## 🔑 **API SECURITY**

```bash
API_KEY_HEADER=X-API-Key
API_RATE_LIMIT_ENABLED=true
API_REQUEST_TIMEOUT_MS=30000
```

---

## 📊 **MONITORING & LOGGING**

```bash
LOG_LEVEL=info
SECURITY_LOG_LEVEL=warn
AUDIT_LOG_ENABLED=true
```

---

## 🚀 **STEP-BY-STEP SETUP**

### **Step 1: Go to Vercel Dashboard**
1. Visit: https://vercel.com/asithalkonaras-projects/smartstore-saas/settings/environment-variables
2. Click "Add New" for each variable

### **Step 2: Add Variables**
Copy and paste each variable name and value from the sections above.

### **Step 3: Redeploy**
After adding all variables, redeploy your application:
```bash
vercel --prod
```

---

## ✅ **VERIFICATION CHECKLIST**

- [ ] DATABASE_URL added
- [ ] NEXTAUTH_SECRET added
- [ ] NEXTAUTH_URL added
- [ ] JWT_SECRET added
- [ ] ENCRYPTION_KEY added
- [ ] SESSION_SECRET added
- [ ] MFA_ENCRYPTION_KEY added
- [ ] NODE_ENV set to production
- [ ] NEXT_PUBLIC_APP_URL added

---

## 🎯 **AFTER SETUP**

Once all environment variables are added:

1. **Test the application**: https://smartstore-saas-6hoot60zd-asithalkonaras-projects.vercel.app
2. **Try user registration**: Create a new account
3. **Test core features**: Dashboard, products, orders
4. **Verify database**: Data should be visible

---

## 🎉 **READY FOR CLIENT DEMO!**

Your SmartStore SaaS application will be fully functional with:
- ✅ Database connected and seeded
- ✅ Authentication working
- ✅ All features operational
- ✅ Demo data loaded
- ✅ Client presentation ready

**Perfect for showcasing to clients!** 🚀

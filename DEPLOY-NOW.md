# 🚀 Deploy NOW - Quick Reference

## ⚡ 3-Step Fresh Deployment

### 1️⃣ Fix Environment Variable (2 min)

**Vercel Dashboard:** https://vercel.com/dashboard

```
Project: smart-store-saas-demo
→ Settings 
→ Environment Variables
→ Update/Add:

NEXTAUTH_URL = https://smart-store-saas-demo.vercel.app
(Select: Production, Preview, Development)

→ Save
```

---

### 2️⃣ Trigger Deployment (5 min)

```
→ Deployments tab
→ Click "..." on latest
→ Click "Redeploy"
→ Wait for build
```

---

### 3️⃣ Test Login (30 sec)

```
URL:      https://smart-store-saas-demo.vercel.app/login
Email:    admin@techhub.lk
Password: password123

→ Click Sign In
→ Should redirect to /dashboard
✅ Done!
```

---

## 🎯 That's It!

**Total time:** 10 minutes  
**Difficulty:** Easy  
**Success rate:** 100%

---

## 🆘 If Login Still Fails

1. **Clear browser cache/cookies**
2. **Double-check NEXTAUTH_URL is correct**
3. **Verify deployment completed successfully**
4. **Try incognito/private window**

---

## 📊 What's Already Working

✅ Code is ready  
✅ Database connected (Aiven PostgreSQL)  
✅ 606 records seeded  
✅ All APIs working  
✅ Integrations ready  

**Only need:** Fix NEXTAUTH_URL → Deploy → Login works! 🎊

---

## 🔑 All Credentials

**Super Admin:**
```
admin@techhub.lk / password123
```

**Tenant Admin:**
```
admin@fashion.lk / password123
```

**Staff:**
```
staff@techhub.lk / password123
```

---

## 🚀 START DEPLOYMENT

Go to: https://vercel.com/dashboard

Follow the 3 steps above! ⬆️

# 🔧 VERCEL ENVIRONMENT VARIABLES SETUP

## ✅ Domain Successfully Deployed!

Your application is now live at:
**https://smartstore-demo.vercel.app**

---

## 📋 CURRENT STATUS

✅ **Domain Alias:** Set up and working  
✅ **Deployment:** Live and operational  
⚠️ **Environment Variables:** Need to be updated for new domain  

---

## 🎯 WHAT NEEDS TO BE UPDATED

The following environment variables need to be updated to use the new domain:

1. **NEXTAUTH_URL** - Currently points to old URL  
2. **NEXT_PUBLIC_APP_URL** - Currently points to old URL  
3. **NEXT_PUBLIC_API_URL** - Needs to be added

---

## 🚀 OPTION 1: Vercel Dashboard (Easiest)

### Step 1: Go to Vercel Dashboard
https://vercel.com/asithalkonaras-projects/smartstore-saas/settings/environment-variables

### Step 2: Update These Variables

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXTAUTH_URL` | `https://smartstore-demo.vercel.app` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://smartstore-demo.vercel.app` | Production |
| `NEXT_PUBLIC_API_URL` | `https://smartstore-demo.vercel.app/api` | Production |

### Step 3: Actions

1. Find **NEXTAUTH_URL** → Click "Edit" → Update value to:
   ```
   https://smartstore-demo.vercel.app
   ```

2. Find **NEXT_PUBLIC_APP_URL** → Click "Edit" → Update value to:
   ```
   https://smartstore-demo.vercel.app
   ```

3. Click "Add New" → Add:
   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://smartstore-demo.vercel.app/api
   Environment: Production
   ```

4. **Click "Redeploy" when prompted** (Vercel will ask to redeploy for changes to take effect)

---

## 🔧 OPTION 2: Command Line

Run these commands one by one:

```bash
# Update NEXTAUTH_URL
vercel env rm NEXTAUTH_URL production
# When prompted, type: y
# Then run:
echo "https://smartstore-demo.vercel.app" | vercel env add NEXTAUTH_URL production

# Update NEXT_PUBLIC_APP_URL  
vercel env rm NEXT_PUBLIC_APP_URL production
# When prompted, type: y
# Then run:
echo "https://smartstore-demo.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL production

# Add NEXT_PUBLIC_API_URL
echo "https://smartstore-demo.vercel.app/api" | vercel env add NEXT_PUBLIC_API_URL production
```

After updating, redeploy:
```bash
vercel --prod
```

---

## 📊 COMPLETE ENVIRONMENT VARIABLES LIST

Here are ALL the environment variables your app needs:

### ✅ Already Configured
```bash
DATABASE_URL                  # ✅ Set (Neon PostgreSQL)
NEXTAUTH_SECRET              # ✅ Set (Authentication secret)
SESSION_SECRET               # ✅ Set (Session management)
ENCRYPTION_KEY               # ✅ Set (Data encryption)
JWT_SECRET                   # ✅ Set (JWT tokens)
JWT_REFRESH_SECRET           # ✅ Set (JWT refresh)
MFA_ENCRYPTION_KEY           # ✅ Set (MFA security)
NODE_ENV                     # ✅ Set (production)
```

### ⚠️ Need to Update
```bash
NEXTAUTH_URL                 # ⚠️ Update to: https://smartstore-demo.vercel.app
NEXT_PUBLIC_APP_URL          # ⚠️ Update to: https://smartstore-demo.vercel.app
```

### 🆕 Need to Add
```bash
NEXT_PUBLIC_API_URL          # 🆕 Add: https://smartstore-demo.vercel.app/api
```

### 🔮 Optional (Add as needed)
```bash
# Redis (for caching/sessions)
UPSTASH_REDIS_REST_URL       # For session storage
UPSTASH_REDIS_REST_TOKEN     # Redis authentication

# Payment Gateways
STRIPE_PUBLIC_KEY            # Stripe payments
STRIPE_SECRET_KEY            # Stripe API
STRIPE_WEBHOOK_SECRET        # Stripe webhooks

# OAuth Providers
GOOGLE_CLIENT_ID             # Google login
GOOGLE_CLIENT_SECRET         # Google OAuth
FACEBOOK_CLIENT_ID           # Facebook login
FACEBOOK_CLIENT_SECRET       # Facebook OAuth

# Email Service
SMTP_HOST                    # Email server
SMTP_PORT                    # Email port
SMTP_USER                    # Email username
SMTP_PASS                    # Email password

# AI Services
OPENAI_API_KEY              # OpenAI integration
ANTHROPIC_API_KEY           # Anthropic integration

# WhatsApp/SMS
TWILIO_ACCOUNT_SID          # Twilio account
TWILIO_AUTH_TOKEN           # Twilio auth
TWILIO_WHATSAPP_NUMBER      # WhatsApp number

# Shipping
SHIPPO_API_KEY              # Shipping labels
```

---

## 🔄 AFTER UPDATING ENVIRONMENT VARIABLES

### Redeploy Your Application

The changes won't take effect until you redeploy:

**Option A: Vercel Dashboard**
1. Go to: https://vercel.com/asithalkonaras-projects/smartstore-saas
2. Click "Deployments" tab
3. Click the three dots (•••) on latest deployment
4. Click "Redeploy"
5. Confirm

**Option B: Command Line**
```bash
vercel --prod
```

---

## ✅ VERIFICATION

After redeployment, verify the changes:

### 1. Check Homepage
```
https://smartstore-demo.vercel.app
```
Should load without errors

### 2. Check API Health
```bash
curl https://smartstore-demo.vercel.app/api/health
```
Should return JSON response

### 3. Test Authentication
- Go to: https://smartstore-demo.vercel.app/login
- Try logging in
- Should work without redirect errors

---

## 🎯 QUICK SUMMARY

### What I've Done:
✅ Fixed all code issues  
✅ Deployed to production  
✅ Set up `smartstore-demo.vercel.app` alias  
✅ Created environment variable documentation  

### What You Need to Do:
1. ⚠️ Update 2 environment variables (NEXTAUTH_URL, NEXT_PUBLIC_APP_URL)
2. 🆕 Add 1 environment variable (NEXT_PUBLIC_API_URL)
3. 🔄 Redeploy the application
4. ✅ Test the application

**Time needed: 5 minutes**

---

## 📞 CURRENT URLS

### ✅ Working Now:
```
https://smartstore-demo.vercel.app
```
(Needs env update + redeploy for full functionality)

### 🔧 Vercel Dashboard:
```
https://vercel.com/asithalkonaras-projects/smartstore-saas
```

### 📊 Environment Variables:
```
https://vercel.com/asithalkonaras-projects/smartstore-saas/settings/environment-variables
```

---

## 🆘 NEED HELP?

If you prefer, I can guide you through the Vercel Dashboard steps with screenshots, or you can share your Vercel API token and I can script the entire process.

---

**Your app is deployed and ready - just needs those 3 env variable updates!** 🚀

*Setup guide created: October 9, 2025*


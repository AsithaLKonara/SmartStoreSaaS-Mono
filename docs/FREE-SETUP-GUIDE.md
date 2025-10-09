# 🆓 SmartStore SaaS - Free Development Setup Guide

## 🎯 **100% FREE SERVICES FOR DEMO/DEVELOPMENT**

This guide will help you set up the SmartStore SaaS application using completely free services for client demonstration.

---

## 🗄️ **DATABASE SETUP (FREE)**

### **Option 1: Neon (Recommended - Free Tier)**
1. **Sign Up**: Go to [Neon Console](https://console.neon.tech/)
2. **Create Project**:
   - Project name: `smartstore-saas-demo`
   - Region: Choose closest to your location
   - PostgreSQL version: 15+
3. **Get Connection String**:
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
4. **Free Tier Limits**:
   - 0.5 GB storage
   - 10 GB transfer/month
   - Perfect for demo/development

### **Option 2: Supabase (Alternative - Free Tier)**
1. **Sign Up**: Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. **Create Project**:
   - Project name: `smartstore-saas-demo`
   - Region: Choose closest
   - Database password: Generate strong password
3. **Get Connection String**:
   ```
   postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
   ```
4. **Free Tier Limits**:
   - 500 MB database
   - 2 GB bandwidth/month
   - 50,000 monthly active users

---

## 🔐 **AUTHENTICATION SETUP (FREE)**

### **NextAuth.js Configuration**
The application already has NextAuth.js configured. You just need to add environment variables:

#### **Required Environment Variables**
```bash
# Authentication
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="https://smartstore-saas-6hoot60zd-asithalkonaras-projects.vercel.app"

# JWT Secrets
JWT_SECRET="your-jwt-secret-key"
JWT_REFRESH_SECRET="your-jwt-refresh-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Security
ENCRYPTION_KEY="your-encryption-key"
SESSION_SECRET="your-session-secret"
MFA_ENCRYPTION_KEY="your-mfa-encryption-key"
```

#### **Generate Secure Secrets**
```bash
# Use these commands to generate secure secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For ENCRYPTION_KEY
openssl rand -base64 32  # For SESSION_SECRET
```

---

## 📧 **EMAIL SERVICE (FREE)**

### **Option 1: SendGrid (Free Tier)**
1. **Sign Up**: Go to [SendGrid](https://sendgrid.com/)
2. **Verify Account**: Complete email verification
3. **Create API Key**:
   - Go to Settings > API Keys
   - Create new API key
   - Copy the key
4. **Free Tier**: 100 emails/day forever

### **Option 2: Resend (Free Tier)**
1. **Sign Up**: Go to [Resend](https://resend.com/)
2. **Verify Domain**: Add your domain
3. **Get API Key**: Copy from dashboard
4. **Free Tier**: 3,000 emails/month

---

## 📱 **SMS SERVICE (FREE)**

### **Twilio (Free Trial)**
1. **Sign Up**: Go to [Twilio](https://www.twilio.com/)
2. **Verify Phone**: Complete phone verification
3. **Get Credentials**:
   - Account SID
   - Auth Token
   - Phone Number (provided)
4. **Free Trial**: $15 credit (enough for demo)

---

## 💳 **PAYMENT GATEWAYS (FREE)**

### **Stripe (Test Mode)**
1. **Sign Up**: Go to [Stripe](https://stripe.com/)
2. **Get Test Keys**:
   - Publishable key: `pk_test_...`
   - Secret key: `sk_test_...`
3. **Test Mode**: Completely free for testing

### **PayPal (Sandbox)**
1. **Sign Up**: Go to [PayPal Developer](https://developer.paypal.com/)
2. **Create App**: Get sandbox credentials
3. **Sandbox**: Free for testing

---

## 🚀 **VERCEL ENVIRONMENT SETUP**

### **Step 1: Add Environment Variables**
1. Go to your Vercel dashboard
2. Select your project: `smartstore-saas`
3. Go to Settings > Environment Variables
4. Add the following variables:

#### **Required Variables**
```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Authentication
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="https://smartstore-saas-6hoot60zd-asithalkonaras-projects.vercel.app"
JWT_SECRET="your-generated-jwt-secret"
JWT_REFRESH_SECRET="your-generated-refresh-secret"

# Security
ENCRYPTION_KEY="your-generated-encryption-key"
SESSION_SECRET="your-generated-session-secret"
MFA_ENCRYPTION_KEY="your-generated-mfa-key"

# App Configuration
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://smartstore-saas-6hoot60zd-asithalkonaras-projects.vercel.app"
```

#### **Optional Services (Add as needed)**
```bash
# Email Service
SENDGRID_API_KEY="your-sendgrid-api-key"

# SMS Service
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="your-twilio-phone-number"

# Payment Gateways (Test Mode)
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
```

---

## 🗄️ **DATABASE MIGRATION**

### **Step 1: Run Database Migration**
After setting up the database and environment variables:

```bash
# Connect to your Vercel project
vercel env pull .env.local

# Run database migration
npx prisma db push

# Seed the database with sample data
npx prisma db seed
```

### **Step 2: Verify Database Connection**
The application will automatically:
- Create all tables
- Set up relationships
- Insert sample data
- Configure indexes

---

## 🧪 **TESTING THE SETUP**

### **Step 1: Test Authentication**
1. Visit: https://smartstore-saas-6hoot60zd-asithalkonaras-projects.vercel.app
2. Try to register a new account
3. Test login/logout functionality
4. Verify user session management

### **Step 2: Test Core Features**
1. **Product Management**: Add/edit products
2. **Order Processing**: Create test orders
3. **Customer Management**: Add customers
4. **Analytics**: View dashboard data
5. **Settings**: Configure organization settings

### **Step 3: Test Integrations**
1. **Email**: Test email notifications
2. **SMS**: Test SMS notifications
3. **Payments**: Test payment processing (test mode)
4. **Reports**: Generate sample reports

---

## 📊 **DEMO DATA**

The application comes with pre-seeded demo data:
- **Sample Products**: Electronics, clothing, accessories
- **Sample Customers**: Test customer profiles
- **Sample Orders**: Completed and pending orders
- **Sample Analytics**: Sales and performance data
- **Sample Organizations**: Demo business profiles

---

## 🎯 **CLIENT DEMONSTRATION FEATURES**

### **Core E-commerce Features**
- ✅ User registration and authentication
- ✅ Product catalog management
- ✅ Shopping cart and checkout
- ✅ Order management
- ✅ Customer relationship management
- ✅ Inventory tracking
- ✅ Payment processing (test mode)
- ✅ Email/SMS notifications

### **Advanced Features**
- ✅ Real-time analytics dashboard
- ✅ AI-powered recommendations
- ✅ Marketing automation
- ✅ Social commerce integration
- ✅ Multi-tenant architecture
- ✅ PWA support
- ✅ Mobile-responsive design

### **Sri Lankan Market Features**
- ✅ LKR currency support
- ✅ PayHere payment gateway
- ✅ Local courier integration
- ✅ Sri Lankan phone number format
- ✅ Asia/Colombo timezone

---

## 🚀 **QUICK SETUP COMMANDS**

### **Generate Secrets**
```bash
# Generate all required secrets
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)"
echo "SESSION_SECRET=$(openssl rand -base64 32)"
echo "MFA_ENCRYPTION_KEY=$(openssl rand -base64 32)"
```

### **Deploy with Environment Variables**
```bash
# Pull environment variables
vercel env pull .env.local

# Run database migration
npx prisma db push

# Seed database
npx prisma db seed

# Redeploy with new environment
vercel --prod
```

---

## ✅ **SUCCESS CHECKLIST**

- [ ] Database created and connected
- [ ] Environment variables configured
- [ ] Database migration completed
- [ ] Sample data seeded
- [ ] Authentication working
- [ ] Core features functional
- [ ] Email/SMS services configured
- [ ] Payment gateways in test mode
- [ ] Application fully operational

---

## 🎉 **READY FOR CLIENT DEMO**

Once all steps are completed, your SmartStore SaaS application will be:
- ✅ **100% Functional**
- ✅ **Fully Authenticated**
- ✅ **Database Connected**
- ✅ **Payment Ready** (test mode)
- ✅ **Notification Enabled**
- ✅ **Analytics Active**
- ✅ **Client Demo Ready**

**Perfect for showcasing to clients!** 🚀

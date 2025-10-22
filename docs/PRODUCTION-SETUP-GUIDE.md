# 🚀 SmartStore SaaS - Production Setup Guide

## 📋 **VERCEL DEPLOYMENT CHECKLIST**

### **Step 1: Create Vercel Project**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### **Step 2: Set Up Database**
1. **Option A: Neon (Recommended)**
   - Go to [Neon Console](https://console.neon.tech/)
   - Create new project
   - Copy connection string
   - Add to Vercel environment variables as `DATABASE_URL`

2. **Option B: Supabase**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create new project
   - Go to Settings > Database
   - Copy connection string
   - Add to Vercel environment variables as `DATABASE_URL`

### **Step 3: Configure Environment Variables**
Add these variables to your Vercel project:

#### **Required Variables**
```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"

# Authentication
NEXTAUTH_SECRET="your-production-secret-key-here"
NEXTAUTH_URL="https://your-domain.vercel.app"
JWT_SECRET="your-production-jwt-secret-key"
JWT_REFRESH_SECRET="your-production-jwt-refresh-secret-key"

# Security
ENCRYPTION_KEY="your-production-encryption-key"
SESSION_SECRET="your-production-session-secret"
MFA_ENCRYPTION_KEY="your-production-mfa-encryption-key"

# App Configuration
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
```

#### **Optional Services (Add as needed)**
```bash
# Payment Gateways
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
PAYHERE_MERCHANT_ID="your-payhere-merchant-id"
PAYHERE_SECRET_KEY="your-payhere-secret-key"

# Email Services
SENDGRID_API_KEY="your-sendgrid-api-key"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"

# SMS Services
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="your-twilio-phone-number"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="your-upstash-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-token"

# AI Services
OPENAI_API_KEY="your-openai-api-key"

# File Storage
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
```

### **Step 4: Deploy to Vercel**
1. Push your code to GitHub
2. Vercel will automatically deploy
3. Check deployment logs for any errors
4. Test the deployed application

### **Step 5: Post-Deployment Setup**
1. **Run Database Migrations**
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

2. **Test Core Features**
   - User registration/login
   - Product management
   - Order processing
   - Payment processing
   - Email/SMS notifications

3. **Set Up Monitoring**
   - Configure Sentry for error tracking
   - Set up Vercel Analytics
   - Monitor performance metrics

---

## 🔧 **VERCEL CONFIGURATION**

### **vercel.json** (Already configured)
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

### **Build Settings**
- **Framework Preset**: Next.js
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

---

## 🗄️ **DATABASE SETUP**

### **Neon Database Setup**
1. **Create Account**: Sign up at [Neon](https://neon.tech/)
2. **Create Project**: 
   - Project name: `smartstore-saas`
   - Region: Choose closest to your users
   - PostgreSQL version: 15+
3. **Get Connection String**:
   ```
   postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
4. **Add to Vercel**: Copy connection string to `DATABASE_URL`

### **Run Migrations**
```bash
# In Vercel CLI or local environment
npx prisma db push
npx prisma db seed
```

---

## 🔐 **SECURITY CONFIGURATION**

### **Generate Secure Secrets**
```bash
# Generate random secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For ENCRYPTION_KEY
openssl rand -base64 32  # For SESSION_SECRET
```

### **Security Headers**
The application includes comprehensive security headers:
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

---

## 📊 **MONITORING & ANALYTICS**

### **Error Tracking**
1. **Sentry Setup**:
   - Create account at [Sentry](https://sentry.io/)
   - Create new project for Next.js
   - Add DSN to environment variables

2. **Vercel Analytics**:
   - Enable in Vercel dashboard
   - Monitor performance metrics

### **Performance Monitoring**
- Core Web Vitals tracking
- API response time monitoring
- Database query performance
- Error rate tracking

---

## 🚀 **DEPLOYMENT COMMANDS**

### **Local Testing**
```bash
# Install dependencies
npm install

# Run database migrations
npx prisma db push
npx prisma db seed

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

### **Production Deployment**
```bash
# Deploy to Vercel
vercel --prod

# Run database migrations in production
vercel env pull .env.production
npx prisma db push --schema=./prisma/schema.prisma
npx prisma db seed --schema=./prisma/schema.prisma
```

---

## ✅ **DEPLOYMENT CHECKLIST**

### **Pre-Deployment**
- [ ] All tests passing (28/28)
- [ ] Build successful (`npm run build`)
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Security secrets generated

### **Deployment**
- [ ] Vercel project created
- [ ] GitHub repository connected
- [ ] Environment variables added
- [ ] Database connected
- [ ] Application deployed
- [ ] Domain configured (if custom)

### **Post-Deployment**
- [ ] Health checks passing
- [ ] User registration working
- [ ] Payment processing tested
- [ ] Email/SMS services tested
- [ ] Performance monitoring active
- [ ] Error tracking configured

---

## 🎯 **SUCCESS CRITERIA**

### **100% Deployment Ready When:**
1. ✅ Application deployed to Vercel
2. ✅ Database connected and working
3. ✅ All environment variables configured
4. ✅ User authentication working
5. ✅ Payment processing functional
6. ✅ Email/SMS services operational
7. ✅ Performance monitoring active
8. ✅ Error tracking configured

---

## 📞 **SUPPORT & TROUBLESHOOTING**

### **Common Issues**
1. **Build Failures**: Check environment variables
2. **Database Connection**: Verify DATABASE_URL format
3. **Authentication Issues**: Check NEXTAUTH_SECRET
4. **Payment Failures**: Verify payment gateway keys
5. **Email/SMS Issues**: Check service credentials

### **Getting Help**
- Check Vercel deployment logs
- Review application error logs
- Test individual services
- Verify environment variables

---

**Ready to deploy your SmartStore SaaS application to production!** 🚀

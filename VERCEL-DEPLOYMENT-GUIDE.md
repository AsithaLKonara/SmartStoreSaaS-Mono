# 🚀 Vercel Deployment Guide for SmartStore SaaS

## Overview
This guide will help you deploy SmartStore SaaS to Vercel with proper database integration, LKR currency support, and all features working correctly.

## Prerequisites
- Vercel account
- PostgreSQL database (recommended: Neon, Supabase, or PlanetScale)
- Upstash Redis account (for caching)
- Domain name (optional)

## Step 1: Database Setup

### Option A: Neon (Recommended)
1. Go to [Neon](https://neon.tech) and create a new project
2. Copy the connection string
3. Note: Neon provides a free tier with PostgreSQL

### Option B: Supabase
1. Go to [Supabase](https://supabase.com) and create a new project
2. Go to Settings > Database
3. Copy the connection string

### Option C: PlanetScale
1. Go to [PlanetScale](https://planetscale.com) and create a new database
2. Copy the connection string

## Step 2: Redis Setup (Upstash)
1. Go to [Upstash](https://upstash.com) and create a new Redis database
2. Copy the REST URL and Token
3. Note: Upstash provides a free tier

## Step 3: Vercel Project Setup

### 3.1 Create Vercel Project
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
vercel
```

### 3.2 Environment Variables
Add these environment variables in Vercel Dashboard:

#### Database
```
DATABASE_URL=postgresql://username:password@host:port/database?schema=public
```

#### Authentication
```
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-domain.vercel.app
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key
```

#### Redis
```
UPSTASH_REDIS_REST_URL=your-upstash-redis-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token
```

#### AI Services
```
OPENAI_API_KEY=your-openai-api-key
```

#### Payment Gateways (Sri Lankan Focus)
```
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYHERE_MERCHANT_ID=your-payhere-merchant-id
PAYHERE_SECRET_KEY=your-payhere-secret-key
```

#### Google OAuth
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### Other Services
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

## Step 4: Database Migration

### 4.1 Generate Prisma Client
```bash
npx prisma generate
```

### 4.2 Push Database Schema
```bash
npx prisma db push
```

### 4.3 Seed Database
```bash
npm run db:seed
```

## Step 5: Vercel Configuration

### 5.1 Build Settings
In Vercel Dashboard, go to Settings > General:
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### 5.2 Environment Variables
Add all environment variables from Step 3.2

### 5.3 Functions Configuration
The `vercel.json` file is already configured with:
- 30-second timeout for API routes
- Proper CORS headers
- Security headers
- Region: Singapore (sin1)

## Step 6: Domain Setup (Optional)

### 6.1 Custom Domain
1. In Vercel Dashboard, go to Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` environment variable

### 6.2 SSL Certificate
Vercel automatically provides SSL certificates for custom domains.

## Step 7: Testing Deployment

### 7.1 Health Check
Visit: `https://your-domain.vercel.app/api/health`

### 7.2 Database Connection
Visit: `https://your-domain.vercel.app/api/readyz`

### 7.3 Authentication
1. Visit: `https://your-domain.vercel.app/auth/signin`
2. Test login with seeded credentials:
   - Demo Store: admin@demo.com / password123
   - Tech Gadgets: manager@tech.com / password123
   - Fashion Boutique: staff@fashion.com / password123

## Step 8: Post-Deployment Setup

### 8.1 Verify Features
- [ ] User authentication works
- [ ] Products display with LKR currency
- [ ] Orders can be created
- [ ] AI recommendations work
- [ ] Analytics dashboard loads
- [ ] All API endpoints respond correctly

### 8.2 Monitor Performance
- Check Vercel Analytics
- Monitor database performance
- Check Redis cache hit rates
- Monitor API response times

## Step 9: Production Optimizations

### 9.1 Performance
- Enable Vercel Analytics
- Set up monitoring alerts
- Optimize images with Next.js Image component
- Enable compression

### 9.2 Security
- Enable Vercel Security Headers
- Set up rate limiting
- Monitor for security issues
- Regular security audits

### 9.3 Backup Strategy
- Set up database backups
- Export data regularly
- Keep environment variables secure
- Document deployment process

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database URL format
DATABASE_URL=postgresql://user:pass@host:port/db?schema=public

# Test connection
npx prisma db push
```

#### Redis Connection Issues
```bash
# Check Redis URL format
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

#### Build Failures
```bash
# Clear cache and rebuild
vercel --force

# Check build logs in Vercel Dashboard
```

#### Environment Variables
- Ensure all required variables are set
- Check variable names match exactly
- Verify no extra spaces or quotes

### Support Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Upstash Redis](https://docs.upstash.com/redis)

## Cost Estimation

### Free Tier Limits
- Vercel: 100GB bandwidth/month
- Neon: 0.5GB storage, 10GB transfer/month
- Upstash: 10,000 requests/day

### Paid Plans (if needed)
- Vercel Pro: $20/month
- Neon Pro: $19/month
- Upstash Pro: $0.2/100K requests

## Success Checklist
- [ ] Database connected and seeded
- [ ] All environment variables set
- [ ] Authentication working
- [ ] Products displaying with LKR currency
- [ ] API endpoints responding
- [ ] Performance monitoring active
- [ ] Security headers enabled
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Backup strategy implemented

---

**Congratulations!** Your SmartStore SaaS is now deployed on Vercel with full LKR currency support and database integration! 🎉

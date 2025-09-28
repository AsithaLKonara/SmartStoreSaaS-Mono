# 🚀 Custom Domain Deployment Guide

This guide provides step-by-step instructions for deploying SmartStore SaaS with a custom domain on Vercel.

## 📋 Prerequisites

- [x] Vercel account
- [x] Custom domain registered
- [x] DNS access for your domain
- [x] Vercel CLI installed (`npm i -g vercel`)

## 🔧 Configuration

### Environment Variables

Set these environment variables in Vercel dashboard:

```bash
# Production Database
DATABASE_URL="postgresql://neondb_owner:npg_lH72xXfQiSpg@ep-dry-morning-ado12pcf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# NextAuth Configuration
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secure-secret-key"

# App Configuration
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# CORS Configuration
CORS_ALLOWED_ORIGINS="https://your-domain.com,https://www.your-domain.com,https://admin.your-domain.com"

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Custom Domain
CUSTOM_DOMAIN="your-domain.com"
```

## 🚀 Deployment Steps

### 1. Build and Test Locally

```bash
# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Build the application
npm run build

# Test locally
npm start
```

### 2. Deploy to Vercel

```bash
# Login to Vercel
vercel login

# Deploy to preview
npm run deploy:preview

# Deploy to production
npm run deploy:production
```

### 3. Configure Custom Domain

```bash
# Add custom domain to Vercel project
vercel domains add your-domain.com

# Or use the deployment script
npm run deploy:custom-domain
```

### 4. DNS Configuration

Update your DNS records:

```
Type: A
Name: @
Value: 76.76.19.61

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 5. SSL Certificate

Vercel automatically provisions SSL certificates. Wait up to 24 hours for full propagation.

## 🧪 Testing

### Run Custom Domain Tests

```bash
# Test custom domain functionality
npm run test:custom-domain

# Test all deployment features
npm run test:deployment-all
```

### Manual Testing Checklist

- [ ] HTTPS redirects work
- [ ] SSL certificate is valid
- [ ] CORS headers are correct
- [ ] Security headers are present
- [ ] Authentication endpoints work
- [ ] API endpoints respond correctly
- [ ] Static assets load properly
- [ ] Performance is acceptable (<5s response time)

## 🔒 Security Features

The deployment includes these security measures:

- **HTTPS Enforcement**: All HTTP traffic redirects to HTTPS
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
- **CORS Protection**: Only allowed origins can access APIs
- **Authentication**: NextAuth.js with JWT tokens
- **Rate Limiting**: Built-in API protection
- **Input Validation**: All API inputs are validated

## 📊 Monitoring

### Health Check Endpoint

```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-27T18:49:43.912Z",
  "uptime": 57.667165958,
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "app": "running",
    "database": "healthy"
  }
}
```

### Performance Monitoring

- Response time should be < 2 seconds
- Uptime should be > 99.9%
- Error rate should be < 0.1%

## 🛠️ Troubleshooting

### Common Issues

1. **SSL Certificate Not Ready**
   - Wait up to 24 hours
   - Check DNS propagation
   - Verify domain ownership

2. **CORS Errors**
   - Check CORS_ALLOWED_ORIGINS environment variable
   - Verify domain is in the allowed list
   - Check browser console for specific errors

3. **Authentication Issues**
   - Verify NEXTAUTH_URL matches your domain
   - Check NEXTAUTH_SECRET is set
   - Ensure database connection is working

4. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check database server is accessible
   - Ensure SSL mode is enabled

### Debug Commands

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs

# Check domain configuration
vercel domains ls

# Test specific endpoint
curl -v https://your-domain.com/api/health
```

## 📈 Performance Optimization

### Vercel Configuration

The `vercel.json` file includes:

- Static asset optimization
- API route caching
- Security headers
- CORS configuration

### Database Optimization

- Connection pooling enabled
- Query optimization with Prisma
- Indexed database fields
- Efficient data relationships

## 🔄 Continuous Deployment

### GitHub Integration

1. Connect GitHub repository to Vercel
2. Enable automatic deployments
3. Set up branch protection rules
4. Configure preview deployments

### Environment Management

- **Preview**: Automatic deployments for PRs
- **Production**: Manual or automatic deployments from main branch
- **Environment Variables**: Separate for each environment

## 📞 Support

For deployment issues:

1. Check Vercel dashboard for errors
2. Review deployment logs
3. Test locally first
4. Verify environment variables
5. Check DNS configuration

## 🎯 Success Metrics

A successful custom domain deployment should achieve:

- ✅ 100% HTTPS coverage
- ✅ < 2 second response time
- ✅ 99.9% uptime
- ✅ All security headers present
- ✅ CORS properly configured
- ✅ Authentication working
- ✅ Database connectivity
- ✅ SSL certificate valid

## 🚀 Next Steps

After successful deployment:

1. Set up monitoring and alerts
2. Configure backup strategies
3. Implement CI/CD pipeline
4. Set up staging environment
5. Plan for scaling

---

**Deployment completed successfully!** 🎉

Your SmartStore SaaS application is now live at: `https://your-domain.com`
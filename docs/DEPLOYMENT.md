# SmartStore SaaS Production Deployment Guide

This guide covers deploying SmartStore SaaS to production using Docker and Docker Compose.

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Domain name and SSL certificate
- Production database (PostgreSQL)
- Redis instance
- Environment variables configured

### 1. Clone Repository
```bash
git clone https://github.com/your-org/smartstore-saas.git
cd smartstore-saas
```

### 2. Configure Environment
```bash
# Copy production environment template
cp deployment/production.env.example .env.production

# Edit environment variables
nano .env.production
```

### 3. Deploy Application
```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Deploy to production
./scripts/deploy.sh deploy
```

## 📋 Environment Variables

### Required Variables

```bash
# Application Configuration
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secret-jwt-key-here-minimum-32-characters-long

# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database_name
DIRECT_URL=postgresql://username:password@host:port/database_name

# Redis Configuration
REDIS_URL=redis://username:password@host:port
REDIS_PASSWORD=your-redis-password
```

### Optional Variables

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@your-domain.com

# Payment Processing
STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# File Storage
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# Analytics and Monitoring
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Security
ENCRYPTION_KEY=your-32-character-encryption-key
CORS_ORIGIN=https://your-domain.com
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

The application includes a complete Docker Compose setup for production:

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

### Services Included

- **app**: SmartStore SaaS application
- **postgres**: PostgreSQL database
- **redis**: Redis cache
- **nginx**: Reverse proxy and SSL termination
- **backup**: Automated database backups
- **prometheus**: Metrics collection
- **grafana**: Monitoring dashboard

## 🔧 Deployment Commands

### Deploy Application
```bash
./scripts/deploy.sh deploy
```

### Check Health
```bash
./scripts/deploy.sh health
```

### View Logs
```bash
./scripts/deploy.sh logs
```

### Create Backup
```bash
./scripts/deploy.sh backup
```

### Rollback
```bash
./scripts/deploy.sh rollback
```

## 🌐 Nginx Configuration

The deployment includes Nginx as a reverse proxy with SSL termination:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Monitoring Setup

### Grafana Dashboard
- URL: `http://your-domain.com:3001`
- Default credentials: admin / (set via GRAFANA_PASSWORD)

### Prometheus Metrics
- URL: `http://your-domain.com:9090`
- Metrics endpoint: `http://your-domain.com/api/metrics`

### Health Checks
- Application: `http://your-domain.com/api/health`
- Database: `http://your-domain.com/api/db-check`
- Performance: `http://your-domain.com/api/performance/dashboard`

## 🔒 Security Configuration

### SSL/TLS Setup
1. Obtain SSL certificate (Let's Encrypt recommended)
2. Place certificate files in `deployment/ssl/`
3. Update Nginx configuration if needed

### Security Headers
The application includes comprehensive security headers:
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security
- Referrer-Policy

### Rate Limiting
- API endpoints: 100 requests per 15 minutes
- Authentication: 10 requests per minute
- Analytics: 50 requests per 15 minutes

## 💾 Database Management

### Migrations
```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Generate Prisma client
docker-compose -f docker-compose.prod.yml exec app npx prisma generate
```

### Backups
Automated backups run daily at 2 AM:
```bash
# Manual backup
./scripts/deploy.sh backup

# Restore from backup
docker-compose -f docker-compose.prod.yml exec postgres psql -U smartstore -d smartstore_prod < backup_file.sql
```

### Indexing
Database indexes are automatically created during deployment:
```sql
-- Key indexes for performance
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_customers_email ON customers(email);
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: |
          ./scripts/deploy.sh deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
```

## 📈 Performance Optimization

### Caching Strategy
- Redis for API response caching
- Database query result caching
- Static asset caching via Nginx

### Database Optimization
- Connection pooling
- Query optimization
- Proper indexing
- Read replicas for scaling

### Bundle Optimization
- Code splitting
- Tree shaking
- Image optimization
- CDN integration

## 🚨 Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs app

# Check environment variables
docker-compose -f docker-compose.prod.yml exec app env | grep NODE_ENV
```

#### Database Connection Issues
```bash
# Check database status
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U smartstore

# Test connection
docker-compose -f docker-compose.prod.yml exec app npx prisma db pull
```

#### Redis Connection Issues
```bash
# Check Redis status
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping

# Check Redis logs
docker-compose -f docker-compose.prod.yml logs redis
```

### Performance Issues

#### High Memory Usage
```bash
# Check memory usage
docker stats

# Restart services
docker-compose -f docker-compose.prod.yml restart app
```

#### Slow Database Queries
```bash
# Check slow queries
curl http://localhost:3000/api/database/performance?action=slow-queries

# Optimize queries
curl http://localhost:3000/api/database/performance?action=optimization-tips
```

## 🔄 Scaling

### Horizontal Scaling
```bash
# Scale application instances
docker-compose -f docker-compose.prod.yml up -d --scale app=3

# Use load balancer
# Configure Nginx upstream for multiple app instances
```

### Database Scaling
- Use read replicas for read-heavy workloads
- Implement database sharding for large datasets
- Use connection pooling for better performance

### Cache Scaling
- Use Redis Cluster for high availability
- Implement cache warming strategies
- Monitor cache hit rates

## 📋 Maintenance

### Regular Tasks
- Monitor disk space and clean up old backups
- Update dependencies and security patches
- Review and optimize database queries
- Monitor performance metrics

### Security Updates
- Keep Docker images updated
- Monitor security advisories
- Regular security audits
- Update SSL certificates

### Backup Verification
- Test backup restoration regularly
- Verify backup integrity
- Monitor backup success rates

## 📞 Support

For deployment issues:
- Check the troubleshooting section above
- Review application logs
- Check service health endpoints
- Contact support: support@smartstore-saas.com

## 📚 Additional Resources

- [API Documentation](./API.md)
- [Monitoring Guide](./monitoring.md)
- [Security Best Practices](./security.md)
- [Performance Optimization](./performance.md)

---

**SmartStore SaaS** - Production-ready e-commerce solution
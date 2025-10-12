# 🚀 SmartStore SaaS - AI-Powered E-commerce Platform

**Status**: 🟢 **PRODUCTION READY**  
**Version**: 2.1.0  
**Last Updated**: August 21, 2025

A comprehensive, AI-powered multi-channel commerce automation platform built with Next.js 14, PostgreSQL, Redis, and Docker. Features a complete settings management system, AI-powered recommendations, and comprehensive business intelligence.

## 📚 **Documentation**

**📖 [Complete Comprehensive Guide](SMARTSTORE-SAAS-COMPLETE-GUIDE.md)** - Everything you need to know about SmartStore SaaS

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 6+

### Quick Setup
```bash
# Clone and install
git clone <your-repo-url>
cd SmartStoreSaaS
npm install

# Environment setup
cp env.example .env.local
# Edit .env.local with your configuration

# Database setup
npm run db:generate
npm run db:push
npm run db:seed

# Development
npm run dev
# App runs on http://localhost:3000
```

### Docker Setup
```bash
# Start all services
docker-compose up -d

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

## 🏗️ Architecture Overview

### Monolithic Services

- **App**: Next.js application (port 3000)
- **PostgreSQL**: Primary database (port 5432)
- **Redis**: Caching and sessions (port 6379)
- **Ollama**: Local AI models (port 11434)
- **Nginx**: Reverse proxy with SSL (ports 80, 443)
- **Redis Commander**: Redis management (port 8082)

### Key Features

- **Multi-tenant SaaS**: Organization-based isolation
- **AI-Powered**: OpenAI integration + local Ollama models
- **Real-time**: WebSocket support for live updates
- **Multi-channel**: WhatsApp, email, SMS integration
- **Payment Processing**: Stripe, PayPal, PayHere
- **Inventory Management**: Advanced warehouse operations
- **Analytics**: Real-time business intelligence
- **Security**: MFA, rate limiting, audit logging
- **Comprehensive Settings**: Organization, user, AI, security, and notification management

## 🔧 Configuration

### Environment Variables

Key environment variables in `.env`:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/smartstore?schema=public
REDIS_URL=redis://redis:6379

# Authentication
NEXTAUTH_SECRET=your-secret-key
JWT_SECRET=your-jwt-secret

# AI Services
OPENAI_API_KEY=your-openai-key
OLLAMA_BASE_URL=http://ollama:11434

# Payment Gateways
STRIPE_SECRET_KEY=your-stripe-key
PAYPAL_CLIENT_ID=your-paypal-id

# External Services
TWILIO_ACCOUNT_SID=your-twilio-sid
FACEBOOK_APP_ID=your-facebook-id
```

### SSL Configuration

For production, replace the self-signed certificates in `ssl/` with your domain certificates.

## 📊 Database Schema

The application uses PostgreSQL with Prisma ORM and the following main models:

- **Users**: Authentication and user management with role-based access
- **Organizations**: Multi-tenant isolation with comprehensive settings
- **Products**: Product catalog management with AI-powered recommendations
- **Orders**: Order processing and tracking with delivery management
- **Customers**: Customer relationship management with loyalty programs
- **Inventory**: Stock and warehouse management with real-time tracking
- **Analytics**: Business intelligence data with predictive analytics
- **Chat**: AI-powered customer support with context awareness
- **Integrations**: WooCommerce, WhatsApp, and courier service integrations

## 🚀 Deployment

### Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production

1. **Update environment variables**
2. **Replace SSL certificates**
3. **Configure domain names**
4. **Set up monitoring and logging**
5. **Configure backups**

### Scaling

```bash
# Scale the main application
docker-compose up -d --scale app=3

# Scale with load balancer
docker-compose up -d --scale app=5
```

## 🔍 Monitoring & Management

### Health Checks

- **Application**: `http://localhost:3000/api/health`
- **PostgreSQL**: `docker-compose exec postgres psql -U username -d smartstore -c "SELECT 1"`
- **Redis**: `docker-compose exec redis redis-cli ping`

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Database Management

- **PostgreSQL**: Direct connection via psql or pgAdmin
- **Redis Commander**: http://localhost:8082

## 🛠️ Development

### Local Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Start development server
npm run dev
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run security tests
npm run test:security
```

### Code Quality

```bash
# Lint code
npm run lint

# Type check
npm run type-check

# Security audit
npm run security:audit
```

## 🔒 Security Features

- **Authentication**: NextAuth.js with MFA support
- **Authorization**: Role-based access control (ADMIN, STAFF, USER)
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Prisma ORM
- **XSS Protection**: Security headers
- **CSRF Protection**: Built-in Next.js protection
- **Audit Logging**: Comprehensive activity tracking
- **Session Management**: Configurable timeout and concurrent session limits

## 📱 PWA Features

- **Offline Support**: Service worker implementation
- **Push Notifications**: Web Push API
- **Install Prompt**: Add to home screen
- **Background Sync**: Offline data synchronization

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signup` - User registration
- `GET /api/auth/[...nextauth]` - NextAuth.js routes

### Core Operations
- `GET /api/products` - Product management
- `GET /api/orders` - Order processing
- `GET /api/customers` - Customer management
- `GET /api/analytics` - Business intelligence
- `GET /api/chat` - AI-powered chat

### Settings Management
- `GET /api/settings/organization` - Organization settings
- `PUT /api/settings/organization` - Update organization settings
- `GET /api/settings/users` - User management
- `POST /api/settings/users` - Create new user
- `PUT /api/settings/users` - Update user
- `DELETE /api/settings/users` - Deactivate user
- `GET /api/settings/ai` - AI configuration
- `PUT /api/settings/ai` - Update AI settings
- `GET /api/settings/security` - Security settings
- `PUT /api/settings/security` - Update security settings
- `GET /api/settings/notifications` - Notification preferences
- `PUT /api/settings/notifications` - Update notification settings
- `GET /api/settings/billing` - Billing information
- `PUT /api/settings/billing` - Update billing settings
- `GET /api/settings/integrations` - Integration management
- `PUT /api/settings/integrations` - Update integrations

### AI & Analytics
- `GET /api/ai/recommendations` - AI-powered product recommendations
- `GET /api/analytics/dashboard` - Business intelligence dashboard
- `GET /api/analytics/enhanced` - Enhanced analytics with AI insights

### Integrations
- `GET /api/integrations` - Third-party services
- `GET /api/webhooks` - Webhook management
- `GET /api/sync` - Data synchronization
- `GET /api/integrations/setup` - Integration setup status

### Health & Monitoring
- `GET /api/health` - Application health status
- `GET /api/readyz` - Readiness probe
- `GET /api/ready` - Liveness probe

## 🎛️ Settings System

### Organization Settings
- **Basic Information**: Name, domain, description
- **Plan Management**: Current plan, features, limits
- **Branding**: Logo, colors, custom CSS

### User Management
- **User Accounts**: Create, edit, deactivate users
- **Role Management**: ADMIN, STAFF, USER roles
- **Permissions**: Granular access control
- **Activity Tracking**: User login history and actions

### AI Configuration
- **Recommendation Engine**: Collaborative filtering, content-based filtering
- **Predictive Analytics**: Demand forecasting, churn prediction
- **Marketing Automation**: Abandoned cart recovery, birthday campaigns

### Security Settings
- **Password Policy**: Length, complexity, expiry requirements
- **Multi-Factor Authentication**: TOTP, backup codes
- **Session Management**: Timeout, concurrent session limits
- **Access Control**: IP restrictions, device management

### Notification Preferences
- **Email Notifications**: Order updates, inventory alerts, reports
- **SMS Notifications**: Order confirmations, delivery updates
- **Push Notifications**: Real-time alerts, AI insights

### Billing & Subscription
- **Plan Management**: Upgrade, downgrade, cancellation
- **Payment Methods**: Credit cards, digital wallets
- **Billing History**: Invoice management, payment tracking
- **Usage Analytics**: Resource consumption, cost optimization

### Integration Management
- **WooCommerce**: Store synchronization, product sync
- **WhatsApp Business**: Customer messaging, automation
- **Courier Services**: Delivery tracking, logistics optimization

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**: Check if required ports are available
2. **Memory issues**: Ensure sufficient RAM (4GB+)
3. **SSL errors**: Verify certificate configuration
4. **Database connection**: Check PostgreSQL container status
5. **Prisma client issues**: Run `npx prisma generate` after schema changes

### Debug Commands

```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs <service-name>

# Access container shell
docker-compose exec <service-name> sh

# Restart specific service
docker-compose restart <service-name>

# Regenerate Prisma client
npx prisma generate

# Reset database
npx prisma db push --force-reset
```

### Performance Optimization

- **Database indexing**: Optimize PostgreSQL queries
- **Redis caching**: Implement strategic caching
- **Image optimization**: Use Next.js image optimization
- **CDN**: Configure content delivery network
- **Prisma optimization**: Use select and include for efficient queries

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Docker Documentation](https://docs.docker.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the documentation

---

**Built with ❤️ using modern web technologies**
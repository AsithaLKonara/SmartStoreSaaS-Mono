
#!/bin/bash

# 🚀 SmartStore SaaS - Custom Domain Deployment Script
# This script deploys the application to Vercel with your custom domain

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration - UPDATE THESE WITH YOUR DOMAIN
CUSTOM_DOMAIN="your-domain.com"  # Replace with your actual domain
PROJECT_NAME="smartstore-saas"

echo -e "${PURPLE}🚀 SmartStore SaaS - Custom Domain Deployment${NC}"
echo -e "${PURPLE}================================================${NC}"
echo ""

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if custom domain is configured
check_domain_config() {
    if [ "$CUSTOM_DOMAIN" = "your-domain.com" ]; then
        print_error "Please update CUSTOM_DOMAIN variable in this script with your actual domain!"
        print_status "Edit this file and change: CUSTOM_DOMAIN=\"your-domain.com\" to your actual domain"
        exit 1
    fi
    print_success "Custom domain configured: $CUSTOM_DOMAIN"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI is not installed. Please install it with: npm i -g vercel"
        exit 1
    fi
    
    # Check if user is logged in to Vercel
    if ! vercel whoami &> /dev/null; then
        print_error "Not logged in to Vercel. Please run: vercel login"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Build the application
build_application() {
    print_status "Building application..."
    
    # Install dependencies
    npm ci
    
    # Generate Prisma client
    npx prisma generate
    
    # Build the application
    npm run build
    
    print_success "Application built successfully"
}

# Update vercel.json for custom domain
update_vercel_config() {
    print_status "Updating Vercel configuration for custom domain..."
    
    # Create custom domain vercel.json
    cat > vercel.json << EOF
{
  "version": 2,
  "env": {
    "NODE_ENV": "production",
    "NEXTAUTH_URL": "https://$CUSTOM_DOMAIN",
    "NEXT_PUBLIC_APP_URL": "https://$CUSTOM_DOMAIN",
    "CORS_ALLOWED_ORIGINS": "https://$CUSTOM_DOMAIN,https://www.$CUSTOM_DOMAIN",
    "NEXTAUTH_SECRET": "smartstore-production-nextauth-secret-key-2024-secure",
    "JWT_SECRET": "smartstore-production-jwt-secret-key-2024-secure",
    "JWT_REFRESH_SECRET": "smartstore-production-jwt-refresh-secret-key-2024-secure",
    "JWT_EXPIRES_IN": "15m",
    "JWT_REFRESH_EXPIRES_IN": "7d",
    "DATABASE_URL": "postgresql://neondb_owner:npg_lH72xXfQiSpg@ep-dry-morning-ado12pcf-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    "SECURITY_HEADERS_ENABLED": "true",
    "CSP_ENABLED": "true",
    "HSTS_ENABLED": "true",
    "API_RATE_LIMIT": "1000",
    "API_TIMEOUT": "30000",
    "ENABLE_ANALYTICS": "true",
    "ENABLE_NOTIFICATIONS": "true",
    "ENABLE_PWA": "true",
    "ENABLE_LOGGING": "true",
    "LOG_LEVEL": "info",
    "ENABLE_METRICS": "true",
    "RATE_LIMIT_WINDOW_MS": "900000",
    "RATE_LIMIT_MAX_REQUESTS": "100",
    "CUSTOM_DOMAIN": "$CUSTOM_DOMAIN"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization, X-API-Key"
        }
      ]
    }
  ]
}
EOF
    
    print_success "Vercel configuration updated for $CUSTOM_DOMAIN"
}

# Deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel..."
    
    # Deploy to Vercel
    vercel --prod --yes
    
    print_success "Deployed to Vercel successfully"
}

# Configure custom domain in Vercel
configure_custom_domain() {
    print_status "Configuring custom domain: $CUSTOM_DOMAIN"
    
    # Add custom domain to Vercel project
    vercel domains add $CUSTOM_DOMAIN
    
    print_success "Custom domain configured: $CUSTOM_DOMAIN"
}

# Set up environment variables in Vercel
setup_environment() {
    print_status "Setting up environment variables in Vercel..."
    
    # Set production environment variables
    echo "Setting NEXTAUTH_URL..."
    vercel env add NEXTAUTH_URL production <<< "https://$CUSTOM_DOMAIN"
    
    echo "Setting NEXT_PUBLIC_APP_URL..."
    vercel env add NEXT_PUBLIC_APP_URL production <<< "https://$CUSTOM_DOMAIN"
    
    echo "Setting CORS_ALLOWED_ORIGINS..."
    vercel env add CORS_ALLOWED_ORIGINS production <<< "https://$CUSTOM_DOMAIN,https://www.$CUSTOM_DOMAIN"
    
    echo "Setting CUSTOM_DOMAIN..."
    vercel env add CUSTOM_DOMAIN production <<< "$CUSTOM_DOMAIN"
    
    print_success "Environment variables configured"
}

# Test deployment
test_deployment() {
    print_status "Testing deployment..."
    
    # Wait for deployment to be ready
    sleep 30
    
    # Test health endpoint
    HEALTH_URL="https://$CUSTOM_DOMAIN/api/health"
    print_status "Testing health endpoint: $HEALTH_URL"
    
    if curl -f -s "$HEALTH_URL" > /dev/null; then
        print_success "Health check passed"
    else
        print_warning "Health check failed - deployment may still be in progress"
    fi
}

# Main deployment process
main() {
    echo -e "${PURPLE}Starting deployment process for $CUSTOM_DOMAIN${NC}"
    echo ""
    
    check_domain_config
    check_prerequisites
    build_application
    update_vercel_config
    deploy_to_vercel
    configure_custom_domain
    setup_environment
    test_deployment
    
    echo ""
    echo -e "${GREEN}🎉 Custom domain deployment completed!${NC}"
    echo ""
    echo -e "${BLUE}Your application is now available at:${NC}"
    echo -e "${GREEN}  🌐 https://$CUSTOM_DOMAIN${NC}"
    echo -e "${GREEN}  🔧 Admin panel: https://$CUSTOM_DOMAIN/admin${NC}"
    echo -e "${GREEN}  📊 API health: https://$CUSTOM_DOMAIN/api/health${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "${BLUE}1.${NC} Update your DNS records to point to Vercel"
    echo -e "${BLUE}2.${NC} Wait for SSL certificate provisioning (up to 24 hours)"
    echo -e "${BLUE}3.${NC} Test all functionality on the custom domain"
    echo -e "${BLUE}4.${NC} Update any hardcoded URLs in your application"
    echo ""
    echo -e "${PURPLE}🚀 SmartStore SaaS is now live on your custom domain!${NC}"
}

# Run main function
main "$@"

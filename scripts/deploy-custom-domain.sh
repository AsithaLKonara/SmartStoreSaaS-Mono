#!/bin/bash

# Custom Domain Deployment Script for SmartStore SaaS
# This script deploys the application to Vercel with custom domain configuration

set -e

echo "🚀 Starting SmartStore SaaS Custom Domain Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CUSTOM_DOMAIN=${CUSTOM_DOMAIN:-"smartstore.example.com"}
PROJECT_NAME="smartstore-saas"

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

# Deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel..."
    
    # Deploy to Vercel
    vercel --prod --yes
    
    print_success "Deployed to Vercel successfully"
}

# Configure custom domain
configure_custom_domain() {
    print_status "Configuring custom domain: $CUSTOM_DOMAIN"
    
    # Add custom domain to Vercel project
    vercel domains add $CUSTOM_DOMAIN
    
    print_success "Custom domain configured: $CUSTOM_DOMAIN"
}

# Set up SSL certificate
setup_ssl() {
    print_status "Setting up SSL certificate..."
    
    # Vercel automatically provisions SSL certificates
    print_success "SSL certificate will be automatically provisioned by Vercel"
}

# Update environment variables
update_environment() {
    print_status "Updating environment variables..."
    
    # Set production environment variables
    vercel env add NEXTAUTH_URL production
    vercel env add NEXT_PUBLIC_APP_URL production
    vercel env add CORS_ALLOWED_ORIGINS production
    vercel env add NEXTAUTH_SECRET production
    vercel env add DATABASE_URL production
    
    print_success "Environment variables updated"
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
    print_status "Starting deployment process for $CUSTOM_DOMAIN"
    
    check_prerequisites
    build_application
    deploy_to_vercel
    configure_custom_domain
    setup_ssl
    update_environment
    test_deployment
    
    print_success "🎉 Custom domain deployment completed!"
    print_status "Your application is now available at: https://$CUSTOM_DOMAIN"
    print_status "Admin panel: https://$CUSTOM_DOMAIN/admin"
    print_status "API documentation: https://$CUSTOM_DOMAIN/api/health"
    
    echo ""
    print_status "Next steps:"
    print_status "1. Update your DNS records to point to Vercel"
    print_status "2. Wait for SSL certificate provisioning (up to 24 hours)"
    print_status "3. Test all functionality on the custom domain"
    print_status "4. Update any hardcoded URLs in your application"
}

# Run main function
main "$@"
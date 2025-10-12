#!/bin/bash

# SmartStore SaaS Production Deployment Script
set -e

echo "🚀 Starting SmartStore SaaS Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="smartstore-saas"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required files exist
check_requirements() {
    print_status "Checking requirements..."
    
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        print_error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
        exit 1
    fi
    
    if [ ! -f "$ENV_FILE" ]; then
        print_warning "Environment file not found: $ENV_FILE"
        print_warning "Please copy deployment/production.env.example to .env.production and configure it"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    print_status "Requirements check passed ✓"
}

# Build and deploy
deploy() {
    print_status "Building and deploying SmartStore SaaS..."
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose -f $DOCKER_COMPOSE_FILE down
    
    # Pull latest images
    print_status "Pulling latest images..."
    docker-compose -f $DOCKER_COMPOSE_FILE pull
    
    # Build application image
    print_status "Building application image..."
    docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache app
    
    # Start services
    print_status "Starting services..."
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_health
}

# Check service health
check_health() {
    print_status "Checking service health..."
    
    # Check if app is responding
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_status "Application is healthy ✓"
    else
        print_error "Application health check failed"
        show_logs
        exit 1
    fi
    
    # Check database connection
    if docker-compose -f $DOCKER_COMPOSE_FILE exec -T postgres pg_isready -U smartstore -d smartstore_prod > /dev/null 2>&1; then
        print_status "Database is healthy ✓"
    else
        print_error "Database health check failed"
        exit 1
    fi
    
    # Check Redis connection
    if docker-compose -f $DOCKER_COMPOSE_FILE exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_status "Redis is healthy ✓"
    else
        print_error "Redis health check failed"
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Wait for database to be ready
    sleep 10
    
    # Run Prisma migrations
    docker-compose -f $DOCKER_COMPOSE_FILE exec -T app npx prisma migrate deploy
    
    # Generate Prisma client
    docker-compose -f $DOCKER_COMPOSE_FILE exec -T app npx prisma generate
    
    print_status "Database migrations completed ✓"
}

# Show logs
show_logs() {
    print_status "Showing application logs..."
    docker-compose -f $DOCKER_COMPOSE_FILE logs app --tail=50
}

# Cleanup old images
cleanup() {
    print_status "Cleaning up old Docker images..."
    docker image prune -f
    docker system prune -f
}

# Rollback to previous version
rollback() {
    print_warning "Rolling back to previous version..."
    
    # Stop current containers
    docker-compose -f $DOCKER_COMPOSE_FILE down
    
    # Start previous version (if available)
    if [ -f "docker-compose.prod.yml.backup" ]; then
        mv docker-compose.prod.yml.backup docker-compose.prod.yml
        docker-compose -f $DOCKER_COMPOSE_FILE up -d
        print_status "Rollback completed ✓"
    else
        print_error "No backup found for rollback"
        exit 1
    fi
}

# Backup database
backup_database() {
    print_status "Creating database backup..."
    
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_file="backups/smartstore_backup_${timestamp}.sql"
    
    mkdir -p backups
    
    docker-compose -f $DOCKER_COMPOSE_FILE exec -T postgres pg_dump -U smartstore smartstore_prod > $backup_file
    
    if [ -f "$backup_file" ]; then
        print_status "Database backup created: $backup_file ✓"
    else
        print_error "Database backup failed"
        exit 1
    fi
}

# Main deployment function
main() {
    case "${1:-deploy}" in
        "deploy")
            check_requirements
            backup_database
            deploy
            run_migrations
            check_health
            cleanup
            print_status "🎉 Deployment completed successfully!"
            print_status "Application is available at: http://localhost:3000"
            print_status "Grafana dashboard: http://localhost:3001"
            print_status "Prometheus metrics: http://localhost:9090"
            ;;
        "rollback")
            rollback
            ;;
        "logs")
            show_logs
            ;;
        "health")
            check_health
            ;;
        "backup")
            backup_database
            ;;
        *)
            echo "Usage: $0 {deploy|rollback|logs|health|backup}"
            echo ""
            echo "Commands:"
            echo "  deploy   - Deploy the application (default)"
            echo "  rollback - Rollback to previous version"
            echo "  logs     - Show application logs"
            echo "  health   - Check service health"
            echo "  backup   - Create database backup"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"





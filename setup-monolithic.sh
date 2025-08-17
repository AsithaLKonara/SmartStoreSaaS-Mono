#!/bin/bash

# SmartStore SaaS Monolithic Setup Script
# This script sets up the complete monolithic environment

set -e

echo "🚀 Starting SmartStore SaaS Monolithic Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if required ports are available
check_ports() {
    print_status "Checking port availability..."
    
    local ports=("80" "443" "3000" "27017" "6379" "11434" "8081" "8082")
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_warning "Port $port is already in use. Please free it up or change the configuration."
        else
            print_success "Port $port is available"
        fi
    done
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p uploads
    mkdir -p logs
    mkdir -p ssl
    mkdir -p backups
    
    print_success "Directories created successfully"
}

# Generate self-signed SSL certificate for development
generate_ssl_cert() {
    print_status "Generating self-signed SSL certificate..."
    
    if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
        mkdir -p ssl
        openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=SmartStore/CN=localhost"
        print_success "SSL certificate generated successfully"
    else
        print_status "SSL certificate already exists"
    fi
}

# Create environment file
create_env_file() {
    print_status "Creating environment file..."
    
    if [ ! -f ".env" ]; then
        cp env.example .env
        print_warning "Environment file created from template. Please update it with your actual values."
        print_status "You can edit .env file to configure your environment variables."
    else
        print_status "Environment file already exists"
    fi
}

# Build and start services
start_services() {
    print_status "Building and starting services..."
    
    # Build the application
    print_status "Building Docker images..."
    docker-compose build --no-cache
    
    # Start services
    print_status "Starting services..."
    docker-compose up -d
    
    print_success "Services started successfully"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for MongoDB
    print_status "Waiting for MongoDB..."
    until docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
        sleep 2
    done
    print_success "MongoDB is ready"
    
    # Wait for Redis
    print_status "Waiting for Redis..."
    until docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; do
        sleep 2
    done
    print_success "Redis is ready"
    
    # Wait for Ollama
    print_status "Waiting for Ollama..."
    until curl -s http://localhost:11434/api/tags > /dev/null 2>&1; do
        sleep 2
    done
    print_success "Ollama is ready"
    
    # Wait for the main application
    print_status "Waiting for the main application..."
    until curl -s http://localhost:3000/api/health > /dev/null 2>&1; do
        sleep 5
    done
    print_success "Main application is ready"
}

# Show service status
show_status() {
    print_status "Service Status:"
    docker-compose ps
    
    echo ""
    print_status "Access URLs:"
    echo -e "  ${GREEN}Main Application:${NC} http://localhost:3000"
    echo -e "  ${GREEN}Nginx (HTTP):${NC} http://localhost"
    echo -e "  ${GREEN}Nginx (HTTPS):${NC} https://localhost"
    echo -e "  ${GREEN}MongoDB Express:${NC} http://localhost:8081"
    echo -e "  ${GREEN}Redis Commander:${NC} http://localhost:8082"
    echo -e "  ${GREEN}Ollama API:${NC} http://localhost:11434"
    
    echo ""
    print_status "Default Admin Credentials:"
    echo -e "  ${GREEN}Email:${NC} admin@smartstore.com"
    echo -e "  ${GREEN}Password:${NC} admin123"
    
    echo ""
    print_warning "Remember to change the default admin password in production!"
}

# Main setup function
main() {
    echo "=========================================="
    echo "  SmartStore SaaS Monolithic Setup"
    echo "=========================================="
    echo ""
    
    check_docker
    check_ports
    create_directories
    generate_ssl_cert
    create_env_file
    start_services
    wait_for_services
    show_status
    
    echo ""
    echo "=========================================="
    print_success "Setup completed successfully!"
    echo "=========================================="
    echo ""
    print_status "Useful commands:"
    echo "  docker-compose up -d          # Start services"
    echo "  docker-compose down           # Stop services"
    echo "  docker-compose logs -f        # View logs"
    echo "  docker-compose restart        # Restart services"
    echo "  docker-compose ps             # Check status"
    echo ""
    print_status "For more information, check the README.md file."
}

# Run main function
main "$@"


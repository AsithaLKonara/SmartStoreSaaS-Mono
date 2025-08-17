# SmartStore SaaS Monolithic Setup Script for Windows
# This script sets up the complete monolithic environment

param(
    [switch]$SkipChecks,
    [switch]$SkipSSL
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting SmartStore SaaS Monolithic Setup..." -ForegroundColor Cyan

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Docker is installed
function Test-Docker {
    Write-Status "Checking Docker installation..."
    
    try {
        $dockerVersion = docker --version
        $dockerComposeVersion = docker-compose --version
        
        if ($dockerVersion -and $dockerComposeVersion) {
            Write-Success "Docker and Docker Compose are installed"
            Write-Host "  Docker: $dockerVersion" -ForegroundColor Gray
            Write-Host "  Docker Compose: $dockerComposeVersion" -ForegroundColor Gray
        } else {
            throw "Docker or Docker Compose not found"
        }
    }
    catch {
        Write-Error "Docker is not installed or not running. Please install Docker Desktop first."
        Write-Host "Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
        exit 1
    }
}

# Check if required ports are available
function Test-Ports {
    Write-Status "Checking port availability..."
    
    $ports = @(80, 443, 3000, 27017, 6379, 11434, 8081, 8082)
    
    foreach ($port in $ports) {
        try {
            $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
            if ($connection.TcpTestSucceeded) {
                Write-Warning "Port $port is already in use. Please free it up or change the configuration."
            } else {
                Write-Success "Port $port is available"
            }
        }
        catch {
            Write-Success "Port $port is available"
        }
    }
}

# Create necessary directories
function New-Directories {
    Write-Status "Creating necessary directories..."
    
    $directories = @("uploads", "logs", "ssl", "backups")
    
    foreach ($dir in $directories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "  Created: $dir" -ForegroundColor Gray
        }
    }
    
    Write-Success "Directories created successfully"
}

# Generate self-signed SSL certificate for development
function New-SSLCertificate {
    if ($SkipSSL) {
        Write-Warning "Skipping SSL certificate generation"
        return
    }
    
    Write-Status "Generating self-signed SSL certificate..."
    
    if (!(Test-Path "ssl\cert.pem") -or !(Test-Path "ssl\key.pem")) {
        try {
            # Check if OpenSSL is available
            $openssl = Get-Command openssl -ErrorAction SilentlyContinue
            
            if ($openssl) {
                $opensslArgs = @(
                    "req", "-x509", "-newkey", "rsa:4096",
                    "-keyout", "ssl\key.pem",
                    "-out", "ssl\cert.pem",
                    "-days", "365", "-nodes",
                    "-subj", "/C=US/ST=State/L=City/O=SmartStore/CN=localhost"
                )
                
                & openssl @opensslArgs
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "SSL certificate generated successfully"
                } else {
                    throw "OpenSSL command failed"
                }
            } else {
                Write-Warning "OpenSSL not found. Creating dummy SSL files for development."
                New-Item -ItemType File -Path "ssl\cert.pem" -Force | Out-Null
                New-Item -ItemType File -Path "ssl\key.pem" -Force | Out-Null
                Write-Host "  Created dummy SSL files. Replace with real certificates for production." -ForegroundColor Yellow
            }
        }
        catch {
            Write-Warning "Failed to generate SSL certificate. Creating dummy files."
            New-Item -ItemType File -Path "ssl\cert.pem" -Force | Out-Null
            New-Item -ItemType File -Path "ssl\key.pem" -Force | Out-Null
        }
    } else {
        Write-Status "SSL certificate already exists"
    }
}

# Create environment file
function New-EnvironmentFile {
    Write-Status "Creating environment file..."
    
    if (!(Test-Path ".env")) {
        if (Test-Path "env.example") {
            Copy-Item "env.example" ".env"
            Write-Warning "Environment file created from template. Please update it with your actual values."
            Write-Status "You can edit .env file to configure your environment variables."
        } else {
            Write-Warning "env.example not found. Creating basic .env file."
            @"
# SmartStore SaaS Environment Configuration
# Update these values with your actual configuration

# Database Configuration
DATABASE_URL="mongodb://mongodb:27017/smartstore"
REDIS_URL="redis://redis:6379"

# Authentication & Security
NEXTAUTH_SECRET="your-secret-key-here"
JWT_SECRET="your-jwt-secret-key"
JWT_REFRESH_SECRET="your-jwt-refresh-secret-key"

# AI Services
OPENAI_API_KEY="your-openai-api-key"
OLLAMA_BASE_URL="http://ollama:11434"

# Payment Gateways
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-client-secret"

# External Services
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
FACEBOOK_APP_ID="your-facebook-app-id"
FACEBOOK_APP_SECRET="your-facebook-app-secret"

# File Storage
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# Email Services
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-email-password"

# Development
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
"@ | Out-File -FilePath ".env" -Encoding UTF8
        }
    } else {
        Write-Status "Environment file already exists"
    }
}

# Build and start services
function Start-Services {
    Write-Status "Building and starting services..."
    
    # Build the application
    Write-Status "Building Docker images..."
    docker-compose build --no-cache
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to build Docker images"
    }
    
    # Start services
    Write-Status "Starting services..."
    docker-compose up -d
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to start services"
    }
    
    Write-Success "Services started successfully"
}

# Wait for services to be ready
function Wait-Services {
    Write-Status "Waiting for services to be ready..."
    
    # Wait for MongoDB
    Write-Status "Waiting for MongoDB..."
    do {
        Start-Sleep -Seconds 2
        try {
            $result = docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" 2>$null
            if ($LASTEXITCODE -eq 0) { break }
        }
        catch { }
    } while ($true)
    Write-Success "MongoDB is ready"
    
    # Wait for Redis
    Write-Status "Waiting for Redis..."
    do {
        Start-Sleep -Seconds 2
        try {
            $result = docker-compose exec -T redis redis-cli ping 2>$null
            if ($LASTEXITCODE -eq 0) { break }
        }
        catch { }
    } while ($true)
    Write-Success "Redis is ready"
    
    # Wait for Ollama
    Write-Status "Waiting for Ollama..."
    do {
        Start-Sleep -Seconds 2
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) { break }
        }
        catch { }
    } while ($true)
    Write-Success "Ollama is ready"
    
    # Wait for the main application
    Write-Status "Waiting for the main application..."
    do {
        Start-Sleep -Seconds 5
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) { break }
        }
        catch { }
    } while ($true)
    Write-Success "Main application is ready"
}

# Show service status
function Show-Status {
    Write-Status "Service Status:"
    docker-compose ps
    
    Write-Host ""
    Write-Status "Access URLs:"
    Write-Host "  Main Application: http://localhost:3000" -ForegroundColor Green
    Write-Host "  Nginx (HTTP): http://localhost" -ForegroundColor Green
    Write-Host "  Nginx (HTTPS): https://localhost" -ForegroundColor Green
    Write-Host "  MongoDB Express: http://localhost:8081" -ForegroundColor Green
    Write-Host "  Redis Commander: http://localhost:8082" -ForegroundColor Green
    Write-Host "  Ollama API: http://localhost:11434" -ForegroundColor Green
    
    Write-Host ""
    Write-Status "Default Admin Credentials:"
    Write-Host "  Email: admin@smartstore.com" -ForegroundColor Green
    Write-Host "  Password: admin123" -ForegroundColor Green
    
    Write-Host ""
    Write-Warning "Remember to change the default admin password in production!"
}

# Main setup function
function Main {
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  SmartStore SaaS Monolithic Setup" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    
    if (!$SkipChecks) {
        Test-Docker
        Test-Ports
    }
    
    New-Directories
    New-SSLCertificate
    New-EnvironmentFile
    Start-Services
    Wait-Services
    Show-Status
    
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Success "Setup completed successfully!"
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Status "Useful commands:"
    Write-Host "  docker-compose up -d          # Start services" -ForegroundColor Gray
    Write-Host "  docker-compose down           # Stop services" -ForegroundColor Gray
    Write-Host "  docker-compose logs -f        # View logs" -ForegroundColor Gray
    Write-Host "  docker-compose restart        # Restart services" -ForegroundColor Gray
    Write-Host "  docker-compose ps             # Check status" -ForegroundColor Gray
    Write-Host ""
    Write-Status "For more information, check the README.md file."
}

# Run main function
try {
    Main
}
catch {
    Write-Error "Setup failed: $($_.Exception.Message)"
    Write-Host "Check the error messages above and try again." -ForegroundColor Red
    exit 1
}


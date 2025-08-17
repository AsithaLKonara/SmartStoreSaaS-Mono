@echo off
REM SmartStore SaaS Monolithic Setup Script for Windows
REM This script sets up the complete monolithic environment

echo 🚀 Starting SmartStore SaaS Monolithic Setup...
echo.

REM Check if Docker is running
echo [INFO] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not running. Please install Docker Desktop first.
    echo Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo [SUCCESS] Docker and Docker Compose are installed

REM Create necessary directories
echo [INFO] Creating necessary directories...
if not exist "uploads" mkdir uploads
if not exist "logs" mkdir logs
if not exist "ssl" mkdir ssl
if not exist "backups" mkdir backups
echo [SUCCESS] Directories created successfully

REM Generate SSL certificates
echo [INFO] Generating self-signed SSL certificate...
if not exist "ssl\cert.pem" (
    openssl req -x509 -newkey rsa:4096 -keyout ssl\key.pem -out ssl\cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=SmartStore/CN=localhost" >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] SSL certificate generated successfully
    ) else (
        echo [WARNING] Failed to generate SSL certificate. Creating dummy files.
        echo. > ssl\cert.pem
        echo. > ssl\key.pem
    )
) else (
    echo [INFO] SSL certificate already exists
)

REM Create environment file
echo [INFO] Creating environment file...
if not exist ".env" (
    if exist "env.example" (
        copy env.example .env >nul
        echo [WARNING] Environment file created from template. Please update it with your actual values.
    ) else (
        echo [WARNING] env.example not found. Creating basic .env file.
        (
            echo # SmartStore SaaS Environment Configuration
            echo # Update these values with your actual configuration
            echo.
            echo # Database Configuration
            echo DATABASE_URL="mongodb://mongodb:27017/smartstore"
            echo REDIS_URL="redis://redis:6379"
            echo.
            echo # Authentication ^& Security
            echo NEXTAUTH_SECRET="your-secret-key-here"
            echo JWT_SECRET="your-jwt-secret-key"
            echo JWT_REFRESH_SECRET="your-jwt-refresh-secret-key"
            echo.
            echo # AI Services
            echo OPENAI_API_KEY="your-openai-api-key"
            echo OLLAMA_BASE_URL="http://ollama:11434"
            echo.
            echo # Payment Gateways
            echo STRIPE_SECRET_KEY="your-stripe-secret-key"
            echo STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
            echo PAYPAL_CLIENT_ID="your-paypal-client-id"
            echo PAYPAL_CLIENT_SECRET="your-paypal-client-secret"
            echo.
            echo # External Services
            echo TWILIO_ACCOUNT_SID="your-twilio-account-sid"
            echo TWILIO_AUTH_TOKEN="your-twilio-auth-token"
            echo FACEBOOK_APP_ID="your-facebook-app-id"
            echo FACEBOOK_APP_SECRET="your-facebook-app-secret"
            echo.
            echo # Development
            echo NODE_ENV="production"
            echo NEXT_PUBLIC_APP_URL="http://localhost:3000"
        ) > .env
    )
) else (
    echo [INFO] Environment file already exists
)

REM Build and start services
echo [INFO] Building and starting services...
echo [INFO] Building Docker images...
docker-compose build --no-cache
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build Docker images
    pause
    exit /b 1
)

echo [INFO] Starting services...
docker-compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start services
    pause
    exit /b 1
)

echo [SUCCESS] Services started successfully

REM Wait for services
echo [INFO] Waiting for services to be ready...
echo [INFO] This may take a few minutes...

REM Wait for MongoDB
echo [INFO] Waiting for MongoDB...
:wait_mongo
timeout /t 2 /nobreak >nul
docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" >nul 2>&1
if %errorlevel% neq 0 goto wait_mongo
echo [SUCCESS] MongoDB is ready

REM Wait for Redis
echo [INFO] Waiting for Redis...
:wait_redis
timeout /t 2 /nobreak >nul
docker-compose exec -T redis redis-cli ping >nul 2>&1
if %errorlevel% neq 0 goto wait_redis
echo [SUCCESS] Redis is ready

REM Wait for main application
echo [INFO] Waiting for the main application...
:wait_app
timeout /t 5 /nobreak >nul
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% neq 0 goto wait_app
echo [SUCCESS] Main application is ready

REM Show status
echo.
echo ==========================================
echo [SUCCESS] Setup completed successfully!
echo ==========================================
echo.
echo [INFO] Service Status:
docker-compose ps

echo.
echo [INFO] Access URLs:
echo   Main Application: http://localhost:3000
echo   Nginx (HTTP): http://localhost
echo   Nginx (HTTPS): https://localhost
echo   MongoDB Express: http://localhost:8081
echo   Redis Commander: http://localhost:8082
echo   Ollama API: http://localhost:11434

echo.
echo [INFO] Default Admin Credentials:
echo   Email: admin@smartstore.com
echo   Password: admin123

echo.
echo [WARNING] Remember to change the default admin password in production!

echo.
echo [INFO] Useful commands:
echo   docker-compose up -d          # Start services
echo   docker-compose down           # Stop services
echo   docker-compose logs -f        # View logs
echo   docker-compose restart        # Restart services
echo   docker-compose ps             # Check status

echo.
echo [INFO] For more information, check the README.md file.
echo.
pause


# Migration Guide: From Development to Monolithic Docker

This guide helps you migrate your SmartStore SaaS project from a development setup to the new monolithic Docker architecture.

## 🚀 Quick Migration

### Option 1: Automated Setup (Recommended)

**For Windows users:**
```cmd
setup-monolithic.bat
```

**For Linux/Mac users:**
```bash
chmod +x setup-monolithic.sh
./setup-monolithic.sh
```

### Option 2: Manual Migration

Follow these steps to manually migrate your existing setup:

## 📋 Pre-Migration Checklist

1. **Backup your data**
   ```bash
   # Backup your current database
   mongodump --db smartstore --out ./backups/pre-migration
   
   # Backup your environment variables
   cp .env .env.backup
   ```

2. **Stop existing services**
   ```bash
   # Stop any running Node.js processes
   npm run dev:stop  # if you have this script
   
   # Stop any running MongoDB/Redis instances
   # (depending on your current setup)
   ```

3. **Check Docker requirements**
   - Docker Desktop installed and running
   - At least 4GB RAM available
   - Ports 80, 443, 3000, 27017, 6379, 11434, 8081, 8082 available

## 🔄 Migration Steps

### Step 1: Environment Setup

1. **Create new environment file**
   ```bash
   cp env.example .env
   ```

2. **Update environment variables**
   - Copy your existing API keys and secrets
   - Update database URLs to use Docker service names
   - Set `NODE_ENV=production`

3. **Generate SSL certificates**
   ```bash
   mkdir -p ssl
   openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=SmartStore/CN=localhost"
   ```

### Step 2: Database Migration

1. **Start MongoDB container**
   ```bash
   docker-compose up -d mongodb
   ```

2. **Wait for MongoDB to be ready**
   ```bash
   docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
   ```

3. **Restore your data**
   ```bash
   # If you have a backup
   mongorestore --db smartstore ./backups/pre-migration/smartstore
   
   # Or let the application create fresh data
   # (the mongo-init.js will create default data)
   ```

### Step 3: Application Deployment

1. **Build the application**
   ```bash
   docker-compose build --no-cache
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Verify deployment**
   ```bash
   # Check service status
   docker-compose ps
   
   # Check application health
   curl http://localhost:3000/api/health
   ```

## 🔧 Post-Migration Configuration

### 1. Update External Services

- **Domain names**: Update webhook URLs to use your new domain
- **SSL certificates**: Replace self-signed certificates with real ones
- **Environment variables**: Update production API keys

### 2. Configure Monitoring

- **Health checks**: Monitor `/api/health` endpoint
- **Logs**: Set up log aggregation for production
- **Metrics**: Configure application performance monitoring

### 3. Set Up Backups

```bash
# Create backup script
mkdir -p scripts
cat > scripts/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/$DATE"
mkdir -p $BACKUP_DIR

# Backup MongoDB
docker-compose exec -T mongodb mongodump --db smartstore --out /tmp/backup
docker cp $(docker-compose ps -q mongodb):/tmp/backup $BACKUP_DIR/mongodb

# Backup uploads
cp -r uploads $BACKUP_DIR/

echo "Backup completed: $BACKUP_DIR"
EOF

chmod +x scripts/backup.sh
```

## 🚨 Troubleshooting Migration Issues

### Common Problems

1. **Port conflicts**
   ```bash
   # Check what's using the ports
   netstat -an | findstr :3000
   netstat -an | findstr :27017
   
   # Stop conflicting services
   # or change ports in docker-compose.yml
   ```

2. **Database connection issues**
   ```bash
   # Check MongoDB container
   docker-compose logs mongodb
   
   # Test connection
   docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
   ```

3. **Build failures**
   ```bash
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

4. **Memory issues**
   ```bash
   # Check Docker memory allocation
   docker stats
   
   # Increase Docker Desktop memory limit
   # (Docker Desktop > Settings > Resources > Memory)
   ```

### Recovery Steps

1. **Rollback to previous setup**
   ```bash
   # Stop Docker services
   docker-compose down
   
   # Restore your backup
   cp .env.backup .env
   
   # Start your previous setup
   ```

2. **Partial migration**
   ```bash
   # Start only specific services
   docker-compose up -d mongodb redis
   
   # Test database connectivity
   # Then gradually add other services
   ```

## 📊 Performance Optimization

### 1. Database Optimization

```bash
# Create additional indexes
docker-compose exec mongodb mongosh smartstore --eval "
db.products.createIndex({ 'organizationId': 1, 'categoryId': 1 });
db.orders.createIndex({ 'organizationId': 1, 'status': 1, 'createdAt': -1 });
db.customers.createIndex({ 'organizationId': 1, 'email': 1 });
"
```

### 2. Redis Configuration

```bash
# Optimize Redis for your workload
docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
docker-compose exec redis redis-cli CONFIG SET maxmemory 512mb
```

### 3. Application Scaling

```bash
# Scale the main application
docker-compose up -d --scale app=3

# Use load balancer for multiple instances
```

## 🔒 Security Considerations

### 1. Production SSL

```bash
# Replace self-signed certificates
cp /path/to/your/cert.pem ssl/cert.pem
cp /path/to/your/key.pem ssl/key.pem

# Restart Nginx
docker-compose restart nginx
```

### 2. Environment Security

```bash
# Generate strong secrets
openssl rand -base64 32  # for NEXTAUTH_SECRET
openssl rand -base64 32  # for JWT_SECRET

# Update .env file
# Never commit .env to version control
```

### 3. Network Security

```bash
# Restrict external access
# Update docker-compose.yml to bind only to localhost
# Use reverse proxy for external access
```

## 📈 Monitoring & Maintenance

### 1. Health Monitoring

```bash
# Create monitoring script
cat > scripts/monitor.sh << 'EOF'
#!/bin/bash
while true; do
    # Check application health
    if ! curl -f http://localhost:3000/api/health > /dev/null; then
        echo "$(date): Application health check failed"
        # Send alert or restart services
    fi
    
    # Check database
    if ! docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null; then
        echo "$(date): Database health check failed"
    fi
    
    sleep 60
done
EOF

chmod +x scripts/monitor.sh
```

### 2. Regular Maintenance

```bash
# Update images
docker-compose pull
docker-compose up -d

# Clean up old containers/images
docker system prune -f

# Backup data
./scripts/backup.sh
```

## 🎯 Next Steps

After successful migration:

1. **Test all functionality** - Ensure all features work as expected
2. **Performance testing** - Load test your application
3. **Security audit** - Review security configurations
4. **Documentation** - Update team documentation
5. **Training** - Train team on new deployment process

## 📞 Support

If you encounter issues during migration:

1. Check the troubleshooting section above
2. Review Docker and application logs
3. Check the main README.md for detailed setup instructions
4. Create an issue in the repository with detailed error information

---

**Happy migrating! 🚀**


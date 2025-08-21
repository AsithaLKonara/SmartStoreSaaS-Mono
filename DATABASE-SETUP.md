# Database Setup Guide

## Issue Resolution

The 500 error in the `/api/ready` endpoint was caused by a database configuration mismatch. The Prisma schema is configured for PostgreSQL, but the environment was set to MongoDB.

## Quick Fix

1. **Choose your database type** and update your `.env` file:

### Option 1: PostgreSQL (Recommended)
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/smartstore"
```

### Option 2: MongoDB
```bash
DATABASE_URL="mongodb://localhost:27017/smartstore"
```

2. **Update Prisma schema** if using MongoDB:
   - Copy `prisma/schema-postgresql.prisma` to `prisma/schema.prisma`
   - Or modify the existing schema to use MongoDB provider

3. **Generate Prisma client**:
```bash
npm run db:generate
```

4. **Push database schema**:
```bash
npm run db:push
```

## Database Health Check Endpoints

The following endpoints now support both PostgreSQL and MongoDB:

- `/api/ready` - Liveness probe (database-agnostic)
- `/api/readyz` - Readiness probe (database-agnostic)
- `/api/health` - Health check (database-agnostic)
- `/api/test-db` - Database test endpoint
- `/api/test-enhanced` - Enhanced test endpoint

## Environment Variables

Make sure these are set in your `.env` file:

```bash
# Database
DATABASE_URL="your-database-connection-string"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Redis (optional)
UPSTASH_REDIS_REST_URL="your-redis-url"
```

## Testing

After setup, test the endpoints:

```bash
# Test database connection
curl http://localhost:3000/api/test-db

# Check application readiness
curl http://localhost:3000/api/ready

# Health check
curl http://localhost:3000/api/health
```

## Troubleshooting

- **500 Error**: Check database connection string and ensure database is running
- **Connection Refused**: Verify database service is started
- **Authentication Failed**: Check username/password in connection string
- **Schema Mismatch**: Run `npm run db:push` to sync schema

## Docker Setup

If using Docker, ensure the database service is running:

```bash
# Check services
docker-compose ps

# Start services
docker-compose up -d

# View logs
docker-compose logs database
```



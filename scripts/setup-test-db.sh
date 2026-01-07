#!/bin/bash

# Setup Test Database Script
# This script initializes a dedicated test database for e2e tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Setting up test database...${NC}"

# Load environment variables from .env.test if it exists
if [ -f .env.test ]; then
    export $(cat .env.test | grep -v '^#' | xargs)
    echo -e "${GREEN}✅ Loaded .env.test${NC}"
else
    echo -e "${YELLOW}⚠️  .env.test not found. Creating from example...${NC}"
    if [ -f env.test.example ]; then
        cp env.test.example .env.test
        echo -e "${GREEN}✅ Created .env.test from example${NC}"
    else
        echo -e "${RED}❌ env.test.example not found. Please create .env.test manually.${NC}"
        exit 1
    fi
fi

# Extract database connection details
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL not set in .env.test${NC}"
    exit 1
fi

# Parse DATABASE_URL (format: postgresql://user:password@host:port/database)
DB_URL_REGEX="postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+)"
if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASSWORD="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    echo -e "${RED}❌ Invalid DATABASE_URL format. Expected: postgresql://user:password@host:port/database${NC}"
    exit 1
fi

echo -e "${GREEN}📊 Database Configuration:${NC}"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"

# Check if PostgreSQL is accessible
echo -e "\n${GREEN}🔍 Checking PostgreSQL connection...${NC}"
if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c '\q' 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Direct psql connection failed. Trying Docker...${NC}"
    
    # Try to connect via Docker if psql is not available or connection fails
    if docker ps | grep -q "smartstore-postgres\|postgres"; then
        echo -e "${GREEN}✅ Found PostgreSQL container running${NC}"
    else
        echo -e "${YELLOW}⚠️  PostgreSQL not accessible. Make sure:${NC}"
        echo "   1. PostgreSQL is running (local or Docker)"
        echo "   2. Connection details in .env.test are correct"
        echo "   3. Network access is allowed"
        echo -e "\n${YELLOW}Attempting to continue with Prisma commands...${NC}"
    fi
fi

# Generate Prisma Client
echo -e "\n${GREEN}📦 Generating Prisma Client...${NC}"
npm run db:generate

# Push database schema
echo -e "\n${GREEN}🗄️  Pushing database schema...${NC}"
dotenv -e .env.test -- npx prisma db push --force-reset --skip-generate || {
    echo -e "${RED}❌ Failed to push schema${NC}"
    exit 1
}

# Check if seed script exists and run it
echo -e "\n${GREEN}🌱 Seeding test database...${NC}"
if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
    dotenv -e .env.test -- npx tsx prisma/seed.ts || {
        echo -e "${YELLOW}⚠️  Seed script failed or incomplete. Continuing...${NC}"
    }
else
    echo -e "${YELLOW}⚠️  No seed script found. Database will be empty.${NC}"
fi

# Verify database setup
echo -e "\n${GREEN}✅ Verifying database setup...${NC}"
dotenv -e .env.test -- npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  try {
    await prisma.\$connect();
    const userCount = await prisma.user.count();
    console.log('✅ Database connection successful');
    console.log(\`✅ Users in database: \${userCount}\`);
    await prisma.\$disconnect();
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    process.exit(1);
  }
})();
" || {
    echo -e "${RED}❌ Database verification failed${NC}"
    exit 1
}

echo -e "\n${GREEN}✅ Test database setup complete!${NC}"
echo -e "${GREEN}📝 You can now run: pnpm test:e2e:local${NC}"


-- SmartStore SaaS Database Initialization Script

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';

-- Create custom types if needed
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE smartstore TO smartstore_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO smartstore_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO smartstore_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO smartstore_user;

-- Create initial admin user (will be handled by Prisma migrations)
-- This is just a placeholder for the database structure


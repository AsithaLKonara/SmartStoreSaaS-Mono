import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/migrate - Run database migration
export async function POST(request: NextRequest) {
  try {
    // Check if migration is already done
    const existingTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('wishlists', 'coupons', 'loyalty_transactions', 'notifications')
    `;

    if (Array.isArray(existingTables) && existingTables.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Database migration already completed', 
        tables: existingTables
      });
    }

    // Run the migration SQL
    const migrationSQL = `
      -- Create wishlists table
      CREATE TABLE IF NOT EXISTS wishlists (
        id VARCHAR(255) PRIMARY KEY,
        customer_id VARCHAR(255) NOT NULL,
        organization_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        is_public BOOLEAN DEFAULT false,
        share_code VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create wishlist_items table
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id VARCHAR(255) PRIMARY KEY,
        wishlist_id VARCHAR(255) NOT NULL,
        product_id VARCHAR(255) NOT NULL,
        notes TEXT,
        added_at TIMESTAMP DEFAULT NOW()
      );

      -- Create coupons table
      CREATE TABLE IF NOT EXISTS coupons (
        id VARCHAR(255) PRIMARY KEY,
        organization_id VARCHAR(255) NOT NULL,
        code VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        value DECIMAL(10,2) NOT NULL,
        min_order_amount DECIMAL(10,2),
        max_discount_amount DECIMAL(10,2),
        usage_limit INTEGER,
        used_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        valid_from TIMESTAMP,
        valid_to TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create coupon_usage table
      CREATE TABLE IF NOT EXISTS coupon_usage (
        id VARCHAR(255) PRIMARY KEY,
        coupon_id VARCHAR(255) NOT NULL,
        order_id VARCHAR(255) NOT NULL,
        customer_id VARCHAR(255) NOT NULL,
        discount_amount DECIMAL(10,2) NOT NULL,
        used_at TIMESTAMP DEFAULT NOW()
      );

      -- Create loyalty_transactions table
      CREATE TABLE IF NOT EXISTS loyalty_transactions (
        id VARCHAR(255) PRIMARY KEY,
        customer_id VARCHAR(255) NOT NULL,
        organization_id VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        points INTEGER NOT NULL,
        reason VARCHAR(255) NOT NULL,
        order_id VARCHAR(255),
        product_id VARCHAR(255),
        campaign_id VARCHAR(255),
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Create loyalty_rewards table
      CREATE TABLE IF NOT EXISTS loyalty_rewards (
        id VARCHAR(255) PRIMARY KEY,
        organization_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        points_required INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL,
        value DECIMAL(10,2) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        valid_from TIMESTAMP,
        valid_to TIMESTAMP,
        usage_limit INTEGER,
        used_count INTEGER DEFAULT 0,
        image VARCHAR(255),
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create loyalty_campaigns table
      CREATE TABLE IF NOT EXISTS loyalty_campaigns (
        id VARCHAR(255) PRIMARY KEY,
        organization_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        points_multiplier DECIMAL(3,2) DEFAULT 1.0,
        bonus_points INTEGER DEFAULT 0,
        conditions JSON,
        is_active BOOLEAN DEFAULT true,
        valid_from TIMESTAMP,
        valid_to TIMESTAMP,
        usage_limit INTEGER,
        used_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create social_commerce table
      CREATE TABLE IF NOT EXISTS social_commerce (
        id VARCHAR(255) PRIMARY KEY,
        organization_id VARCHAR(255) NOT NULL,
        platform VARCHAR(50) NOT NULL,
        platform_account_id VARCHAR(255) NOT NULL,
        access_token VARCHAR(255) NOT NULL,
        is_connected BOOLEAN DEFAULT false,
        settings JSON,
        last_sync TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create social_products table
      CREATE TABLE IF NOT EXISTS social_products (
        id VARCHAR(255) PRIMARY KEY,
        product_id VARCHAR(255) NOT NULL,
        social_commerce_id VARCHAR(255) NOT NULL,
        platform_product_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        last_sync TIMESTAMP,
        metadata JSON,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create social_posts table
      CREATE TABLE IF NOT EXISTS social_posts (
        id VARCHAR(255) PRIMARY KEY,
        social_commerce_id VARCHAR(255) NOT NULL,
        organization_id VARCHAR(255) NOT NULL,
        platform_post_id VARCHAR(255),
        type VARCHAR(50) NOT NULL,
        content JSON,
        product_ids VARCHAR(255)[],
        scheduled_at TIMESTAMP,
        published_at TIMESTAMP,
        status VARCHAR(50) DEFAULT 'DRAFT',
        metrics JSON,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create notifications table
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        organization_id VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSON,
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Create notification_settings table
      CREATE TABLE IF NOT EXISTS notification_settings (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        organization_id VARCHAR(255) NOT NULL,
        email_enabled BOOLEAN DEFAULT true,
        sms_enabled BOOLEAN DEFAULT false,
        push_enabled BOOLEAN DEFAULT true,
        order_notifications BOOLEAN DEFAULT true,
        payment_notifications BOOLEAN DEFAULT true,
        delivery_notifications BOOLEAN DEFAULT true,
        system_notifications BOOLEAN DEFAULT true,
        promotion_notifications BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT uk_notification_settings_user_org UNIQUE (user_id, organization_id)
      );

      -- Create audit_logs table
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(255) PRIMARY KEY,
        organization_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        action VARCHAR(255) NOT NULL,
        resource VARCHAR(255) NOT NULL,
        resource_id VARCHAR(255),
        old_values JSON,
        new_values JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Create api_keys table
      CREATE TABLE IF NOT EXISTS api_keys (
        id VARCHAR(255) PRIMARY KEY,
        organization_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        key VARCHAR(255) NOT NULL,
        permissions VARCHAR(50)[],
        is_active BOOLEAN DEFAULT true,
        last_used TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create rate_limits table
      CREATE TABLE IF NOT EXISTS rate_limits (
        id VARCHAR(255) PRIMARY KEY,
        identifier VARCHAR(255) NOT NULL,
        endpoint VARCHAR(255) NOT NULL,
        requests INTEGER DEFAULT 0,
        window_start TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create device_tokens table
      CREATE TABLE IF NOT EXISTS device_tokens (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        organization_id VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
        platform VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        last_used TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create pwa_subscriptions table
      CREATE TABLE IF NOT EXISTS pwa_subscriptions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        organization_id VARCHAR(255) NOT NULL,
        endpoint VARCHAR(255) NOT NULL,
        keys JSON NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create translations table
      CREATE TABLE IF NOT EXISTS translations (
        id VARCHAR(255) PRIMARY KEY,
        organization_id VARCHAR(255) NOT NULL,
        language VARCHAR(10) NOT NULL,
        resource VARCHAR(255) NOT NULL,
        resource_id VARCHAR(255) NOT NULL,
        field VARCHAR(255) NOT NULL,
        value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create currency_exchange_rates table
      CREATE TABLE IF NOT EXISTS currency_exchange_rates (
        id VARCHAR(255) PRIMARY KEY,
        from_currency VARCHAR(10) NOT NULL,
        to_currency VARCHAR(10) NOT NULL,
        rate DECIMAL(10,6) NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Update existing tables
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'LKR',
      ADD COLUMN IF NOT EXISTS billing_address JSON;

      ALTER TABLE payments 
      ADD COLUMN IF NOT EXISTS gateway_response JSON DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS refund_reason TEXT,
      ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

      -- Update payments currency default
      ALTER TABLE payments 
      ALTER COLUMN currency SET DEFAULT 'LKR';
    `;

    // Execute migration
    await prisma.$executeRawUnsafe(migrationSQL);

    // Create indexes for performance
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_wishlists_customer_id ON wishlists(customer_id);
      CREATE INDEX IF NOT EXISTS idx_wishlists_organization_id ON wishlists(organization_id);
      CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id);
      CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON wishlist_items(product_id);
      CREATE INDEX IF NOT EXISTS idx_coupons_organization_id ON coupons(organization_id);
      CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
      CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
      CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
      CREATE INDEX IF NOT EXISTS idx_coupon_usage_order_id ON coupon_usage(order_id);
      CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer_id ON loyalty_transactions(customer_id);
      CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_organization_id ON loyalty_transactions(organization_id);
      CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON loyalty_transactions(type);
      CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_organization_id ON loyalty_rewards(organization_id);
      CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_is_active ON loyalty_rewards(is_active);
      CREATE INDEX IF NOT EXISTS idx_loyalty_campaigns_organization_id ON loyalty_campaigns(organization_id);
      CREATE INDEX IF NOT EXISTS idx_loyalty_campaigns_is_active ON loyalty_campaigns(is_active);
      CREATE INDEX IF NOT EXISTS idx_social_commerce_organization_id ON social_commerce(organization_id);
      CREATE INDEX IF NOT EXISTS idx_social_commerce_platform ON social_commerce(platform);
      CREATE INDEX IF NOT EXISTS idx_social_products_product_id ON social_products(product_id);
      CREATE INDEX IF NOT EXISTS idx_social_products_social_commerce_id ON social_products(social_commerce_id);
      CREATE INDEX IF NOT EXISTS idx_social_posts_organization_id ON social_posts(organization_id);
      CREATE INDEX IF NOT EXISTS idx_social_posts_social_commerce_id ON social_posts(social_commerce_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON notifications(organization_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_api_keys_organization_id ON api_keys(organization_id);
      CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);
      CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
      CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON rate_limits(endpoint);
      CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_device_tokens_organization_id ON device_tokens(organization_id);
      CREATE INDEX IF NOT EXISTS idx_device_tokens_is_active ON device_tokens(is_active);
      CREATE INDEX IF NOT EXISTS idx_pwa_subscriptions_user_id ON pwa_subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_translations_organization_id ON translations(organization_id);
      CREATE INDEX IF NOT EXISTS idx_translations_language ON translations(language);
      CREATE INDEX IF NOT EXISTS idx_translations_resource ON translations(resource);
      CREATE INDEX IF NOT EXISTS idx_currency_exchange_rates_from_currency ON currency_exchange_rates(from_currency);
      CREATE INDEX IF NOT EXISTS idx_currency_exchange_rates_to_currency ON currency_exchange_rates(to_currency);
      CREATE INDEX IF NOT EXISTS idx_currency_exchange_rates_date ON currency_exchange_rates(date);
    `;

    await prisma.$executeRawUnsafe(indexSQL);

    // Insert default data
    const defaultDataSQL = `
      -- Insert default loyalty campaigns
      INSERT INTO loyalty_campaigns (id, organization_id, name, description, type, points_multiplier, bonus_points, is_active, created_at, updated_at)
      VALUES 
        ('bronze-tier', 'default', 'Bronze Tier', 'Basic loyalty tier with 1x points', 'PURCHASE', 1.0, 0, true, NOW(), NOW()),
        ('silver-tier', 'default', 'Silver Tier', 'Silver loyalty tier with 1.2x points', 'PURCHASE', 1.2, 0, true, NOW(), NOW()),
        ('gold-tier', 'default', 'Gold Tier', 'Gold loyalty tier with 1.5x points', 'PURCHASE', 1.5, 0, true, NOW(), NOW()),
        ('platinum-tier', 'default', 'Platinum Tier', 'Platinum loyalty tier with 2x points', 'PURCHASE', 2.0, 0, true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;

      -- Insert default currency exchange rates
      INSERT INTO currency_exchange_rates (id, from_currency, to_currency, rate, date, created_at)
      VALUES 
        ('lkr-usd', 'LKR', 'USD', 0.0033, CURRENT_DATE, NOW()),
        ('lkr-eur', 'LKR', 'EUR', 0.0030, CURRENT_DATE, NOW()),
        ('lkr-gbp', 'LKR', 'GBP', 0.0026, CURRENT_DATE, NOW()),
        ('lkr-inr', 'LKR', 'INR', 0.27, CURRENT_DATE, NOW())
      ON CONFLICT (id) DO NOTHING;
    `;

    await prisma.$executeRawUnsafe(defaultDataSQL);

    return NextResponse.json({ 
      success: true, 
      message: 'Database migration completed successfully', 
      tables: [
        'wishlists', 'wishlist_items',
        'coupons', 'coupon_usage',
        'loyalty_transactions', 'loyalty_rewards', 'loyalty_campaigns',
        'social_commerce', 'social_products', 'social_posts',
        'notifications', 'notification_settings',
        'audit_logs', 'api_keys', 'rate_limits',
        'device_tokens', 'pwa_subscriptions',
        'translations', 'currency_exchange_rates'
      ]
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// GET /api/migrate - Check migration status
export async function GET(request: NextRequest) {
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'wishlists', 'coupons', 'loyalty_transactions', 'notifications',
        'social_commerce', 'audit_logs', 'device_tokens', 'translations'
      )
      ORDER BY table_name
    `;

    return NextResponse.json({ 
      success: true, 
      tables: tables,
      count: Array.isArray(tables) ? tables.length : 0
    });

  } catch (error) {
    console.error('Migration status check error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
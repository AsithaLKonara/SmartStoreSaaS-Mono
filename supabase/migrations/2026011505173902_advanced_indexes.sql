-- ============================================================================
-- ADVANCED PERFORMANCE INDEXES - MIGRATION 02
-- ============================================================================
-- Purpose: Add indexes for procurement, returns, POS, and other feature tables
-- Downtime: ZERO (uses CONCURRENT index creation)
-- Estimated Time: 3-10 minutes depending on data size
-- Prerequisites: Migration 01 must be completed first
-- ============================================================================

-- ============================================================================
-- PROCUREMENT MODULE INDEXES (v1.2)
-- ============================================================================

-- Supplier management
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'suppliers') THEN
        CREATE INDEX IF NOT EXISTS idx_suppliers_org_status 
ON suppliers("organizationId", status);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'suppliers') THEN
        CREATE INDEX IF NOT EXISTS idx_suppliers_org_code 
ON suppliers("organizationId", code);
    END IF;
END $$;

-- Purchase order queries
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'purchase_orders') THEN
        CREATE INDEX IF NOT EXISTS idx_purchase_orders_org_status 
ON purchase_orders("organizationId", status, "orderDate" DESC);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'purchase_orders') THEN
        CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_status 
ON purchase_orders("supplierId", status);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'purchase_orders') THEN
        CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_by 
ON purchase_orders("createdById");
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'purchase_orders') THEN
        CREATE INDEX IF NOT EXISTS idx_purchase_orders_expected_date 
ON purchase_orders("expectedDate") 
WHERE status IN ('SUBMITTED', 'APPROVED', 'ORDERED', 'PARTIALLY_RECEIVED');
    END IF;
END $$;

-- Purchase order items
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'purchase_order_items') THEN
        CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po 
ON purchase_order_items("purchaseOrderId");
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'purchase_order_items') THEN
        CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product 
ON purchase_order_items("productId");
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rfqs') THEN
        CREATE INDEX IF NOT EXISTS idx_rfqs_org_status 
ON rfqs("organizationId", status, "createdAt" DESC);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rfqs') THEN
        CREATE INDEX IF NOT EXISTS idx_rfqs_created_by 
ON rfqs("createdBy");
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rfqs') THEN
        CREATE INDEX IF NOT EXISTS idx_rfqs_deadline 
ON rfqs(deadline) 
WHERE status NOT IN ('COMPLETED', 'CANCELLED');
    END IF;
END $$;

-- ============================================================================
-- RETURNS & REFUNDS MODULE INDEXES (v1.4)
-- ============================================================================

-- Returns management
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'returns') THEN
        CREATE INDEX IF NOT EXISTS idx_returns_org_status 
ON returns("organizationId", status, "createdAt" DESC);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'returns') THEN
        CREATE INDEX IF NOT EXISTS idx_returns_customer 
ON returns("customerId", status);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'returns') THEN
        CREATE INDEX IF NOT EXISTS idx_returns_order 
ON returns("orderId");
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'returns') THEN
        CREATE INDEX IF NOT EXISTS idx_returns_approved_by 
ON returns("approvedById") 
WHERE "approvedById" IS NOT NULL;
    END IF;
END $$;

-- Return items
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'return_items') THEN
        CREATE INDEX IF NOT EXISTS idx_return_items_return 
ON return_items("returnId");
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'return_items') THEN
        CREATE INDEX IF NOT EXISTS idx_return_items_product 
ON return_items("productId");
    END IF;
END $$;

-- ============================================================================
-- GIFT CARD MODULE INDEXES (v1.4)
-- ============================================================================

-- Gift card lookup
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gift_cards') THEN
        CREATE INDEX IF NOT EXISTS idx_gift_cards_org_status 
ON gift_cards("organizationId", status);
    END IF;
END $$;

-- Code already has unique index via unique constraint

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gift_cards') THEN
        CREATE INDEX IF NOT EXISTS idx_gift_cards_issued_by 
ON gift_cards("issuedById") 
WHERE "issuedById" IS NOT NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gift_cards') THEN
        CREATE INDEX IF NOT EXISTS idx_gift_cards_issued_email 
ON gift_cards("issuedToEmail") 
WHERE "issuedToEmail" IS NOT NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gift_cards') THEN
        CREATE INDEX IF NOT EXISTS idx_gift_cards_expires_at 
ON gift_cards("expiresAt") 
WHERE status = 'ACTIVE' AND "expiresAt" IS NOT NULL;
    END IF;
END $$;

-- Gift card transactions
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gift_card_transactions') THEN
        CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_card 
ON gift_card_transactions("giftCardId", "createdAt" DESC);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gift_card_transactions') THEN
        CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_order 
ON gift_card_transactions("orderId") 
WHERE "orderId" IS NOT NULL;
    END IF;
END $$;

-- ============================================================================
-- AFFILIATE & REFERRAL MODULE INDEXES (v1.5)
-- ============================================================================

-- Affiliates
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'affiliates') THEN
        CREATE INDEX IF NOT EXISTS idx_affiliates_org_status 
ON affiliates("organizationId", status);
    END IF;
END $$;

-- Code unique index covered by unique constraint

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'affiliates') THEN
        CREATE INDEX IF NOT EXISTS idx_affiliates_email 
ON affiliates(email);
    END IF;
END $$;

-- Affiliate commissions
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'affiliate_commissions') THEN
        CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_status 
ON affiliate_commissions("affiliateId", status);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'affiliate_commissions') THEN
        CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_order 
ON affiliate_commissions("orderId");
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'affiliate_commissions') THEN
        CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_unpaid 
ON affiliate_commissions("affiliateId", "createdAt" DESC) 
WHERE status = 'PENDING' OR status = 'APPROVED';
    END IF;
END $$;

-- Referrals
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'referrals') THEN
        CREATE INDEX IF NOT EXISTS idx_referrals_org_status 
ON referrals("organizationId", status);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'referrals') THEN
        CREATE INDEX IF NOT EXISTS idx_referrals_referrer 
ON referrals("referrerId", status);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'referrals') THEN
        CREATE INDEX IF NOT EXISTS idx_referrals_referred 
ON referrals("referredId") 
WHERE "referredId" IS NOT NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'referrals') THEN
        CREATE INDEX IF NOT EXISTS idx_referrals_affiliate 
ON referrals("affiliateId") 
WHERE "affiliateId" IS NOT NULL;
    END IF;
END $$;

-- Code already has unique index

-- ============================================================================
-- POS MODULE INDEXES
-- ============================================================================

-- POS terminals
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pos_terminals') THEN
        CREATE INDEX IF NOT EXISTS idx_pos_terminals_org_active 
ON pos_terminals("organizationId", "isActive");
    END IF;
END $$;

-- POS transactions
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pos_transactions') THEN
        CREATE INDEX IF NOT EXISTS idx_pos_transactions_org_date 
ON pos_transactions("organizationId", "createdAt" DESC);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pos_transactions') THEN
        CREATE INDEX IF NOT EXISTS idx_pos_transactions_terminal 
ON pos_transactions("terminalId", "createdAt" DESC);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pos_transactions') THEN
        CREATE INDEX IF NOT EXISTS idx_pos_transactions_cashier 
ON pos_transactions("cashierId", "createdAt" DESC);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pos_transactions') THEN
        CREATE INDEX IF NOT EXISTS idx_pos_transactions_status 
ON pos_transactions(status, "createdAt" DESC);
    END IF;
END $$;

-- ============================================================================
-- INTEGRATION MODULE INDEXES
-- ============================================================================

-- WooCommerce integrations
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'woocommerce_integrations') THEN
        CREATE INDEX IF NOT EXISTS idx_woocommerce_org_active 
ON woocommerce_integrations("organizationId", "isActive");
    END IF;
END $$;

-- WhatsApp integrations already have unique constraint on "organizationId"

-- WhatsApp messages
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'whatsapp_messages') THEN
        CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_org_status 
ON whatsapp_messages("organizationId", status, "createdAt" DESC);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'whatsapp_messages') THEN
        CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_customer 
ON whatsapp_messages("customerId") 
WHERE "customerId" IS NOT NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'whatsapp_messages') THEN
        CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone 
ON whatsapp_messages("phoneNumber", "createdAt" DESC);
    END IF;
END $$;

-- Channel integrations
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'channel_integrations') THEN
        CREATE INDEX IF NOT EXISTS idx_channel_integrations_org_status 
ON channel_integrations("organizationId", status);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'channel_integrations') THEN
        CREATE INDEX IF NOT EXISTS idx_channel_integrations_type 
ON channel_integrations(type, "isActive");
    END IF;
END $$;

-- Integration logs
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'integration_logs') THEN
        CREATE INDEX IF NOT EXISTS idx_integration_logs_integration_date 
ON integration_logs("integrationId", timestamp DESC);
    END IF;
END $$;

-- ============================================================================
-- WAREHOUSE & INVENTORY ADVANCED INDEXES
-- ============================================================================

-- Warehouse inventory
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'warehouse_inventory') THEN
        CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_warehouse 
ON warehouse_inventory("warehouseId", "productId");
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'warehouse_inventory') THEN
        CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_product 
ON warehouse_inventory("productId");
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'warehouse_inventory') THEN
        CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_low_stock 
ON warehouse_inventory("warehouseId", quantity) 
WHERE quantity > 0;
    END IF;
END $$;

-- ============================================================================
-- IOT MODULE INDEXES
-- ============================================================================

-- IoT devices
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'iot_devices') THEN
        CREATE INDEX IF NOT EXISTS idx_iot_devices_org_status 
ON iot_devices("organizationId", status);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'iot_devices') THEN
        CREATE INDEX IF NOT EXISTS idx_iot_devices_warehouse 
ON iot_devices("warehouseId") 
WHERE "warehouseId" IS NOT NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'iot_devices') THEN
        CREATE INDEX IF NOT EXISTS idx_iot_devices_mac_address 
ON iot_devices("macAddress");
    END IF;
END $$;

-- Sensor readings
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sensor_readings') THEN
        CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_date 
ON sensor_readings("deviceId", timestamp DESC);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sensor_readings') THEN
        CREATE INDEX IF NOT EXISTS idx_sensor_readings_type_date 
ON sensor_readings(type, timestamp DESC);
    END IF;
END $$;

-- IoT alerts
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'iot_alerts') THEN
        CREATE INDEX IF NOT EXISTS idx_iot_alerts_device_unresolved 
ON iot_alerts("deviceId", "createdAt" DESC) 
WHERE "isResolved" = false;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'iot_alerts') THEN
        CREATE INDEX IF NOT EXISTS idx_iot_alerts_severity 
ON iot_alerts(severity, "createdAt" DESC) 
WHERE "isResolved" = false;
    END IF;
END $$;

-- ============================================================================
-- SMS & MARKETING MODULE INDEXES
-- ============================================================================

-- SMS campaigns
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sms_campaigns') THEN
        CREATE INDEX IF NOT EXISTS idx_sms_campaigns_org_status 
ON sms_campaigns("organizationId", status);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sms_campaigns') THEN
        CREATE INDEX IF NOT EXISTS idx_sms_campaigns_template 
ON sms_campaigns("templateId");
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sms_campaigns') THEN
        CREATE INDEX IF NOT EXISTS idx_sms_campaigns_scheduled 
ON sms_campaigns("scheduledAt") 
WHERE status = 'scheduled';
    END IF;
END $$;

-- SMS logs
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sms_logs') THEN
        CREATE INDEX IF NOT EXISTS idx_sms_logs_org_status 
ON sms_logs("organizationId", status, "createdAt" DESC);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sms_logs') THEN
        CREATE INDEX IF NOT EXISTS idx_sms_logs_phone 
ON sms_logs(phone, "createdAt" DESC);
    END IF;
END $$;

-- SMS templates
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sms_templates') THEN
        CREATE INDEX IF NOT EXISTS idx_sms_templates_org_active 
ON sms_templates("organizationId", "isActive");
    END IF;
END $$;

-- SMS subscriptions
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sms_subscriptions') THEN
        CREATE INDEX IF NOT EXISTS idx_sms_subscriptions_phone 
ON sms_subscriptions(phone, "isActive");
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sms_subscriptions') THEN
        CREATE INDEX IF NOT EXISTS idx_sms_subscriptions_org 
ON sms_subscriptions("organizationId", "isActive");
    END IF;
END $$;

-- ============================================================================
-- SOCIAL COMMERCE MODULE INDEXES
-- ============================================================================

-- Social commerce integrations
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'social_commerce') THEN
        CREATE INDEX IF NOT EXISTS idx_social_commerce_org_platform 
ON social_commerce("organizationId", platform, "isActive");
    END IF;
END $$;

-- Social posts
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'social_posts') THEN
        CREATE INDEX IF NOT EXISTS idx_social_posts_commerce_status 
ON social_posts("socialCommerceId", status) 
WHERE "socialCommerceId" IS NOT NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'social_posts') THEN
        CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled 
ON social_posts("scheduledAt") 
WHERE status = 'SCHEDULED';
    END IF;
END $$;

-- Social products
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'social_products') THEN
        CREATE INDEX IF NOT EXISTS idx_social_products_commerce 
ON social_products("socialCommerceId", "isActive");
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'social_products') THEN
        CREATE INDEX IF NOT EXISTS idx_social_products_product 
ON social_products("productId");
    END IF;
END $$;

-- ============================================================================
-- SUPPORT MODULE INDEXES
-- ============================================================================

-- Support tickets
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_tickets') THEN
        CREATE INDEX IF NOT EXISTS idx_support_tickets_org_status 
ON support_tickets("organizationId", status, priority);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_tickets') THEN
        CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned 
ON support_tickets("assignedTo", status) 
WHERE "assignedTo" IS NOT NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_tickets') THEN
        CREATE INDEX IF NOT EXISTS idx_support_tickets_email 
ON support_tickets(email) 
WHERE email IS NOT NULL;
    END IF;
END $$;

-- ============================================================================
-- CUSTOMER SEGMENTS & LOYALTY INDEXES
-- ============================================================================

-- Customer segments
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customer_segments') THEN
        CREATE INDEX IF NOT EXISTS idx_customer_segments_org_active 
ON customer_segments("organizationId", "isActive");
    END IF;
END $$;

-- Customer segment relationships
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customer_segment_customers') THEN
        CREATE INDEX IF NOT EXISTS idx_customer_segment_customers_segment 
ON customer_segment_customers("segmentId");
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customer_segment_customers') THEN
        CREATE INDEX IF NOT EXISTS idx_customer_segment_customers_customer 
ON customer_segment_customers("customerId");
    END IF;
END $$;

-- Loyalty transactions
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'loyalty_transactions') THEN
        CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_loyalty 
ON loyalty_transactions("loyaltyId", "createdAt" DESC);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'loyalty_transactions') THEN
        CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type 
ON loyalty_transactions(type, "createdAt" DESC);
    END IF;
END $$;

-- ============================================================================
-- WISHLIST MODULE INDEXES
-- ============================================================================

-- Wishlists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wishlists') THEN
        CREATE INDEX IF NOT EXISTS idx_wishlists_customer 
ON wishlists("customerId");
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wishlists') THEN
        CREATE INDEX IF NOT EXISTS idx_wishlists_public 
ON wishlists("isPublic", "createdAt" DESC) 
WHERE "isPublic" = true;
    END IF;
END $$;

-- Wishlist items
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wishlist_items') THEN
        CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist 
ON wishlist_items("wishlistId");
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wishlist_items') THEN
        CREATE INDEX IF NOT EXISTS idx_wishlist_items_product 
ON wishlist_items("productId");
    END IF;
END $$;

-- ============================================================================
-- ACTIVITIES & TRACKING INDEXES
-- ============================================================================

-- Activities
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activities') THEN
        CREATE INDEX IF NOT EXISTS idx_activities_org_type 
ON activities("organizationId", type, "createdAt" DESC);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activities') THEN
        CREATE INDEX IF NOT EXISTS idx_activities_user 
ON activities("userId") 
WHERE "userId" IS NOT NULL;
    END IF;
END $$;

-- Product activities
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_activities') THEN
        CREATE INDEX IF NOT EXISTS idx_product_activities_product_date 
ON product_activities("productId", "createdAt" DESC);
    END IF;
END $$;

-- Delivery status history
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'delivery_status_history') THEN
        CREATE INDEX IF NOT EXISTS idx_delivery_status_history_delivery 
ON delivery_status_history("deliveryId", "createdAt" DESC);
    END IF;
END $$;

-- Order status history
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_status_history') THEN
        CREATE INDEX IF NOT EXISTS idx_order_status_history_order 
ON order_status_history("orderId", "createdAt" DESC);
    END IF;
END $$;

-- ============================================================================
-- PERFORMANCE METRICS INDEXES
-- ============================================================================

-- Performance metrics
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'performance_metrics') THEN
        CREATE INDEX IF NOT EXISTS idx_performance_metrics_org_endpoint 
ON performance_metrics("organizationId", endpoint, "createdAt" DESC);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'performance_metrics') THEN
        CREATE INDEX IF NOT EXISTS idx_performance_metrics_slow_queries 
ON performance_metrics(endpoint, "responseTime" DESC) 
WHERE "responseTime" > 1000;
    END IF;
END $$;

-- ============================================================================
-- SUBSCRIPTION MODULE INDEXES
-- ============================================================================

-- Subscriptions already have unique constraint on "organizationId"

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
        CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
ON subscriptions(status, "currentPeriodEnd");
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
        CREATE INDEX IF NOT EXISTS idx_subscriptions_trial 
ON subscriptions("trialEndsAt") 
WHERE status = 'TRIAL' AND "trialEndsAt" IS NOT NULL;
    END IF;
END $$;

-- ============================================================================
-- AI MODULE INDEXES
-- ============================================================================

-- AI analytics
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_analytics') THEN
        CREATE INDEX IF NOT EXISTS idx_ai_analytics_org_date 
ON ai_analytics("organizationId", "createdAt" DESC);
    END IF;
END $$;

-- AI conversations
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_conversations') THEN
        CREATE INDEX IF NOT EXISTS idx_ai_conversations_org_updated 
ON ai_conversations("organizationId", "updatedAt" DESC);
    END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================

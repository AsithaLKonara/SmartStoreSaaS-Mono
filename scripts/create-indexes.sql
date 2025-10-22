-- Database Indexing Script for SmartStore SaaS
-- This script creates optimized indexes for better query performance

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(categoryId);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(isActive);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(createdAt);
CREATE INDEX IF NOT EXISTS idx_products_organization ON products(organizationId);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customerId);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(createdAt);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, createdAt);
CREATE INDEX IF NOT EXISTS idx_orders_organization ON orders(organizationId);
CREATE INDEX IF NOT EXISTS idx_orders_total ON orders(total);

-- Customers table indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(createdAt);
CREATE INDEX IF NOT EXISTS idx_customers_organization ON customers(organizationId);

-- Order items table indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(orderId);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(productId);
CREATE INDEX IF NOT EXISTS idx_order_items_quantity ON order_items(quantity);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organizationId);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(isActive);

-- Organizations table indexes
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_organizations_subdomain ON organizations(subdomain);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(isActive);

-- Categories table indexes
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_organization ON categories(organizationId);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(isActive);

-- Inventory movements table indexes
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(productId);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(createdAt);

-- Payments table indexes
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(orderId);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(createdAt);

-- Reports table indexes
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_organization ON reports(organizationId);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(createdAt);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Support tickets table indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_organization ON support_tickets(organizationId);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(createdAt);

-- Performance metrics table indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_organization ON performance_metrics(organizationId);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(createdAt);

-- Analytics events table indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_organization ON analytics_events(organizationId);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(createdAt);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_products_org_active ON products(organizationId, isActive);
CREATE INDEX IF NOT EXISTS idx_orders_org_status ON orders(organizationId, status);
CREATE INDEX IF NOT EXISTS idx_customers_org_created ON customers(organizationId, createdAt);
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON orders(customerId, status);
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(categoryId, isActive);

-- Full-text search indexes (if supported by your database)
-- CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || description));
-- CREATE INDEX IF NOT EXISTS idx_customers_search ON customers USING gin(to_tsvector('english', name || ' ' || email));

-- Analyze tables after creating indexes (PostgreSQL)
-- ANALYZE products;
-- ANALYZE orders;
-- ANALYZE customers;
-- ANALYZE users;
-- ANALYZE organizations;

-- Show index usage statistics (PostgreSQL)
-- SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- ORDER BY idx_tup_read DESC;





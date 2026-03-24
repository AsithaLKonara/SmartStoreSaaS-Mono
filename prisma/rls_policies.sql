-- Enable RLS on core tables
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;

-- Create policy for users: can only see users in their own organization
CREATE POLICY user_tenant_isolation ON "users"
USING ("organizationId" = current_setting('app.current_organization_id', true));

-- Create policy for products: can only see products in their own organization
CREATE POLICY product_tenant_isolation ON "products"
USING ("organizationId" = current_setting('app.current_organization_id', true));

-- Create policy for orders: can only see orders in their own organization
CREATE POLICY order_tenant_isolation ON "orders"
USING ("organizationId" = current_setting('app.current_organization_id', true));

-- Create policy for categories: can only see categories in their own organization
CREATE POLICY category_tenant_isolation ON "categories"
USING ("organizationId" = current_setting('app.current_organization_id', true));

-- Exceptions for SUPER_ADMIN (if implemented via DB role or specific check)
-- For simplicity, policies above check the app-provided context.

# 🔍 SmartStore SaaS - Database Comparison Analysis

## 📋 **OVERVIEW**

This document compares the current database schema with our required collections to identify what exists, what's missing, and what needs to be created or modified.

---

## ✅ **EXISTING COLLECTIONS (Current Schema)**

### **Core Business Collections - ✅ COMPLETE**
1. **`users`** - ✅ Complete with MFA support
2. **`organizations`** - ✅ Complete with feature flags
3. **`customers`** - ✅ Complete with loyalty relation
4. **`products`** - ✅ Complete with variants support
5. **`product_variants`** - ✅ Complete
6. **`categories`** - ✅ Complete with hierarchical support
7. **`inventory_movements`** - ✅ Complete
8. **`orders`** - ✅ Complete with 5-6 character order numbers
9. **`order_items`** - ✅ Complete
10. **`order_status_history`** - ✅ Complete
11. **`payments`** - ✅ Complete (needs LKR currency update)

### **Courier & Delivery Collections - ✅ COMPLETE**
12. **`couriers`** - ✅ Complete with real-time tracking
13. **`deliveries`** - ✅ Complete with status management
14. **`delivery_status_history`** - ✅ Complete

### **Loyalty Collections - ✅ COMPLETE**
15. **`customer_loyalty`** - ✅ Complete with tier system

### **Warehouse Collections - ✅ COMPLETE**
16. **`warehouses`** - ✅ Complete

### **Integration Collections - ✅ COMPLETE**
17. **`woocommerce_integrations`** - ✅ Complete
18. **`whatsapp_integrations`** - ✅ Complete

### **Analytics & Reporting Collections - ✅ COMPLETE**
19. **`analytics`** - ✅ Complete
20. **`reports`** - ✅ Complete

### **Campaign Collections - ✅ COMPLETE**
21. **`campaigns`** - ✅ Complete
22. **`campaign_details`** - ✅ Complete

### **Additional Collections - ✅ COMPLETE**
23. **`product_media`** - ✅ Complete (bonus collection)
24. **`purchase_orders`** - ✅ Complete (bonus collection)

---

## ❌ **MISSING COLLECTIONS (Need to Create)**

### **Wishlist Collections - ❌ MISSING**
1. **`wishlists`** - Multi-wishlist support with sharing
2. **`wishlist_items`** - Items in customer wishlists

### **Enhanced Loyalty Collections - ❌ MISSING**
3. **`loyalty_transactions`** - Points earning and redemption history
4. **`loyalty_rewards`** - Available loyalty rewards
5. **`loyalty_campaigns`** - Loyalty marketing campaigns

### **Coupon & Discount Collections - ❌ MISSING**
6. **`coupons`** - Discount coupons and promotional codes
7. **`coupon_usage`** - Coupon usage tracking

### **Social Commerce Collections - ❌ MISSING**
8. **`social_commerce`** - Social media platform connections
9. **`social_products`** - Products synced to social platforms
10. **`social_posts`** - Social media posts and campaigns

### **Notification Collections - ❌ MISSING**
11. **`notifications`** - User notifications
12. **`notification_settings`** - User notification preferences

### **Security & Audit Collections - ❌ MISSING**
13. **`audit_logs`** - System activity logging
14. **`api_keys`** - API access management
15. **`rate_limits`** - API rate limiting

### **Mobile & PWA Collections - ❌ MISSING**
16. **`device_tokens`** - Push notification tokens
17. **`pwa_subscriptions`** - PWA push subscriptions

### **Localization Collections - ❌ MISSING**
18. **`translations`** - Multi-language support
19. **`currency_exchange_rates`** - Currency conversion rates

---

## 🔧 **COLLECTIONS NEEDING MODIFICATIONS**

### **Payment Collection - 🔧 NEEDS UPDATE**
**Current**: `payments` table
**Issues**:
- Currency default is "USD" instead of "LKR"
- Missing LankaQR payment method
- Missing local payment gateways (WebXPay, 2Checkout, bank gateways)
- Missing COD payment method

**Required Changes**:
```sql
-- Update currency default
currency String @default("LKR") // Changed from "USD"

-- Update payment methods
method String // Add: LANKAQR, COD, WEBXPAY, BANK_TRANSFER

-- Add new fields
gatewayResponse Json @default("{}") // Enhanced gateway response
refundAmount Float?
refundReason String?
processedAt DateTime?
```

### **Order Collection - 🔧 NEEDS UPDATE**
**Current**: `orders` table
**Issues**:
- Missing billing address field
- Missing currency field (defaults to LKR)

**Required Changes**:
```sql
-- Add missing fields
billingAddress Json? // Billing address object
currency String @default("LKR") // Currency field
```

---

## 📊 **SUMMARY STATISTICS**

### **Current Status**
- **Total Required Collections**: 42
- **Existing Collections**: 24
- **Missing Collections**: 18
- **Collections Needing Updates**: 2

### **Completion Status**
- **Core Business**: 100% ✅
- **Courier & Delivery**: 100% ✅
- **Loyalty System**: 20% ❌ (1/5 collections)
- **Wishlist System**: 0% ❌ (0/2 collections)
- **Coupon System**: 0% ❌ (0/2 collections)
- **Social Commerce**: 0% ❌ (0/3 collections)
- **Notifications**: 0% ❌ (0/2 collections)
- **Security & Audit**: 0% ❌ (0/3 collections)
- **Mobile & PWA**: 0% ❌ (0/2 collections)
- **Localization**: 0% ❌ (0/2 collections)

---

## 🚀 **IMMEDIATE ACTION PLAN**

### **Phase 1: Critical Missing Collections (Week 1)**
1. **Create Wishlist System**
   - `wishlists` table
   - `wishlist_items` table

2. **Create Coupon System**
   - `coupons` table
   - `coupon_usage` table

3. **Update Payment System**
   - Update `payments` table for LKR and local gateways
   - Update `orders` table for billing address

### **Phase 2: Enhanced Loyalty System (Week 2)**
4. **Create Enhanced Loyalty Collections**
   - `loyalty_transactions` table
   - `loyalty_rewards` table
   - `loyalty_campaigns` table

### **Phase 3: Social Commerce (Week 3)**
5. **Create Social Commerce Collections**
   - `social_commerce` table
   - `social_products` table
   - `social_posts` table

### **Phase 4: Notifications & Security (Week 4)**
6. **Create Notification System**
   - `notifications` table
   - `notification_settings` table

7. **Create Security & Audit System**
   - `audit_logs` table
   - `api_keys` table
   - `rate_limits` table

### **Phase 5: Mobile & Localization (Week 5)**
8. **Create Mobile & PWA Collections**
   - `device_tokens` table
   - `pwa_subscriptions` table

9. **Create Localization Collections**
   - `translations` table
   - `currency_exchange_rates` table

---

## 📝 **DETAILED MISSING COLLECTIONS**

### **1. Wishlist System**
```sql
-- wishlists
CREATE TABLE wishlists (
  id VARCHAR PRIMARY KEY,
  customer_id VARCHAR NOT NULL,
  organization_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  is_public BOOLEAN DEFAULT false,
  share_code VARCHAR UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- wishlist_items
CREATE TABLE wishlist_items (
  id VARCHAR PRIMARY KEY,
  wishlist_id VARCHAR NOT NULL,
  product_id VARCHAR NOT NULL,
  notes TEXT,
  added_at TIMESTAMP DEFAULT NOW()
);
```

### **2. Coupon System**
```sql
-- coupons
CREATE TABLE coupons (
  id VARCHAR PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  code VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL, -- PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING
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

-- coupon_usage
CREATE TABLE coupon_usage (
  id VARCHAR PRIMARY KEY,
  coupon_id VARCHAR NOT NULL,
  order_id VARCHAR NOT NULL,
  customer_id VARCHAR NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP DEFAULT NOW()
);
```

### **3. Enhanced Loyalty System**
```sql
-- loyalty_transactions
CREATE TABLE loyalty_transactions (
  id VARCHAR PRIMARY KEY,
  customer_id VARCHAR NOT NULL,
  organization_id VARCHAR NOT NULL,
  type VARCHAR NOT NULL, -- EARNED, REDEEMED, EXPIRED, ADJUSTED
  points INTEGER NOT NULL,
  reason VARCHAR NOT NULL,
  order_id VARCHAR,
  product_id VARCHAR,
  campaign_id VARCHAR,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- loyalty_rewards
CREATE TABLE loyalty_rewards (
  id VARCHAR PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  type VARCHAR NOT NULL, -- DISCOUNT, FREE_SHIPPING, PRODUCT, CASHBACK
  value DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP,
  valid_to TIMESTAMP,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  image VARCHAR,
  category VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- loyalty_campaigns
CREATE TABLE loyalty_campaigns (
  id VARCHAR PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL, -- BIRTHDAY, ANNIVERSARY, PURCHASE, REFERRAL, REVIEW, SOCIAL_SHARE
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
```

### **4. Social Commerce System**
```sql
-- social_commerce
CREATE TABLE social_commerce (
  id VARCHAR PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  platform VARCHAR NOT NULL, -- FACEBOOK, INSTAGRAM, TIKTOK, WHATSAPP, TWITTER
  platform_account_id VARCHAR NOT NULL,
  access_token VARCHAR NOT NULL,
  is_connected BOOLEAN DEFAULT false,
  settings JSON,
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- social_products
CREATE TABLE social_products (
  id VARCHAR PRIMARY KEY,
  product_id VARCHAR NOT NULL,
  social_commerce_id VARCHAR NOT NULL,
  platform_product_id VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'PENDING', -- ACTIVE, INACTIVE, PENDING, REJECTED
  last_sync TIMESTAMP,
  metadata JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- social_posts
CREATE TABLE social_posts (
  id VARCHAR PRIMARY KEY,
  social_commerce_id VARCHAR NOT NULL,
  organization_id VARCHAR NOT NULL,
  platform_post_id VARCHAR,
  type VARCHAR NOT NULL, -- PRODUCT, PROMOTION, STORY, REEL, LIVE
  content JSON NOT NULL,
  product_ids VARCHAR[],
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  status VARCHAR DEFAULT 'DRAFT', -- DRAFT, SCHEDULED, PUBLISHED, FAILED
  metrics JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **5. Notification System**
```sql
-- notifications
CREATE TABLE notifications (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  organization_id VARCHAR NOT NULL,
  type VARCHAR NOT NULL, -- ORDER, PAYMENT, DELIVERY, SYSTEM, PROMOTION
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  data JSON,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- notification_settings
CREATE TABLE notification_settings (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  organization_id VARCHAR NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  order_notifications BOOLEAN DEFAULT true,
  payment_notifications BOOLEAN DEFAULT true,
  delivery_notifications BOOLEAN DEFAULT true,
  system_notifications BOOLEAN DEFAULT true,
  promotion_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **6. Security & Audit System**
```sql
-- audit_logs
CREATE TABLE audit_logs (
  id VARCHAR PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  user_id VARCHAR,
  action VARCHAR NOT NULL,
  resource VARCHAR NOT NULL,
  resource_id VARCHAR,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- api_keys
CREATE TABLE api_keys (
  id VARCHAR PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  key VARCHAR NOT NULL, -- Hashed
  permissions VARCHAR[],
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- rate_limits
CREATE TABLE rate_limits (
  id VARCHAR PRIMARY KEY,
  identifier VARCHAR NOT NULL, -- IP, User ID, API Key
  endpoint VARCHAR NOT NULL,
  requests INTEGER DEFAULT 0,
  window_start TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **7. Mobile & PWA System**
```sql
-- device_tokens
CREATE TABLE device_tokens (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  organization_id VARCHAR NOT NULL,
  token VARCHAR NOT NULL,
  platform VARCHAR NOT NULL, -- IOS, ANDROID, WEB
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- pwa_subscriptions
CREATE TABLE pwa_subscriptions (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  organization_id VARCHAR NOT NULL,
  endpoint VARCHAR NOT NULL,
  keys JSON NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **8. Localization System**
```sql
-- translations
CREATE TABLE translations (
  id VARCHAR PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  language VARCHAR NOT NULL, -- en, si, ta
  resource VARCHAR NOT NULL,
  resource_id VARCHAR NOT NULL,
  field VARCHAR NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- currency_exchange_rates
CREATE TABLE currency_exchange_rates (
  id VARCHAR PRIMARY KEY,
  from_currency VARCHAR NOT NULL,
  to_currency VARCHAR NOT NULL,
  rate DECIMAL(10,6) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 **PRIORITY IMPLEMENTATION ORDER**

### **High Priority (Week 1-2)**
1. **Wishlist System** - Core user experience feature
2. **Coupon System** - Essential for promotions
3. **Payment Updates** - LKR currency and local gateways
4. **Enhanced Loyalty** - Customer retention

### **Medium Priority (Week 3-4)**
5. **Social Commerce** - Market expansion
6. **Notification System** - User engagement
7. **Security & Audit** - Compliance and monitoring

### **Low Priority (Week 5)**
8. **Mobile & PWA** - Enhanced mobile experience
9. **Localization** - Future expansion

---

## 🚀 **READY TO IMPLEMENT!**

The analysis shows that **57% of required collections already exist** (24/42), which is excellent! The core business functionality is complete, and we need to focus on the enhanced features that make SmartStore SaaS unique for the Sri Lankan market.

**Next Steps**:
1. Create the missing collections in priority order
2. Update existing collections for LKR currency
3. Test all new collections with the enhanced features
4. Deploy to staging for comprehensive testing

**This will complete the most comprehensive e-commerce platform for Sri Lanka!** 🇱🚀

## 📋 **OVERVIEW**

This document compares the current database schema with our required collections to identify what exists, what's missing, and what needs to be created or modified.

---

## ✅ **EXISTING COLLECTIONS (Current Schema)**

### **Core Business Collections - ✅ COMPLETE**
1. **`users`** - ✅ Complete with MFA support
2. **`organizations`** - ✅ Complete with feature flags
3. **`customers`** - ✅ Complete with loyalty relation
4. **`products`** - ✅ Complete with variants support
5. **`product_variants`** - ✅ Complete
6. **`categories`** - ✅ Complete with hierarchical support
7. **`inventory_movements`** - ✅ Complete
8. **`orders`** - ✅ Complete with 5-6 character order numbers
9. **`order_items`** - ✅ Complete
10. **`order_status_history`** - ✅ Complete
11. **`payments`** - ✅ Complete (needs LKR currency update)

### **Courier & Delivery Collections - ✅ COMPLETE**
12. **`couriers`** - ✅ Complete with real-time tracking
13. **`deliveries`** - ✅ Complete with status management
14. **`delivery_status_history`** - ✅ Complete

### **Loyalty Collections - ✅ COMPLETE**
15. **`customer_loyalty`** - ✅ Complete with tier system

### **Warehouse Collections - ✅ COMPLETE**
16. **`warehouses`** - ✅ Complete

### **Integration Collections - ✅ COMPLETE**
17. **`woocommerce_integrations`** - ✅ Complete
18. **`whatsapp_integrations`** - ✅ Complete

### **Analytics & Reporting Collections - ✅ COMPLETE**
19. **`analytics`** - ✅ Complete
20. **`reports`** - ✅ Complete

### **Campaign Collections - ✅ COMPLETE**
21. **`campaigns`** - ✅ Complete
22. **`campaign_details`** - ✅ Complete

### **Additional Collections - ✅ COMPLETE**
23. **`product_media`** - ✅ Complete (bonus collection)
24. **`purchase_orders`** - ✅ Complete (bonus collection)

---

## ❌ **MISSING COLLECTIONS (Need to Create)**

### **Wishlist Collections - ❌ MISSING**
1. **`wishlists`** - Multi-wishlist support with sharing
2. **`wishlist_items`** - Items in customer wishlists

### **Enhanced Loyalty Collections - ❌ MISSING**
3. **`loyalty_transactions`** - Points earning and redemption history
4. **`loyalty_rewards`** - Available loyalty rewards
5. **`loyalty_campaigns`** - Loyalty marketing campaigns

### **Coupon & Discount Collections - ❌ MISSING**
6. **`coupons`** - Discount coupons and promotional codes
7. **`coupon_usage`** - Coupon usage tracking

### **Social Commerce Collections - ❌ MISSING**
8. **`social_commerce`** - Social media platform connections
9. **`social_products`** - Products synced to social platforms
10. **`social_posts`** - Social media posts and campaigns

### **Notification Collections - ❌ MISSING**
11. **`notifications`** - User notifications
12. **`notification_settings`** - User notification preferences

### **Security & Audit Collections - ❌ MISSING**
13. **`audit_logs`** - System activity logging
14. **`api_keys`** - API access management
15. **`rate_limits`** - API rate limiting

### **Mobile & PWA Collections - ❌ MISSING**
16. **`device_tokens`** - Push notification tokens
17. **`pwa_subscriptions`** - PWA push subscriptions

### **Localization Collections - ❌ MISSING**
18. **`translations`** - Multi-language support
19. **`currency_exchange_rates`** - Currency conversion rates

---

## 🔧 **COLLECTIONS NEEDING MODIFICATIONS**

### **Payment Collection - 🔧 NEEDS UPDATE**
**Current**: `payments` table
**Issues**:
- Currency default is "USD" instead of "LKR"
- Missing LankaQR payment method
- Missing local payment gateways (WebXPay, 2Checkout, bank gateways)
- Missing COD payment method

**Required Changes**:
```sql
-- Update currency default
currency String @default("LKR") // Changed from "USD"

-- Update payment methods
method String // Add: LANKAQR, COD, WEBXPAY, BANK_TRANSFER

-- Add new fields
gatewayResponse Json @default("{}") // Enhanced gateway response
refundAmount Float?
refundReason String?
processedAt DateTime?
```

### **Order Collection - 🔧 NEEDS UPDATE**
**Current**: `orders` table
**Issues**:
- Missing billing address field
- Missing currency field (defaults to LKR)

**Required Changes**:
```sql
-- Add missing fields
billingAddress Json? // Billing address object
currency String @default("LKR") // Currency field
```

---

## 📊 **SUMMARY STATISTICS**

### **Current Status**
- **Total Required Collections**: 42
- **Existing Collections**: 24
- **Missing Collections**: 18
- **Collections Needing Updates**: 2

### **Completion Status**
- **Core Business**: 100% ✅
- **Courier & Delivery**: 100% ✅
- **Loyalty System**: 20% ❌ (1/5 collections)
- **Wishlist System**: 0% ❌ (0/2 collections)
- **Coupon System**: 0% ❌ (0/2 collections)
- **Social Commerce**: 0% ❌ (0/3 collections)
- **Notifications**: 0% ❌ (0/2 collections)
- **Security & Audit**: 0% ❌ (0/3 collections)
- **Mobile & PWA**: 0% ❌ (0/2 collections)
- **Localization**: 0% ❌ (0/2 collections)

---

## 🚀 **IMMEDIATE ACTION PLAN**

### **Phase 1: Critical Missing Collections (Week 1)**
1. **Create Wishlist System**
   - `wishlists` table
   - `wishlist_items` table

2. **Create Coupon System**
   - `coupons` table
   - `coupon_usage` table

3. **Update Payment System**
   - Update `payments` table for LKR and local gateways
   - Update `orders` table for billing address

### **Phase 2: Enhanced Loyalty System (Week 2)**
4. **Create Enhanced Loyalty Collections**
   - `loyalty_transactions` table
   - `loyalty_rewards` table
   - `loyalty_campaigns` table

### **Phase 3: Social Commerce (Week 3)**
5. **Create Social Commerce Collections**
   - `social_commerce` table
   - `social_products` table
   - `social_posts` table

### **Phase 4: Notifications & Security (Week 4)**
6. **Create Notification System**
   - `notifications` table
   - `notification_settings` table

7. **Create Security & Audit System**
   - `audit_logs` table
   - `api_keys` table
   - `rate_limits` table

### **Phase 5: Mobile & Localization (Week 5)**
8. **Create Mobile & PWA Collections**
   - `device_tokens` table
   - `pwa_subscriptions` table

9. **Create Localization Collections**
   - `translations` table
   - `currency_exchange_rates` table

---

## 📝 **DETAILED MISSING COLLECTIONS**

### **1. Wishlist System**
```sql
-- wishlists
CREATE TABLE wishlists (
  id VARCHAR PRIMARY KEY,
  customer_id VARCHAR NOT NULL,
  organization_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  is_public BOOLEAN DEFAULT false,
  share_code VARCHAR UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- wishlist_items
CREATE TABLE wishlist_items (
  id VARCHAR PRIMARY KEY,
  wishlist_id VARCHAR NOT NULL,
  product_id VARCHAR NOT NULL,
  notes TEXT,
  added_at TIMESTAMP DEFAULT NOW()
);
```

### **2. Coupon System**
```sql
-- coupons
CREATE TABLE coupons (
  id VARCHAR PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  code VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL, -- PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING
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

-- coupon_usage
CREATE TABLE coupon_usage (
  id VARCHAR PRIMARY KEY,
  coupon_id VARCHAR NOT NULL,
  order_id VARCHAR NOT NULL,
  customer_id VARCHAR NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP DEFAULT NOW()
);
```

### **3. Enhanced Loyalty System**
```sql
-- loyalty_transactions
CREATE TABLE loyalty_transactions (
  id VARCHAR PRIMARY KEY,
  customer_id VARCHAR NOT NULL,
  organization_id VARCHAR NOT NULL,
  type VARCHAR NOT NULL, -- EARNED, REDEEMED, EXPIRED, ADJUSTED
  points INTEGER NOT NULL,
  reason VARCHAR NOT NULL,
  order_id VARCHAR,
  product_id VARCHAR,
  campaign_id VARCHAR,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- loyalty_rewards
CREATE TABLE loyalty_rewards (
  id VARCHAR PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  type VARCHAR NOT NULL, -- DISCOUNT, FREE_SHIPPING, PRODUCT, CASHBACK
  value DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP,
  valid_to TIMESTAMP,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  image VARCHAR,
  category VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- loyalty_campaigns
CREATE TABLE loyalty_campaigns (
  id VARCHAR PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL, -- BIRTHDAY, ANNIVERSARY, PURCHASE, REFERRAL, REVIEW, SOCIAL_SHARE
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
```

### **4. Social Commerce System**
```sql
-- social_commerce
CREATE TABLE social_commerce (
  id VARCHAR PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  platform VARCHAR NOT NULL, -- FACEBOOK, INSTAGRAM, TIKTOK, WHATSAPP, TWITTER
  platform_account_id VARCHAR NOT NULL,
  access_token VARCHAR NOT NULL,
  is_connected BOOLEAN DEFAULT false,
  settings JSON,
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- social_products
CREATE TABLE social_products (
  id VARCHAR PRIMARY KEY,
  product_id VARCHAR NOT NULL,
  social_commerce_id VARCHAR NOT NULL,
  platform_product_id VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'PENDING', -- ACTIVE, INACTIVE, PENDING, REJECTED
  last_sync TIMESTAMP,
  metadata JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- social_posts
CREATE TABLE social_posts (
  id VARCHAR PRIMARY KEY,
  social_commerce_id VARCHAR NOT NULL,
  organization_id VARCHAR NOT NULL,
  platform_post_id VARCHAR,
  type VARCHAR NOT NULL, -- PRODUCT, PROMOTION, STORY, REEL, LIVE
  content JSON NOT NULL,
  product_ids VARCHAR[],
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  status VARCHAR DEFAULT 'DRAFT', -- DRAFT, SCHEDULED, PUBLISHED, FAILED
  metrics JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **5. Notification System**
```sql
-- notifications
CREATE TABLE notifications (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  organization_id VARCHAR NOT NULL,
  type VARCHAR NOT NULL, -- ORDER, PAYMENT, DELIVERY, SYSTEM, PROMOTION
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  data JSON,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- notification_settings
CREATE TABLE notification_settings (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  organization_id VARCHAR NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  order_notifications BOOLEAN DEFAULT true,
  payment_notifications BOOLEAN DEFAULT true,
  delivery_notifications BOOLEAN DEFAULT true,
  system_notifications BOOLEAN DEFAULT true,
  promotion_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **6. Security & Audit System**
```sql
-- audit_logs
CREATE TABLE audit_logs (
  id VARCHAR PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  user_id VARCHAR,
  action VARCHAR NOT NULL,
  resource VARCHAR NOT NULL,
  resource_id VARCHAR,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- api_keys
CREATE TABLE api_keys (
  id VARCHAR PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  key VARCHAR NOT NULL, -- Hashed
  permissions VARCHAR[],
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- rate_limits
CREATE TABLE rate_limits (
  id VARCHAR PRIMARY KEY,
  identifier VARCHAR NOT NULL, -- IP, User ID, API Key
  endpoint VARCHAR NOT NULL,
  requests INTEGER DEFAULT 0,
  window_start TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **7. Mobile & PWA System**
```sql
-- device_tokens
CREATE TABLE device_tokens (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  organization_id VARCHAR NOT NULL,
  token VARCHAR NOT NULL,
  platform VARCHAR NOT NULL, -- IOS, ANDROID, WEB
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- pwa_subscriptions
CREATE TABLE pwa_subscriptions (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  organization_id VARCHAR NOT NULL,
  endpoint VARCHAR NOT NULL,
  keys JSON NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **8. Localization System**
```sql
-- translations
CREATE TABLE translations (
  id VARCHAR PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  language VARCHAR NOT NULL, -- en, si, ta
  resource VARCHAR NOT NULL,
  resource_id VARCHAR NOT NULL,
  field VARCHAR NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- currency_exchange_rates
CREATE TABLE currency_exchange_rates (
  id VARCHAR PRIMARY KEY,
  from_currency VARCHAR NOT NULL,
  to_currency VARCHAR NOT NULL,
  rate DECIMAL(10,6) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 **PRIORITY IMPLEMENTATION ORDER**

### **High Priority (Week 1-2)**
1. **Wishlist System** - Core user experience feature
2. **Coupon System** - Essential for promotions
3. **Payment Updates** - LKR currency and local gateways
4. **Enhanced Loyalty** - Customer retention

### **Medium Priority (Week 3-4)**
5. **Social Commerce** - Market expansion
6. **Notification System** - User engagement
7. **Security & Audit** - Compliance and monitoring

### **Low Priority (Week 5)**
8. **Mobile & PWA** - Enhanced mobile experience
9. **Localization** - Future expansion

---

## 🚀 **READY TO IMPLEMENT!**

The analysis shows that **57% of required collections already exist** (24/42), which is excellent! The core business functionality is complete, and we need to focus on the enhanced features that make SmartStore SaaS unique for the Sri Lankan market.

**Next Steps**:
1. Create the missing collections in priority order
2. Update existing collections for LKR currency
3. Test all new collections with the enhanced features
4. Deploy to staging for comprehensive testing

**This will complete the most comprehensive e-commerce platform for Sri Lanka!** 🇱🚀

## 📋 **OVERVIEW**

This document compares the current database schema with our required collections to identify what exists, what's missing, and what needs to be created or modified.

---

## ✅ **EXISTING COLLECTIONS (Current Schema)**

### **Core Business Collections - ✅ COMPLETE**
1. **`users`** - ✅ Complete with MFA support
2. **`organizations`** - ✅ Complete with feature flags
3. **`customers`** - ✅ Complete with loyalty relation
4. **`products`** - ✅ Complete with variants support
5. **`product_variants`** - ✅ Complete
6. **`categories`** - ✅ Complete with hierarchical support
7. **`inventory_movements`** - ✅ Complete
8. **`orders`** - ✅ Complete with 5-6 character order numbers
9. **`order_items`** - ✅ Complete
10. **`order_status_history`** - ✅ Complete
11. **`payments`** - ✅ Complete (needs LKR currency update)

### **Courier & Delivery Collections - ✅ COMPLETE**
12. **`couriers`** - ✅ Complete with real-time tracking
13. **`deliveries`** - ✅ Complete with status management
14. **`delivery_status_history`** - ✅ Complete

### **Loyalty Collections - ✅ COMPLETE**
15. **`customer_loyalty`** - ✅ Complete with tier system

### **Warehouse Collections - ✅ COMPLETE**
16. **`warehouses`** - ✅ Complete

### **Integration Collections - ✅ COMPLETE**
17. **`woocommerce_integrations`** - ✅ Complete
18. **`whatsapp_integrations`** - ✅ Complete

### **Analytics & Reporting Collections - ✅ COMPLETE**
19. **`analytics`** - ✅ Complete
20. **`reports`** - ✅ Complete

### **Campaign Collections - ✅ COMPLETE**
21. **`campaigns`** - ✅ Complete
22. **`campaign_details`** - ✅ Complete

### **Additional Collections - ✅ COMPLETE**
23. **`product_media`** - ✅ Complete (bonus collection)
24. **`purchase_orders`** - ✅ Complete (bonus collection)

---

## ❌ **MISSING COLLECTIONS (Need to Create)**

### **Wishlist Collections - ❌ MISSING**
1. **`wishlists`** - Multi-wishlist support with sharing
2. **`wishlist_items`** - Items in customer wishlists

### **Enhanced Loyalty Collections - ❌ MISSING**
3. **`loyalty_transactions`** - Points earning and redemption history
4. **`loyalty_rewards`** - Available loyalty rewards
5. **`loyalty_campaigns`** - Loyalty marketing campaigns

### **Coupon & Discount Collections - ❌ MISSING**
6. **`coupons`** - Discount coupons and promotional codes
7. **`coupon_usage`** - Coupon usage tracking

### **Social Commerce Collections - ❌ MISSING**
8. **`social_commerce`** - Social media platform connections
9. **`social_products`** - Products synced to social platforms
10. **`social_posts`** - Social media posts and campaigns

### **Notification Collections - ❌ MISSING**
11. **`notifications`** - User notifications
12. **`notification_settings`** - User notification preferences

### **Security & Audit Collections - ❌ MISSING**
13. **`audit_logs`** - System activity logging
14. **`api_keys`** - API access management
15. **`rate_limits`** - API rate limiting

### **Mobile & PWA Collections - ❌ MISSING**
16. **`device_tokens`** - Push notification tokens
17. **`pwa_subscriptions`** - PWA push subscriptions

### **Localization Collections - ❌ MISSING**
18. **`translations`** - Multi-language support
19. **`currency_exchange_rates`** - Currency conversion rates

---

## 🔧 **COLLECTIONS NEEDING MODIFICATIONS**

### **Payment Collection - 🔧 NEEDS UPDATE**
**Current**: `payments` table
**Issues**:
- Currency default is "USD" instead of "LKR"
- Missing LankaQR payment method
- Missing local payment gateways (WebXPay, 2Checkout, bank gateways)
- Missing COD payment method

**Required Changes**:
```sql
-- Update currency default
currency String @default("LKR") // Changed from "USD"

-- Update payment methods
method String // Add: LANKAQR, COD, WEBXPAY, BANK_TRANSFER

-- Add new fields
gatewayResponse Json @default("{}") // Enhanced gateway response
refundAmount Float?
refundReason String?
processedAt DateTime?
```

### **Order Collection - 🔧 NEEDS UPDATE**
**Current**: `orders` table
**Issues**:
- Missing billing address field
- Missing currency field (defaults to LKR)

**Required Changes**:
```sql
-- Add missing fields
billingAddress Json? // Billing address object
currency String @default("LKR") // Currency field
```

---

## 📊 **SUMMARY STATISTICS**

### **Current Status**
- **Total Required Collections**: 42
- **Existing Collections**: 24
- **Missing Collections**: 18
- **Collections Needing Updates**: 2

### **Completion Status**
- **Core Business**: 100% ✅
- **Courier & Delivery**: 100% ✅
- **Loyalty System**: 20% ❌ (1/5 collections)
- **Wishlist System**: 0% ❌ (0/2 collections)
- **Coupon System**: 0% ❌ (0/2 collections)
- **Social Commerce**: 0% ❌ (0/3 collections)
- **Notifications**: 0% ❌ (0/2 collections)
- **Security & Audit**: 0% ❌ (0/3 collections)
- **Mobile & PWA**: 0% ❌ (0/2 collections)
- **Localization**: 0% ❌ (0/2 collections)

---

## 🚀 **IMMEDIATE ACTION PLAN**

### **Phase 1: Critical Missing Collections (Week 1)**
1. **Create Wishlist System**
   - `wishlists` table
   - `wishlist_items` table

2. **Create Coupon System**
   - `coupons` table
   - `coupon_usage` table

3. **Update Payment System**
   - Update `payments` table for LKR and local gateways
   - Update `orders` table for billing address

### **Phase 2: Enhanced Loyalty System (Week 2)**
4. **Create Enhanced Loyalty Collections**
   - `loyalty_transactions` table
   - `loyalty_rewards` table
   - `loyalty_campaigns` table

### **Phase 3: Social Commerce (Week 3)**
5. **Create Social Commerce Collections**
   - `social_commerce` table
   - `social_products` table
   - `social_posts` table

### **Phase 4: Notifications & Security (Week 4)**
6. **Create Notification System**
   - `notifications` table
   - `notification_settings` table

7. **Create Security & Audit System**
   - `audit_logs` table
   - `api_keys` table
   - `rate_limits` table

### **Phase 5: Mobile & Localization (Week 5)**
8. **Create Mobile & PWA Collections**
   - `device_tokens` table
   - `pwa_subscriptions` table

9. **Create Localization Collections**
   - `translations` table
   - `currency_exchange_rates` table

---

## 📝 **DETAILED MISSING COLLECTIONS**

### **1. Wishlist System**
```sql
-- wishlists
CREATE TABLE wishlists (
  id VARCHAR PRIMARY KEY,
  customer_id VARCHAR NOT NULL,
  organization_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  is_public BOOLEAN DEFAULT false,
  share_code VARCHAR UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- wishlist_items
CREATE TABLE wishlist_items (
  id VARCHAR PRIMARY KEY,
  wishlist_id VARCHAR NOT NULL,
  product_id VARCHAR NOT NULL,
  notes TEXT,
  added_at TIMESTAMP DEFAULT NOW()
);
```

### **2. Coupon System**
```sql
-- coupons
CREATE TABLE coupons (
  id VARCHAR PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  code VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL, -- PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING
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

-- coupon_usage
CREATE TABLE coupon_usage (
  id VARCHAR PRIMARY KEY,
  coupon_id VARCHAR NOT NULL,
  order_id VARCHAR NOT NULL,
  customer_id VARCHAR NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP DEFAULT NOW()
);
```

### **3. Enhanced Loyalty System**
```sql
-- loyalty_transactions
CREATE TABLE loyalty_transactions (
  id VARCHAR PRIMARY KEY,
  customer_id VARCHAR NOT NULL,
  organization_id VARCHAR NOT NULL,
  type VARCHAR NOT NULL, -- EARNED, REDEEMED, EXPIRED, ADJUSTED
  points INTEGER NOT NULL,
  reason VARCHAR NOT NULL,
  order_id VARCHAR,
  product_id VARCHAR,
  campaign_id VARCHAR,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- loyalty_rewards
CREATE TABLE loyalty_rewards (
  id VARCHAR PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  type VARCHAR NOT NULL, -- DISCOUNT, FREE_SHIPPING, PRODUCT, CASHBACK
  value DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP,
  valid_to TIMESTAMP,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  image VARCHAR,
  category VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- loyalty_campaigns
CREATE TABLE loyalty_campaigns (
  id VARCHAR PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL, -- BIRTHDAY, ANNIVERSARY, PURCHASE, REFERRAL, REVIEW, SOCIAL_SHARE
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
```

### **4. Social Commerce System**
```sql
-- social_commerce
CREATE TABLE social_commerce (
  id VARCHAR PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  platform VARCHAR NOT NULL, -- FACEBOOK, INSTAGRAM, TIKTOK, WHATSAPP, TWITTER
  platform_account_id VARCHAR NOT NULL,
  access_token VARCHAR NOT NULL,
  is_connected BOOLEAN DEFAULT false,
  settings JSON,
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- social_products
CREATE TABLE social_products (
  id VARCHAR PRIMARY KEY,
  product_id VARCHAR NOT NULL,
  social_commerce_id VARCHAR NOT NULL,
  platform_product_id VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'PENDING', -- ACTIVE, INACTIVE, PENDING, REJECTED
  last_sync TIMESTAMP,
  metadata JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- social_posts
CREATE TABLE social_posts (
  id VARCHAR PRIMARY KEY,
  social_commerce_id VARCHAR NOT NULL,
  organization_id VARCHAR NOT NULL,
  platform_post_id VARCHAR,
  type VARCHAR NOT NULL, -- PRODUCT, PROMOTION, STORY, REEL, LIVE
  content JSON NOT NULL,
  product_ids VARCHAR[],
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  status VARCHAR DEFAULT 'DRAFT', -- DRAFT, SCHEDULED, PUBLISHED, FAILED
  metrics JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **5. Notification System**
```sql
-- notifications
CREATE TABLE notifications (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  organization_id VARCHAR NOT NULL,
  type VARCHAR NOT NULL, -- ORDER, PAYMENT, DELIVERY, SYSTEM, PROMOTION
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  data JSON,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- notification_settings
CREATE TABLE notification_settings (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  organization_id VARCHAR NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  order_notifications BOOLEAN DEFAULT true,
  payment_notifications BOOLEAN DEFAULT true,
  delivery_notifications BOOLEAN DEFAULT true,
  system_notifications BOOLEAN DEFAULT true,
  promotion_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **6. Security & Audit System**
```sql
-- audit_logs
CREATE TABLE audit_logs (
  id VARCHAR PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  user_id VARCHAR,
  action VARCHAR NOT NULL,
  resource VARCHAR NOT NULL,
  resource_id VARCHAR,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- api_keys
CREATE TABLE api_keys (
  id VARCHAR PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  key VARCHAR NOT NULL, -- Hashed
  permissions VARCHAR[],
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- rate_limits
CREATE TABLE rate_limits (
  id VARCHAR PRIMARY KEY,
  identifier VARCHAR NOT NULL, -- IP, User ID, API Key
  endpoint VARCHAR NOT NULL,
  requests INTEGER DEFAULT 0,
  window_start TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **7. Mobile & PWA System**
```sql
-- device_tokens
CREATE TABLE device_tokens (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  organization_id VARCHAR NOT NULL,
  token VARCHAR NOT NULL,
  platform VARCHAR NOT NULL, -- IOS, ANDROID, WEB
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- pwa_subscriptions
CREATE TABLE pwa_subscriptions (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  organization_id VARCHAR NOT NULL,
  endpoint VARCHAR NOT NULL,
  keys JSON NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **8. Localization System**
```sql
-- translations
CREATE TABLE translations (
  id VARCHAR PRIMARY KEY,
  organization_id VARCHAR NOT NULL,
  language VARCHAR NOT NULL, -- en, si, ta
  resource VARCHAR NOT NULL,
  resource_id VARCHAR NOT NULL,
  field VARCHAR NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- currency_exchange_rates
CREATE TABLE currency_exchange_rates (
  id VARCHAR PRIMARY KEY,
  from_currency VARCHAR NOT NULL,
  to_currency VARCHAR NOT NULL,
  rate DECIMAL(10,6) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 **PRIORITY IMPLEMENTATION ORDER**

### **High Priority (Week 1-2)**
1. **Wishlist System** - Core user experience feature
2. **Coupon System** - Essential for promotions
3. **Payment Updates** - LKR currency and local gateways
4. **Enhanced Loyalty** - Customer retention

### **Medium Priority (Week 3-4)**
5. **Social Commerce** - Market expansion
6. **Notification System** - User engagement
7. **Security & Audit** - Compliance and monitoring

### **Low Priority (Week 5)**
8. **Mobile & PWA** - Enhanced mobile experience
9. **Localization** - Future expansion

---

## 🚀 **READY TO IMPLEMENT!**

The analysis shows that **57% of required collections already exist** (24/42), which is excellent! The core business functionality is complete, and we need to focus on the enhanced features that make SmartStore SaaS unique for the Sri Lankan market.

**Next Steps**:
1. Create the missing collections in priority order
2. Update existing collections for LKR currency
3. Test all new collections with the enhanced features
4. Deploy to staging for comprehensive testing

**This will complete the most comprehensive e-commerce platform for Sri Lanka!** 🇱🚀

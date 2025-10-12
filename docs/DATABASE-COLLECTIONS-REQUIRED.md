# 🗄️ SmartStore SaaS - Required Database Collections

## 📋 **OVERVIEW**

This document lists all required database collections (tables) for the enhanced SmartStore SaaS platform, including core business entities, new features, and supporting collections.

---

## 🏗️ **CORE BUSINESS COLLECTIONS**

### **1. User Management**
```sql
-- users
- id (Primary Key)
- email (Unique)
- name
- password (Hashed)
- image
- role (ADMIN, STAFF, USER)
- isActive
- emailVerified
- stripeCustomerId
- mfaEnabled
- mfaSecret
- mfaBackupCodes (Array)
- deletedAt (Soft Delete)
- organizationId (Foreign Key)
- createdAt
- updatedAt
```

### **2. Organization Management**
```sql
-- organizations
- id (Primary Key)
- name
- domain (Unique)
- plan (FREE, BASIC, PRO, ENTERPRISE)
- status (ACTIVE, SUSPENDED, CANCELLED)
- settings (JSON)
- features (JSON) -- Feature flags and permissions
- createdAt
- updatedAt
```

### **3. Customer Management**
```sql
-- customers
- id (Primary Key)
- email
- name
- phone
- address (JSON)
- organizationId (Foreign Key)
- status (ACTIVE, INACTIVE, BLOCKED)
- totalOrders
- totalSpent
- createdAt
- updatedAt
```

---

## 🛍️ **PRODUCT & INVENTORY COLLECTIONS**

### **4. Product Management**
```sql
-- products
- id (Primary Key)
- name
- sku (Unique)
- description
- price
- currency (Default: LKR)
- categoryId (Foreign Key)
- organizationId (Foreign Key)
- status (ACTIVE, INACTIVE, DRAFT)
- inventory (JSON) -- Stock levels, variants
- images (Array)
- tags (Array)
- weight
- dimensions (JSON)
- seoTitle
- seoDescription
- createdById (Foreign Key)
- updatedById (Foreign Key)
- createdAt
- updatedAt
```

### **5. Product Variants**
```sql
-- product_variants
- id (Primary Key)
- productId (Foreign Key)
- name
- value
- price
- sku
- inventory
- images (Array)
- isActive
- createdAt
- updatedAt
```

### **6. Categories**
```sql
-- categories
- id (Primary Key)
- name
- slug
- description
- parentId (Foreign Key) -- For hierarchical categories
- organizationId (Foreign Key)
- image
- isActive
- sortOrder
- createdAt
- updatedAt
```

### **7. Inventory Management**
```sql
-- inventory_movements
- id (Primary Key)
- productId (Foreign Key)
- warehouseId (Foreign Key)
- organizationId (Foreign Key)
- type (IN, OUT, ADJUSTMENT, TRANSFER)
- quantity
- reason
- reference (Order ID, etc.)
- createdById (Foreign Key)
- createdAt
```

---

## 🛒 **ORDER & PAYMENT COLLECTIONS**

### **8. Orders**
```sql
-- orders
- id (Primary Key)
- orderNumber (5-6 character unique)
- customerId (Foreign Key)
- organizationId (Foreign Key)
- status (PENDING, CONFIRMED, PROCESSING, PACKED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED)
- shippingStatus (PENDING, PROCESSING, DISPATCHED, DELIVERED, RETURNED)
- total
- subtotal
- tax
- shipping
- discount
- currency (Default: LKR)
- shippingAddress (JSON)
- billingAddress (JSON)
- courierId (Foreign Key)
- trackingNumber
- notes
- createdById (Foreign Key)
- updatedById (Foreign Key)
- createdAt
- updatedAt
```

### **9. Order Items**
```sql
-- order_items
- id (Primary Key)
- orderId (Foreign Key)
- productId (Foreign Key)
- variantId (Foreign Key)
- quantity
- price
- total
- createdAt
```

### **10. Order Status History**
```sql
-- order_status_history
- id (Primary Key)
- orderId (Foreign Key)
- status
- newStatus
- reason
- notes
- changedById (Foreign Key)
- createdAt
```

### **11. Payments**
```sql
-- payments
- id (Primary Key)
- orderId (Foreign Key)
- customerId (Foreign Key)
- organizationId (Foreign Key)
- amount
- currency (Default: LKR)
- method (STRIPE, PAYPAL, PAYHERE, LANKAQR, COD, BANK_TRANSFER)
- status (PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED)
- gatewayTransactionId
- gatewayResponse (JSON)
- refundAmount
- refundReason
- processedAt
- createdAt
- updatedAt
```

---

## 🚚 **COURIER & DELIVERY COLLECTIONS**

### **12. Couriers**
```sql
-- couriers
- id (Primary Key)
- name
- email
- phone
- vehicleType
- status (AVAILABLE, BUSY, OFFLINE)
- organizationId (Foreign Key)
- currentLocation (JSON)
- lastSeen
- totalEarnings
- rating
- isActive
- createdAt
- updatedAt
```

### **13. Deliveries**
```sql
-- deliveries
- id (Primary Key)
- orderId (Foreign Key)
- courierId (Foreign Key)
- organizationId (Foreign Key)
- trackingNumber (8-character with TRK prefix)
- status (PENDING, PROCESSING, DISPATCHED, DELIVERED, RETURNED)
- deliveryProof (String)
- returnReason (String)
- estimatedDeliveryTime
- actualDeliveryTime
- address (JSON)
- items (JSON)
- specialInstructions
- createdAt
- updatedAt
```

### **14. Delivery Status History**
```sql
-- delivery_status_history
- id (Primary Key)
- deliveryId (Foreign Key)
- status
- newStatus
- reason
- notes
- location (JSON)
- changedById (Foreign Key)
- createdAt
```

---

## 🎁 **WISHLIST & LOYALTY COLLECTIONS**

### **15. Wishlists**
```sql
-- wishlists
- id (Primary Key)
- customerId (Foreign Key)
- organizationId (Foreign Key)
- name
- isPublic
- shareCode
- createdAt
- updatedAt
```

### **16. Wishlist Items**
```sql
-- wishlist_items
- id (Primary Key)
- wishlistId (Foreign Key)
- productId (Foreign Key)
- notes
- addedAt
```

### **17. Customer Loyalty**
```sql
-- customer_loyalty
- id (Primary Key)
- customerId (Foreign Key)
- organizationId (Foreign Key)
- points
- tier (BRONZE, SILVER, GOLD, PLATINUM)
- totalEarned
- totalRedeemed
- lastActivity
- expiresAt
- createdAt
- updatedAt
```

### **18. Loyalty Transactions**
```sql
-- loyalty_transactions
- id (Primary Key)
- customerId (Foreign Key)
- organizationId (Foreign Key)
- type (EARNED, REDEEMED, EXPIRED, ADJUSTED)
- points
- reason
- orderId (Foreign Key)
- productId (Foreign Key)
- campaignId (Foreign Key)
- expiresAt
- createdAt
```

### **19. Loyalty Rewards**
```sql
-- loyalty_rewards
- id (Primary Key)
- organizationId (Foreign Key)
- name
- description
- pointsRequired
- type (DISCOUNT, FREE_SHIPPING, PRODUCT, CASHBACK)
- value
- isActive
- validFrom
- validTo
- usageLimit
- usedCount
- image
- category
- createdAt
- updatedAt
```

### **20. Loyalty Campaigns**
```sql
-- loyalty_campaigns
- id (Primary Key)
- organizationId (Foreign Key)
- name
- description
- type (BIRTHDAY, ANNIVERSARY, PURCHASE, REFERRAL, REVIEW, SOCIAL_SHARE)
- pointsMultiplier
- bonusPoints
- conditions (JSON)
- isActive
- validFrom
- validTo
- usageLimit
- usedCount
- createdAt
- updatedAt
```

---

## 💳 **COUPON & DISCOUNT COLLECTIONS**

### **21. Coupons**
```sql
-- coupons
- id (Primary Key)
- organizationId (Foreign Key)
- code (Unique)
- name
- description
- type (PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING)
- value
- minOrderAmount
- maxDiscountAmount
- usageLimit
- usedCount
- isActive
- validFrom
- validTo
- createdAt
- updatedAt
```

### **22. Coupon Usage**
```sql
-- coupon_usage
- id (Primary Key)
- couponId (Foreign Key)
- orderId (Foreign Key)
- customerId (Foreign Key)
- discountAmount
- usedAt
```

---

## 📊 **ANALYTICS & REPORTING COLLECTIONS**

### **23. Analytics**
```sql
-- analytics
- id (Primary Key)
- organizationId (Foreign Key)
- type (REVENUE, ORDERS, CUSTOMERS, PRODUCTS, COURIER, PAYMENT)
- data (JSON)
- period (DAILY, WEEKLY, MONTHLY, YEARLY)
- date
- createdAt
```

### **24. Reports**
```sql
-- reports
- id (Primary Key)
- organizationId (Foreign Key)
- name
- type (SALES, INVENTORY, CUSTOMER, COURIER, PAYMENT)
- data (JSON)
- format (PDF, CSV, EXCEL)
- status (GENERATING, COMPLETED, FAILED)
- createdById (Foreign Key)
- createdAt
- completedAt
```

---

## 🏪 **WAREHOUSE COLLECTIONS**

### **25. Warehouses**
```sql
-- warehouses
- id (Primary Key)
- organizationId (Foreign Key)
- name
- address (JSON)
- contactPerson
- phone
- email
- isActive
- createdAt
- updatedAt
```

### **26. Warehouse Inventory**
```sql
-- warehouse_inventory
- id (Primary Key)
- warehouseId (Foreign Key)
- productId (Foreign Key)
- quantity
- reservedQuantity
- availableQuantity
- reorderLevel
- maxLevel
- lastUpdated
- createdAt
- updatedAt
```

---

## 🔗 **INTEGRATION COLLECTIONS**

### **27. WooCommerce Integrations**
```sql
-- woo_commerce_integrations
- id (Primary Key)
- organizationId (Foreign Key)
- storeUrl
- consumerKey
- consumerSecret
- isActive
- lastSync
- settings (JSON)
- createdAt
- updatedAt
```

### **28. WhatsApp Integrations**
```sql
-- whatsapp_integrations
- id (Primary Key)
- organizationId (Foreign Key)
- phoneNumberId
- accessToken
- webhookToken
- isActive
- settings (JSON)
- createdAt
- updatedAt
```

### **29. Social Commerce**
```sql
-- social_commerce
- id (Primary Key)
- organizationId (Foreign Key)
- platform (FACEBOOK, INSTAGRAM, TIKTOK, WHATSAPP, TWITTER)
- platformAccountId
- accessToken
- isConnected
- settings (JSON)
- lastSync
- createdAt
- updatedAt
```

### **30. Social Products**
```sql
-- social_products
- id (Primary Key)
- productId (Foreign Key)
- socialCommerceId (Foreign Key)
- platformProductId
- status (ACTIVE, INACTIVE, PENDING, REJECTED)
- lastSync
- metadata (JSON)
- createdAt
- updatedAt
```

### **31. Social Posts**
```sql
-- social_posts
- id (Primary Key)
- socialCommerceId (Foreign Key)
- organizationId (Foreign Key)
- platformPostId
- type (PRODUCT, PROMOTION, STORY, REEL, LIVE)
- content (JSON)
- productIds (Array)
- scheduledAt
- publishedAt
- status (DRAFT, SCHEDULED, PUBLISHED, FAILED)
- metrics (JSON)
- createdAt
- updatedAt
```

---

## 🎯 **CAMPAIGN & MARKETING COLLECTIONS**

### **32. Campaigns**
```sql
-- campaigns
- id (Primary Key)
- organizationId (Foreign Key)
- name
- description
- type (EMAIL, SMS, PUSH, SOCIAL)
- status (DRAFT, ACTIVE, PAUSED, COMPLETED)
- targetAudience (JSON)
- content (JSON)
- schedule (JSON)
- metrics (JSON)
- createdById (Foreign Key)
- createdAt
- updatedAt
```

### **33. Campaign Recipients**
```sql
-- campaign_recipients
- id (Primary Key)
- campaignId (Foreign Key)
- customerId (Foreign Key)
- status (PENDING, SENT, DELIVERED, OPENED, CLICKED, FAILED)
- sentAt
- deliveredAt
- openedAt
- clickedAt
```

---

## 🔔 **NOTIFICATION COLLECTIONS**

### **34. Notifications**
```sql
-- notifications
- id (Primary Key)
- userId (Foreign Key)
- organizationId (Foreign Key)
- type (ORDER, PAYMENT, DELIVERY, SYSTEM, PROMOTION)
- title
- message
- data (JSON)
- isRead
- readAt
- createdAt
```

### **35. Notification Settings**
```sql
-- notification_settings
- id (Primary Key)
- userId (Foreign Key)
- organizationId (Foreign Key)
- emailEnabled
- smsEnabled
- pushEnabled
- orderNotifications
- paymentNotifications
- deliveryNotifications
- systemNotifications
- promotionNotifications
- createdAt
- updatedAt
```

---

## 🔒 **SECURITY & AUDIT COLLECTIONS**

### **36. Audit Logs**
```sql
-- audit_logs
- id (Primary Key)
- organizationId (Foreign Key)
- userId (Foreign Key)
- action
- resource
- resourceId
- oldValues (JSON)
- newValues (JSON)
- ipAddress
- userAgent
- createdAt
```

### **37. API Keys**
```sql
-- api_keys
- id (Primary Key)
- organizationId (Foreign Key)
- name
- key (Hashed)
- permissions (Array)
- isActive
- lastUsed
- expiresAt
- createdAt
- updatedAt
```

### **38. Rate Limits**
```sql
-- rate_limits
- id (Primary Key)
- identifier (IP, User ID, API Key)
- endpoint
- requests
- windowStart
- createdAt
- updatedAt
```

---

## 📱 **MOBILE & PWA COLLECTIONS**

### **39. Device Tokens**
```sql
-- device_tokens
- id (Primary Key)
- userId (Foreign Key)
- organizationId (Foreign Key)
- token
- platform (IOS, ANDROID, WEB)
- isActive
- lastUsed
- createdAt
- updatedAt
```

### **40. PWA Subscriptions**
```sql
-- pwa_subscriptions
- id (Primary Key)
- userId (Foreign Key)
- organizationId (Foreign Key)
- endpoint
- keys (JSON)
- isActive
- createdAt
- updatedAt
```

---

## 🌐 **LOCALIZATION COLLECTIONS**

### **41. Translations**
```sql
-- translations
- id (Primary Key)
- organizationId (Foreign Key)
- language (en, si, ta)
- resource
- resourceId
- field
- value
- createdAt
- updatedAt
```

### **42. Currency Exchange Rates**
```sql
-- currency_exchange_rates
- id (Primary Key)
- fromCurrency
- toCurrency
- rate
- date
- createdAt
```

---

## 📈 **SUMMARY**

### **Total Collections: 42**

**Core Business (11)**: Users, Organizations, Customers, Products, Product Variants, Categories, Inventory Movements, Orders, Order Items, Order Status History, Payments

**Courier & Delivery (3)**: Couriers, Deliveries, Delivery Status History

**Wishlist & Loyalty (6)**: Wishlists, Wishlist Items, Customer Loyalty, Loyalty Transactions, Loyalty Rewards, Loyalty Campaigns

**Coupon & Discount (2)**: Coupons, Coupon Usage

**Analytics & Reporting (2)**: Analytics, Reports

**Warehouse (2)**: Warehouses, Warehouse Inventory

**Integration (5)**: WooCommerce, WhatsApp, Social Commerce, Social Products, Social Posts

**Campaign & Marketing (2)**: Campaigns, Campaign Recipients

**Notification (2)**: Notifications, Notification Settings

**Security & Audit (3)**: Audit Logs, API Keys, Rate Limits

**Mobile & PWA (2)**: Device Tokens, PWA Subscriptions

**Localization (2)**: Translations, Currency Exchange Rates

---

## 🚀 **IMPLEMENTATION NOTES**

1. **All collections include** `organizationId` for multi-tenant isolation
2. **Soft deletes** implemented where needed (`deletedAt` field)
3. **Audit trails** maintained with `createdAt`, `updatedAt`, and user tracking
4. **JSON fields** used for flexible data storage (addresses, settings, metadata)
5. **Indexes** should be created on frequently queried fields
6. **Foreign key constraints** ensure data integrity
7. **Unique constraints** on business-critical fields (email, SKU, order numbers)

This comprehensive collection structure supports all the enhanced features of SmartStore SaaS while maintaining data integrity and multi-tenant isolation! 🎯

## 📋 **OVERVIEW**

This document lists all required database collections (tables) for the enhanced SmartStore SaaS platform, including core business entities, new features, and supporting collections.

---

## 🏗️ **CORE BUSINESS COLLECTIONS**

### **1. User Management**
```sql
-- users
- id (Primary Key)
- email (Unique)
- name
- password (Hashed)
- image
- role (ADMIN, STAFF, USER)
- isActive
- emailVerified
- stripeCustomerId
- mfaEnabled
- mfaSecret
- mfaBackupCodes (Array)
- deletedAt (Soft Delete)
- organizationId (Foreign Key)
- createdAt
- updatedAt
```

### **2. Organization Management**
```sql
-- organizations
- id (Primary Key)
- name
- domain (Unique)
- plan (FREE, BASIC, PRO, ENTERPRISE)
- status (ACTIVE, SUSPENDED, CANCELLED)
- settings (JSON)
- features (JSON) -- Feature flags and permissions
- createdAt
- updatedAt
```

### **3. Customer Management**
```sql
-- customers
- id (Primary Key)
- email
- name
- phone
- address (JSON)
- organizationId (Foreign Key)
- status (ACTIVE, INACTIVE, BLOCKED)
- totalOrders
- totalSpent
- createdAt
- updatedAt
```

---

## 🛍️ **PRODUCT & INVENTORY COLLECTIONS**

### **4. Product Management**
```sql
-- products
- id (Primary Key)
- name
- sku (Unique)
- description
- price
- currency (Default: LKR)
- categoryId (Foreign Key)
- organizationId (Foreign Key)
- status (ACTIVE, INACTIVE, DRAFT)
- inventory (JSON) -- Stock levels, variants
- images (Array)
- tags (Array)
- weight
- dimensions (JSON)
- seoTitle
- seoDescription
- createdById (Foreign Key)
- updatedById (Foreign Key)
- createdAt
- updatedAt
```

### **5. Product Variants**
```sql
-- product_variants
- id (Primary Key)
- productId (Foreign Key)
- name
- value
- price
- sku
- inventory
- images (Array)
- isActive
- createdAt
- updatedAt
```

### **6. Categories**
```sql
-- categories
- id (Primary Key)
- name
- slug
- description
- parentId (Foreign Key) -- For hierarchical categories
- organizationId (Foreign Key)
- image
- isActive
- sortOrder
- createdAt
- updatedAt
```

### **7. Inventory Management**
```sql
-- inventory_movements
- id (Primary Key)
- productId (Foreign Key)
- warehouseId (Foreign Key)
- organizationId (Foreign Key)
- type (IN, OUT, ADJUSTMENT, TRANSFER)
- quantity
- reason
- reference (Order ID, etc.)
- createdById (Foreign Key)
- createdAt
```

---

## 🛒 **ORDER & PAYMENT COLLECTIONS**

### **8. Orders**
```sql
-- orders
- id (Primary Key)
- orderNumber (5-6 character unique)
- customerId (Foreign Key)
- organizationId (Foreign Key)
- status (PENDING, CONFIRMED, PROCESSING, PACKED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED)
- shippingStatus (PENDING, PROCESSING, DISPATCHED, DELIVERED, RETURNED)
- total
- subtotal
- tax
- shipping
- discount
- currency (Default: LKR)
- shippingAddress (JSON)
- billingAddress (JSON)
- courierId (Foreign Key)
- trackingNumber
- notes
- createdById (Foreign Key)
- updatedById (Foreign Key)
- createdAt
- updatedAt
```

### **9. Order Items**
```sql
-- order_items
- id (Primary Key)
- orderId (Foreign Key)
- productId (Foreign Key)
- variantId (Foreign Key)
- quantity
- price
- total
- createdAt
```

### **10. Order Status History**
```sql
-- order_status_history
- id (Primary Key)
- orderId (Foreign Key)
- status
- newStatus
- reason
- notes
- changedById (Foreign Key)
- createdAt
```

### **11. Payments**
```sql
-- payments
- id (Primary Key)
- orderId (Foreign Key)
- customerId (Foreign Key)
- organizationId (Foreign Key)
- amount
- currency (Default: LKR)
- method (STRIPE, PAYPAL, PAYHERE, LANKAQR, COD, BANK_TRANSFER)
- status (PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED)
- gatewayTransactionId
- gatewayResponse (JSON)
- refundAmount
- refundReason
- processedAt
- createdAt
- updatedAt
```

---

## 🚚 **COURIER & DELIVERY COLLECTIONS**

### **12. Couriers**
```sql
-- couriers
- id (Primary Key)
- name
- email
- phone
- vehicleType
- status (AVAILABLE, BUSY, OFFLINE)
- organizationId (Foreign Key)
- currentLocation (JSON)
- lastSeen
- totalEarnings
- rating
- isActive
- createdAt
- updatedAt
```

### **13. Deliveries**
```sql
-- deliveries
- id (Primary Key)
- orderId (Foreign Key)
- courierId (Foreign Key)
- organizationId (Foreign Key)
- trackingNumber (8-character with TRK prefix)
- status (PENDING, PROCESSING, DISPATCHED, DELIVERED, RETURNED)
- deliveryProof (String)
- returnReason (String)
- estimatedDeliveryTime
- actualDeliveryTime
- address (JSON)
- items (JSON)
- specialInstructions
- createdAt
- updatedAt
```

### **14. Delivery Status History**
```sql
-- delivery_status_history
- id (Primary Key)
- deliveryId (Foreign Key)
- status
- newStatus
- reason
- notes
- location (JSON)
- changedById (Foreign Key)
- createdAt
```

---

## 🎁 **WISHLIST & LOYALTY COLLECTIONS**

### **15. Wishlists**
```sql
-- wishlists
- id (Primary Key)
- customerId (Foreign Key)
- organizationId (Foreign Key)
- name
- isPublic
- shareCode
- createdAt
- updatedAt
```

### **16. Wishlist Items**
```sql
-- wishlist_items
- id (Primary Key)
- wishlistId (Foreign Key)
- productId (Foreign Key)
- notes
- addedAt
```

### **17. Customer Loyalty**
```sql
-- customer_loyalty
- id (Primary Key)
- customerId (Foreign Key)
- organizationId (Foreign Key)
- points
- tier (BRONZE, SILVER, GOLD, PLATINUM)
- totalEarned
- totalRedeemed
- lastActivity
- expiresAt
- createdAt
- updatedAt
```

### **18. Loyalty Transactions**
```sql
-- loyalty_transactions
- id (Primary Key)
- customerId (Foreign Key)
- organizationId (Foreign Key)
- type (EARNED, REDEEMED, EXPIRED, ADJUSTED)
- points
- reason
- orderId (Foreign Key)
- productId (Foreign Key)
- campaignId (Foreign Key)
- expiresAt
- createdAt
```

### **19. Loyalty Rewards**
```sql
-- loyalty_rewards
- id (Primary Key)
- organizationId (Foreign Key)
- name
- description
- pointsRequired
- type (DISCOUNT, FREE_SHIPPING, PRODUCT, CASHBACK)
- value
- isActive
- validFrom
- validTo
- usageLimit
- usedCount
- image
- category
- createdAt
- updatedAt
```

### **20. Loyalty Campaigns**
```sql
-- loyalty_campaigns
- id (Primary Key)
- organizationId (Foreign Key)
- name
- description
- type (BIRTHDAY, ANNIVERSARY, PURCHASE, REFERRAL, REVIEW, SOCIAL_SHARE)
- pointsMultiplier
- bonusPoints
- conditions (JSON)
- isActive
- validFrom
- validTo
- usageLimit
- usedCount
- createdAt
- updatedAt
```

---

## 💳 **COUPON & DISCOUNT COLLECTIONS**

### **21. Coupons**
```sql
-- coupons
- id (Primary Key)
- organizationId (Foreign Key)
- code (Unique)
- name
- description
- type (PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING)
- value
- minOrderAmount
- maxDiscountAmount
- usageLimit
- usedCount
- isActive
- validFrom
- validTo
- createdAt
- updatedAt
```

### **22. Coupon Usage**
```sql
-- coupon_usage
- id (Primary Key)
- couponId (Foreign Key)
- orderId (Foreign Key)
- customerId (Foreign Key)
- discountAmount
- usedAt
```

---

## 📊 **ANALYTICS & REPORTING COLLECTIONS**

### **23. Analytics**
```sql
-- analytics
- id (Primary Key)
- organizationId (Foreign Key)
- type (REVENUE, ORDERS, CUSTOMERS, PRODUCTS, COURIER, PAYMENT)
- data (JSON)
- period (DAILY, WEEKLY, MONTHLY, YEARLY)
- date
- createdAt
```

### **24. Reports**
```sql
-- reports
- id (Primary Key)
- organizationId (Foreign Key)
- name
- type (SALES, INVENTORY, CUSTOMER, COURIER, PAYMENT)
- data (JSON)
- format (PDF, CSV, EXCEL)
- status (GENERATING, COMPLETED, FAILED)
- createdById (Foreign Key)
- createdAt
- completedAt
```

---

## 🏪 **WAREHOUSE COLLECTIONS**

### **25. Warehouses**
```sql
-- warehouses
- id (Primary Key)
- organizationId (Foreign Key)
- name
- address (JSON)
- contactPerson
- phone
- email
- isActive
- createdAt
- updatedAt
```

### **26. Warehouse Inventory**
```sql
-- warehouse_inventory
- id (Primary Key)
- warehouseId (Foreign Key)
- productId (Foreign Key)
- quantity
- reservedQuantity
- availableQuantity
- reorderLevel
- maxLevel
- lastUpdated
- createdAt
- updatedAt
```

---

## 🔗 **INTEGRATION COLLECTIONS**

### **27. WooCommerce Integrations**
```sql
-- woo_commerce_integrations
- id (Primary Key)
- organizationId (Foreign Key)
- storeUrl
- consumerKey
- consumerSecret
- isActive
- lastSync
- settings (JSON)
- createdAt
- updatedAt
```

### **28. WhatsApp Integrations**
```sql
-- whatsapp_integrations
- id (Primary Key)
- organizationId (Foreign Key)
- phoneNumberId
- accessToken
- webhookToken
- isActive
- settings (JSON)
- createdAt
- updatedAt
```

### **29. Social Commerce**
```sql
-- social_commerce
- id (Primary Key)
- organizationId (Foreign Key)
- platform (FACEBOOK, INSTAGRAM, TIKTOK, WHATSAPP, TWITTER)
- platformAccountId
- accessToken
- isConnected
- settings (JSON)
- lastSync
- createdAt
- updatedAt
```

### **30. Social Products**
```sql
-- social_products
- id (Primary Key)
- productId (Foreign Key)
- socialCommerceId (Foreign Key)
- platformProductId
- status (ACTIVE, INACTIVE, PENDING, REJECTED)
- lastSync
- metadata (JSON)
- createdAt
- updatedAt
```

### **31. Social Posts**
```sql
-- social_posts
- id (Primary Key)
- socialCommerceId (Foreign Key)
- organizationId (Foreign Key)
- platformPostId
- type (PRODUCT, PROMOTION, STORY, REEL, LIVE)
- content (JSON)
- productIds (Array)
- scheduledAt
- publishedAt
- status (DRAFT, SCHEDULED, PUBLISHED, FAILED)
- metrics (JSON)
- createdAt
- updatedAt
```

---

## 🎯 **CAMPAIGN & MARKETING COLLECTIONS**

### **32. Campaigns**
```sql
-- campaigns
- id (Primary Key)
- organizationId (Foreign Key)
- name
- description
- type (EMAIL, SMS, PUSH, SOCIAL)
- status (DRAFT, ACTIVE, PAUSED, COMPLETED)
- targetAudience (JSON)
- content (JSON)
- schedule (JSON)
- metrics (JSON)
- createdById (Foreign Key)
- createdAt
- updatedAt
```

### **33. Campaign Recipients**
```sql
-- campaign_recipients
- id (Primary Key)
- campaignId (Foreign Key)
- customerId (Foreign Key)
- status (PENDING, SENT, DELIVERED, OPENED, CLICKED, FAILED)
- sentAt
- deliveredAt
- openedAt
- clickedAt
```

---

## 🔔 **NOTIFICATION COLLECTIONS**

### **34. Notifications**
```sql
-- notifications
- id (Primary Key)
- userId (Foreign Key)
- organizationId (Foreign Key)
- type (ORDER, PAYMENT, DELIVERY, SYSTEM, PROMOTION)
- title
- message
- data (JSON)
- isRead
- readAt
- createdAt
```

### **35. Notification Settings**
```sql
-- notification_settings
- id (Primary Key)
- userId (Foreign Key)
- organizationId (Foreign Key)
- emailEnabled
- smsEnabled
- pushEnabled
- orderNotifications
- paymentNotifications
- deliveryNotifications
- systemNotifications
- promotionNotifications
- createdAt
- updatedAt
```

---

## 🔒 **SECURITY & AUDIT COLLECTIONS**

### **36. Audit Logs**
```sql
-- audit_logs
- id (Primary Key)
- organizationId (Foreign Key)
- userId (Foreign Key)
- action
- resource
- resourceId
- oldValues (JSON)
- newValues (JSON)
- ipAddress
- userAgent
- createdAt
```

### **37. API Keys**
```sql
-- api_keys
- id (Primary Key)
- organizationId (Foreign Key)
- name
- key (Hashed)
- permissions (Array)
- isActive
- lastUsed
- expiresAt
- createdAt
- updatedAt
```

### **38. Rate Limits**
```sql
-- rate_limits
- id (Primary Key)
- identifier (IP, User ID, API Key)
- endpoint
- requests
- windowStart
- createdAt
- updatedAt
```

---

## 📱 **MOBILE & PWA COLLECTIONS**

### **39. Device Tokens**
```sql
-- device_tokens
- id (Primary Key)
- userId (Foreign Key)
- organizationId (Foreign Key)
- token
- platform (IOS, ANDROID, WEB)
- isActive
- lastUsed
- createdAt
- updatedAt
```

### **40. PWA Subscriptions**
```sql
-- pwa_subscriptions
- id (Primary Key)
- userId (Foreign Key)
- organizationId (Foreign Key)
- endpoint
- keys (JSON)
- isActive
- createdAt
- updatedAt
```

---

## 🌐 **LOCALIZATION COLLECTIONS**

### **41. Translations**
```sql
-- translations
- id (Primary Key)
- organizationId (Foreign Key)
- language (en, si, ta)
- resource
- resourceId
- field
- value
- createdAt
- updatedAt
```

### **42. Currency Exchange Rates**
```sql
-- currency_exchange_rates
- id (Primary Key)
- fromCurrency
- toCurrency
- rate
- date
- createdAt
```

---

## 📈 **SUMMARY**

### **Total Collections: 42**

**Core Business (11)**: Users, Organizations, Customers, Products, Product Variants, Categories, Inventory Movements, Orders, Order Items, Order Status History, Payments

**Courier & Delivery (3)**: Couriers, Deliveries, Delivery Status History

**Wishlist & Loyalty (6)**: Wishlists, Wishlist Items, Customer Loyalty, Loyalty Transactions, Loyalty Rewards, Loyalty Campaigns

**Coupon & Discount (2)**: Coupons, Coupon Usage

**Analytics & Reporting (2)**: Analytics, Reports

**Warehouse (2)**: Warehouses, Warehouse Inventory

**Integration (5)**: WooCommerce, WhatsApp, Social Commerce, Social Products, Social Posts

**Campaign & Marketing (2)**: Campaigns, Campaign Recipients

**Notification (2)**: Notifications, Notification Settings

**Security & Audit (3)**: Audit Logs, API Keys, Rate Limits

**Mobile & PWA (2)**: Device Tokens, PWA Subscriptions

**Localization (2)**: Translations, Currency Exchange Rates

---

## 🚀 **IMPLEMENTATION NOTES**

1. **All collections include** `organizationId` for multi-tenant isolation
2. **Soft deletes** implemented where needed (`deletedAt` field)
3. **Audit trails** maintained with `createdAt`, `updatedAt`, and user tracking
4. **JSON fields** used for flexible data storage (addresses, settings, metadata)
5. **Indexes** should be created on frequently queried fields
6. **Foreign key constraints** ensure data integrity
7. **Unique constraints** on business-critical fields (email, SKU, order numbers)

This comprehensive collection structure supports all the enhanced features of SmartStore SaaS while maintaining data integrity and multi-tenant isolation! 🎯

## 📋 **OVERVIEW**

This document lists all required database collections (tables) for the enhanced SmartStore SaaS platform, including core business entities, new features, and supporting collections.

---

## 🏗️ **CORE BUSINESS COLLECTIONS**

### **1. User Management**
```sql
-- users
- id (Primary Key)
- email (Unique)
- name
- password (Hashed)
- image
- role (ADMIN, STAFF, USER)
- isActive
- emailVerified
- stripeCustomerId
- mfaEnabled
- mfaSecret
- mfaBackupCodes (Array)
- deletedAt (Soft Delete)
- organizationId (Foreign Key)
- createdAt
- updatedAt
```

### **2. Organization Management**
```sql
-- organizations
- id (Primary Key)
- name
- domain (Unique)
- plan (FREE, BASIC, PRO, ENTERPRISE)
- status (ACTIVE, SUSPENDED, CANCELLED)
- settings (JSON)
- features (JSON) -- Feature flags and permissions
- createdAt
- updatedAt
```

### **3. Customer Management**
```sql
-- customers
- id (Primary Key)
- email
- name
- phone
- address (JSON)
- organizationId (Foreign Key)
- status (ACTIVE, INACTIVE, BLOCKED)
- totalOrders
- totalSpent
- createdAt
- updatedAt
```

---

## 🛍️ **PRODUCT & INVENTORY COLLECTIONS**

### **4. Product Management**
```sql
-- products
- id (Primary Key)
- name
- sku (Unique)
- description
- price
- currency (Default: LKR)
- categoryId (Foreign Key)
- organizationId (Foreign Key)
- status (ACTIVE, INACTIVE, DRAFT)
- inventory (JSON) -- Stock levels, variants
- images (Array)
- tags (Array)
- weight
- dimensions (JSON)
- seoTitle
- seoDescription
- createdById (Foreign Key)
- updatedById (Foreign Key)
- createdAt
- updatedAt
```

### **5. Product Variants**
```sql
-- product_variants
- id (Primary Key)
- productId (Foreign Key)
- name
- value
- price
- sku
- inventory
- images (Array)
- isActive
- createdAt
- updatedAt
```

### **6. Categories**
```sql
-- categories
- id (Primary Key)
- name
- slug
- description
- parentId (Foreign Key) -- For hierarchical categories
- organizationId (Foreign Key)
- image
- isActive
- sortOrder
- createdAt
- updatedAt
```

### **7. Inventory Management**
```sql
-- inventory_movements
- id (Primary Key)
- productId (Foreign Key)
- warehouseId (Foreign Key)
- organizationId (Foreign Key)
- type (IN, OUT, ADJUSTMENT, TRANSFER)
- quantity
- reason
- reference (Order ID, etc.)
- createdById (Foreign Key)
- createdAt
```

---

## 🛒 **ORDER & PAYMENT COLLECTIONS**

### **8. Orders**
```sql
-- orders
- id (Primary Key)
- orderNumber (5-6 character unique)
- customerId (Foreign Key)
- organizationId (Foreign Key)
- status (PENDING, CONFIRMED, PROCESSING, PACKED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED)
- shippingStatus (PENDING, PROCESSING, DISPATCHED, DELIVERED, RETURNED)
- total
- subtotal
- tax
- shipping
- discount
- currency (Default: LKR)
- shippingAddress (JSON)
- billingAddress (JSON)
- courierId (Foreign Key)
- trackingNumber
- notes
- createdById (Foreign Key)
- updatedById (Foreign Key)
- createdAt
- updatedAt
```

### **9. Order Items**
```sql
-- order_items
- id (Primary Key)
- orderId (Foreign Key)
- productId (Foreign Key)
- variantId (Foreign Key)
- quantity
- price
- total
- createdAt
```

### **10. Order Status History**
```sql
-- order_status_history
- id (Primary Key)
- orderId (Foreign Key)
- status
- newStatus
- reason
- notes
- changedById (Foreign Key)
- createdAt
```

### **11. Payments**
```sql
-- payments
- id (Primary Key)
- orderId (Foreign Key)
- customerId (Foreign Key)
- organizationId (Foreign Key)
- amount
- currency (Default: LKR)
- method (STRIPE, PAYPAL, PAYHERE, LANKAQR, COD, BANK_TRANSFER)
- status (PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED)
- gatewayTransactionId
- gatewayResponse (JSON)
- refundAmount
- refundReason
- processedAt
- createdAt
- updatedAt
```

---

## 🚚 **COURIER & DELIVERY COLLECTIONS**

### **12. Couriers**
```sql
-- couriers
- id (Primary Key)
- name
- email
- phone
- vehicleType
- status (AVAILABLE, BUSY, OFFLINE)
- organizationId (Foreign Key)
- currentLocation (JSON)
- lastSeen
- totalEarnings
- rating
- isActive
- createdAt
- updatedAt
```

### **13. Deliveries**
```sql
-- deliveries
- id (Primary Key)
- orderId (Foreign Key)
- courierId (Foreign Key)
- organizationId (Foreign Key)
- trackingNumber (8-character with TRK prefix)
- status (PENDING, PROCESSING, DISPATCHED, DELIVERED, RETURNED)
- deliveryProof (String)
- returnReason (String)
- estimatedDeliveryTime
- actualDeliveryTime
- address (JSON)
- items (JSON)
- specialInstructions
- createdAt
- updatedAt
```

### **14. Delivery Status History**
```sql
-- delivery_status_history
- id (Primary Key)
- deliveryId (Foreign Key)
- status
- newStatus
- reason
- notes
- location (JSON)
- changedById (Foreign Key)
- createdAt
```

---

## 🎁 **WISHLIST & LOYALTY COLLECTIONS**

### **15. Wishlists**
```sql
-- wishlists
- id (Primary Key)
- customerId (Foreign Key)
- organizationId (Foreign Key)
- name
- isPublic
- shareCode
- createdAt
- updatedAt
```

### **16. Wishlist Items**
```sql
-- wishlist_items
- id (Primary Key)
- wishlistId (Foreign Key)
- productId (Foreign Key)
- notes
- addedAt
```

### **17. Customer Loyalty**
```sql
-- customer_loyalty
- id (Primary Key)
- customerId (Foreign Key)
- organizationId (Foreign Key)
- points
- tier (BRONZE, SILVER, GOLD, PLATINUM)
- totalEarned
- totalRedeemed
- lastActivity
- expiresAt
- createdAt
- updatedAt
```

### **18. Loyalty Transactions**
```sql
-- loyalty_transactions
- id (Primary Key)
- customerId (Foreign Key)
- organizationId (Foreign Key)
- type (EARNED, REDEEMED, EXPIRED, ADJUSTED)
- points
- reason
- orderId (Foreign Key)
- productId (Foreign Key)
- campaignId (Foreign Key)
- expiresAt
- createdAt
```

### **19. Loyalty Rewards**
```sql
-- loyalty_rewards
- id (Primary Key)
- organizationId (Foreign Key)
- name
- description
- pointsRequired
- type (DISCOUNT, FREE_SHIPPING, PRODUCT, CASHBACK)
- value
- isActive
- validFrom
- validTo
- usageLimit
- usedCount
- image
- category
- createdAt
- updatedAt
```

### **20. Loyalty Campaigns**
```sql
-- loyalty_campaigns
- id (Primary Key)
- organizationId (Foreign Key)
- name
- description
- type (BIRTHDAY, ANNIVERSARY, PURCHASE, REFERRAL, REVIEW, SOCIAL_SHARE)
- pointsMultiplier
- bonusPoints
- conditions (JSON)
- isActive
- validFrom
- validTo
- usageLimit
- usedCount
- createdAt
- updatedAt
```

---

## 💳 **COUPON & DISCOUNT COLLECTIONS**

### **21. Coupons**
```sql
-- coupons
- id (Primary Key)
- organizationId (Foreign Key)
- code (Unique)
- name
- description
- type (PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING)
- value
- minOrderAmount
- maxDiscountAmount
- usageLimit
- usedCount
- isActive
- validFrom
- validTo
- createdAt
- updatedAt
```

### **22. Coupon Usage**
```sql
-- coupon_usage
- id (Primary Key)
- couponId (Foreign Key)
- orderId (Foreign Key)
- customerId (Foreign Key)
- discountAmount
- usedAt
```

---

## 📊 **ANALYTICS & REPORTING COLLECTIONS**

### **23. Analytics**
```sql
-- analytics
- id (Primary Key)
- organizationId (Foreign Key)
- type (REVENUE, ORDERS, CUSTOMERS, PRODUCTS, COURIER, PAYMENT)
- data (JSON)
- period (DAILY, WEEKLY, MONTHLY, YEARLY)
- date
- createdAt
```

### **24. Reports**
```sql
-- reports
- id (Primary Key)
- organizationId (Foreign Key)
- name
- type (SALES, INVENTORY, CUSTOMER, COURIER, PAYMENT)
- data (JSON)
- format (PDF, CSV, EXCEL)
- status (GENERATING, COMPLETED, FAILED)
- createdById (Foreign Key)
- createdAt
- completedAt
```

---

## 🏪 **WAREHOUSE COLLECTIONS**

### **25. Warehouses**
```sql
-- warehouses
- id (Primary Key)
- organizationId (Foreign Key)
- name
- address (JSON)
- contactPerson
- phone
- email
- isActive
- createdAt
- updatedAt
```

### **26. Warehouse Inventory**
```sql
-- warehouse_inventory
- id (Primary Key)
- warehouseId (Foreign Key)
- productId (Foreign Key)
- quantity
- reservedQuantity
- availableQuantity
- reorderLevel
- maxLevel
- lastUpdated
- createdAt
- updatedAt
```

---

## 🔗 **INTEGRATION COLLECTIONS**

### **27. WooCommerce Integrations**
```sql
-- woo_commerce_integrations
- id (Primary Key)
- organizationId (Foreign Key)
- storeUrl
- consumerKey
- consumerSecret
- isActive
- lastSync
- settings (JSON)
- createdAt
- updatedAt
```

### **28. WhatsApp Integrations**
```sql
-- whatsapp_integrations
- id (Primary Key)
- organizationId (Foreign Key)
- phoneNumberId
- accessToken
- webhookToken
- isActive
- settings (JSON)
- createdAt
- updatedAt
```

### **29. Social Commerce**
```sql
-- social_commerce
- id (Primary Key)
- organizationId (Foreign Key)
- platform (FACEBOOK, INSTAGRAM, TIKTOK, WHATSAPP, TWITTER)
- platformAccountId
- accessToken
- isConnected
- settings (JSON)
- lastSync
- createdAt
- updatedAt
```

### **30. Social Products**
```sql
-- social_products
- id (Primary Key)
- productId (Foreign Key)
- socialCommerceId (Foreign Key)
- platformProductId
- status (ACTIVE, INACTIVE, PENDING, REJECTED)
- lastSync
- metadata (JSON)
- createdAt
- updatedAt
```

### **31. Social Posts**
```sql
-- social_posts
- id (Primary Key)
- socialCommerceId (Foreign Key)
- organizationId (Foreign Key)
- platformPostId
- type (PRODUCT, PROMOTION, STORY, REEL, LIVE)
- content (JSON)
- productIds (Array)
- scheduledAt
- publishedAt
- status (DRAFT, SCHEDULED, PUBLISHED, FAILED)
- metrics (JSON)
- createdAt
- updatedAt
```

---

## 🎯 **CAMPAIGN & MARKETING COLLECTIONS**

### **32. Campaigns**
```sql
-- campaigns
- id (Primary Key)
- organizationId (Foreign Key)
- name
- description
- type (EMAIL, SMS, PUSH, SOCIAL)
- status (DRAFT, ACTIVE, PAUSED, COMPLETED)
- targetAudience (JSON)
- content (JSON)
- schedule (JSON)
- metrics (JSON)
- createdById (Foreign Key)
- createdAt
- updatedAt
```

### **33. Campaign Recipients**
```sql
-- campaign_recipients
- id (Primary Key)
- campaignId (Foreign Key)
- customerId (Foreign Key)
- status (PENDING, SENT, DELIVERED, OPENED, CLICKED, FAILED)
- sentAt
- deliveredAt
- openedAt
- clickedAt
```

---

## 🔔 **NOTIFICATION COLLECTIONS**

### **34. Notifications**
```sql
-- notifications
- id (Primary Key)
- userId (Foreign Key)
- organizationId (Foreign Key)
- type (ORDER, PAYMENT, DELIVERY, SYSTEM, PROMOTION)
- title
- message
- data (JSON)
- isRead
- readAt
- createdAt
```

### **35. Notification Settings**
```sql
-- notification_settings
- id (Primary Key)
- userId (Foreign Key)
- organizationId (Foreign Key)
- emailEnabled
- smsEnabled
- pushEnabled
- orderNotifications
- paymentNotifications
- deliveryNotifications
- systemNotifications
- promotionNotifications
- createdAt
- updatedAt
```

---

## 🔒 **SECURITY & AUDIT COLLECTIONS**

### **36. Audit Logs**
```sql
-- audit_logs
- id (Primary Key)
- organizationId (Foreign Key)
- userId (Foreign Key)
- action
- resource
- resourceId
- oldValues (JSON)
- newValues (JSON)
- ipAddress
- userAgent
- createdAt
```

### **37. API Keys**
```sql
-- api_keys
- id (Primary Key)
- organizationId (Foreign Key)
- name
- key (Hashed)
- permissions (Array)
- isActive
- lastUsed
- expiresAt
- createdAt
- updatedAt
```

### **38. Rate Limits**
```sql
-- rate_limits
- id (Primary Key)
- identifier (IP, User ID, API Key)
- endpoint
- requests
- windowStart
- createdAt
- updatedAt
```

---

## 📱 **MOBILE & PWA COLLECTIONS**

### **39. Device Tokens**
```sql
-- device_tokens
- id (Primary Key)
- userId (Foreign Key)
- organizationId (Foreign Key)
- token
- platform (IOS, ANDROID, WEB)
- isActive
- lastUsed
- createdAt
- updatedAt
```

### **40. PWA Subscriptions**
```sql
-- pwa_subscriptions
- id (Primary Key)
- userId (Foreign Key)
- organizationId (Foreign Key)
- endpoint
- keys (JSON)
- isActive
- createdAt
- updatedAt
```

---

## 🌐 **LOCALIZATION COLLECTIONS**

### **41. Translations**
```sql
-- translations
- id (Primary Key)
- organizationId (Foreign Key)
- language (en, si, ta)
- resource
- resourceId
- field
- value
- createdAt
- updatedAt
```

### **42. Currency Exchange Rates**
```sql
-- currency_exchange_rates
- id (Primary Key)
- fromCurrency
- toCurrency
- rate
- date
- createdAt
```

---

## 📈 **SUMMARY**

### **Total Collections: 42**

**Core Business (11)**: Users, Organizations, Customers, Products, Product Variants, Categories, Inventory Movements, Orders, Order Items, Order Status History, Payments

**Courier & Delivery (3)**: Couriers, Deliveries, Delivery Status History

**Wishlist & Loyalty (6)**: Wishlists, Wishlist Items, Customer Loyalty, Loyalty Transactions, Loyalty Rewards, Loyalty Campaigns

**Coupon & Discount (2)**: Coupons, Coupon Usage

**Analytics & Reporting (2)**: Analytics, Reports

**Warehouse (2)**: Warehouses, Warehouse Inventory

**Integration (5)**: WooCommerce, WhatsApp, Social Commerce, Social Products, Social Posts

**Campaign & Marketing (2)**: Campaigns, Campaign Recipients

**Notification (2)**: Notifications, Notification Settings

**Security & Audit (3)**: Audit Logs, API Keys, Rate Limits

**Mobile & PWA (2)**: Device Tokens, PWA Subscriptions

**Localization (2)**: Translations, Currency Exchange Rates

---

## 🚀 **IMPLEMENTATION NOTES**

1. **All collections include** `organizationId` for multi-tenant isolation
2. **Soft deletes** implemented where needed (`deletedAt` field)
3. **Audit trails** maintained with `createdAt`, `updatedAt`, and user tracking
4. **JSON fields** used for flexible data storage (addresses, settings, metadata)
5. **Indexes** should be created on frequently queried fields
6. **Foreign key constraints** ensure data integrity
7. **Unique constraints** on business-critical fields (email, SKU, order numbers)

This comprehensive collection structure supports all the enhanced features of SmartStore SaaS while maintaining data integrity and multi-tenant isolation! 🎯

# Type Validation Fix Strategy

## Missing Prisma Models - Name Mapping

Many errors are due to incorrect model names. Here's the mapping:

### Models that exist with different names:
- `securityAudit` → Already exists (needs to be added to schema)
- `productActivity` → `product_activities` (exists)
- `emailCampaign` → Needs to be created
- `socialPost` → `social_posts` (exists)
- `channelIntegration` → `channel_integrations` (exists)
- `activity` → `activities` (exists)

### Models that need to be created:
1. `SecurityAudit` - For security event logging
2. `SecurityAlert` - For security alerts
3. `CustomerConversation` - For customer chat
4. `ChatSession` - For chat sessions
5. `EmailCampaign` - For email marketing
6. `Fulfillment` - For order fulfillment
7. `PaymentIntent` - For payment processing
8. `PaymentMethod` - For stored payment methods
9. `LoyaltyAccount` - For loyalty programs
10. `SocialPlatform` - For social media platforms
11. `ErrorEvent` - For error tracking
12. `Shipment` - For shipping
13. `ProductionAlert` - For production monitoring
14. `VoiceCommand` - For voice commerce
15. `SyncConflict` - For data sync conflicts
16. `StockAlert` - For inventory alerts

## Fix Approach

### Phase 1: Add Missing Prisma Models (High Priority)
Add the most commonly referenced models to schema.prisma

### Phase 2: Fix Model Name References
Update service files to use correct model names (snake_case)

### Phase 3: Fix Type Assertions
Replace `unknown` with `any` where needed for dynamic data

### Phase 4: Add Null Guards
Add proper undefined/null checks

### Phase 5: Fix Property Access
Ensure all property accesses match Prisma schema

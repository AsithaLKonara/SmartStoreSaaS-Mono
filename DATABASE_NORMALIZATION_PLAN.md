# 🗄️ E2E Database Normalization Plan - [COMPLETED ✅]

This document outlines the strategy to normalize the database schema, improve data integrity, and standardize naming conventions across the SmartStoreSaaS-Mono project.

## 🚨 Current State Analysis

*   **Naming Inconsistencies**: [FIXED] Standardized to PascalCase.
*   **Data Types**: [FIXED] Converted String JSON blobs to native `Json` type and implemented Enums for statuses.
*   **Redundancy**: [FIXED] Unified Activities into `ActivityLog` and Conversations into a single `Conversation` model.
*   **Normalization Level**: [FIXED] POS and RFQ items decomposed into relational models.

---

## 📅 Execution Phases

### Phase 1: Standardization (Naming & Types) - [DONE]
**Goal**: Make the schema readable and consistent without changing underlying data relationships.

1.  **Model Renaming**: Convert all snake_case models to PascalCase.
    *   [x] `iot_devices` → `IotDevice`
    *   [x] `iot_alerts` → `IotAlert`
    *   [x] `sensor_readings` → `SensorReading`
    *   [x] `sms_campaigns` → `SmsCampaign`
    *   [x] `customer_segments` → `CustomerSegment`
    *   [x] `chart_of_accounts` → `ChartOfAccount`
    *   [x] `journal_entries` → `JournalEntry`
    *   [x] All other snake_case models renamed
2.  **JSON Type Migration**: Convert `String` fields storing JSON to native `Json` type.
    *   [x] `PosTransaction.itemsJson`
    *   [x] `RFQ.itemsJson`
    *   [x] `IotDevice.metadata` & `configuration`
    *   [x] `AiAnalytics.insights`
    *   [x] `SocialCommerce.settings`

### Phase 2: Enum Implementation - [DONE]
**Goal**: Enforce strict values for status fields to prevent logic errors.

1.  **Create Enums**:
    *   [x] `PaymentStatus` (PENDING, PAID, FAILED, REFUNDED, etc.)
    *   [x] `DeliveryStatus` (PENDING, SHIPPED, DELIVERED, RETURNED, etc.)
    *   [x] `IoTStatus` (ONLINE, OFFLINE, MAINTENANCE)
    *   [x] `SmsStatus` & `SmsLogStatus`
    *   [x] `SupportStatus` & `SupportPriority`
2.  **Migration**: Updated all models to use these Enums instead of Strings.

### Phase 3: Structural Normalization - [DONE]
**Goal**: Break down complex JSON blobs into relational tables for better querying.

1.  **POS Transactions**:
    *   [x] Created `PosTransactionItem` model linking `Product` to `PosTransaction`.
2.  **RFQs**:
    *   [x] Created `RFQItem` model linking `Product` to `RFQ`.
3.  **Consolidation**:
    *   [x] Merged `activities` and `Activity` into a single `ActivityLog` model.
    *   [x] Unified `ai_conversations`, `ChatSession`, and `CustomerConversation` into `Conversation`.
4.  **Address Standardization**:
    *   [x] Standardized `Address` format across `Warehouse`, `Delivery`, and `Customer` as `Json`.

---

## ✅ Final Verification
1.  **Prisma Validation**: `npx prisma validate` passed.
2.  **Client Generation**: `npx prisma generate` passed.
3.  **Service Refactoring**: Updated `AIChatService`, `OmnichannelService`, `IoTService`, `SMSService`, `CRMService`, and others to match the new schema.

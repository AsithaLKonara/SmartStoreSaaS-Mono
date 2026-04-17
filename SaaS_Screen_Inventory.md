# 📱 SmartStore SaaS: Complete Screen Inventory

This document provides a comprehensive map of all functional screens within the SmartStore ecosystem, categorized by module and user context.

---

## 🌍 1. Global Marketplace (B2C Discovery)
*Central platform for cross-tenant product discovery and unified checkout.*

| Screen | Route | Description |
| :--- | :--- | :--- |
| **Marketplace Home** | `/marketplace` | Landing page for global catalog discovery. |
| **Product Detail** | `/marketplace/product/[id]` | Comprehensive view for guest shoppers. |
| **Global Cart** | `/marketplace/cart` | Unified cart grouping items from multiple tenants. |
| **Master Checkout** | `/marketplace/checkout` | Multi-tenant split payment execution. |
| **Trending Now** | `/marketplace/trending` | AI-curated popular products section. |

---

## 🔑 2. Authentication & Marketing
*Onboarding and secure access control.*

| Screen | Route | Description |
| :--- | :--- | :--- |
| **Platform Home** | `/marketing-home` | SaaS landing page for new merchant signups. |
| **Merchant Login** | `/login` | Secure gateway to the ERP. |
| **Registrations** | `/register` | Tenant onboarding wizard. |
| **Password Recovery** | `/reset-password` | Self-service credential restoration. |
| **MFA Setup** | `/auth/mfa` | Multi-factor security enrollment. |
| **MFA Verification** | `/mfa-verify` | Login-time security challenge. |

---

## 📊 3. Core Merchant Operations (ERP)
*Primary business management tools for tenants.*

### 📦 Products & Catalog
| Screen | Route | Description |
| :--- | :--- | :--- |
| **Catalog Overview** | `/products` | Filterable list of all inventory items. |
| **New Product** | `/products/new` | Multi-step creation wizard. |
| **Product Edit** | `/products/[id]` | Detailed SKU and attribute management. |
| **Bulk Operations** | `/products/bulk-edit` | Mass pricing and status updates. |
| **CSV Import** | `/products/import` | Large-scale inventory ingestion tool. |
| **Categories** | `/categories` | Taxonomy and group management. |

### 🛒 Orders & Fulfillment
| Screen | Route | Description |
| :--- | :--- | :--- |
| **Order Triage** | `/orders` | Omnichannel order list with origin flags. |
| **Manual Order** | `/orders/new` | Back-office order creation. |
| **Order Detail** | `/orders/[id]` | Summary of transaction and ship status. |
| **Order Edit** | `/orders/[id]/edit` | Modification of status, notes, and tracking. |
| **Returns Desk** | `/returns` | RMA processing and approval queue. |
| **Fulfillment Hub** | `/fulfillment` | Batch processing for logistics teams. |

### 👥 Customers & CRM
| Screen | Route | Description |
| :--- | :--- | :--- |
| **Customer List** | `/customers` | Database of all registered shoppers. |
| **Customer Profiling** | `/customers/[id]` | Unified view of purchase history and LTV. |
| **Segments** | `/customers/segments` | Filtered groups for targeted marketing. |

---

## 💸 4. Financial & Billing
*Fiscal transparency and revenue management.*

| Screen | Route | Description |
| :--- | :--- | :--- |
| **Accounting Hub** | `/accounting` | Financial overview and widget dashboard. |
| **Bank Reconcile** | `/accounting/reconciliation` | External statement matching. |
| **Ledger View** | `/accounting/ledger` | Detailed transaction audit trail. |
| **Tax Management** | `/accounting/tax` | Regional and global VAT/Sales Tax config. |
| **Report Wizard** | `/accounting/generate-report` | P&L and Balance Sheet generator. |
| **Payments Ledger** | `/payments` | Inbound cash flow monitoring. |
| **Refund Manager** | `/payments/refunds` | Global reversal and chargeback handler. |
| **Tenant Billing** | `/billing` | Subscription and platform usage overview. |
| **Invoice Viewer** | `/billing/invoices/[id]` | High-fidelity financial statement view. |

---

## 🚛 5. Logistics & Infrastructure
*Supply chain and physical asset tracking.*

| Screen | Route | Description |
| :--- | :--- | :--- |
| **Inventory Movements** | `/inventory/movements` | Audit trail of every stock deduction/addition. |
| **Warehouse Manager** | `/warehouse` | Physical location and bin management. |
| **Shipment Tracking** | `/shipping` | Real-time carrier status monitoring. |
| **Rate Calculator** | `/logistics/rates` | Shipping cost comparison tool. |
| **IoT Device Grid** | `/iot/devices` | Live telemetry for hardware scanners/sensors. |
| **Procurement Hub** | `/procurement` | Purchasing workflow and supplier POs. |

---

## 🧠 6. AI Analytics & Insights
*Machine learning driven platform intelligence.*

| Screen | Route | Description |
| :--- | :--- | :--- |
| **AI Dashboard** | `/ai-analytics` | Summary of predictive insights. |
| **ML Config** | `/ai-analytics/predictions/configure` | Tuning of model thresholds and weights. |
| **Churn Prediction** | `/analytics/customer-insights` | Identifying at-risk customer segments. |
| **AI Auditor** | `/ai-analytics/financial` | Automated anomaly detection in accounting. |
| **Pricing Strategy** | `/pricing` | Dynamic AI pricing and competitive matching. |
| **AI Assistant** | `/ai-assistant` | Context-aware natural language support. |

---

## 📣 7. Marketing & Engagement
| Screen | Route | Description |
| :--- | :--- | :--- |
| **Campaigns** | `/campaigns` | E-mail and SMS broadcast management. |
| **Loyalty Program** | `/loyalty` | Point systems and reward configuration. |
| **Review Moderation** | `/reviews` | Approval queue for customer sentiment. |
| **Review Detail** | `/reviews/[id]` | Content vetting and sentiment scoring. |
| **Affiliates** | `/affiliates` | Referral tracking and commission management. |

---

## 🎧 8. Support & Communication
| Screen | Route | Description |
| :--- | :--- | :--- |
| **Helpdesk** | `/support` | Ticket management and agent assignments. |
| **Live Chat** | `/chat` | Sub-second real-time customer communication. |
| **Entity Omnichannel** | `/omnichannel` | Unified view of messaging across channels. |

---

## 🏪 9. SaaS Storefront (The "B2C Shop")
*Direct-to-consumer website generated for each tenant.*

| Screen | Route | Description |
| :--- | :--- | :--- |
| **Store Home** | `/store-home` | Tenant's branded landing page. |
| **Product Detail** | `/shop` | SKU-specific landing page. |
| **Checkout Flow** | `/checkout` | Isolated single-tenant checkout. |
| **Customer Profiler** | `/my-profile` | Registered shopper dashboard. |
| **Order History** | `/my-orders` | Self-service tracking for shoppers. |

---

## 💳 10. POS Terminal
| Screen | Route | Description |
| :--- | :--- | :--- |
| **POS Terminal** | `/pos` | Touch-optimized sales surface. |
| **Terminal Home** | `(pos-app)/` | Specialized group for offline retail sales. |

---

## 🛡️ 11. Platform Administration (Super Admin)
*Platform-level management for the SmartStore owner.*

| Screen | Route | Description |
| :--- | :--- | :--- |
| **Admin Home** | `/admin-home` | Platform health and organization charts. |
| **Organizations** | `/tenants` | Global tenant management and impersonation. |
| **Platform Billing** | `/admin/billing` | Stripe Connect volume and commission stats. |
| **Packages** | `/admin/packages` | Tiered subscription plan management. |
| **Compliance Desk** | `/compliance` | Global policy and legal guardrails. |
| **Audit Navigator** | `/audit` | Root-level system activity tracking. |
| **Backup Control** | `/backup` | Disaster recovery and data archiving. |

---

## 🛠️ 12. Developer & System Tools
| Screen | Route | Description |
| :--- | :--- | :--- |
| **API Documentation** | `/docs` | OpenAPI/Swagger playground. |
| **Testing Sandbox** | `/testing` | Internal QA and regression surfaces. |
| **Validation Hub** | `/validation` | Identity and entity verification tools. |
| **Deployment** | `/deployment` | CI/CD status and infrastructure logs. |
| **Webhooks** | `/webhooks` | External event subscription manager. |
| **Sync Manager** | `/sync` | Real-time cache and third-party sync status. |

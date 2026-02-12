# ✅ Phase 1 — AI Action Gateway

**Goal:** Establish a safe bridge between the AI model and the core system.

### 🛣️ API Endpoint
Create a central entry point for AI-driven requests:
`POST /api/ai/actions`

### 🛠️ Initial Supported Actions
| Action | Service Responsibility |
| :--- | :--- |
| `CREATE_PURCHASE_ORDER` | `supplier.service` |
| `UPDATE_PRODUCT_PRICE` | `pricing.service` |
| `CREATE_ORDER` | `order.service` |
| `APPLY_DISCOUNT` | `pricing.service` |
| `SEND_CAMPAIGN` | `crm.service` |
| `GET_ANALYTICS` | `analytics.service` |

### 🛡️ Security & Validation
- **Zod Validation**: Define strict schemas for every action. AI cannot send random or malformed data.
- **Permission Layer**: Interceptor to verify `organizationId`, user role, and operation limits before execution.

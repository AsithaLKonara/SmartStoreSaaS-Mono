# ✅ Phase 6 — WhatsApp / Instagram AI Sales Agent

**Goal:** Close sales automatically via messaging channels.

### 📲 Messaging Flow
**Customer:** *"Do you have the Nike Air Max in size 42?"*

**Logic Steps:**
1. **Ingestion**: Message hits the WhatsApp Webhook → Orchestrator.
2. **Lookup**: AI calls the Product Search tool to check real-time stock.
3. **Response**: AI replies with availability and pricing.
4. **Checkout**: AI builds a cart and sends a unique payment link.
5. **Fulfillment**: On successful payment, the system creates the order and notifies the warehouse.

### 🧰 Required Tools for Agent
- **Conversation Memory**: Track user preferences across messages.
- **Product Search Tool**: Intelligent matching for messy user queries.
- **Cart Builder Tool**: Bridge between chat and the order service.

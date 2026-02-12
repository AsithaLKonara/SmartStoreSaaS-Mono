# ✅ Phase 3 — AI Orchestrator

**Goal:** Centralize the logic for data gathering and AI communication.

### 🔧 Location
`/lib/ai/orchestrator.ts`

### 📋 Responsibilities
1. **Context Aggregation**: Fetch the current "State of the Store" (Inventory, Sales, Alerts).
2. **AI Inference**: Call the Hugging Face API with the aggregated context.
3. **Response Parsing**: Validate the AI's JSON output.
4. **Execution**: Pass the validated command to the **AI Action Gateway**.
5. **Logging**: Persist the AI's reasonings and decisions for the audit dashboard.

### ⚡ Triggers
- **Cron Jobs**: Nightly pricing optimization and stock replenishment checks.
- **Events**: Real-time triggers based on low stock, new messages, or sensor alerts.

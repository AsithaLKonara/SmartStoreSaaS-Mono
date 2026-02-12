# ✅ Phase 4 — Autonomous Inventory Manager

**Goal:** Eliminate stockouts through data-driven procurement.

### 🔄 Automatic Flow
1. **Detection**: Stock threshold is reached OR sales velocity spikes.
2. **Context**: Orchestrator sends current stock + sales speed + supplier history to the AI.
3. **Decision**: AI selects the best supplier and determines optimal reorder quantity.
4. **Action**: AI creates a Purchase Order (PO).
5. **Human-in-the-loop**: Admin receives a notification: *"AI created PO #123 for approval"*.

### 🚀 New Engine Features
- **Sales Velocity Calculator**: Real-time units-per-day tracking.
- **Supplier Performance Scoring**: Tracking lead times and fulfillment accuracy.
- **Reorder Prediction Logic**: Forecasting when stock will hit zero.

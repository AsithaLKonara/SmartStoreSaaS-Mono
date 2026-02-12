# ✅ Phase 2 — Deploy Your Model on 🤗 Hugging Face

**Goal:** Integrate the fine-tuned LLM as the decision-making brain.

### 🧠 Model Specifications
The model is hosted on Hugging Face Inference Endpoints. It expects structured context and returns intent-based JSON.

**Sample Request Input:**
- Inventory snapshots
- Sales velocity (last 30 days)
- Supplier lead times
- Customer behavior patterns
- Current analytics summary

**Sample Model Output:**
```json
{
  "action": "CREATE_PURCHASE_ORDER",
  "data": {
    "productId": "prod-abc",
    "quantity": 50,
    "supplierId": "sup-123"
  },
  "reason": "Stock will run out in 3 days based on current velocity of 15 units/day"
}
```

# 🤖 AI-Native Retail OS Upgrade: Antigravity Instructions

## ⚠️ STRICT OPERATIONAL PROTOCOL

These instructions are **BINDING**. Any deviation from this protocol is a failure in the mission.

### 1. 🧭 Following the Plan
- **Primary Source of Truth**: The documents in `/UpgradePlan/`.
- **Phase-Gate Control**: Do **NOT** proceed to Phase `N+1` until Phase `N` is 100% completed, verified, and pushed.
- **Verification**: Each feature within a phase must be tested (unit/integration) where applicable before being considered "done".

### 2. 🚛 Git Workflow (Feature-by-Feature)
- **Branch**: All work must stay on `feat/ai-native-retail-os`.
- **Commit Granularity**: Commit and push immediately after completing a **single coherent feature** or structural change. 
- **Commit Messages**: Use the `feat: [Phase X] Description` format.
- **Push Policy**: Push every commit immediately to the remote branch.

### 3. 🛠️ Implementation Standards
- **Refactoring First**: Always verify if the current architecture needs the "Service Extraction" from Phase 0 before adding new AI capabilities.
- **Security First**: AI actions must always pass through the **AI Action Gateway** (Phase 1) once established.
- **Audit Logging**: Every AI-driven change must be tagged with `updatedBy: 'ai'`.

### 4. 📊 Progress Tracking
- Maintain a local status marker in `AI_UPGRADE_PROGRESS.md` (to be created) showing:
  - Total Phases: 12 (0-11)
  - Current Phase: X
  - Completed Features: [List]
  - Remaining Features in Phase X: [List]

---
*Identity: Antigravity*
*Mode: AI-Native Retail OS Transformation*

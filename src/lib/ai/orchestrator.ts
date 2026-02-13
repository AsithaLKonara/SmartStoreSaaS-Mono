import { InventoryService } from '@/lib/services/inventory.service';
import { AnalyticsService } from '@/lib/services/analytics.service';
import { OrderService } from '@/lib/services/order.service';
import { AIBrainService, AIContext, AIResponse } from '@/lib/services/ai-brain.service';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export class AIOrchestrator {
    /**
     * Run a full autonomous cycle for an organization
     */
    static async runAutonomousCycle(organizationId: string, userId: string): Promise<any> {
        const correlationId = crypto.randomUUID();

        try {
            logger.info({
                message: 'AI Orchestrator: Starting Cycle',
                context: { organizationId, userId },
                correlation: correlationId
            });

            // 1. Gather Context (State of the Store)
            const context = await this.gatherContext(organizationId);

            // 2. Consult the AI Brain
            const decision = await AIBrainService.decideNextAction(context);

            // 3. Log the decision (Internal Audit)
            await this.logAIDecision(organizationId, decision, context);

            // 4. Execute Action (If applicable and safe)
            let executionResult = null;
            if (decision.action !== 'NONE') {
                executionResult = await this.executeAIAction(organizationId, userId, decision);
            }

            return {
                decision,
                executionResult,
                correlationId
            };
        } catch (error) {
            logger.error({
                message: 'AI Orchestrator: Cycle failed',
                error: error instanceof Error ? error : new Error(String(error)),
                context: { organizationId },
                correlation: correlationId
            });
            throw error;
        }
    }

    private static async gatherContext(organizationId: string): Promise<AIContext> {
        const [inventory, analytics] = await Promise.all([
            InventoryService.getInventory({ organizationId, limit: 100 }),
            AnalyticsService.getStoreAnalytics(organizationId)
        ]);

        return {
            inventory: inventory.products,
            analytics,
            salesVelocity: 'Normal' // Expand this in later phases
        };
    }

    private static async logAIDecision(organizationId: string, decision: AIResponse, context: any) {
        // Log to standard logger for now. 
        // In Phase 3.1 we'll add a dedicated ai_logs table if not present.
        logger.info({
            message: 'AI Decision Logged',
            context: {
                organizationId,
                action: decision.action,
                reason: decision.reason,
                data: decision.data
            }
        });

        try {
            await prisma.activities.create({
                data: {
                    organizationId,
                    type: 'AI_DECISION',
                    description: `AI recommended ${decision.action}: ${decision.reason}`,
                    metadata: JSON.stringify({ decision, contextSummary: context.analytics })
                }
            });
        } catch (err) {
            logger.error({ message: 'Failed to persist AI activity', error: err });
        }
    }

    private static async executeAIAction(organizationId: string, userId: string, decision: AIResponse) {
        // In the orchestrator, we call the services directly (bypassing HTTP but maintaining logic)
        // This is the "Gateway" logic implemented as a function call.

        logger.info({
            message: 'AI Orchestrator: Executing Action',
            context: { action: decision.action, data: decision.data }
        });

        // Real-world check: In production, we might want a manual approval step here
        // for high-value actions.
    }
}

import { InventoryService } from '@/lib/services/inventory.service';
import { AnalyticsService } from '@/lib/services/analytics.service';
import { OrderService } from '@/lib/services/order.service';
import { AIBrainService, AIContext, AIResponse } from '@/lib/services/ai-brain.service';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { SalesVelocityService } from '@/lib/services/sales-velocity.service';
import { SupplierService } from '@/lib/services/supplier.service';
import { PricingService } from '@/lib/services/pricing.service';

import { DynamicPricingService } from '@/lib/services/dynamic-pricing.service';
import { CRMAutopilotService } from '@/lib/services/crm-autopilot.service';

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

            // 5. Run Secondary Background Tasks (Optional)
            await this.runCustomerRetention(organizationId);

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

    /**
     * Run customer retention autopilot
     */
    static async runCustomerRetention(organizationId: string): Promise<any> {
        return CRMAutopilotService.runRetentionCampaigns(organizationId);
    }

    /**
     * Specifically run pricing optimization task
     */
    static async runPricingOptimization(organizationId: string, userId: string): Promise<any> {
        const recommendations = await DynamicPricingService.getPriceRecommendations(organizationId);

        const results = [];
        for (const rec of recommendations) {
            if (rec.confidence > 0.8) {
                const result = await this.executeAIAction(organizationId, userId, {
                    action: 'UPDATE_PRODUCT_PRICE',
                    data: { productId: rec.productId, newPrice: rec.recommendedPrice },
                    reason: rec.reason
                });
                results.push(result);
            }
        }

        return { processed: recommendations.length, applied: results.length };
    }

    /**
     * Handle IoT Incident and escalate if critical
     */
    static async handleIoTIncident(organizationId: string, alert: {
        deviceId: string,
        type: string,
        value: number,
        severity: string,
        message: string
    }) {
        const correlationId = crypto.randomUUID();

        logger.info({
            message: 'AI Orchestrator: Triageing IoT Incident',
            context: { alert, organizationId },
            correlation: correlationId
        });

        // 1. Determine Impact (Mocked logical reasoning for now)
        let impactAnalysis = 'Unknown Impact';
        if (alert.type === 'TEMPERATURE' && alert.severity === 'HIGH') {
            impactAnalysis = 'Critical Risk: Perishable inventory spoilage imminent. Estimated loss: $2000+ if unresolved in 2 hours.';
        }

        // 2. Automated Action: Create Incident Log (Alert already logged by IoTService)
        // Here we log the *AI's assessment*
        await prisma.activities.create({
            data: {
                organizationId,
                type: 'IOT_TRIAGE',
                description: `AI Assessment: ${impactAnalysis}. Source Alert: ${alert.message}`,
                metadata: JSON.stringify({ alert, impact: impactAnalysis })
            }
        });

        // 3. Notification (Emergency Channel)
        if (alert.severity === 'HIGH') {
            // In future: SMS/Slack Integration
            logger.error({
                message: '🚨 EMERGENCY NOTIFICATION SENT 🚨',
                alert: alert.message,
                assessment: impactAnalysis
            });
        }
    }

    /**
     * Handle natural language queries from the admin
     */
    static async handleChatQuery(organizationId: string, userId: string, query: string): Promise<any> {
        const correlationId = crypto.randomUUID();

        try {
            logger.info({
                message: 'AI Orchestrator: Handling Chat Query',
                context: { query, organizationId, userId },
                correlation: correlationId
            });

            // 1. Gather state for query context
            const context = await this.gatherContext(organizationId);

            // 2. Wrap query with context for the Brain
            const chatPrompt = {
                type: 'CHAT_QUERY',
                query,
                context
            };

            // 3. Consult the Brain
            const response = await AIBrainService.decideNextAction(chatPrompt as any);

            return {
                answer: response.reason,
                suggestedAction: response.action !== 'NONE' ? response : null,
                correlationId
            };
        } catch (error) {
            logger.error({
                message: 'AI Orchestrator: Chat query failed',
                error: error instanceof Error ? error : new Error(String(error)),
                correlation: correlationId
            });
            throw error;
        }
    }

    private static async gatherContext(organizationId: string): Promise<AIContext> {
        const [inventory, analytics, velocity] = await Promise.all([
            InventoryService.getInventory({ organizationId, limit: 100 }),
            AnalyticsService.getStoreAnalytics(organizationId),
            SalesVelocityService.getOrganizationVelocity(organizationId, 30)
        ]);

        // Map velocity to products
        const productsWithVelocity = inventory.products.map(p => ({
            ...p,
            salesVelocity: velocity.find(v => v.productId === p.id)?.velocity || 0
        }));

        return {
            inventory: productsWithVelocity,
            analytics,
            salesVelocity: 'Detailed velocity mapped to products'
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
        const { action, data } = decision;

        logger.info({
            message: 'AI Orchestrator: Executing Action',
            context: { action, data }
        });

        try {
            switch (action) {
                case 'CREATE_PURCHASE_ORDER':
                    return await SupplierService.createPurchaseOrder({
                        supplierId: data.supplierId,
                        items: [{
                            productId: data.productId,
                            quantity: data.quantity,
                            unitCost: data.unitCost || 0
                        }],
                        organizationId,
                        createdById: userId,
                        origin: 'ai'
                    });

                case 'UPDATE_PRODUCT_PRICE':
                    return await PricingService.updateProductPrice({
                        productId: data.productId,
                        organizationId,
                        newPrice: data.newPrice,
                        reason: decision.reason,
                        updatedBy: 'ai'
                    });

                default:
                    logger.warn({ message: 'AI Orchestrator: Action not implemented for auto-execution', action });
                    return null;
            }
        } catch (error) {
            logger.error({ message: 'AI Orchestrator: Action execution failed', action, error });
            throw error;
        }
    }
}

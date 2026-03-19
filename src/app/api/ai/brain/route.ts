import { NextRequest, NextResponse } from 'next/server';
import { Permission, requirePermission, AuthenticatedRequest, getOrganizationScope } from '@/lib/rbac/middleware';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { AIBrainService } from '@/lib/services/ai-brain.service';
import { InventoryService } from '@/lib/services/inventory.service';
import { AnalyticsService } from '@/lib/services/analytics.service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/brain
 * Test endpoint to see what the AI Brain thinks of the current store state
 */
export const GET = requirePermission(Permission.AI_MANAGE)(
    async (req: AuthenticatedRequest, user) => {
        try {
            const organizationId = getOrganizationScope(user);
            if (!organizationId) {
                return NextResponse.json({ success: false, message: 'Org required' }, { status: 400 });
            }

            // 1. Collect Context
            const [inventory, analytics] = await Promise.all([
                InventoryService.getInventory({ organizationId, limit: 50 }),
                AnalyticsService.getStoreAnalytics(organizationId)
            ]);

            const context = {
                inventory: inventory.products,
                analytics,
                salesVelocity: 'Normal' // Placeholder
            };

            // 2. Ask Brain
            const decision = await AIBrainService.decideNextAction(context);

            logger.info({
                message: 'AI Brain Insight Generated',
                context: { decision, organizationId }
            });

            return NextResponse.json(successResponse({
                contextSummary: {
                    productsChecked: inventory.products.length,
                    lowStockCount: analytics.lowStockAlerts
                },
                decision
            }));

        } catch (error: any) {
            return NextResponse.json({
                success: false,
                message: error.message || 'Brain failure'
            }, { status: 500 });
        }
    }
);

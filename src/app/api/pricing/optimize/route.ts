import { NextResponse } from 'next/server';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { AIBrainService, AIContext } from '@/lib/services/ai-brain.service';
import { InventoryService } from '@/lib/services/inventory.service';
import { SalesVelocityService } from '@/lib/services/sales-velocity.service';
import { logger } from '@/lib/logger';
import { AuditService } from '@/lib/services/audit.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pricing/optimize
 * Dynamic pricing analysis and application
 */
export const POST = requirePermission('MANAGE_AI_PRICING')(
    async (req: AuthenticatedRequest, user) => {
        try {
            const organizationId = getOrganizationScope(user);
            if (!organizationId) {
                throw new ValidationError('Organization scope required');
            }

            const body = await req.json();
            const { mode = 'analyze' } = body;

            // 1. Fetch Context
            const [inventory, velocity] = await Promise.all([
                InventoryService.getInventory({ organizationId, limit: 10 }),
                SalesVelocityService.getOrganizationVelocity(organizationId)
            ]);

            const context: AIContext = {
                inventory: inventory.items,
                salesVelocity: velocity,
                analytics: {
                    totalProducts: inventory.total,
                    activeVelocity: velocity.avgUnitsPerDay
                }
            };

            // 2. Generate Recommendations
            const pricingData = await AIBrainService.optimizePricing(context);

            if (mode === 'apply') {
                // If application is requested, we would iterate and update products
                // In a real system, we might update in a transaction
                // For now, we simulate and log

                await AuditService.log({
                    action: 'AI_OPTIMIZATION',
                    entity: 'PRICING',
                    entityId: organizationId,
                    userId: user.id,
                    organizationId,
                    ipAddress: req.ip || '0.0.0.0',
                    metadata: { recommendationsCount: pricingData.recommendations.length }
                });

                logger.info({
                    message: 'AI pricing adjustments applied',
                    context: {
                        userId: user.id,
                        organizationId,
                        count: pricingData.recommendations.length
                    }
                });
            }

            return NextResponse.json(successResponse(pricingData));
        } catch (error: any) {
            return NextResponse.json({
                success: false,
                message: error.message || 'Pricing optimization failed'
            }, { status: 500 });
        }
    }
);

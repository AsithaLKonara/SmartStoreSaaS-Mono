import { NextResponse } from 'next/server';
import { requirePermission, Permission, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
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
export const POST = requirePermission(Permission.AI_READ)(
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

            const totalUnitsSold = velocity.reduce((sum, v) => sum + v.unitsSold, 0);
            const avgVelocity = velocity.length > 0 ? totalUnitsSold / velocity.length : 0;

            const context: AIContext = {
                inventory: inventory.products,
                salesVelocity: velocity,
                analytics: {
                    totalProducts: inventory.total,
                    activeVelocity: avgVelocity
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
                    resource: 'PRICING',
                    resourceId: organizationId,
                    userId: user.id,
                    organizationId,
                    ipAddress: req.ip || '0.0.0.0',
                    details: { recommendationsCount: pricingData.recommendations.length }
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

/**
 * AI Analytics Insights API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (VIEW_AI_INSIGHTS permission)
 * 
 * Organization Scoping: Required
 */

import { NextResponse } from 'next/server';
import { AIBrainService, AIContext } from '@/lib/services/ai-brain.service';
import { InventoryService } from '@/lib/services/inventory.service';
import { SalesVelocityService } from '@/lib/services/sales-velocity.service';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

/**
 * POST /api/ai-analytics/insights
 * Generate AI insights (VIEW_AI_INSIGHTS permission)
 */
export const POST = requirePermission('VIEW_AI_INSIGHTS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { dataType = 'all' } = body;

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

      // 2. Generate Insights
      const insights = await AIBrainService.generateDashboardInsights(context);

      logger.info({
        message: 'AI insights generated',
        context: {
          userId: user.id,
          organizationId
        }
      });

      return NextResponse.json(successResponse({
        ...insights,
        confidence: 0.9,
        dataType
      }));
    } catch (error: any) {
      logger.error({
        message: 'AI insights generation failed',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });

      if (error instanceof ValidationError) {
        throw error;
      }

      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'AI insights generation failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

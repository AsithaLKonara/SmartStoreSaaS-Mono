/**
 * AI Analytics Predictions API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (VIEW_AI_PREDICTIONS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { AIBrainService, AIContext } from '@/lib/services/ai-brain.service';
import { InventoryService } from '@/lib/services/inventory.service';
import { SalesVelocityService } from '@/lib/services/sales-velocity.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai-analytics/predictions
 * Generate AI predictions (VIEW_AI_PREDICTIONS permission)
 */
export const POST = requirePermission('VIEW_AI_PREDICTIONS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

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

      // 2. Generate Predictions
      const predictions = await AIBrainService.generatePredictions(context);

      logger.info({
        message: 'AI predictions generated',
        context: {
          userId: user.id,
          organizationId
        }
      });

      return NextResponse.json(successResponse({
        predictions,
        confidence: 0.88
      }));
    } catch (error: any) {
      logger.error({
        message: 'AI predictions generation failed',
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
        message: 'AI predictions generation failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

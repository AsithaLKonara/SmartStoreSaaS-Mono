import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/integrations
 * Get integrations
 */
export const GET = requirePermission('VIEW_SETTINGS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      logger.info({
        message: 'Integrations fetched',
        context: {
          userId: user.id,
          organizationId
        },
        correlation: req.correlationId
      });

      // TODO: Implement actual integrations fetching
      // This would typically involve querying integrations from database
      const integrations = [
        { id: 'stripe', name: 'Stripe', status: 'connected', type: 'payment' },
        { id: 'shopify', name: 'Shopify', status: 'disconnected', type: 'ecommerce' },
        { id: 'woocommerce', name: 'WooCommerce', status: 'disconnected', type: 'ecommerce' }
      ];

      return NextResponse.json(successResponse(integrations));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch integrations',
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
        message: 'Failed to fetch integrations',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
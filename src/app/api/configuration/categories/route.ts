/**
 * Configuration Categories API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_SETTINGS permission)
 * 
 * Returns available configuration categories
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/configuration/categories
 * Get configuration categories
 */
export const GET = requirePermission('VIEW_SETTINGS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const categories = [
        { id: 'general', name: 'General Settings' },
        { id: 'payment', name: 'Payment Settings' },
        { id: 'shipping', name: 'Shipping Settings' },
        { id: 'tax', name: 'Tax Settings' },
        { id: 'email', name: 'Email Settings' },
        { id: 'integrations', name: 'Integrations' }
      ];

      logger.info({
        message: 'Configuration categories fetched',
        context: {
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(categories));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch configuration categories',
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
        message: 'Failed to fetch configuration categories',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

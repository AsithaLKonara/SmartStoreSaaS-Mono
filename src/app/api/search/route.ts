/**
 * Search API Route
 * 
 * Authorization:
 * - GET: All authenticated users (VIEW_PRODUCTS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requireAuth, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/search
 * Perform search (requires authentication)
 */
export const GET = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const { searchParams } = new URL(req.url);
      const query = searchParams.get('q');
      const type = searchParams.get('type') || 'all';

      if (!query) {
        throw new ValidationError('Query parameter is required', {
          fields: { q: !query }
        });
      }

      logger.info({
        message: 'Search performed',
        context: {
          userId: user.id,
          organizationId,
          query,
          type
        },
        correlation: req.correlationId
      });

      // TODO: Implement actual search logic
      return NextResponse.json(successResponse({
        results: [],
        query,
        type,
        message: 'Search - implementation pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Search failed',
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
        message: 'Search failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/docs
 * Get documentation list (public or authenticated)
 */
export const GET = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      logger.info({
        message: 'Documents fetched',
        context: {
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });

      // TODO: Implement documents fetching
      // This would typically involve querying documents from database
      const documents = [
        {
          id: 'doc_1',
          title: 'Getting Started Guide',
          description: 'A comprehensive guide to get started with the platform',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'doc_2',
          title: 'API Documentation',
          description: 'Complete API reference and examples',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      return NextResponse.json(successResponse(documents));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch documents',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch documents',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
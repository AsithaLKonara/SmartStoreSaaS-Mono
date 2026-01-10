import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/docs/[id]
 * Get single document (public or authenticated)
 */
export const GET = requireAuth(
  async (req: AuthenticatedRequest, user, { params }: { params: { id: string } }) => {
    try {
      const docId = params.id;

      logger.info({
        message: 'Document fetched',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          docId
        },
        correlation: req.correlationId
      });

      // TODO: Implement document fetching
      // This would typically involve querying documents from database
      const document = {
        id: docId,
        title: 'Sample Document',
        content: 'This is a sample document content.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return NextResponse.json(successResponse(document));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch document',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId,
          docId: params.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch document',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
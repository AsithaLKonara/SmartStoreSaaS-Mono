import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireRole, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/email/statistics
 * Email statistics (SUPER_ADMIN or TENANT_ADMIN)
 */
import { prisma } from '@/lib/prisma';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      // Aggregate campaign stats
      const stats = await prisma.emailCampaign.aggregate({
        where: { organizationId },
        _sum: {
          recipientCount: true,
          openCount: true,
          clickCount: true
        }
      });

      const totalSent = stats._sum.recipientCount || 0;
      const totalOpened = stats._sum.openCount || 0;
      const totalClicked = stats._sum.clickCount || 0;

      const statistics = {
        totalSent,
        totalOpened,
        totalClicked,
        openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
        clickRate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
        period: 'All Time'
      };

      logger.info({
        message: 'Email statistics generated successfully',
        context: { userId: user.id, organizationId, totalSent }
      });

      return NextResponse.json(successResponse(statistics));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch email statistics',
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
        message: 'Failed to fetch email statistics',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/customer-portal/gift-cards
 * Get customer gift cards (authenticated customer)
 */
export const GET = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      const giftCards = await prisma.giftCard.findMany({
        where: {
          OR: [
            { issuedTo: user.id },
            { issuedToEmail: user.email }
          ]
        }
      });

      logger.info({
        message: 'Gift cards fetched',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          count: giftCards.length
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(giftCards));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch gift cards',
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
        message: 'Failed to fetch gift cards',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
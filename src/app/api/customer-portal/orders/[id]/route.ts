import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, NotFoundError } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/customer-portal/orders/[id]
 * Get single customer order (authenticated customer)
 */
export const GET = requireAuth(
  async (req: AuthenticatedRequest, user, { params }: { params: { id: string } }) => {
    try {
      const order = await prisma.order.findFirst({
        where: {
          id: params.id,
          customerId: user.id
        },
        include: {
          orderItems: {
            include: {
              product: true
            }
          },
          deliveries: true
        }
      });

      if (!order) {
        throw new NotFoundError('Order not found');
      }

      logger.info({
        message: 'Customer order fetched',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          orderId: params.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(order));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch customer order',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId,
          orderId: params.id
        },
        correlation: req.correlationId
      });
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      return NextResponse.json({
        success: false,
        code: 'ERR_INTERNAL',
        message: 'Failed to fetch customer order',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
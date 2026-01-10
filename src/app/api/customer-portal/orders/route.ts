import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/customer-portal/orders
 * Get customer orders (authenticated customer)
 */
export const GET = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');

      const orders = await prisma.order.findMany({
        where: { customerId: user.id },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          orderItems: {
            include: {
              product: true
            }
          }
        }
      });

      const total = await prisma.order.count({
        where: { customerId: user.id }
      });

      logger.info({
        message: 'Customer orders fetched',
        context: {
          userId: user.id,
          organizationId: user.organizationId,
          count: orders.length
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch customer orders',
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
        message: 'Failed to fetch customer orders',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/customer-portal/orders
 * Customer cannot create orders directly
 */
export const POST = requireAuth(
  async (req: AuthenticatedRequest, user) => {
    try {
      logger.info({
        message: 'POST to orders endpoint - customer cannot create orders directly',
        context: {
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        message: 'Customer cannot create orders directly',
        status: 'use_checkout_endpoint'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to process customer order creation request',
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
        message: 'Failed to process request',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
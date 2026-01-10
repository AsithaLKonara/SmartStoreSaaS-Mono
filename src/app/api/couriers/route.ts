import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/couriers
 * Get couriers (VIEW_INVENTORY permission - couriers are related to shipping/inventory)
 */
export const GET = requirePermission('VIEW_INVENTORY')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');

      const couriers = await prisma.courier.findMany({
        where: { organizationId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      const total = await prisma.courier.count({
        where: { organizationId }
      });

      logger.info({
        message: 'Couriers fetched',
        context: {
          userId: user.id,
          organizationId,
          count: couriers.length,
          total
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        couriers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch couriers',
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
        message: 'Failed to fetch couriers',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/couriers
 * Create courier (MANAGE_INVENTORY permission)
 */
export const POST = requirePermission('MANAGE_INVENTORY')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const courier = await prisma.courier.create({
        data: {
          ...body,
          organizationId
        }
      });

      logger.info({
        message: 'Courier created',
        context: {
          userId: user.id,
          organizationId,
          courierId: courier.id
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(courier), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create courier',
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
        message: 'Failed to create courier',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
/**
 * Fulfillment API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF (VIEW_INVENTORY permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN, STAFF (MANAGE_INVENTORY permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/fulfillment
 * List fulfillments with organization scoping
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

      const [fulfillments, total] = await Promise.all([
        prisma.delivery.findMany({
          where: { organizationId },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.delivery.count({
          where: { organizationId }
        })
      ]);

      logger.info({
        message: 'Fulfillments fetched',
        context: {
          userId: user.id,
          organizationId,
          count: fulfillments.length
        },
        correlation: req.correlationId
      });

      return NextResponse.json(
        successResponse(fulfillments, {
          pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        })
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch fulfillments',
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
        message: 'Failed to fetch fulfillments',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/fulfillment
 * Create fulfillment
 */
export const POST = requirePermission('MANAGE_INVENTORY')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const fulfillment = await prisma.delivery.create({
        data: {
          ...body,
          organizationId
        }
      });

      logger.info({
        message: 'Fulfillment created',
        context: {
          userId: user.id,
          fulfillmentId: fulfillment.id,
          organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(fulfillment));
    } catch (error: any) {
      logger.error({
        message: 'Failed to create fulfillment',
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
        message: 'Failed to create fulfillment',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
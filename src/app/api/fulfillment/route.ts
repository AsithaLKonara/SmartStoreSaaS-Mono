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
      const filter = searchParams.get('status') || 'all';

      const [fulfillments, total] = await Promise.all([
        prisma.fulfillment.findMany({
          where: {
            organizationId,
            ...(filter !== 'all' ? { status: filter } : {})
          },
          include: {
            order: {
              include: {
                customer: true,
              }
            },
            items: {
              include: {
                product: true
              }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.fulfillment.count({
          where: {
            organizationId,
            ...(filter !== 'all' ? { status: filter } : {})
          }
        })
      ]);

      const orders = fulfillments.map(f => ({
        id: f.id,
        orderNumber: (f.order as any)?.orderNumber || `ORD-${f.orderId.substring(0, 8)}`,
        customer: {
          name: (f.order as any)?.customer?.name || 'Unknown',
          email: (f.order as any)?.customer?.email || '',
          phone: (f.order as any)?.customer?.phone || '',
        },
        items: (f as any).items?.map((item: any) => ({
          productName: item.product?.name || 'Unknown',
          quantity: item.quantity,
          location: (item.product as any)?.dimensions || 'W-01', // Use dimensions as location placeholder if location not in schema
        })) || [],
        priority: (f as any).priority || 'MEDIUM',
        status: f.status,
        assignedTo: (f as any).assignedTo || null,
        totalAmount: Number((f.order as any)?.total || 0),
        createdAt: f.createdAt.toISOString()
      }));

      logger.info({
        message: 'Fulfillment orders fetched',
        context: {
          userId: user.id,
          organizationId,
          count: orders.length
        },
        correlation: req.correlationId
      });

      return NextResponse.json(
        successResponse({
          orders,
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
      const fulfillment = await prisma.fulfillment.create({
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
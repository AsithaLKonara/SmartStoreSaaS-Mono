/**
 * Abandoned Carts API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_MARKETING permission)
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_MARKETING permission)
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
 * GET /api/marketing/abandoned-carts
 * Get abandoned carts
 */
export const GET = requirePermission('VIEW_MARKETING')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const hours = parseInt(searchParams.get('hours') || '24');

    // Calculate cutoff time for abandoned carts
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Query orders that are PENDING and older than cutoff (abandoned carts)
    const [abandonedOrders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          organizationId,
          status: 'PENDING',
          createdAt: { lte: cutoffTime }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          customer: {
            select: { name: true, email: true }
          },
          orderItems: {
            include: {
              product: {
                select: { name: true, price: true }
              }
            }
          }
        }
      }),
      prisma.order.count({
        where: {
          organizationId,
          status: 'PENDING',
          createdAt: { lte: cutoffTime }
        }
      })
    ]);

      logger.info({
        message: 'Abandoned carts fetched successfully',
        context: {
          userId: user.id,
          organizationId,
          count: abandonedOrders.length,
          total,
          hours,
          page,
          limit
        },
        correlation: req.correlationId
      });

      return NextResponse.json(
        successResponse(abandonedOrders, {
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        })
      );
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch abandoned carts',
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
        message: 'Failed to fetch abandoned carts',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/marketing/abandoned-carts
 * Initiate abandoned cart campaign
 */
export const POST = requirePermission('MANAGE_MARKETING')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { cartIds, campaignType = 'email', templateId, delay = 0 } = body;

      if (!cartIds || !Array.isArray(cartIds) || cartIds.length === 0) {
        throw new ValidationError('No cart IDs provided');
      }

      // TODO: Implement actual abandoned cart campaign logic
      // This would typically involve:
      // 1. Validating cart IDs
      // 2. Creating campaign records
      // 3. Scheduling emails/SMS based on delay
      // 4. Tracking campaign performance

      const campaign = {
        id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: campaignType,
        cartIds,
        templateId,
        delay,
        status: 'scheduled',
        organizationId,
        createdAt: new Date().toISOString()
      };

      logger.info({
        message: 'Abandoned cart campaign initiated',
        context: {
          userId: user.id,
          cartIds: cartIds.length,
          campaignType,
          templateId,
          delay,
          organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse(campaign));
    } catch (error: any) {
      logger.error({
        message: 'Abandoned cart campaign failed',
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
        message: 'Failed to initiate abandoned cart campaign',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
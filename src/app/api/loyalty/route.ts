import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/loyalty
 * Get loyalty programs (VIEW_LOYALTY permission)
 */
export const GET = requirePermission('VIEW_LOYALTY')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');

      // Get loyalty programs with organization scoping
      const where: any = { organizationId };
      const [loyaltyPrograms, total] = await Promise.all([
        prisma.customerLoyalty.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.customerLoyalty.count({ where })
      ]);

      logger.info({
        message: 'Loyalty programs fetched successfully',
        context: {
          userId: user.id,
          organizationId,
          count: loyaltyPrograms.length,
          total
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        loyaltyPrograms,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch loyalty programs',
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
        message: 'Failed to fetch loyalty programs',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);

/**
 * POST /api/loyalty
 * Create loyalty transaction (MANAGE_LOYALTY permission)
 */
export const POST = requirePermission('MANAGE_LOYALTY')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { customerId, points, action, description } = body;

      // Validate required fields
      if (!customerId || !points || !action) {
        throw new ValidationError('Missing required fields: customerId, points, action', {
          fields: { customerId: !customerId, points: !points, action: !action }
        });
      }

      // Get or create customer loyalty record
      let customerLoyalty = await prisma.customerLoyalty.findFirst({
        where: { customerId, organizationId }
      });

      if (!customerLoyalty) {
        customerLoyalty = await prisma.customerLoyalty.create({
          data: {
            customerId,
            organizationId,
            points: 0
          }
        });
      }

      // Create loyalty transaction
      const loyaltyTransaction = await prisma.loyalty_transactions.create({
        data: {
          id: `loyalty_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          customerId,
          loyaltyId: customerLoyalty.id,
          type: action,
          points: parseInt(points),
          description: description || ''
        }
      });

      logger.info({
        message: 'Loyalty transaction created successfully',
        context: {
          userId: user.id,
          organizationId,
          customerId,
          points,
          action
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        message: 'Loyalty transaction created successfully',
        data: loyaltyTransaction
      }), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create loyalty transaction',
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
        message: 'Failed to create loyalty transaction',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
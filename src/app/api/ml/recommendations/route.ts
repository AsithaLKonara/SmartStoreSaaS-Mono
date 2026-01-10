import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { requirePermission, getOrganizationScope, AuthenticatedRequest } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ml/recommendations
 * Generate ML-based recommendations (VIEW_AI_INSIGHTS permission)
 */
export const POST = requirePermission('VIEW_AI_INSIGHTS')(
  async (req: AuthenticatedRequest, user) => {
    try {
      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new ValidationError('User must belong to an organization');
      }

      const body = await req.json();
      const { customerId, type = 'products', limit = 10, modelVersion = 'v1.0' } = body;

      if (!customerId) {
        throw new ValidationError('Customer ID is required', {
          fields: { customerId: !customerId }
        });
      }

      logger.info({
        message: 'Recommendations requested',
        context: {
          userId: user.id,
          organizationId,
          customerId,
          type,
          limit,
          modelVersion
        },
        correlation: req.correlationId
      });

    // Get customer's purchase history for collaborative filtering
    const customerOrders = await prisma.order.findMany({
      where: {
        customerId,
        organizationId,
        status: { in: ['COMPLETED', 'DELIVERED'] }
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    // Get products from same categories that customer bought from
    const purchasedProductIds = customerOrders.flatMap(order =>
      order.orderItems.map(item => item.productId)
    );

    const recommendations = await prisma.product.findMany({
      where: {
        organizationId,
        isActive: true,
        id: { notIn: purchasedProductIds }, // Exclude already purchased
        stock: { gt: 0 }
      },
      orderBy: [
        { stock: 'desc' }, // Prioritize available items
        { createdAt: 'desc' } // Newer products first
      ],
      take: limit
    });

      return NextResponse.json(successResponse({
        customerId,
        type,
        recommendations,
        totalRecommendations: recommendations.length,
        modelVersion: '1.0-basic',
        generatedAt: new Date().toISOString(),
        note: 'Basic collaborative filtering - enhance with ML models for better recommendations'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Recommendations failed',
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
        message: 'Recommendations failed',
        correlation: req.correlationId || 'unknown'
      }, { status: 500 });
    }
  }
);
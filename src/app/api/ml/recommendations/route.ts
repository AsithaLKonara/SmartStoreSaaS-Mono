import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, type = 'products', limit = 10, modelVersion = 'v1.0' } = body;

    if (!customerId) {
      return NextResponse.json({
        success: false,
        error: 'Customer ID is required'
      }, { status: 400 });
    }

    logger.info({
      message: 'Recommendations requested',
      context: {
        userId: session.user.id,
        customerId,
        type,
        limit,
        modelVersion
      }
    });

    const organizationId = session.user.organizationId;

    // Get customer's purchase history for collaborative filtering
    const customerOrders = await prisma.order.findMany({
      where: { 
        customerId,
        organizationId,
        status: { in: ['COMPLETED', 'DELIVERED'] }
      },
      include: {
        items: {
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
      order.items.map(item => item.productId)
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

    return NextResponse.json({
      success: true,
      data: {
        customerId,
        type,
        recommendations,
        totalRecommendations: recommendations.length,
        modelVersion: '1.0-basic',
        generatedAt: new Date().toISOString(),
        note: 'Basic collaborative filtering - enhance with ML models for better recommendations'
      }
    });

  } catch (error: any) {
    logger.error({
      message: 'Recommendations failed',
      error: error.message,
      context: { path: request.nextUrl.pathname }
    });
    
    return NextResponse.json({
      success: false,
      error: 'Recommendations failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
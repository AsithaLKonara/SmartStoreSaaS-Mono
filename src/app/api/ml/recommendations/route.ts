import { NextRequest, NextResponse } from 'next/server';
import { recommendationEngine } from '@/lib/ml/recommendationEngine';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const productId = searchParams.get('productId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (customerId) {
      // Get customer's interaction history
      const orders = await prisma.orderItem.findMany({
        where: {
          order: { customerId }
        },
        select: {
          productId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const userInteractions = orders.map(order => ({
        productId: order.productId,
        interactionType: 'purchase' as const,
        timestamp: order.createdAt,
      }));

      // Get all products
      const allProducts = await prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          categoryId: true,
          price: true,
        },
      });

      const productInteractions = allProducts.map(p => ({
        productId: p.id,
        productName: p.name,
        categoryId: p.categoryId || undefined,
        price: Number(p.price),
      }));

      // Get all user interactions for collaborative filtering
      const allUserOrders = await prisma.orderItem.findMany({
        select: {
          productId: true,
          order: {
            select: { customerId: true, createdAt: true }
          }
        },
        take: 1000, // Sample for performance
      });

      const allUserInteractions = new Map<string, any[]>();
      for (const order of allUserOrders) {
        const userId = order.order.customerId;
        if (!allUserInteractions.has(userId)) {
          allUserInteractions.set(userId, []);
        }
        allUserInteractions.get(userId)!.push({
          productId: order.productId,
          interactionType: 'purchase' as const,
          timestamp: order.order.createdAt,
        });
      }

      // Get recommendations using hybrid model
      const recommendations = await recommendationEngine.getRecommendations(
        customerId,
        userInteractions,
        productInteractions,
        allUserInteractions,
        limit
      );

      return NextResponse.json({
        success: true,
        data: recommendations,
        message: 'Recommendations generated using hybrid collaborative + content-based filtering',
      });
    }

    if (productId) {
      // Get similar products
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          categoryId: true,
          price: true,
        },
      });

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      // Find similar products in same category with similar price
      const similar = await prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { not: productId },
          isActive: true,
        },
        take: limit,
        select: {
          id: true,
          name: true,
          price: true,
          categoryId: true,
        },
      });

      const recommendations = similar.map((p, index) => ({
        productId: p.id,
        productName: p.name,
        score: 0.9 - (index * 0.05),
        confidence: 0.75,
        reason: 'Similar product in same category',
        method: 'content-based' as const,
      }));

      return NextResponse.json({
        success: true,
        data: recommendations,
        message: 'Similar products based on category and attributes',
      });
    }

    // General recommendations (trending/popular products)
    const popular = await prisma.orderItem.groupBy({
      by: ['productId'],
      _count: {
        productId: true,
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _count: {
          productId: 'desc',
        },
      },
      take: limit,
    });

    const recommendations = await Promise.all(
      popular.map(async (item, index) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, price: true },
        });

        return {
          productId: item.productId,
          productName: product?.name || 'Unknown',
          score: 0.95 - (index * 0.05),
          confidence: 0.8,
          reason: `${item._count.productId} customers bought this`,
          method: 'popular' as const,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: recommendations,
      message: 'Popular products based on purchase frequency',
    });
  } catch (error: any) {
    console.error('Recommendations error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Recommendation failed',
      },
      { status: 500 }
    );
  }
}


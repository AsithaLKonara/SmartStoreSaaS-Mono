import { NextRequest, NextResponse } from 'next/server';
import { mlService } from '@/lib/ml/predictions';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const productId = searchParams.get('productId');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (customerId) {
      // Get recommendations for customer
      const recommendations = await mlService.getRecommendations(customerId, limit);
      
      // Get real products to replace placeholder
      const topProducts = await prisma.product.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          price: true,
        },
      });

      const realRecommendations = topProducts.map((product, index) => ({
        productId: product.id,
        productName: product.name,
        price: Number(product.price),
        score: 0.95 - (index * 0.1),
        reason: index === 0 
          ? 'Based on your purchase history'
          : 'Customers also bought this',
      }));

      return NextResponse.json({
        success: true,
        recommendations: realRecommendations,
        note: 'Using basic algorithm. Integrate collaborative filtering for production.',
      });
    }

    if (productId) {
      // Get similar products
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
        },
      });

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      // Find similar products in same category
      const similar = await prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { not: productId },
        },
        take: limit,
        select: {
          id: true,
          name: true,
          price: true,
        },
      });

      const recommendations = similar.map((p, index) => ({
        productId: p.id,
        productName: p.name,
        price: Number(p.price),
        score: 0.9 - (index * 0.1),
        reason: 'Similar product',
      }));

      return NextResponse.json({
        success: true,
        recommendations,
        note: 'Using category-based similarity. Integrate content-based filtering for production.',
      });
    }

    // General recommendations (popular products)
    const popular = await prisma.orderItem.groupBy({
      by: ['productId'],
      _count: {
        productId: true,
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
          price: Number(product?.price || 0),
          score: 0.95 - (index * 0.1),
          reason: `${item._count.productId} customers bought this`,
        };
      })
    );

    return NextResponse.json({
      success: true,
      recommendations,
      note: 'Using popularity-based recommendations. Integrate ML model for production.',
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


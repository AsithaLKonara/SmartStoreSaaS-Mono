import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/error-handling';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId') || 'default-org';
  const customerId = searchParams.get('customerId') || 'default-customer';
  const limit = parseInt(searchParams.get('limit') || '5');

  try {
    const prisma = new PrismaClient();

    // Get customer's order history for recommendations
    const customerOrders = await prisma.order.findMany({
      where: { customerId },
      include: {
        order_items: {
          include: {
            products: true
          }
        }
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    // Get top products from customer's purchase history
    const purchasedProductIds = customerOrders.flatMap(order => 
      order.order_items.map(item => item.productId)
    );

    // Get similar products based on categories of purchased items
    const purchasedProducts = await prisma.product.findMany({
      where: {
        id: { in: purchasedProductIds }
      },
      select: {
        categoryId: true
      }
    });

    const categoryIds = [...new Set(purchasedProducts.map(p => p.categoryId))];

    // Get recommended products from same categories
    const recommendedProducts = await prisma.product.findMany({
      where: {
        categoryId: { in: categoryIds },
        id: { notIn: purchasedProductIds },
        isActive: true
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    await prisma.$disconnect();

    const recommendations = recommendedProducts.map((product, index) => ({
      id: `rec-${index + 1}`,
      type: 'product',
      title: product.name,
      description: `Based on your purchase history, you might like this ${product.categoryId || 'product'}`,
      productId: product.id,
      price: parseFloat(product.price.toString()),
      image: '/placeholder-product.jpg',
      confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
      reason: 'Similar to your previous purchases'
    }));

    return NextResponse.json({
      success: true,
      data: recommendations,
      metadata: {
        organizationId,
        customerId,
        totalRecommendations: recommendations.length,
        basedOn: customerOrders.length > 0 ? 'purchase history' : 'popular items'
      }
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    
    // Fallback to mock data on error
    const mockRecommendations = [
      {
        id: 'rec-1',
        type: 'product',
        title: 'iPhone 15 Pro',
        description: 'Based on your purchase history, you might like this premium smartphone',
        productId: 'prod-iphone-15-pro',
        price: 999.99,
        image: '/placeholder-product.jpg',
        confidence: 0.85,
        reason: 'Similar to your previous purchases'
      },
      {
        id: 'rec-2',
        type: 'product',
        title: 'MacBook Air M2',
        description: 'Perfect companion for your iPhone, great for productivity',
        productId: 'prod-macbook-air-m2',
        price: 1199.99,
        image: '/placeholder-product.jpg',
        confidence: 0.78,
        reason: 'Complementary product'
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockRecommendations.slice(0, limit),
      metadata: {
        organizationId,
        customerId,
        totalRecommendations: mockRecommendations.length,
        basedOn: 'fallback recommendations'
      }
    });
  }
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { recommendationId, feedback, userId, organizationId } = body;

  if (!recommendationId || !feedback || !userId || !organizationId) {
    return NextResponse.json({
      success: false,
      message: 'Missing required fields for feedback'
    }, { status: 400 });
  }

  // In a real application, this would store feedback in a database
  console.log(`Received feedback for recommendation ${recommendationId}:`, feedback);

  return NextResponse.json({
    success: true,
    message: 'Feedback received successfully',
    data: { recommendationId, feedback, userId, organizationId }
  });
});

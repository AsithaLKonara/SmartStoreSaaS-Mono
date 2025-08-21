import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AIRecommendationEngine } from '@/lib/ai/recommendationEngine';
import { prisma } from '@/lib/prisma';

const recommendationEngine = new AIRecommendationEngine();

// GET - Get personalized product recommendations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId') || session.user.id;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Get recommendations
    const recommendations = await recommendationEngine.getRecommendations(
      userId,
      organizationId,
      limit
    );

    // Get product details for recommendations
    const productIds = recommendations.map(rec => rec.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        category: true,
        media: { take: 1, where: { isPrimary: true } },
        _count: { select: { orderItems: true } }
      }
    });

    // Combine recommendations with product data
    const enrichedRecommendations = recommendations.map(rec => {
      const product = products.find(p => p.id === rec.productId);
      return {
        ...rec,
        product: product ? {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.media[0]?.url,
          category: product.category?.name,
          popularity: product._count.orderItems
        } : null
      };
    }).filter(rec => rec.product !== null);

    return NextResponse.json({
      success: true,
      data: enrichedRecommendations,
      metadata: {
        total: enrichedRecommendations.length,
        algorithm: 'Hybrid (Collaborative + Content-based)',
        confidence: enrichedRecommendations.reduce((sum, rec) => sum + rec.confidence, 0) / enrichedRecommendations.length
      }
    });
  } catch (error) {
    console.error('AI recommendations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Record user behavior for learning
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, action, value, organizationId } = body;

    if (!productId || !action || !organizationId) {
      return NextResponse.json({
        error: 'Product ID, action, and organization ID are required'
      }, { status: 400 });
    }

    // Record user behavior
    await recommendationEngine.recordUserBehavior({
      userId: session.user.id,
      productId,
      action,
      value,
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'User behavior recorded successfully'
    });
  } catch (error) {
    console.error('User behavior recording error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/error-handling';
import { withSecurity } from '@/lib/security';

export const GET = withErrorHandling(
  withSecurity(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || 'org-1';
    const customerId = searchParams.get('customerId');

    // AI Recommendations data
    const recommendations = {
      organizationId,
      customerId,
      timestamp: new Date().toISOString(),
      recommendations: {
        products: [
          {
            id: 'prod-001',
            name: 'Premium Headphones',
            reason: 'Based on your purchase history',
            confidence: 0.92,
            price: 199.99,
            image: '/images/headphones.jpg'
          },
          {
            id: 'prod-002',
            name: 'Smart Watch',
            reason: 'Similar customers also bought',
            confidence: 0.87,
            price: 299.99,
            image: '/images/smartwatch.jpg'
          },
          {
            id: 'prod-003',
            name: 'Wireless Speaker',
            reason: 'Trending in your category',
            confidence: 0.78,
            price: 149.99,
            image: '/images/speaker.jpg'
          }
        ],
        categories: [
          { name: 'Electronics', score: 0.95, reason: 'High engagement' },
          { name: 'Accessories', score: 0.82, reason: 'Frequent purchases' },
          { name: 'Home & Garden', score: 0.65, reason: 'Seasonal interest' }
        ],
        offers: [
          {
            type: 'discount',
            value: '20% off',
            product: 'Premium Headphones',
            validUntil: '2024-02-15',
            reason: 'First-time buyer offer'
          },
          {
            type: 'bundle',
            value: 'Buy 2 Get 1 Free',
            products: ['Smart Watch', 'Wireless Speaker'],
            validUntil: '2024-02-20',
            reason: 'Bundle recommendation'
          }
        ]
      },
      personalization: {
        model: 'collaborative_filtering',
        lastUpdated: '2024-01-15T10:30:00Z',
        accuracy: 0.89
      }
    };

    return NextResponse.json(recommendations);
  })
);

export const POST = withErrorHandling(
  withSecurity(async (request: NextRequest) => {
    const body = await request.json();
    
    // Process recommendation feedback
    const feedback = {
      id: `feedback-${Date.now()}`,
      customerId: body.customerId,
      recommendationId: body.recommendationId,
      action: body.action, // 'clicked', 'purchased', 'dismissed'
      rating: body.rating,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: feedback,
      message: 'Recommendation feedback recorded'
    });
  })
);

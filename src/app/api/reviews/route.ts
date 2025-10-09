import { NextRequest, NextResponse } from 'next/server';
import {
  createReview,
  approveReview,
  rejectReview,
  markReviewHelpful,
  getProductReviews,
  getCustomerReviews,
  respondToReview,
} from '@/lib/reviews/manager';

export const dynamic = 'force-dynamic';

// Get reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const customerId = searchParams.get('customerId');

    if (customerId) {
      const reviews = await getCustomerReviews(customerId);
      return NextResponse.json({ success: true, data: reviews });
    }

    if (productId) {
      const rating = searchParams.get('rating');
      const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
      const sortBy = searchParams.get('sortBy') as any;
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

      const result = await getProductReviews(productId, {
        rating: rating ? parseInt(rating) : undefined,
        verifiedOnly,
        sortBy,
        limit,
      });

      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json(
      { error: 'Product ID or Customer ID is required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// Create review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, customerId, rating, title, comment, images } = body;

    if (!productId || !customerId || !rating) {
      return NextResponse.json(
        { error: 'Product ID, customer ID, and rating are required' },
        { status: 400 }
      );
    }

    const result = await createReview({
      productId,
      customerId,
      rating,
      title,
      comment,
      images,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.review,
        message: 'Review submitted successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { error: error.message || 'Review creation failed' },
      { status: 500 }
    );
  }
}

// Update review
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, action, ...data } = body;

    if (!reviewId || !action) {
      return NextResponse.json(
        { error: 'Review ID and action are required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'approve':
        result = await approveReview(reviewId);
        break;
      case 'reject':
        result = await rejectReview(reviewId, data.reason);
        break;
      case 'helpful':
        result = await markReviewHelpful(reviewId, data.customerId);
        break;
      case 'respond':
        result = await respondToReview(reviewId, data.response, data.responderId);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Review ${action} completed successfully`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Update review error:', error);
    return NextResponse.json(
      { error: error.message || 'Review update failed' },
      { status: 500 }
    );
  }
}


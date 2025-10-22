/**
 * Product Reviews & Ratings System
 */

import { prisma } from '@/lib/prisma';

export interface ReviewData {
  productId: string;
  customerId: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  verifiedPurchase?: boolean;
}

/**
 * Create review
 */
export async function createReview(
  data: ReviewData
): Promise<{ success: boolean; review?: any; error?: string }> {
  try {
    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5' };
    }

    // Check for existing review
    const existing = await prisma.review.findFirst({
      where: {
        productId: data.productId,
        customerId: data.customerId,
      },
    });

    if (existing) {
      return { success: false, error: 'You have already reviewed this product' };
    }

    // Check if verified purchase
    if (data.verifiedPurchase === undefined) {
      const purchase = await prisma.orderItem.findFirst({
        where: {
          productId: data.productId,
          order: {
            customerId: data.customerId,
            status: { in: ['COMPLETED', 'DELIVERED'] },
          },
        },
      });
      data.verifiedPurchase = !!purchase;
    }

    const review = await prisma.review.create({
      data: {
        ...data,
        status: 'PENDING',
        helpfulCount: 0,
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
    });

    // Update product rating
    await updateProductRating(data.productId);

    return { success: true, review };
  } catch (error: any) {
    console.error('Create review error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update product average rating
 */
async function updateProductRating(productId: string): Promise<void> {
  const reviews = await prisma.review.findMany({
    where: {
      productId,
      status: 'APPROVED',
    },
    select: {
      rating: true,
    },
  });

  if (reviews.length === 0) return;

  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / reviews.length;

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: averageRating,
      reviewCount: reviews.length,
    },
  });
}

/**
 * Approve review
 */
export async function approveReview(
  reviewId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });

    await updateProductRating(review.productId);

    return { success: true };
  } catch (error: any) {
    console.error('Approve review error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reject review
 */
export async function rejectReview(
  reviewId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Reject review error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark review as helpful
 */
export async function markReviewHelpful(
  reviewId: string,
  customerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if already marked
    const existing = await prisma.reviewHelpful.findFirst({
      where: {
        reviewId,
        customerId,
      },
    });

    if (existing) {
      return { success: false, error: 'Already marked as helpful' };
    }

    await prisma.reviewHelpful.create({
      data: {
        reviewId,
        customerId,
      },
    });

    await prisma.review.update({
      where: { id: reviewId },
      data: {
        helpfulCount: { increment: 1 },
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Mark helpful error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get product reviews
 */
export async function getProductReviews(
  productId: string,
  filters?: {
    rating?: number;
    verifiedOnly?: boolean;
    sortBy?: 'recent' | 'helpful' | 'rating';
    limit?: number;
  }
) {
  const where: any = {
    productId,
    status: 'APPROVED',
  };

  if (filters?.rating) {
    where.rating = filters.rating;
  }

  if (filters?.verifiedOnly) {
    where.verifiedPurchase = true;
  }

  let orderBy: any = { createdAt: 'desc' };
  if (filters?.sortBy === 'helpful') {
    orderBy = { helpfulCount: 'desc' };
  } else if (filters?.sortBy === 'rating') {
    orderBy = { rating: 'desc' };
  }

  const reviews = await prisma.review.findMany({
    where,
    include: {
      customer: {
        select: {
          name: true,
        },
      },
    },
    orderBy,
    take: filters?.limit || 50,
  });

  // Calculate rating distribution
  const allReviews = await prisma.review.findMany({
    where: {
      productId,
      status: 'APPROVED',
    },
    select: {
      rating: true,
    },
  });

  const distribution = {
    5: allReviews.filter(r => r.rating === 5).length,
    4: allReviews.filter(r => r.rating === 4).length,
    3: allReviews.filter(r => r.rating === 3).length,
    2: allReviews.filter(r => r.rating === 2).length,
    1: allReviews.filter(r => r.rating === 1).length,
  };

  const totalReviews = allReviews.length;
  const averageRating = totalReviews > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  return {
    reviews,
    summary: {
      totalReviews,
      averageRating,
      distribution,
      verifiedCount: allReviews.filter((r: any) => r.verifiedPurchase).length,
    },
  };
}

/**
 * Get customer reviews
 */
export async function getCustomerReviews(customerId: string) {
  return await prisma.review.findMany({
    where: { customerId },
    include: {
      product: {
        select: {
          name: true,
          sku: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Respond to review
 */
export async function respondToReview(
  reviewId: string,
  response: string,
  responderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        response,
        responderId,
        respondedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Respond to review error:', error);
    return { success: false, error: error.message };
  }
}


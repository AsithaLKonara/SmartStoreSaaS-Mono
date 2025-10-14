/**
 * Reviews API Route
 * 
 * Authorization:
 * - GET: Public (anyone can view approved reviews)
 * - POST: CUSTOMER (authenticated users can review)
 * - PATCH: SUPER_ADMIN, TENANT_ADMIN (moderate reviews)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Public endpoint - anyone can view approved reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const status = searchParams.get('status') || 'APPROVED';

    const where: any = { status };
    if (productId) where.productId = productId;

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    logger.info({
      message: 'Reviews fetched',
      context: { productId, count: reviews.length }
    });

    return NextResponse.json(successResponse(reviews));
  } catch (error: any) {
    logger.error({
      message: 'Failed to fetch reviews',
      error: error
    });
    throw error;
  }
}

export const POST = requireAuth(
  async (request, user) => {
    try {
      const body = await request.json();
      const { productId, rating, comment } = body;

      if (!productId || !rating) {
        throw new ValidationError('Product ID and rating are required');
      }

      if (rating < 1 || rating > 5) {
        throw new ValidationError('Rating must be between 1 and 5');
      }

      const review = await prisma.review.create({
        data: {
          productId,
          customerId: user.id,
          rating,
          comment,
          status: 'PENDING',
          organizationId: user.organizationId || ''
        }
      });

      logger.info({
        message: 'Review created',
        context: { userId: user.id, productId, rating }
      });

      return NextResponse.json(successResponse(review), { status: 201 });
    } catch (error: any) {
      logger.error({
        message: 'Failed to create review',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

export const PATCH = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const body = await request.json();
      const { reviewId, action } = body;

      if (!reviewId || !action) {
        throw new ValidationError('Review ID and action are required');
      }

      let status: string;
      switch (action) {
        case 'approve':
          status = 'APPROVED';
          break;
        case 'reject':
          status = 'REJECTED';
          break;
        case 'spam':
          status = 'SPAM';
          break;
        default:
          throw new ValidationError('Invalid action');
      }

      const review = await prisma.review.update({
        where: { id: reviewId },
        data: { status }
      });

      logger.info({
        message: `Review ${action}`,
        context: { userId: user.id, reviewId, action }
      });

      return NextResponse.json(successResponse(review));
    } catch (error: any) {
      logger.error({
        message: 'Failed to moderate review',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

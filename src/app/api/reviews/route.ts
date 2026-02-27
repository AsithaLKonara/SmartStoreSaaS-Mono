import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { successResponse, AppError } from '@/lib/middleware/withErrorHandler';
import { requireAuth, getOrganizationScope, AuthenticatedRequest } from '@/lib/rbac/middleware';
import { withErrorHandlerApp } from '@/lib/middleware/withErrorHandlerApp';

export const GET = withErrorHandlerApp(
  requireAuth(async (req: AuthenticatedRequest, user) => {
    try {

      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const productId = searchParams.get('productId');
      const status = searchParams.get('status');
      const rating = searchParams.get('rating');

      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new AppError('Organization ID not found for user', 'ERR_VALIDATION', 400);
      }

      logger.info({
        message: 'Reviews fetched',
        context: {
          userId: user.id,
          page,
          limit,
          productId,
          status,
          rating,
          organizationId
        },
        correlation: req.correlationId
      });

      // Build where clause for reviews
      const where: any = {
        product: {
          organizationId
        }
      };

      if (productId) where.productId = productId;
      if (status) where.status = status;
      if (rating) where.rating = parseInt(rating);

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            product: {
              select: { name: true, organizationId: true }
            },
            customer: {
              select: { name: true }
            }
          }
        }),
        prisma.review.count({ where })
      ]);

      return NextResponse.json(successResponse({
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }));

    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch reviews',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          organizationId: user.organizationId,
          userId: user.id
        },
        correlation: req.correlationId
      });
      throw error;
    }
  })
);

export const POST = withErrorHandlerApp(
  requireAuth(async (req: AuthenticatedRequest, user) => {
    try {

      const body = await req.json();
      const { productId, rating, title, comment } = body;

      // Validate required fields
      if (!productId || !rating || !title || !comment) {
        return NextResponse.json({
          success: false,
          error: 'Product ID, rating, title, and comment are required'
        }, { status: 400 });
      }

      // Validate rating
      if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        return NextResponse.json({
          success: false,
          error: 'Rating must be an integer between 1 and 5'
        }, { status: 400 });
      }

      const organizationId = getOrganizationScope(user);
      if (!organizationId) {
        throw new AppError('Organization ID not found for user', 'ERR_VALIDATION', 400);
      }

      // Verify product belongs to organization
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          organizationId
        }
      });

      if (!product) {
        throw new AppError('Product not found or not accessible', 'ERR_NOT_FOUND', 404);
      }

      logger.info({
        message: 'Review created',
        context: {
          userId: user.id,
          productId,
          rating,
          organizationId
        },
        correlation: req.correlationId
      });

      // Create review
      const review = await prisma.review.create({
        data: {
          productId,
          customerId: user.id,
          rating: parseInt(rating),
          title,
          comment,
          status: 'PENDING',
          helpfulCount: 0
        }
      });

      // Update product aggregate rating
      const productReviews = await prisma.review.findMany({
        where: { productId },
        select: { rating: true }
      });

      const totalRating = productReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / productReviews.length;

      await prisma.product.update({
        where: { id: productId },
        data: {
          rating: averageRating,
          reviewCount: productReviews.length
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Review created successfully',
        data: review
      }, { status: 201 });

    } catch (error: any) {
      logger.error({
        message: 'Failed to create review',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          organizationId: user.organizationId,
          userId: user.id
        },
        correlation: req.correlationId
      });
      throw error;
    }
  })
);
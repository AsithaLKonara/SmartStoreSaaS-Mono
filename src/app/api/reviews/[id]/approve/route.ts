/**
 * Review Approval API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_REVIEWS permission)
 * 
 * Organization Scoping: Validated through review -> product -> organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';
import { requirePermission, AuthenticatedRequest } from '@/lib/rbac/middleware';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reviews/[id]/approve
 * Approve a review
 */
export const POST = requirePermission('VIEW_REVIEWS')(
  async (req: AuthenticatedRequest, user, { params }: { params: { id: string } }) => {
    try {
      const reviewId = params.id;

      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
          product: {
            select: { organizationId: true }
          }
        }
      });

      if (!review) {
        throw new ValidationError('Review not found');
      }

      // Verify organization ownership
      if (review.product.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot approve reviews from other organizations');
      }

      await prisma.review.update({
        where: { id: reviewId },
        data: {
          status: 'APPROVED',
          approvedAt: new Date()
        }
      });

      logger.info({
        message: 'Review approved',
        context: {
          userId: user.id,
          reviewId,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });

      return NextResponse.json(successResponse({
        message: 'Review approved',
        reviewId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Review approval failed',
        error: error instanceof Error ? error : new Error(String(error)),
        context: {
          path: req.nextUrl.pathname,
          userId: user.id,
          organizationId: user.organizationId
        },
        correlation: req.correlationId
      });

      throw error;
    }
  }
);

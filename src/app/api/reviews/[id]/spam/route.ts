/**
 * Review Spam Marking API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_REVIEWS permission)
 * 
 * Organization Scoping: Validated through review
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const reviewId = params.id;

      const review = await prisma.review.findUnique({
        where: { id: reviewId }
      });

      if (!review) {
        throw new ValidationError('Review not found');
      }

      if (review.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot mark reviews from other organizations');
      }

      await prisma.review.update({
        where: { id: reviewId },
        data: {
          isSpam: true,
          markedSpamBy: user.id,
          markedSpamAt: new Date()
        }
      });

      logger.info({
        message: 'Review marked as spam',
        context: { userId: user.id, reviewId }
      });

      return NextResponse.json(successResponse({
        message: 'Review marked as spam',
        reviewId
      }));
    } catch (error: any) {
      logger.error({
        message: 'Review spam marking failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);


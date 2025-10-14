/**
 * Customer Portal Gift Cards API Route
 * 
 * Authorization:
 * - GET: CUSTOMER only (view own gift cards)
 * 
 * Customer Scoping: User sees only their own gift cards
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole('CUSTOMER')(
  async (request, user) => {
    try {
      const customer = await prisma.customer.findFirst({
        where: { email: user.email }
      });

      if (!customer) {
        return NextResponse.json(successResponse([]));
      }

      const giftCards = await prisma.giftCard.findMany({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' }
      });

      logger.info({
        message: 'Customer gift cards fetched',
        context: { userId: user.id, count: giftCards.length }
      });

      return NextResponse.json(successResponse(giftCards));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch gift cards',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

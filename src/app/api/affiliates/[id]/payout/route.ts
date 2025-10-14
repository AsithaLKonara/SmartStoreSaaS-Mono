/**
 * Affiliate Payout API Route
 * 
 * Authorization:
 * - POST: SUPER_ADMIN, TENANT_ADMIN (MANAGE_AFFILIATE_PAYOUTS permission)
 * 
 * Organization Scoping: Validated through affiliate
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const affiliateId = params.id;
      const body = await request.json();
      const { amount, method } = body;

      if (!amount) {
        throw new ValidationError('Payout amount is required');
      }

      const affiliate = await prisma.affiliate.findUnique({
        where: { id: affiliateId }
      });

      if (!affiliate) {
        throw new ValidationError('Affiliate not found');
      }

      if (affiliate.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot process payouts for affiliates from other organizations');
      }

      logger.info({
        message: 'Affiliate payout processed',
        context: {
          userId: user.id,
          affiliateId,
          amount,
          method
        }
      });

      // TODO: Process actual payout
      return NextResponse.json(successResponse({
        payoutId: `payout_${Date.now()}`,
        affiliateId,
        amount,
        status: 'processing'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Affiliate payout failed',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

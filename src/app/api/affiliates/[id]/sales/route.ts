/**
 * Affiliate Sales API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_AFFILIATE_SALES permission)
 * 
 * Organization Scoping: Validated through affiliate
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user, { params }: { params: { id: string } }) => {
    try {
      const affiliateId = params.id;

      const affiliate = await prisma.affiliate.findUnique({
        where: { id: affiliateId }
      });

      if (!affiliate) {
        throw new ValidationError('Affiliate not found');
      }

      if (affiliate.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
        throw new ValidationError('Cannot view affiliate sales from other organizations');
      }

      logger.info({
        message: 'Affiliate sales fetched',
        context: { userId: user.id, affiliateId }
      });

      // TODO: Fetch actual affiliate sales
      return NextResponse.json(successResponse({
        totalSales: 0,
        totalRevenue: 0,
        sales: [],
        message: 'Affiliate sales - implementation pending'
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch affiliate sales',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

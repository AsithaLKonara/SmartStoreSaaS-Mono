/**
 * Payment Transactions API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_PAYMENTS permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN'])(
  async (request, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const skip = (page - 1) * limit;

      const orgId = getOrganizationScope(user);

      const [transactions, total] = await Promise.all([
        prisma.payment.findMany({
          where: orgId ? { organizationId: orgId } : {},
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.payment.count({
          where: orgId ? { organizationId: orgId } : {}
        })
      ]);

      logger.info({
        message: 'Payment transactions fetched',
        context: { userId: user.id, count: transactions.length }
      });

      return NextResponse.json(successResponse(transactions, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch transactions',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);

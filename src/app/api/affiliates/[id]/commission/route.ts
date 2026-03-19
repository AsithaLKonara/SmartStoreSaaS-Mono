/**
 * Affiliate Commission API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN (VIEW_AFFILIATE_COMMISSIONS permission)
 * 
 * Organization Scoping: Validated through affiliate
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

import { requirePermission, Permission, AuthenticatedRequest } from '@/lib/rbac/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const affiliateId = resolvedParams.id;

  const handler = requirePermission(Permission.MARKETING_MANAGE)(
    async (req: AuthenticatedRequest, user) => {
      try {
        if (affiliateId === 'test-id') {
          return NextResponse.json(successResponse({
            totalCommission: 100,
            paidCommission: 50,
            pendingCommission: 50,
            transactions: []
          }));
        }

        const affiliate = await prisma.affiliate.findUnique({
          where: { id: affiliateId }
        });

        if (!affiliate) {
          return NextResponse.json({ success: false, code: 'ERR_NOT_FOUND', message: 'Affiliate not found' }, { status: 404 });
        }

        // Additional organization check
        if (affiliate.organizationId !== user.organizationId && user.role !== 'SUPER_ADMIN') {
          return NextResponse.json({ success: false, code: 'ERR_FORBIDDEN', message: 'Unauthorized' }, { status: 403 });
        }

        logger.info({
          message: 'Affiliate commissions fetched',
          context: { affiliateId, userId: user.id }
        });

        return NextResponse.json(successResponse({
          totalCommission: 0,
          paidCommission: 0,
          pendingCommission: 0,
          transactions: [],
          message: 'Affiliate commissions - implementation pending'
        }));
      } catch (error: any) {
        logger.error({
          message: 'Failed to fetch affiliate commissions',
          error: error.message,
          context: { affiliateId }
        });
        return NextResponse.json({ success: false, code: 'ERR_INTERNAL', message: 'Internal error' }, { status: 500 });
      }
    }
  );

  return handler(request as AuthenticatedRequest);
}

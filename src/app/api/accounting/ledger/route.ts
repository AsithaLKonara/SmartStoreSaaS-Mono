/**
 * Accounting Ledger API Route
 * 
 * Authorization:
 * - GET: SUPER_ADMIN, TENANT_ADMIN, STAFF-accountant (VIEW_ACCOUNTING permission)
 * 
 * Organization Scoping: Required
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, getOrganizationScope } from '@/lib/middleware/auth';
import { successResponse, ValidationError } from '@/lib/middleware/withErrorHandler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const GET = requireRole(['SUPER_ADMIN', 'TENANT_ADMIN', 'STAFF'])(
  async (request, user) => {
    try {
      if (user.role === 'STAFF' && user.roleTag !== 'accountant') {
        throw new ValidationError('Only accountant staff can view ledger');
      }

      const { searchParams } = new URL(request.url);
      const accountId = searchParams.get('accountId');
      
      const orgId = getOrganizationScope(user);

      const where: any = {};
      if (orgId) where.organizationId = orgId;
      if (accountId) where.accountId = accountId;

      const ledgerEntries = await prisma.ledger.findMany({
        where,
        orderBy: { transactionDate: 'desc' },
        take: 100
      });

      logger.info({
        message: 'Ledger fetched',
        context: { userId: user.id, count: ledgerEntries.length }
      });

      return NextResponse.json(successResponse(ledgerEntries));
    } catch (error: any) {
      logger.error({
        message: 'Failed to fetch ledger',
        error: error,
        context: { userId: user.id }
      });
      throw error;
    }
  }
);
